'use client'
import React from 'react'

export type PriceFormState = {
  amount: string            // e.g. "0.1"
  ticker: string            // e.g. "BTC"
  inCurrency: 'USD' | 'EUR' // dropdown
  timestampLocal: string    // "YYYY-MM-DDTHH:mm" (local)
}

type Suggestion = { id: number; symbol: string; name?: string; slug: string; rank?: number }

const POPULAR = ['BTC','ETH','USDT','SOL','XRP','ADA','DOGE']

export default function PriceForm({
  value, onChange, onGetPrice, onPriceNow, loading
}: {
  value: PriceFormState
  onChange: (patch: Partial<PriceFormState>) => void
  onGetPrice: () => void
  onPriceNow: () => void
  loading?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(0)
  const { suggestions, fetching } = useTickerSuggestions(value.ticker)
  const tickerRef = React.useRef<HTMLInputElement>(null)

  const set =
    (k: keyof PriceFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let v = e.target.value
      if (k === 'ticker') v = normalizeTickerInput(v) // live-normalize
      onChange({ [k]: v } as Partial<PriceFormState>)
    }

  const pick = (s: Suggestion) => {
    onChange({ ticker: s.symbol.toUpperCase() })
    setOpen(false)
    tickerRef.current?.focus()
  }

  const onTickerFocus = () => {
    if (suggestions.length) setOpen(true)
  }
  const onTickerBlur = () => setTimeout(() => setOpen(false), 120)

  const onTickerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => Math.min(h + 1, Math.max(0, suggestions.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && suggestions[highlight]) {
        e.preventDefault()
        pick(suggestions[highlight])
      } else {
        onGetPrice()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const canSubmit = !!value.ticker.trim() && Number(value.amount) > 0

  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <h3 className="font-semibold">Price Query</h3>

      {/* Popular chips */}
      <div className="flex flex-wrap gap-2 -mt-1">
        <span className="text-xs opacity-60 self-center">Popular:</span>
        {POPULAR.map(sym => (
          <button
            key={sym}
            type="button"
            className="px-2 py-1 rounded-full border text-xs hover:bg-gray-50"
            title={`Fill ${sym}${loading ? '' : ' (Shift+Click to price now)'}`}
            onClick={(e) => {
              onChange({ ticker: sym })
              setOpen(false)
              tickerRef.current?.focus()
              // Shift+Click = also trigger Price Now
              if (e.shiftKey && canSubmit) onPriceNow()
            }}
          >
            {sym}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Amount */}
        <Field label="Amount">
          <input
            className="border rounded p-2 w-full"
            value={value.amount}
            onChange={set('amount')}
            placeholder="0.1"
            inputMode="decimal"
          />
        </Field>

        {/* Ticker + Autocomplete */}
        <Field label="Ticker">
          <div className="relative">
            <input
              ref={tickerRef}
              className="border rounded p-2 w-full"
              value={value.ticker}
              onChange={(e) => { set('ticker')(e); setOpen(true); setHighlight(0) }}
              onFocus={onTickerFocus}
              onBlur={onTickerBlur}
              onKeyDown={onTickerKeyDown}
              placeholder="BTC or ethereum"
              autoCapitalize="characters"
              spellCheck={false}
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="ticker-suggestions"
            />
            {/* Dropdown */}
            {open && (fetching || suggestions.length > 0) && (
              <ul
                id="ticker-suggestions"
                className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow"
                role="listbox"
              >
                {fetching && (
                  <li className="px-3 py-2 text-sm opacity-60">Searching…</li>
                )}
                {!fetching && suggestions.map((s, i) => (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={i === highlight}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}
                    className={`px-3 py-2 text-sm cursor-pointer ${i === highlight ? 'bg-gray-100' : ''}`}
                    onMouseEnter={() => setHighlight(i)}
                  >
                    <span className="font-medium">{s.symbol}</span>
                    {s.name ? <span className="ml-2 opacity-70">{s.name}</span> : null}
                    <span className="ml-2 opacity-60">({s.slug})</span>
                  </li>
                ))}
                {!fetching && suggestions.length === 0 && value.ticker.trim() && (
                  <li className="px-3 py-2 text-sm opacity-60">No matches</li>
                )}
              </ul>
            )}
          </div>
          <Hint>Enter a <b>symbol</b> (BTC, ETH) or <b>name/slug</b> (ethereum). We’ll resolve it.</Hint>
        </Field>

        {/* In */}
        <Field label="In">
          <select
            className="border rounded p-2 bg-white w-full"
            value={value.inCurrency}
            onChange={set('inCurrency')}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </Field>

        {/* UTC Timestamp */}
        <Field label="UTC Timestamp">
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="border rounded p-2 flex-1"
              value={value.timestampLocal}
              onChange={set('timestampLocal')}
            />
            <button
              type="button"
              onClick={() => onChange({ timestampLocal: nowLocalForInput() })}
              className="px-3 rounded border hover:bg-gray-50"
              title="Set to current time"
            >
              {/* clock icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </button>
            {value.timestampLocal && (
              <button
                type="button"
                onClick={() => onChange({ timestampLocal: '' })}
                className="px-3 rounded border hover:bg-gray-50"
                title="Clear timestamp (use live price)"
              >
                ✕
              </button>
            )}
          </div>
          <Hint>Local picker is converted to UTC automatically.</Hint>
        </Field>
      </div>

      <div className="flex flex-wrap gap-3">
        <Btn onClick={onGetPrice} disabled={loading || !canSubmit}>
          Get Price
        </Btn>
        <Btn
          onClick={() => {
            if (value.timestampLocal) onChange({ timestampLocal: '' })
            onPriceNow()
          }}
          disabled={loading || !canSubmit}
        >
          Price Now
        </Btn>
        {loading && <span className="self-center text-sm opacity-70">Loading…</span>}
      </div>
    </section>
  )
}

/* ------------------ suggestions hook ------------------ */

function useTickerSuggestions(query: string) {
  const q = normalizeQuery(query)
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
  const [fetching, setFetching] = React.useState(false)

  React.useEffect(() => {
    if (!q) { setSuggestions([]); return }
    const ctrl = new AbortController()
    setFetching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal, cache: 'no-store' })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        setSuggestions(Array.isArray(json?.items) ? json.items.slice(0, 7) : [])
      } catch {
        if (!ctrl.signal.aborted) setSuggestions([])
      } finally {
        if (!ctrl.signal.aborted) setFetching(false)
      }
    }, 150) // debounce
    return () => { ctrl.abort(); clearTimeout(t) }
  }, [q])

  return { suggestions, fetching }
}

/* ------------------ helpers & atoms ------------------ */

function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-50" {...props} />
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col">
      <span className="text-sm opacity-70">{label}</span>
      {children}
    </label>
  )
}
function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-xs opacity-60 mt-1">{children}</span>
}
function nowLocalForInput() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function normalizeTickerInput(raw: string) {
  // normalize for input display — strip $, zero-width, trim, UPPERCASE
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\$/, '').trim().toUpperCase()
}
function normalizeQuery(raw: string) {
  // query should be forgiving (don’t force uppercase so name/slug matches feel natural)
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\$/, '').trim()
}
