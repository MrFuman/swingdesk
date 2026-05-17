import { useTrades } from '../hooks/useTrades'
import { useProfile } from '../hooks/useProfile'
import TradeForm from '../components/TradeForm'
import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function OpenPositions() {
  const { trades, openTrades = [], updateTrade, deleteTrade, uploadScreenshot } = useTrades()
  const { profile } = useProfile()
  const [editTrade, setEditTrade] = useState(null)
  const currency = profile?.trading_currency || 'MYR'
  const capital = profile?.trading_capital || 0

  const totalExposure = openTrades.reduce((sum, t) =>
    sum + (Number(t.entry_price) * Number(t.position_size)), 0)

  return (
    <div>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {openTrades.length} open position{openTrades.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary cards */}
      <div className="fade-up-1" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 14,
      }}>
        {[
          { label: 'Open trades', value: openTrades.length, color: 'var(--text-primary)', mono: false },
          { label: 'Total exposure', value: `${currency} ${totalExposure.toFixed(2)}`, color: 'var(--amber)', mono: true },
          { label: 'Capital used', value: `${capital > 0 ? ((totalExposure / capital) * 100).toFixed(1) : 0}%`, color: 'var(--indigo)', mono: true },
        ].map(({ label, value, color, mono }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontWeight: 500 }}>{label}</p>
            <p className={mono ? 'mono' : ''} style={{ fontSize: 18, fontWeight: 600, color, letterSpacing: mono ? '-0.02em' : 'normal' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Open trades list */}
      <div className="fade-up-2" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Open Positions
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Tap to edit or close a position
          </p>
        </div>

        {openTrades.length === 0 && (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>📭</p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>No open positions</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Log a trade with status Open to see it here</p>
          </div>
        )}

        {openTrades.map((t, i) => {
          const exposure = Number(t.entry_price) * Number(t.position_size)
          const slRisk = t.stop_loss
            ? Math.abs(Number(t.entry_price) - Number(t.stop_loss)) * Number(t.position_size)
            : null
          const tpPotential = t.take_profit
            ? Math.abs(Number(t.take_profit) - Number(t.entry_price)) * Number(t.position_size)
            : null

          return (
            <div key={t.id}
              onClick={() => setEditTrade(t)}
              style={{
                padding: '14px 18px', cursor: 'pointer',
                borderBottom: i < openTrades.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: t.direction === 'long' ? '#22c55e12' : '#ef444412',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {t.direction === 'long'
                      ? <TrendingUp size={15} color="#22c55e" />
                      : <TrendingDown size={15} color="#ef4444" />}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.instrument}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {t.direction.toUpperCase()} · {t.entry_date} · {t.market}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>Exposure</p>
                  <p className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>
                    {currency} {exposure.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Details row */}
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { label: 'Entry', value: t.entry_price },
                  { label: 'Size', value: t.position_size },
                  t.stop_loss ? { label: 'SL', value: t.stop_loss, color: 'var(--red)' } : null,
                  t.take_profit ? { label: 'TP', value: t.take_profit, color: 'var(--accent)' } : null,
                ].filter(Boolean).map(({ label, value, color }) => (
                  <div key={label}>
                    <p style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</p>
                    <p className="mono" style={{ fontSize: 12, fontWeight: 500, color: color || 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
                {slRisk && (
                  <div>
                    <p style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Max risk</p>
                    <p className="mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--red)' }}>−{currency} {slRisk.toFixed(2)}</p>
                  </div>
                )}
                {tpPotential && (
                  <div>
                    <p style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Potential</p>
                    <p className="mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>+{currency} {tpPotential.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {t.tags && t.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                  {t.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 4,
                      background: 'var(--border)', color: 'var(--text-secondary)',
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editTrade && (
        <TradeForm
          editMode tradeId={editTrade.id} prefill={editTrade}
          onAdd={() => {}} onUpdate={updateTrade}
          onUploadScreenshot={uploadScreenshot}
          onClose={() => setEditTrade(null)}
        />
      )}
    </div>
  )
}