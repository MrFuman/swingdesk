import { useTrades } from '../hooks/useTrades'
import { useProfile } from '../hooks/useProfile'
import { useState } from 'react'
import { TrendingUp, TrendingDown, Flame, Calendar } from 'lucide-react'

// ── helpers ────────────────────────────────────────────────
function getMonthDays(year, month) {
  const days = []
  const first = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  for (let i = 0; i < first; i++) days.push(null)
  for (let d = 1; d <= total; d++) days.push(d)
  return days
}

function fmt(val, currency) {
  const abs = Math.abs(val).toLocaleString('en-MY', { minimumFractionDigits: 2 })
  return `${val >= 0 ? '+' : '−'}${currency} ${abs}`
}

// ── P&L Calendar ───────────────────────────────────────────
function PnlCalendar({ trades, currency }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const YEARS  = [now.getFullYear() - 1, now.getFullYear()]

  // build daily map
  const dailyMap = {}
  trades
    .filter(t => t.status === 'closed' && t.pnl != null)
    .forEach(t => {
      const d = t.entry_date
      if (!dailyMap[d]) dailyMap[d] = 0
      dailyMap[d] += Number(t.pnl)
    })

  const days = getMonthDays(year, month)
  const monthTotal = days
    .filter(Boolean)
    .reduce((sum, d) => {
      const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      return sum + (dailyMap[key] || 0)
    }, 0)

  function cellColor(pnl) {
    if (pnl > 0)  return { bg: '#22c55e18', border: '#22c55e35', text: '#22c55e' }
    if (pnl < 0)  return { bg: '#ef444418', border: '#ef444435', text: '#ef4444' }
    return { bg: 'transparent', border: 'var(--border)', text: 'var(--text-muted)' }
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px 18px', marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            P&L Calendar
          </p>
          <p className="mono" style={{
            fontSize: 14, fontWeight: 600, marginTop: 3,
            color: monthTotal >= 0 ? 'var(--accent)' : 'var(--red)',
          }}>
            {fmt(monthTotal, currency)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', borderRadius: 8,
            padding: '5px 8px', fontSize: 12, outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', borderRadius: 8,
            padding: '5px 8px', fontSize: 12, outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-secondary)', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const pnl = dailyMap[key]
          const c = cellColor(pnl ?? 0)
          const hasTrade = pnl !== undefined
          return (
            <div key={key} title={hasTrade ? `${fmt(pnl, currency)}` : ''} style={{
              aspectRatio: '1',
              borderRadius: 6,
              background: hasTrade ? c.bg : 'var(--bg)',
              border: `1px solid ${hasTrade ? c.border : 'var(--border)'}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: hasTrade ? 'pointer' : 'default',
              transition: 'transform 0.1s',
              position: 'relative',
            }}
              onMouseEnter={e => hasTrade && (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <span style={{ fontSize: 11, color: hasTrade ? c.text : 'var(--text-secondary)', fontWeight: hasTrade ? 600 : 400 }}>
                {day}
              </span>
              {hasTrade && (
                <span style={{ fontSize: 8, color: c.text, marginTop: 1, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                  {pnl >= 0 ? '+' : '−'}{Math.abs(pnl).toFixed(0)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
        {[
          { color: '#22c55e', label: 'Profit day' },
          { color: '#ef4444', label: 'Loss day' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: `${color}30`, border: `1px solid ${color}50` }} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Win/Loss Streak ─────────────────────────────────────────
function StreakTracker({ trades, currency }) {
  const closed = [...trades]
    .filter(t => t.status === 'closed' && t.pnl != null)
    .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))

  if (closed.length === 0) return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px 18px', marginBottom: 12,
    }}>
      <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        Win / Loss Streak
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No closed trades yet.</p>
    </div>
  )

  // current streak
  let currentStreak = 1
  let currentType = closed[closed.length - 1].pnl >= 0 ? 'win' : 'loss'
  for (let i = closed.length - 2; i >= 0; i--) {
    const isWin = closed[i].pnl >= 0
    if ((isWin && currentType === 'win') || (!isWin && currentType === 'loss')) currentStreak++
    else break
  }

  // best win streak
  let bestWin = 0, tempWin = 0
  let bestLoss = 0, tempLoss = 0
  closed.forEach(t => {
    if (t.pnl >= 0) { tempWin++; bestWin = Math.max(bestWin, tempWin); tempLoss = 0 }
    else { tempLoss++; bestLoss = Math.max(bestLoss, tempLoss); tempWin = 0 }
  })

  // last 10 trades visual
  const last10 = closed.slice(-10)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px 18px', marginBottom: 12,
    }}>
      <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
        Win / Loss Streak
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          {
            label: 'Current streak',
            value: `${currentStreak} ${currentType === 'win' ? 'W' : 'L'}`,
            color: currentType === 'win' ? 'var(--accent)' : 'var(--red)',
            icon: currentType === 'win' ? <Flame size={14} color="#22c55e" /> : <Flame size={14} color="#ef4444" />,
          },
          { label: 'Best win streak',  value: `${bestWin}W`,  color: 'var(--accent)' },
          { label: 'Best loss streak', value: `${bestLoss}L`, color: 'var(--red)' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              {icon}
              <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</p>
            </div>
            <p className="mono" style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Last 10 trades visual */}
      <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>Last {last10.length} trades</p>
      <div style={{ display: 'flex', gap: 4 }}>
        {last10.map((t, i) => (
          <div key={i} title={`${t.instrument} · ${currency} ${Number(t.pnl).toFixed(2)}`} style={{
            flex: 1, height: 28, borderRadius: 5,
            background: t.pnl >= 0 ? '#22c55e20' : '#ef444420',
            border: `1px solid ${t.pnl >= 0 ? '#22c55e40' : '#ef444440'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
            color: t.pnl >= 0 ? 'var(--accent)' : 'var(--red)',
            cursor: 'default',
          }}>
            {t.pnl >= 0 ? 'W' : 'L'}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Best & Worst Trades ─────────────────────────────────────
function BestWorstTrades({ trades, currency }) {
  const closed = trades.filter(t => t.status === 'closed' && t.pnl != null)
  if (closed.length === 0) return null

  const sorted = [...closed].sort((a, b) => Number(b.pnl) - Number(a.pnl))
  const best  = sorted.slice(0, 3)
  const worst = sorted.slice(-3).reverse()

  function TradeRow({ t, rank }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px', borderRadius: 9,
        background: 'var(--bg)', border: '1px solid var(--border)',
        marginBottom: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 14 }}>#{rank}</span>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: t.direction === 'long' ? '#22c55e12' : '#ef444412',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {t.direction === 'long'
              ? <TrendingUp size={12} color="#22c55e" />
              : <TrendingDown size={12} color="#ef4444" />}
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{t.instrument}</p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{t.entry_date}</p>
          </div>
        </div>
        <p className="mono" style={{
          fontSize: 13, fontWeight: 600,
          color: Number(t.pnl) >= 0 ? 'var(--accent)' : 'var(--red)',
        }}>
          {fmt(Number(t.pnl), currency)}
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px 18px', marginBottom: 12,
    }}>
      <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
        Best &amp; Worst Trades
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 8, fontWeight: 500 }}>🏆 Best</p>
          {best.map((t, i) => <TradeRow key={t.id} t={t} rank={i + 1} />)}
        </div>
        <div>
          <p style={{ fontSize: 10, color: 'var(--red)', marginBottom: 8, fontWeight: 500 }}>💀 Worst</p>
          {worst.map((t, i) => <TradeRow key={t.id} t={t} rank={i + 1} />)}
        </div>
      </div>
    </div>
  )
}

