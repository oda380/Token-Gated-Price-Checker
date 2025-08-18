// /app/api/price/route.ts
import { NextResponse } from 'next/server';
import { resolveToId } from '@/lib/cmcIndex';
import { LRU } from '@/lib/lru';

const CMC = 'https://pro-api.coinmarketcap.com';
const KEY = process.env.CMC_API_KEY!;

type Convert = 'USD' | 'EUR';

const cache = new LRU<string, any>(300, 45_000); // up to 300 entries, 45s TTL

function headers() {
  return { 'X-CMC_PRO_API_KEY': KEY };
}

export async function POST(req: Request) {
  try {
    if (!KEY) return NextResponse.json({ error: 'CMC_API_KEY missing' }, { status: 500 });

    const body = await req.json();
    const input = String(body?.input ?? '').trim();
    const amount = Number(body?.amount ?? 1) || 1;
    const convert = String(body?.currency ?? 'USD').toUpperCase() as Convert;
    const timestamp = body?.timestamp ? new Date(body.timestamp) : undefined;

    if (!input) return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    if (!['USD', 'EUR'].includes(convert))
      return NextResponse.json({ error: 'Unsupported currency. Use USD or EUR.' }, { status: 400 });

    // Resolve user input to CMC id (symbol/slug/name → id)
    const resolved = await resolveToId(input);
    if (!resolved) {
      return NextResponse.json({ error: 'No match. Try a symbol like ETH, a slug like ethereum, or exact name.' }, { status: 404 });
    }
    if ('suggestions' in resolved) {
      return NextResponse.json({
        error: 'Ambiguous input. Did you mean:',
        suggestions: resolved.suggestions.map((s) => ({ id: s.id, symbol: s.symbol, name: s.name, slug: s.slug })),
      }, { status: 409 });
    }

    const id = resolved.id;
    const cacheKey = `${id}:${convert}:${timestamp ? timestamp.toISOString() : 'live'}:${amount}`;
    const hit = cache.get(cacheKey);
    if (hit) return NextResponse.json(hit);

    // Live vs point-in-time
    if (!timestamp) {
      const url = new URL(`${CMC}/v2/cryptocurrency/quotes/latest`);
      url.searchParams.set('id', String(id));
      url.searchParams.set('convert', convert);

      const res = await fetch(url.toString(), { headers: headers(), cache: 'no-store' });
      const json = await res.json();

      if (json?.status?.error_code) {
        return NextResponse.json({ error: `CMC ${json.status.error_code}: ${json.status.error_message}` }, { status: 400 });
      }

      const node = json?.data?.[String(id)];
      const pricePerUnit = node?.quote?.[convert]?.price as number | undefined;
      const lastUpdated = node?.quote?.[convert]?.last_updated as string | undefined;

      if (typeof pricePerUnit !== 'number') {
        console.error('CMC RAW (live)', JSON.stringify(json, null, 2));
        return NextResponse.json({ error: `No ${convert} quote available for id=${id}` }, { status: 404 });
      }

      const total = amount * pricePerUnit;
      const payload = {
        ok: true,
        id,
        symbol: node?.symbol,
        name: node?.name,
        convert,
        amount,
        pricePerUnit,
        total,
        lastUpdated,
        at: lastUpdated,
      };
      cache.set(cacheKey, payload);
      return NextResponse.json(payload);
    } else {
      // Point-in-time (requires appropriate CMC plan for /tools/price-conversion with time=)
      const url = new URL(`${CMC}/v2/tools/price-conversion`);
      url.searchParams.set('amount', '1');
      url.searchParams.set('id', String(id));
      url.searchParams.set('convert', convert);
      url.searchParams.set('time', timestamp.toISOString());

      const res = await fetch(url.toString(), { headers: headers(), cache: 'no-store' });
      const json = await res.json();

      if (json?.status?.error_code) {
        return NextResponse.json({
          error: `CMC ${json.status.error_code}: ${json.status.error_message}`,
          hint: 'Your plan may not support historical point-in-time; consider using OHLCV or nearest-available fallback.',
        }, { status: 400 });
      }

      const pricePerUnit = json?.data?.quote?.[convert]?.price as number | undefined;
      const lastUpdated = json?.data?.quote?.[convert]?.last_updated as string | undefined;

      if (typeof pricePerUnit !== 'number') {
        console.error('CMC RAW (historical)', JSON.stringify(json, null, 2));
        return NextResponse.json({
          error: `No ${convert} quote returned for id=${id} at ${timestamp.toISOString()}`,
          hint: 'If on free/low tier, historical may be unavailable.',
        }, { status: 404 });
      }

      const total = amount * pricePerUnit;
      const payload = {
        ok: true,
        id,
        convert,
        amount,
        pricePerUnit,
        total,
        lastUpdated,
        at: timestamp.toISOString(),
      };
      cache.set(cacheKey, payload);
      return NextResponse.json(payload);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
