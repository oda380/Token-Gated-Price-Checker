import { createPublicClient, http, getAddress } from 'viem'
import { base } from 'viem/chains'
import erc721 from '@/abi/erc721.json'

const ALCHEMY_HTTP_URL = process.env.ALCHEMY_HTTP_URL!
const CONTRACT = process.env.TOKEN_GATE_CONTRACT as `0x${string}`
const BLACKLIST = (process.env.TOKEN_GATE_INVALID_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(BigInt)

const client = createPublicClient({
  chain: base,
  transport: http(ALCHEMY_HTTP_URL)
})

export async function checkGate(address: `0x${string}`) {
  // Must hold ≥1 NFT
  const balance = (await client.readContract({
    address: CONTRACT,
    abi: erc721,
    functionName: 'balanceOf',
    args: [address]
  })) as bigint

  if (balance === 0n) {
    return { ok: false as const, reason: 'NO_NFT' }
  }

  // Must NOT own any blacklisted IDs
  for (const tokenId of BLACKLIST) {
    try {
      const owner = (await client.readContract({
        address: CONTRACT,
        abi: erc721,
        functionName: 'ownerOf',
        args: [tokenId]
      })) as `0x${string}`
      if (getAddress(owner) === getAddress(address)) {
        return { ok: false as const, reason: 'BLACKLISTED_TOKEN', tokenId: Number(tokenId) }
      }
    } catch {
      // ignore missing tokenId
    }
  }

  return { ok: true as const }
}
