// /app/api/search/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { normalizeInput, resolveToId, loadIndex } from '@/lib/cgIndex'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = normalizeInput(searchParams.get('q') || '')
    if (!q) return NextResponse.json({ items: [] })

    const resolved = await resolveToId(q)

    if (resolved && 'id' in resolved) {
      const head = resolved.match
      const idx = await loadIndex()
      const extra = idx.filter(r => r.symbol.startsWith(head.symbol[0] || '') && r.id !== head.id).slice(0, 4)
      const items = [head, ...extra].map(r => ({ id: r.id, symbol: r.symbol, name: r.name, slug: r.id }))
      return NextResponse.json({ items })
    }

    if (resolved && 'suggestions' in resolved) {
      const items = resolved.suggestions.map(r => ({ id: r.id, symbol: r.symbol, name: r.name, slug: r.id }))
      return NextResponse.json({ items })
    }

    return NextResponse.json({ items: [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Search error' }, { status: 500 })
  }
}