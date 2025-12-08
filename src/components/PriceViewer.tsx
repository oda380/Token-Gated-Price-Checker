'use client'
import { useState } from 'react'
import PriceForm, { type PriceFormState } from './PriceForm'

export default function PriceViewer() {
  const [form, setForm] = useState<PriceFormState>({
    mode: 'live',
    amount: '0.1',
    ticker: '',
    inCurrency: 'USD',
    timestampLocal: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<null | {
    from: string
    amount: number
    currency: 'USD' | 'EUR'
    at?: string
    value?: number
    perUnit?: number
    raw?: any
    suggestions?: Array<{ id: number; symbol: string; name?: string; slug: string }>
    // Compare specific
    isCompare?: boolean
    thenValue?: number
    nowValue?: number
    change?: number
    percent?: number
  }>(null)

  function localToUtcIso(datetimeLocal: string) {
    if (!datetimeLocal) return ''
    const m = datetimeLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
    if (!m) return ''
    const [_, Y, M, D, h, mm] = m.map(Number)
    const dt = new Date(Y, (M ?? 1) - 1, D ?? 1, h ?? 0, mm ?? 0, 0, 0)
    return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString()
  }

  function normalizeTicker(raw: string) {
    return String(raw ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\$/, '').trim()
  }

  async function fetchOne(timestampIso?: string) {
    const input = normalizeTicker(form.ticker)
    const amt = Number(form.amount)
    const currency = form.inCurrency
    const payload: any = { input, currency, amount: amt }
    if (timestampIso) payload.timestamp = timestampIso

    const res = await fetch('/api/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    })
    const text = await res.text()
    let json: any = null
    try { json = JSON.parse(text) } catch { /* ignore */ }

    if (!res.ok) {
      const msg = (json && json.error) || text || `HTTP ${res.status}`
      throw { msg, suggestions: json?.suggestions }
    }
    const data = json
    if (!data?.ok || typeof data.pricePerUnit !== 'number') {
      throw { msg: 'No price data returned' }
    }
    return data
  }

  async function handleGetPrice() {
    setLoading(true); setError(null); setResult(null)
    try {
      const input = normalizeTicker(form.ticker)
      const amt = Number(form.amount)
      if (!input) throw { msg: 'Enter a ticker' }
      if (!Number.isFinite(amt) || amt <= 0) throw { msg: 'Enter a positive amount' }

      if (form.mode === 'compare') {
        const isoThen = localToUtcIso(form.timestampLocal)
        if (!isoThen) throw { msg: 'Select a past date to compare' }

        const [rThen, rNow] = await Promise.all([
          fetchOne(isoThen),
          fetchOne() // live
        ])

        const thenVal = rThen.total
        const nowVal = rNow.total
        const change = nowVal - thenVal
        const pct = (change / thenVal) * 100

        setResult({
          from: rNow.symbol ?? input.toUpperCase(),
          amount: amt,
          currency: form.inCurrency,
          isCompare: true,
          thenValue: thenVal,
          nowValue: nowVal,
          change,
          percent: pct,
          raw: { then: rThen, now: rNow }
        })

      } else {
        // Live or Historical
        let iso: string | undefined
        if (form.mode === 'historical') {
          iso = localToUtcIso(form.timestampLocal)
          if (!iso) throw { msg: 'Select a date' }
        }
        const data = await fetchOne(iso)
        setResult({
          from: data.symbol ?? input.toUpperCase(),
          amount: amt,
          currency: data.convert,
          at: data.at ?? data.lastUpdated,
          value: data.total,
          perUnit: data.pricePerUnit,
          raw: data
        })
      }

    } catch (e: any) {
      setError(e.msg || String(e))
      if (e.suggestions) {
        setResult({
          from: form.ticker,
          amount: Number(form.amount),
          currency: form.inCurrency,
          suggestions: e.suggestions
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <PriceForm
        value={form}
        onChange={(p) => setForm({ ...form, ...p })}
        onGetPrice={handleGetPrice}
        onPriceNow={() => { /* no-op, single button now */ }}
        loading={loading}
      />

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950 p-4 space-y-3">
          <p className="text-sm text-red-400 whitespace-pre-wrap">{error}</p>
          {result?.suggestions?.length ? (
            <div className="mt-2 text-sm text-gray-300">
              <p className="font-medium">Did you mean:</p>
              <ul className="list-disc ml-5 space-y-1">
                {result.suggestions.map(s => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="font-semibold text-purple-400 hover:text-purple-500 transition-colors"
                      onClick={() => setForm(f => ({ ...f, ticker: s.symbol }))}
                    >
                      {s.symbol}
                    </button>
                    {s.name ? <span className="text-gray-400"> — {s.name}</span> : null}
                    <span className="text-gray-500"> ({s.slug})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {result && (result.value != null) && (
        <div className="neo-card space-y-4 text-white">
          <h4 className="font-bold text-2xl uppercase tracking-tighter border-b-2 border-white pb-2">Result</h4>

          {result.isCompare ? (
            <div className="space-y-4 font-mono">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm sm:text-base">
                <span className="text-gray-400">THEN:</span>
                <span>{result.currency} {fmt2(result.thenValue!)}</span>
                <span className="text-gray-400">NOW:</span>
                <span>{result.currency} {fmt2(result.nowValue!)}</span>
              </div>
              <div className="border-t border-gray-700 pt-2">
                <div className="text-lg">
                  CHANGE: <span className={result.change! >= 0 ? 'text-[#CCFF00]' : 'text-red-500'}>
                    {result.change! >= 0 ? '+' : ''}{fmt2(result.change!)} {result.currency}
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  <span className={result.percent! >= 0 ? 'text-[#CCFF00]' : 'text-red-500'}>
                    {result.percent! >= 0 ? '▲' : '▼'} {fmt2(Math.abs(result.percent!))}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-base text-gray-300">
              <strong className="text-purple-400">{result.amount} {result.from}</strong>
              {' '}= <strong className="text-white">{result.currency} {fmt2(result.value!)}</strong>
              {' '}
              {result.at ? <>@ <span className="text-gray-400">{new Date(result.at).toLocaleString()}</span></> : <>@ <span className="text-gray-400">now</span></>}
              {result.perUnit != null && (
                <> &nbsp;(<span className="text-gray-400">≈ {result.currency} {fmt2(result.perUnit)} / 1 {result.from}</span>)</>
              )}
            </p>
          )}

          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer font-semibold">Raw</summary>
            <pre className="overflow-auto bg-slate-900 text-gray-400 p-4 rounded-lg mt-2">
              {JSON.stringify(result.raw, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

function fmt2(n: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n)
}