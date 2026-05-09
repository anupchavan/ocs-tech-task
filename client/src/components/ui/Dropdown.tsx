import { useEffect, useRef, useState, useCallback } from 'react'

export interface DropdownOption {
  value: string
  label: string
  sub?: string           // secondary line shown in the row
  badge?: string         // optional coloured dot class
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  searchPlaceholder?: string
  /** Width of the pill trigger button */
  triggerWidth?: string | number
  /** Minimum width of the floating panel */
  panelMinWidth?: string | number
  disabled?: boolean
  /** Extra class name on the root element (e.g. "full-width") */
  className?: string
}

/* ── Fuzzy matching ─────────────────────────────────────────────────────── */

function fuzzyMatch(text: string, pattern: string): { matched: boolean; indices: number[]; score: number } {
  if (!pattern) return { matched: true, indices: [], score: 0 }
  const lowerText = text.toLowerCase()
  const lowerPattern = pattern.toLowerCase()
  const indices: number[] = []
  let pi = 0
  let score = 0
  let lastIdx = -1

  for (let ti = 0; ti < lowerText.length && pi < lowerPattern.length; ti++) {
    if (lowerText[ti] === lowerPattern[pi]) {
      indices.push(ti)
      // Reward consecutive runs, penalise gaps, penalise late matches
      score += ti + (lastIdx >= 0 && ti !== lastIdx + 1 ? 10 : 0)
      lastIdx = ti
      pi++
    }
  }
  return { matched: pi === lowerPattern.length, indices, score }
}

/** Render a label string with fuzzy-matched positions in semibold */
function HighlightedLabel({ text, indices }: { text: string; indices: number[] }) {
  if (indices.length === 0) return <>{text}</>
  const set = new Set(indices)
  const parts: JSX.Element[] = []
  let i = 0
  while (i < text.length) {
    if (set.has(i)) {
      parts.push(
        <span key={i} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {text[i]}
        </span>,
      )
      i++
    } else {
      const start = i
      while (i < text.length && !set.has(i)) i++
      parts.push(<span key={start}>{text.slice(start, i)}</span>)
    }
  }
  return <>{parts}</>
}

/* ── Component ──────────────────────────────────────────────────────────── */

type FilteredOption = DropdownOption & { _indices: number[]; _score: number }

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  triggerWidth,
  panelMinWidth = 200,
  disabled = false,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [hlIdx, setHlIdx] = useState(0)
  const rootRef  = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef  = useRef<HTMLDivElement>(null)

  // Search strip is only shown for lists with more than 4 items
  const showSearch = options.length > 4

  const selected = options.find((o) => o.value === value)

  // Build filtered + scored list
  const filtered: FilteredOption[] = (() => {
    if (!showSearch || !search.trim()) {
      return options.map((o) => ({ ...o, _indices: [], _score: 0 }))
    }
    const results: FilteredOption[] = []
    for (const o of options) {
      const r = fuzzyMatch(o.label, search)
      if (r.matched) {
        results.push({ ...o, _indices: r.indices, _score: r.score })
        continue
      }
      if (o.sub) {
        const r2 = fuzzyMatch(o.sub, search)
        if (r2.matched) {
          results.push({ ...o, _indices: [], _score: r2.score + 5 })
        }
      }
    }
    return results.sort((a, b) => a._score - b._score)
  })()

  const openPanel = useCallback(() => {
    if (disabled) return
    setOpen(true)
    setSearch('')
    setHlIdx(Math.max(0, options.findIndex((o) => o.value === value)))
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 0)
    } else {
      setTimeout(() => panelRef.current?.focus(), 0)
    }
  }, [disabled, options, value, showSearch])

  const closePanel = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  const pick = useCallback(
    (v: string) => { onChange(v); closePanel() },
    [onChange, closePanel],
  )

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) closePanel()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, closePanel])

  // Keyboard navigation (shared between search input and panel)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape')    { e.preventDefault(); closePanel(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHlIdx((i) => Math.min(filtered.length - 1, i < 0 ? 0 : i + 1)); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHlIdx((i) => Math.max(0, i - 1)); return }
    if (e.key === 'Enter') {
      e.preventDefault()
      const row = filtered[Math.min(hlIdx, filtered.length - 1)]
      if (row) pick(row.value)
    }
  }

  // Reset keyboard highlight when search changes
  useEffect(() => { setHlIdx(0) }, [search])

  return (
    <div
      ref={rootRef}
      className={`ocs-dropdown${className ? ` ${className}` : ''}`}
      style={{ position: 'relative', width: triggerWidth }}
    >
      {/* ── Pill trigger ── */}
      <div className={`ocs-dropdown-pill${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}>
        <button
          type="button"
          className="ocs-dropdown-trigger"
          onClick={() => (open ? closePanel() : openPanel())}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
        >
          <span className="ocs-dropdown-trigger-title">
            {selected ? selected.label : <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>}
          </span>
          <span className="ocs-dropdown-trigger-spacer" aria-hidden />
          <span className="ocs-dropdown-trigger-chevron">
            <ChevronIcon open={open} />
          </span>
        </button>
      </div>

      {/* ── Floating panel ── */}
      {open && (
        <div
          ref={panelRef}
          className="ocs-dropdown-panel"
          role="listbox"
          style={{ minWidth: panelMinWidth }}
          tabIndex={showSearch ? -1 : 0}
          onKeyDown={showSearch ? undefined : onKeyDown}
        >
          {/* Search strip — only rendered when list has more than 4 items */}
          {showSearch && (
            <div className="ocs-dropdown-search-wrap">
              <SearchIcon />
              <input
                ref={searchRef}
                className="ocs-dropdown-search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
              />
            </div>
          )}

          {/* Option list */}
          <div className="ocs-dropdown-list">
            {filtered.length === 0 ? (
              <div className="ocs-dropdown-empty">No options match</div>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value
                const isHl = hlIdx === idx
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`ocs-dropdown-row${isHl ? ' is-keyboard-highlight' : ''}${isSelected ? ' is-selected' : ''}`}
                    onMouseEnter={() => setHlIdx(idx)}
                    onClick={() => pick(opt.value)}
                  >
                    <span className="ocs-dropdown-name">
                      {search && showSearch
                        ? <HighlightedLabel text={opt.label} indices={opt._indices} />
                        : opt.label}
                    </span>
                    {opt.sub && <span className="ocs-dropdown-sub">{opt.sub}</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tiny inline SVGs ───────────────────────────────────────────────────── */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
