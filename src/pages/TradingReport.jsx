import { useTrades } from '../hooks/useTrades'
import { useProfile } from '../hooks/useProfile'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

export default function TradingReport() {
  const { trades } = useTrades()
  const { profile } = useProfile()
  const currency = profile?.trading_currency || 'MYR'
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const years = [now.getFullYear() - 1, now.getFullYear()]

  const closed = trades.filter(t => t.status === 'closed' && t.pnl != null)

  // Build monthly data
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
    const monthTrades = closed.filter(t => t.entry_date?.startsWith(monthStr))
    const pnl = monthTrades.reduce((sum, t) => sum + Number(t.pnl), 0)
    const wins = monthTrades.filter(t => t.pnl > 0).length
    const winRate = monthTrades.length > 0 ? Math.round((wins / monthTrades.length) * 100) : 0
    return {
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      pnl, trades: monthTrades.length, wins, winRate,
    }
  })

  const yearPnl = months.reduce((sum, m) => sum + m.pnl, 0)
  const yearTrades = months.reduce((sum, m) => sum + m.trades, 0)
  const bestMonth = [...months].sort((a, b) => b.pnl - a.pnl)[0]
  const worstMonth = [...months].sort((a, b) => a.pnl - b.pnl)[0]

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12,
      }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{label} {year}</p>
        <p className="mono" style={{ color: d.pnl >= 0 ? 'var(--accent)' : 'var(--red)', marginBottom: 2 }}>
          P&L: {d.pnl >= 0 ? '+' : ''}{currency} {d.pnl.toFixed(2)}
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>{d.trades} trades · {d.winRate}% WR</p>
      </div>
    )
  }

  return (
    <div>
      {/* Year selector */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {yearTrades} trades in {year}
        </p>
        <select value={year} onChange={e => setYear(Number(e.target.value))} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', borderRadius: 9,
          padding: '6px 10px', fontSize: 12, outline: 'none',
          fontFamily: 'var(--font-sans)',
        }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Year summary cards */}
      <div className="fade-up-1" style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10, marginBottom: 14,
      }}>
        {[
          { label: `${year} P&L`, value: `${yearPnl >= 0 ? '+' : ''}${currency} ${yearPnl.toFixed(2)}`, color: yearPnl >= 0 ? 'var(--accent)' : 'var(--red)' },
          { label: 'Total trades', value: yearTrades, color: 'var(--text-primary)' },
          { label: 'Best month', value: `${bestMonth.month} · ${currency} ${bestMonth.pnl.toFixed(2)}`, color: 'var(--accent)' },
          { label: 'Worst month', value: `${worstMonth.month} · ${currency} ${worstMonth.pnl.toFixed(2)}`, color: 'var(--red)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontWeight: 500 }}>{label}</p>
            <p className="mono" style={{ fontSize: 14, fontWeight: 600, color, letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly P&L bar chart */}
      <div className="fade-up-2" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14,
      }}>
        <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
          Monthly P&L
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false}
              tickFormatter={v => `${v >= 0 ? '+' : ''}${v}`} width={52} />
            <ReferenceLine y={0} stroke="var(--border-mid)" strokeDasharray="4 3" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {months.map((m, i) => (
                <Cell key={i} fill={m.pnl >= 0 ? '#22c55e' : '#ef4444'}
                  fillOpacity={m.trades === 0 ? 0.1 : 0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="fade-up-3" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Monthly Breakdown
          </p>
        </div>
        {months.filter(m => m.trades > 0).length === 0 && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            No closed trades in {year}.
          </p>
        )}
        {months.map((m, i) => {
          if (m.trades === 0) return null
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 18px',
              borderBottom: '1px solid var(--border)',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', width: 32 }}>{m.month}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.trades} trades</span>
                  <span style={{ fontSize: 11, color: m.winRate >= 50 ? 'var(--accent)' : 'var(--red)' }}>{m.winRate}% WR</span>
                </div>
              </div>
              <p className="mono" style={{
                fontSize: 13, fontWeight: 600,
                color: m.pnl >= 0 ? 'var(--accent)' : 'var(--red)',
              }}>
                {m.pnl >= 0 ? '+' : ''}{currency} {m.pnl.toFixed(2)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}