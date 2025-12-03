// src/lib/auth.ts
import 'server-only'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SiweMessage } from 'siwe'

const REQUIRED_CHAIN_ID = 8453 // Base mainnet

// Lazy evaluation to avoid build-time errors
function getExpectedDomain() {
  const url = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return new URL(url).host
}

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set')
  }
  return secret
}

// Lazy-load authOptions to prevent build-time execution
let _authOptions: NextAuthOptions | null = null

export function getAuthOptions(): NextAuthOptions {
  if (_authOptions) return _authOptions

  _authOptions = {
    secret: getSecret(),
    session: { strategy: 'jwt' },

    providers: [
      CredentialsProvider({
        name: 'Ethereum',
        credentials: {
          message: { label: 'Message', type: 'text' },
          signature: { label: 'Signature', type: 'text' }
        },
        async authorize(credentials) {
          try {
            if (!credentials?.message || !credentials?.signature) return null

            // Parse SIWE message sent from the client
            const siwe = new SiweMessage(credentials.message)

            // Verify signature (+ domain). Optional: pass nonce if you store it server-side.
            const { success } = await siwe.verify({
              signature: credentials.signature,
              domain: getExpectedDomain(),
              // nonce: cookies().get('siwe-nonce')?.value, // if you set one in /api/siwe/nonce
            })
            if (!success) return null

            // Enforce Base chain
            const chainId = Number(siwe.chainId)
            if (chainId !== REQUIRED_CHAIN_ID) return null

            const address = siwe.address as `0x${string}`

            // Return a minimal user object; extras go into JWT in callbacks
            return {
              id: `${chainId}:${address}`,
              address,
              chainId
            } as any
          } catch {
            return null
          }
        }
      })
    ],

    callbacks: {
      async jwt({ token, user }) {
        // On sign-in, copy fields to the JWT
        if (user) {
          const u = user as any
          token.address = u.address
          token.chainId = u.chainId
          token.sub = `${u.chainId}:${u.address}` // keep consistent
        }
        return token
      },
      async session({ session, token }) {
        // Expose on session for server routes
        if (token?.address) (session as any).address = token.address
        if (token?.chainId) (session as any).chainId = token.chainId
        return session
      }
    }
  }

  return _authOptions
}
