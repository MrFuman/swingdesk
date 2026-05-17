import { useState } from 'react'
import { useTrades } from '../hooks/useTrades'
import { useProfile } from '../hooks/useProfile'
import { useTradeTags } from '../hooks/useTradeTags'
import TradeForm from '../components/TradeForm'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

function EquityCurve({ data, currency }) {
  if (data.length === 0) {
    return (
      <div style={{
        height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: 13,
      }}>
        Close some trades to see your equity curve
      </div>
    )
  }

  const isPositive = data[data.length - 1]?.equity >= 0
  const colorHex = isPositive ? '#22c55e' : '#ef4444'

  function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
        borderRadius: 8, padding: '8px 12px', fontSize: 11,
      }}>
        <p style={{ color: 'var(--text-primary)', marginBottom: 2 }}>
          {d.instrument} · Trade #{d.trade}
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{d.date}</p>
        <p style={{ color: d.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
          P&L: {currency} {d.pnl >= 0 ? '+' : ''}{d.pnl.toFixed(2)}
        </p>
        <p style={{ color: colorHex }}>
          Total: {currency} {d.equity >= 0 ? '+' : ''}{d.equity.toFixed(2)}
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colorHex} stopOpacity={0.15} />
            <stop offset="95%" stopColor={colorHex} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="trade" tick={{ fill: '#333', fontSize: 10 }}
          tickLine={false} axisLine={false}
          tickFormatter={v => `#${v}`} />
        <YAxis tick={{ fill: '#333', fontSize: 10 }}
          tickLine={false} axisLine={false}
          tickFormatter={v => `${v >= 0 ? '+' : ''}${v}`}
          width={52} />
        <ReferenceLine y={0} stroke="var(--border-mid)" strokeDasharray="4 3" />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="equity"
          stroke={colorHex} strokeWidth={1.5}
          fill="url(#equityGrad)"
          dot={{ fill: colorHex, strokeWidth: 0, r: 2.5 }}
          activeDot={{ fill: colorHex, strokeWidth: 0, r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function Journal() {
  const [showForm, setShowForm] = useState(false)
  const [editTrade, setEditTrade] = useState(null)
  const [activeTag, setActiveTag] = useState(null)

  const { trades, loading, addTrade, updateTrade, deleteTrade, stats, equityCurve, uploadScreenshot } = useTrades()
  const { profile } = useProfile()
  const { tags } = useTradeTags()

  const currency = profile?.trading_currency || 'MYR'

  // Filter trades by active tag
  const filteredTrades = activeTag
    ? trades.filter(t => t.tags && t.tags.includes(activeTag))
    : trades

  return (
    <div>
      {/* Header */}
      <div className="fade-up" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {trades.length} trade{trades.length !== 1 ? 's' : ''} logged
        </p>
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--accent)', color: '#000',
          border: 'none', borderRadius: 9, padding: '7px 14px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 0 16px #22c55e25',
        }}>
          <Plus size={13} /> Log trade
        </button>
      </div>

      {/* Tag filter bar */}
      {tags.length > 0 && (
        <div className="fade-up-1" style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16,
        }}>
          <button
            onClick={() => setActiveTag(null)}
            style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 11,
              fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              background: !activeTag ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: !activeTag ? 'var(--accent)' : 'var(--text-secondary)',
              border: `1px solid ${!activeTag ? 'var(--accent-border)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}>
            All
          </button>
          {tags.map(tag => {
            const isActive = activeTag === tag.name
            return (
              <button
                key={tag.id}
                onClick={() => setActiveTag(isActive ? null : tag.name)}
                style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 11,
                  fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  background: isActive ? `${tag.color}25` : 'var(--bg-card)',
                  color: isActive ? tag.color : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? tag.color + '50' : 'var(--border)'}`,
                  transition: 'all 0.15s',
                }}>
                {tag.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Stats grid */}
      <div className="fade-up-1" style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10, marginBottom: 12,
      }}>
        {[
          { label: 'Total trades', value: stats.total, color: 'var(--text-primary)', mono: false },
          { label: 'Win rate', value: `${stats.winRate}%`, color: 'var(--accent)', mono: true },
          {
            label: 'Total P&L',
            value: `${currency} ${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}`,
            color: stats.totalPnl >= 0 ? 'var(--accent)' : 'var(--red)', mono: true
          },
          { label: 'Profit factor', value: stats.profitFactor, color: 'var(--indigo)', mono: true },
        ].map(({ label, value, color, mono }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <p style={{
              fontSize: 10, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              marginBottom: 6, fontWeight: 500,
            }}>{label}</p>
            <p className={mono ? 'mono' : ''} style={{
              fontSize: 20, fontWeight: 600, color,
              letterSpacing: mono ? '-0.02em' : 'normal',
            }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Equity curve */}
      <div className="fade-up-2" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 12,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 12,
        }}>
          <div>
            <p style={{
              fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>Equity Curve</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              Cumulative P&L · closed trades
            </p>
          </div>
          {equityCurve.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Net P&L</p>
              <p className="mono" style={{
                fontSize: 14, fontWeight: 600, marginTop: 2,
                color: stats.totalPnl >= 0 ? 'var(--accent)' : 'var(--red)',
              }}>
                {stats.totalPnl >= 0 ? '+' : ''}{currency} {stats.totalPnl.toFixed(2)}
              </p>
            </div>
          )}
        </div>
        <EquityCurve data={equityCurve} currency={currency} />
      </div>

      {/* Trade history */}
      <div className="fade-up-3" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px 10px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{
              fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>Trade History</p>
            {activeTag && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 5,
                background: 'var(--accent-dim)', color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
              }}>
                {filteredTrades.length} result{filteredTrades.length !== 1 ? 's' : ''} · {activeTag}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Tap a trade to edit or close
          </p>
        </div>

        {loading && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Loading...
          </p>
        )}
        {!loading && filteredTrades.length === 0 && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            {activeTag ? `No trades tagged "${activeTag}".` : 'No trades yet. Log your first trade!'}
          </p>
        )}

        {filteredTrades.map((t, i) => (
          <div key={t.id}
            onClick={() => setEditTrade(t)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 18px', cursor: 'pointer',
              borderBottom: i < filteredTrades.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: t.direction === 'long' ? '#22c55e12' : '#ef444412',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.direction === 'long'
                  ? <TrendingUp size={14} color="#22c55e" />
                  : <TrendingDown size={14} color="#ef4444" />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {t.instrument}
                  </p>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: t.status === 'open' ? '#f59e0b18' : 'var(--border)',
                    color: t.status === 'open' ? 'var(--amber)' : 'var(--text-secondary)',
                    fontWeight: 500,
                  }}>{t.status}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {t.direction.toUpperCase()} · {t.entry_date}
                </p>
                {/* Tags on trade row */}
                {t.tags && t.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {t.tags.map(tagName => {
                      const tagObj = tags.find(tg => tg.name === tagName)
                      return (
                        <span key={tagName} style={{
                          fontSize: 9, padding: '1px 6px', borderRadius: 4,
                          background: tagObj ? `${tagObj.color}20` : 'var(--border)',
                          color: tagObj ? tagObj.color : 'var(--text-secondary)',
                          border: `1px solid ${tagObj ? tagObj.color + '35' : 'var(--border)'}`,
                          fontWeight: 500,
                        }}>{tagName}</span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>Entry</p>
                <p className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                  {t.entry_price}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>P&L</p>
                <p className="mono" style={{
                  fontSize: 13, fontWeight: 600,
                  color: t.pnl > 0 ? 'var(--accent)' : t.pnl < 0 ? 'var(--red)' : 'var(--text-secondary)',
                }}>
                  {t.pnl != null
                    ? `${t.pnl >= 0 ? '+' : ''}${currency} ${Number(t.pnl).toFixed(2)}`
                    : '—'}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteTrade(t.id) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', padding: 2,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <TradeForm
          onAdd={addTrade}
          onUpdate={updateTrade}
          onUploadScreenshot={uploadScreenshot}
          onClose={() => setShowForm(false)}
        />
      )}
      {editTrade && (
        <TradeForm
          editMode
          tradeId={editTrade.id}
          prefill={editTrade}
          onAdd={addTrade}
          onUpdate={updateTrade}
          onUploadScreenshot={uploadScreenshot}
          onClose={() => setEditTrade(null)}
        />
      )}
    </div>
  )
}