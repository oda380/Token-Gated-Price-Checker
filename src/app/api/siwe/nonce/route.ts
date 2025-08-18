import { generateNonce } from 'siwe'

export async function GET() {
  // generate a nonce and set it in a non-HTTPOnly cookie (client needs to read it back)
  const nonce = generateNonce()
  return new Response(JSON.stringify({ nonce }), {
    headers: {
      'Content-Type': 'application/json',
      // Path=/ so the client can read it; you can tighten security later
      'Set-Cookie': `siwe-nonce=${nonce}; Path=/; Max-Age=300; SameSite=Lax`
    }
  })
}
