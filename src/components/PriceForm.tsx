'use client'
import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type PriceFormState = {
  mode: 'live' | 'historical' | 'compare'
  amount: string
  ticker: string
  inCurrency: 'USD' | 'EUR'
  timestampLocal: string
}

type Suggestion = { id: number; symbol: string; name?: string; slug: string; rank?: number }

const POPULAR = ['BTC', 'ETH', 'USDT', 'SOL', 'XRP', 'ADA', 'DOGE']

export default function PriceForm({
  value, onChange, onGetPrice, onPriceNow, loading
}: {
  value: PriceFormState
  onChange: (patch: Partial<PriceFormState>) => void
  onGetPrice: () => void
  onPriceNow: () => void
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const { suggestions, fetching } = useTickerSuggestions(value.ticker)
  const tickerRef = useRef<HTMLInputElement>(null)

  const set =
    (k: keyof PriceFormState) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let v = e.target.value
        if (k === 'ticker') v = normalizeTickerInput(v)
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

  const onTickerKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
    <section className="neo-card space-y-8 text-white">
      <div className="flex flex-col space-y-4">
        <h3 className="font-bold text-3xl uppercase tracking-tighter border-b-2 border-white pb-4">Price Query</h3>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-0 border-2 border-white">
          <ModeTab
            active={value.mode === 'live'}
            onClick={() => onChange({ mode: 'live' })}
            label="LIVE"
            icon="🔴"
          />
          <ModeTab
            active={value.mode === 'historical'}
            onClick={() => onChange({ mode: 'historical' })}
            label="HISTORICAL"
            icon="📅"
          />
          <ModeTab
            active={value.mode === 'compare'}
            onClick={() => onChange({ mode: 'compare' })}
            label="COMPARE"
            icon="📊"
          />
        </div>
      </div>

      {/* Popular chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold uppercase text-gray-400">Popular:</span>
        {POPULAR.map(sym => (
          <button
            key={sym}
            type="button"
            className="neo-tag"
            title={`Fill ${sym}${loading ? '' : ' (Shift+Click to price now)'}`}
            onClick={(e) => {
              onChange({ ticker: sym })
              setOpen(false)
              tickerRef.current?.focus()
              if (e.shiftKey && canSubmit) onPriceNow()
            }}
          >
            {sym}
          </button>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
        {/* Amount */}
        <Field label="AMOUNT">
          <input
            className="neo-input"
            value={value.amount}
            onChange={set('amount')}
            placeholder="0.1"
            inputMode="decimal"
          />
        </Field>

        {/* Ticker + Autocomplete */}
        <Field label="TICKER">
          <div className="relative">
            <input
              ref={tickerRef}
              className="neo-input"
              value={value.ticker}
              onChange={(e) => { set('ticker')(e); setOpen(true); setHighlight(0) }}
              onFocus={onTickerFocus}
              onBlur={onTickerBlur}
              onKeyDown={onTickerKeyDown}
              placeholder="BTC"
              autoCapitalize="characters"
              spellCheck={false}
              aria-autocomplete="list"
              aria-controls="ticker-suggestions"
            />
            {/* Dropdown */}
            {open && (fetching || suggestions.length > 0) && (
              <ul
                id="ticker-suggestions"
                className="absolute z-20 mt-1 max-h-56 w-full overflow-auto border-2 border-white bg-black shadow-[4px_4px_0px_0px_white]"
                role="listbox"
              >
                {fetching && (
                  <li className="px-4 py-3 text-sm text-gray-500 font-mono">SEARCHING...</li>
                )}
                {!fetching && suggestions.map((s, i) => (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={i === highlight}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}
                    className={`px-4 py-3 text-sm cursor-pointer border-b border-gray-800 last:border-0 ${i === highlight ? 'bg-[#CCFF00] text-black font-bold' : 'text-white hover:bg-gray-900'}`}
                    onMouseEnter={() => setHighlight(i)}
                  >
                    <span className="uppercase">{s.symbol}</span>
                    {s.name ? <span className="ml-2 opacity-70">{s.name}</span> : null}
                  </li>
                ))}
                {!fetching && suggestions.length === 0 && value.ticker.trim() && (
                  <li className="px-4 py-3 text-sm text-gray-500 font-mono">NO MATCHES</li>
                )}
              </ul>
            )}
          </div>
          <Hint>ENTER SYMBOL (BTC) OR NAME (ETHEREUM)</Hint>
        </Field>

        {/* In */}
        <Field label="CURRENCY">
          <select
            className="neo-input appearance-none"
            value={value.inCurrency}
            onChange={set('inCurrency')}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </Field>

        {/* UTC Timestamp (Historical/Compare only) */}
        {(value.mode === 'historical' || value.mode === 'compare') && (
          <Field label="TIMESTAMP (UTC)">
            <div className="flex flex-wrap gap-2">
              <input
                type="datetime-local"
                className="neo-input flex-1 min-w-[170px]"
                value={value.timestampLocal}
                onChange={set('timestampLocal')}
              />
              {/* Compare Mode Presets */}
              {value.mode === 'compare' && (
                <div className="flex gap-1">
                  {['-1H', '-24H', '-7D', '-30D'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className="px-2 text-xs font-bold border border-white hover:bg-white hover:text-black transition-colors"
                      onClick={() => {
                        const d = new Date()
                        if (preset === '-1H') d.setHours(d.getHours() - 1)
                        if (preset === '-24H') d.setHours(d.getHours() - 24)
                        if (preset === '-7D') d.setDate(d.getDate() - 7)
                        if (preset === '-30D') d.setDate(d.getDate() - 30)
                        onChange({ timestampLocal: toLocalIso(d) })
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>
        )}
      </div>

      <div className="flex flex-wrap gap-4 pt-4 border-t-2 border-white">
        <button className="neo-btn w-full sm:w-auto" onClick={onGetPrice} disabled={loading || !canSubmit}>
          {value.mode === 'compare' ? 'COMPARE PRICES' : 'GET PRICE'}
        </button>
        {loading && <span className="self-center text-sm font-mono text-[#CCFF00] animate-pulse">LOADING_DATA...</span>}
      </div>
    </section>
  )
}

/* ------------------ suggestions hook ------------------ */

function useTickerSuggestions(query: string) {
  const q = normalizeQuery(query)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
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
    }, 150)
    return () => { ctrl.abort(); clearTimeout(t) }
  }, [q])

  return { suggestions, fetching }
}

/* ------------------ helpers & atoms ------------------ */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col space-y-2">
      <span className="text-xs font-bold uppercase tracking-widest text-[#CCFF00]">{label}</span>
      {children}
    </label>
  )
}
function Hint({ children }: { children: ReactNode }) {
  return <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 font-mono">{children}</span>
}
function nowLocalForInput() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function normalizeTickerInput(raw: string) {
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\$/, '').trim().toUpperCase()
}
function normalizeQuery(raw: string) {
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\$/, '').trim()
}

function ModeTab({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 text-sm font-bold uppercase tracking-wider transition-all
        ${active ? 'bg-[#CCFF00] text-black' : 'bg-black text-white hover:bg-gray-900'}
      `}
    >
      <span className="mr-2">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function toLocalIso(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}