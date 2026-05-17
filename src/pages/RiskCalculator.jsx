import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useRiskCalculations } from '../hooks/useRiskCalculations'
import TradeForm from '../components/TradeForm'
import { useTrades } from '../hooks/useTrades'
import { Trash2, Calculator, ArrowRight } from 'lucide-react'

const inputStyle = {
  width: '100%', background: 'var(--bg)',
  border: '1px solid var(--border)', color: 'var(--text-primary)',
  borderRadius: 9, padding: '8px 12px', fontSize: 13,
  outline: 'none', fontFamily: 'var(--font-sans)',
}

const labelStyle = {
  fontSize: 10, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  fontWeight: 500, display: 'block', marginBottom: 5,
}

export default function RiskCalculator() {
  const { profile } = useProfile()
  const { calculations, loading, saveCalculation, deleteCalculation } = useRiskCalculations()
  const { addTrade } = useTrades()

  const currency = profile?.trading_currency || 'MYR'
  const capital = profile?.trading_capital || 0
  const defaultRisk = profile?.risk_per_trade || 1

  const [form, setForm] = useState({
    instrument: '', direction: 'long', market: 'stocks',
    entry_price: '', stop_loss: '', take_profit: '', notes: '',
  })
  const [saved, setSaved] = useState(false)
  const [importTrade, setImportTrade] = useState(null)

  const entry = parseFloat(form.entry_price) || 0
  const sl = parseFloat(form.stop_loss) || 0
  const tp = parseFloat(form.take_profit) || 0
  const slDistance = form.direction === 'long' ? entry - sl : sl - entry
  const tpDistance = form.direction === 'long' ? tp - entry : entry - tp
  const riskAmount = capital * (defaultRisk / 100)
  const positionSize = slDistance > 0 ? riskAmount / slDistance : 0
  const riskReward = slDistance > 0 && tpDistance > 0 ? tpDistance / slDistance : 0
  const potentialProfit = positionSize * tpDistance
  const potentialLoss = positionSize * slDistance
  const isValid = entry > 0 && sl > 0 && slDistance > 0

  async function handleSave() {
    if (!isValid) return
    const { error } = await saveCalculation({
      instrument: form.instrument || 'Untitled',
      direction: form.direction, market: form.market,
      entry_price: entry, stop_loss: sl,
      take_profit: tp || null,
      position_size: parseFloat(positionSize.toFixed(4)),
      risk_amount: parseFloat(riskAmount.toFixed(2)),
      risk_reward: tp ? parseFloat(riskReward.toFixed(2)) : null,
      capital_at_risk_pct: parseFloat(defaultRisk),
      notes: form.notes || null,
    })
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  function handleImport(calc) {
    setImportTrade({
      instrument: calc.instrument, direction: calc.direction,
      market: calc.market, entry_price: calc.entry_price,
      stop_loss: calc.stop_loss, take_profit: calc.take_profit,
      position_size: calc.position_size, status: 'open',
      setup: '', notes: calc.notes || '',
      entry_date: new Date().toISOString().slice(0, 10),
      exit_price: '', exit_date: '',
    })
  }

  const rrColor = riskReward >= 2 ? 'var(--accent)' : riskReward >= 1 ? 'var(--amber)' : 'var(--red)'

  return (
    <div>
      {/* Subheader */}
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {currency} {capital.toLocaleString()} capital · {defaultRisk}% risk per trade
        </p>
      </div>

      {/* Calculator card */}
      <div className="fade-up-1" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '18px', marginBottom: 12,
      }}>

        {/* Direction toggle */}
        <div style={{
          display: 'flex', borderRadius: 9, overflow: 'hidden',
          border: '1px solid var(--border)', marginBottom: 16,
        }}>
          {['long', 'short'].map(d => (
            <button key={d} onClick={() => setForm(f => ({ ...f, direction: d }))} style={{
              flex: 1, padding: '8px', fontSize: 13, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 500, transition: 'all 0.15s',
              background: form.direction === d
                ? d === 'long' ? '#22c55e15' : '#ef444415'
                : 'transparent',
              color: form.direction === d
                ? d === 'long' ? 'var(--accent)' : 'var(--red)'
                : 'var(--text-secondary)',
            }}>
              {d === 'long' ? '↑ Long' : '↓ Short'}
            </button>
          ))}
        </div>

        {/* Instrument + Market */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Instrument</label>
            <input type="text" placeholder="AAPL, EURUSD..."
              value={form.instrument}
              onChange={e => setForm(f => ({ ...f, instrument: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Market</label>
            <select value={form.market}
              onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
              style={inputStyle}>
              <option value="stocks">Stocks</option>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
              <option value="futures">Futures</option>
            </select>
          </div>
        </div>

        {/* Prices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { label: 'Entry price', key: 'entry_price' },
            { label: 'Stop loss', key: 'stop_loss' },
            { label: 'Take profit', key: 'take_profit', optional: true },
          ].map(({ label, key, optional }) => (
            <div key={key}>
              <label style={labelStyle}>
                {label}{optional && <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>(opt)</span>}
              </label>
              <input type="number" step="any" placeholder="0.00"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={inputStyle} />
            </div>
          ))}
        </div>

        <textarea placeholder="Notes (optional)"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2}
          style={{ ...inputStyle, resize: 'none', marginBottom: 14 }} />

        {/* Results */}
        {isValid ? (
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 14,
          }}>
            <p style={{
              fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase',
              letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12,
            }}>Results</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>Position size</p>
                <p className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {positionSize.toFixed(2)}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4, fontFamily: 'var(--font-sans)', fontWeight: 400 }}>units</span>
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>Max risk</p>
                <p className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--amber)' }}>
                  {currency} {riskAmount.toFixed(2)}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4, fontFamily: 'var(--font-sans)', fontWeight: 400 }}>({defaultRisk}%)</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: tp > 0 && riskReward > 0 ? 12 : 0 }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>Potential loss</p>
                <p className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--red)' }}>
                  − {currency} {potentialLoss.toFixed(2)}
                </p>
              </div>
              {tp > 0 && tpDistance > 0 && (
                <div>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>Potential profit</p>
                  <p className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
                    + {currency} {potentialProfit.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {tp > 0 && riskReward > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>Risk / Reward</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p className="mono" style={{ fontSize: 20, fontWeight: 700, color: rrColor }}>
                    1 : {riskReward.toFixed(2)}
                  </p>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 500,
                    background: riskReward >= 2 ? '#22c55e18' : riskReward >= 1 ? '#f59e0b18' : '#ef444418',
                    color: rrColor,
                  }}>
                    {riskReward >= 2 ? '✓ Good' : riskReward >= 1 ? '~ Okay' : '✗ Poor'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Calculator size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Enter entry & stop loss to calculate
            </p>
          </div>
        )}

        <button onClick={handleSave} disabled={!isValid} style={{
          width: '100%', padding: '9px', borderRadius: 9,
          fontSize: 13, fontWeight: 600, cursor: isValid ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
          background: saved ? '#22c55e18' : isValid ? '#22c55e18' : 'transparent',
          color: saved ? 'var(--accent)' : isValid ? 'var(--accent)' : 'var(--text-muted)',
          border: `1px solid ${saved ? '#22c55e40' : isValid ? '#22c55e30' : 'var(--border)'}`,
        }}>
          {saved ? '✓ Saved!' : 'Save calculation'}
        </button>
      </div>

      {/* Saved calculations */}
      <div className="fade-up-2" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)' }}>
          <p style={{
            fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>Saved Calculations</p>
        </div>

        {loading && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>Loading...</p>
        )}
        {!loading && calculations.length === 0 && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            No saved calculations yet.
          </p>
        )}

        {calculations.map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 18px',
            borderBottom: i < calculations.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: c.direction === 'long' ? '#22c55e12' : '#ef444412',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 600,
                color: c.direction === 'long' ? 'var(--accent)' : 'var(--red)',
              }}>
                {c.direction === 'long' ? '↑' : '↓'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {c.instrument}
                  </p>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {c.market}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {c.entry_price} → SL {c.stop_loss}
                  {c.take_profit ? ` · TP ${c.take_profit}` : ''}
                  {c.risk_reward ? ` · R:R 1:${c.risk_reward}` : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>Risk</p>
                <p className="mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--amber)' }}>
                  {currency} {c.risk_amount}
                </p>
              </div>
              <button onClick={() => handleImport(c)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7, fontSize: 11,
                fontWeight: 500, cursor: 'pointer', border: 'none',
                background: 'var(--accent-dim)', color: 'var(--accent)',
                fontFamily: 'var(--font-sans)',
              }}>
                Import <ArrowRight size={10} />
              </button>
              <button onClick={() => deleteCalculation(c.id)} style={{
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

      {importTrade && (
        <TradeForm
          onAdd={addTrade}
          onClose={() => setImportTrade(null)}
          prefill={importTrade}
        />
      )}
    </div>
  )
}