// ── Day of Week Performance ─────────────────────────────────
function DayOfWeekPerf({ trades, currency }) {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const closed = trades.filter(t => t.status === 'closed' && t.pnl != null)

  const dayStats = DAYS.map((label, idx) => {
    const dayTrades = closed.filter(t => new Date(t.entry_date).getDay() === idx)
    const pnl = dayTrades.reduce((sum, t) => sum + Number(t.pnl), 0)
    const wins = dayTrades.filter(t => t.pnl > 0).length
    return { label, count: dayTrades.length, pnl, wins }
  })

  const maxAbs = Math.max(...dayStats.map(d => Math.abs(d.pnl)), 1)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px 18px', marginBottom: 12,
    }}>
      <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
        Performance by Day
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dayStats.map(({ label, count, pnl, wins }) => {
          const barPct = Math.abs(pnl) / maxAbs * 100
          const isPos = pnl >= 0
          const color = count === 0 ? 'var(--border-mid)' : isPos ? '#22c55e' : '#ef4444'
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 28, flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: 20, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${count === 0 ? 0 : barPct}%`,
                  background: `${color}25`,
                  borderRight: count > 0 ? `2px solid ${color}` : 'none',
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 120, justifyContent: 'flex-end' }}>
                {count > 0 ? (
                  <>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{count}T · {wins}W</span>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 600, color }}>
                      {fmt(pnl, currency)}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No trades</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────
export default function Analytics() {
  const { trades, loading } = useTrades()
  const { profile } = useProfile()
  const currency = profile?.trading_currency || 'MYR'
  const closed = trades.filter(t => t.status === 'closed' && t.pnl != null)

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {closed.length} closed trade{closed.length !== 1 ? 's' : ''} analysed
        </p>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading...</p>
      ) : closed.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '40px 20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>📊</p>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 6 }}>
            No data yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Close some trades in your Journal to see analytics.
          </p>
        </div>
      ) : (
        <>
          <PnlCalendar trades={trades} currency={currency} />
          <StreakTracker trades={trades} currency={currency} />
          <BestWorstTrades trades={trades} currency={currency} />
          <DayOfWeekPerf trades={trades} currency={currency} />
        </>
      )}
    </div>
  )
}