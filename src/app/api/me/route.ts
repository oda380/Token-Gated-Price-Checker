import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'

// Force dynamic rendering for this route (requires session)
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(getAuthOptions())
  return Response.json({ session })
}
