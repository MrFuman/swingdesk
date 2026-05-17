import { useState, useRef } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useTradeTags } from '../hooks/useTradeTags'
import { X, Image } from 'lucide-react'

export default function TradeForm({ onAdd, onUpdate, onClose, prefill, editMode, tradeId, onUploadScreenshot }) {
  const { profile } = useProfile()
  const { tags } = useTradeTags()
  const currency = profile?.trading_currency || 'MYR'
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    instrument: prefill?.instrument || '',
    direction: prefill?.direction || 'long',
    entry_price: prefill?.entry_price || '',
    exit_price: prefill?.exit_price || '',
    stop_loss: prefill?.stop_loss || '',
    take_profit: prefill?.take_profit || '',
    position_size: prefill?.position_size || '',
    status: prefill?.status || 'open',
    market: prefill?.market || 'stocks',
    setup: prefill?.setup || '',
    notes: prefill?.notes || '',
    entry_date: prefill?.entry_date || new Date().toISOString().slice(0, 10),
    exit_date: prefill?.exit_date || '',
    tags: prefill?.tags || [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(prefill?.screenshot_url || null)

  // ── Capital protection calculations ──────────────────────
  const capital = profile?.trading_capital || 0
  const riskPct = profile?.risk_per_trade || 1
  const size = parseFloat(form.position_size) || 0
  const entryP = parseFloat(form.entry_price) || 0
  const slP = parseFloat(form.stop_loss) || 0
  const exposure = entryP * size
  const slDistance = form.direction === 'long' ? entryP - slP : slP - entryP
  const tradeRisk = slDistance > 0 ? slDistance * size : 0
  const maxRisk = capital * (riskPct / 100)

  const isOverCapital = capital > 0 && size > 0 && entryP > 0 && exposure > capital
  const isOverRisk = capital > 0 && slP > 0 && tradeRisk > maxRisk * 1.5
  const isBlocked = isOverCapital || isOverRisk

  // Capital warning message
  function CapitalWarning() {
    if (!size || !entryP || !capital) return null
    if (isOverCapital) return (
      <div style={{
        padding: '8px 12px', borderRadius: 8, marginTop: 6,
        background: '#ef444415', border: '1px solid #ef444435',
      }}>
        <p style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500 }}>
          🚫 Exposure {currency} {exposure.toFixed(2)} exceeds your capital {currency} {capital.toLocaleString()}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
          Reduce position size to proceed
        </p>
      </div>
    )
    if (isOverRisk && slP) return (
      <div style={{
        padding: '8px 12px', borderRadius: 8, marginTop: 6,
        background: '#ef444415', border: '1px solid #ef444435',
      }}>
        <p style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500 }}>
          🚫 SL risk {currency} {tradeRisk.toFixed(2)} is way over your {riskPct}% limit ({currency} {maxRisk.toFixed(2)})
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
          Reduce position size to proceed
        </p>
      </div>
    )
    if (exposure > capital * 0.5) return (
      <p style={{ fontSize: 11, color: 'var(--amber)', marginTop: 6 }}>
        ⚡ Exposure {currency} {exposure.toFixed(2)} is {((exposure / capital) * 100).toFixed(0)}% of your capital
      </p>
    )
    if (slP && tradeRisk > maxRisk) return (
      <p style={{ fontSize: 11, color: 'var(--amber)', marginTop: 6 }}>
        ⚡ Risk {currency} {tradeRisk.toFixed(2)} slightly over your max {currency} {maxRisk.toFixed(2)}
      </p>
    )
    if (slP && tradeRisk > 0) return (
      <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>
        ✓ Risk {currency} {tradeRisk.toFixed(2)} · Exposure {currency} {exposure.toFixed(2)}
      </p>
    )
    return (
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
        Exposure {currency} {exposure.toFixed(2)}
      </p>
    )
  }

  // ── P&L preview ───────────────────────────────────────────
  const pnl = form.exit_price && form.entry_price && form.position_size
    ? form.direction === 'long'
      ? (Number(form.exit_price) - Number(form.entry_price)) * Number(form.position_size)
      : (Number(form.entry_price) - Number(form.exit_price)) * Number(form.position_size)
    : null

  function toggleTag(tagName) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tagName)
        ? f.tags.filter(t => t !== tagName)
        : [...f.tags, tagName]
    }))
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setScreenshotFile(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isBlocked) return
    if (!form.instrument || !form.entry_price || !form.position_size) {
      setError('Instrument, entry price and position size are required.')
      return
    }
    setSaving(true)
    const submitData = {
      ...form,
      entry_price: parseFloat(form.entry_price),
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      position_size: parseFloat(form.position_size),
      pnl: form.status === 'closed' && pnl !== null ? pnl : null,
      exit_date: form.exit_date || null,
      tags: form.tags,
    }

    let result
    if (editMode && tradeId) {
      result = await onUpdate(tradeId, submitData)
    } else {
      result = await onAdd(submitData)
    }

    if (!result?.error && screenshotFile && onUploadScreenshot) {
      const savedTradeId = editMode ? tradeId : result?.id
      if (savedTradeId) await onUploadScreenshot(savedTradeId, screenshotFile)
    }

    if (result?.error) setError(result.error.message)
    else onClose()
    setSaving(false)
  }

  const input = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 9,
    padding: '8px 12px', fontSize: 13, outline: 'none',
    fontFamily: 'var(--font-sans)', width: '100%',
  }

  const labelStyle = {
    fontSize: 10, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    fontWeight: 500, display: 'block', marginBottom: 5,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-mid)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 36px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 -24px 64px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.25s cubic-bezier(0.32,0,0.15,1) both',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border-mid)', margin: '0 auto 18px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20,
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {editMode ? 'Edit trade' : 'Log trade'}
          </p>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 18,
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Direction */}
          <div style={{
            display: 'flex', borderRadius: 9, overflow: 'hidden',
            border: '1px solid var(--border)', marginBottom: 14,
            padding: 3, background: 'var(--bg)', gap: 3,
          }}>
            {['long', 'short'].map(d => (
              <button type="button" key={d}
                onClick={() => setForm(f => ({ ...f, direction: d }))}
                style={{
                  flex: 1, padding: '8px', fontSize: 13, borderRadius: 7,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 600,
                  background: form.direction === d
                    ? d === 'long' ? '#22c55e20' : '#ef444420'
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Instrument</label>
              <input type="text" placeholder="AAPL, EURUSD"
                value={form.instrument}
                onChange={e => setForm(f => ({ ...f, instrument: e.target.value }))}
                style={input} />
            </div>
            <div>
              <label style={labelStyle}>Market</label>
              <select value={form.market}
                onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                style={input}>
                <option value="stocks">Stocks</option>
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="futures">Futures</option>
              </select>
            </div>
          </div>

          {/* Entry + Position size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            <div>
              <label style={labelStyle}>Entry price</label>
              <input type="number" step="any" placeholder="0.00"
                value={form.entry_price}
                onChange={e => setForm(f => ({ ...f, entry_price: e.target.value }))}
                style={input} />
            </div>
            <div>
              <label style={labelStyle}>
                Position size <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(shares)</span>
              </label>
              <input type="number" step="any" placeholder="0"
                value={form.position_size}
                onChange={e => setForm(f => ({ ...f, position_size: e.target.value }))}
                style={{
                  ...input,
                  borderColor: isBlocked ? '#ef444460' : 'var(--border)',
                }} />
            </div>
          </div>

          {/* Capital warning — shows below entry+size row */}
          <div style={{ marginBottom: 12 }}>
            <CapitalWarning />
          </div>

          {/* SL + TP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Stop loss</label>
              <input type="number" step="any" placeholder="0.00"
                value={form.stop_loss}
                onChange={e => setForm(f => ({ ...f, stop_loss: e.target.value }))}
                style={input} />
            </div>
            <div>
              <label style={labelStyle}>Take profit</label>
              <input type="number" step="any" placeholder="0.00"
                value={form.take_profit}
                onChange={e => setForm(f => ({ ...f, take_profit: e.target.value }))}
                style={input} />
            </div>
          </div>

          {/* Status toggle */}
          <div style={{
            display: 'flex', borderRadius: 9, overflow: 'hidden',
            border: '1px solid var(--border)', marginBottom: 12,
            padding: 3, background: 'var(--bg)', gap: 3,
          }}>
            {['open', 'closed'].map(s => (
              <button type="button" key={s}
                onClick={() => setForm(f => ({ ...f, status: s }))}
                style={{
                  flex: 1, padding: '7px', fontSize: 13, borderRadius: 7,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 500,
                  background: form.status === s ? 'var(--bg-elevated)' : 'transparent',
                  color: form.status === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                {s === 'open' ? '🟡 Open' : '✅ Closed'}
              </button>
            ))}
          </div>

          {/* Exit fields */}
          {form.status === 'closed' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Exit price</label>
                <input type="number" step="any" placeholder="0.00"
                  value={form.exit_price}
                  onChange={e => setForm(f => ({ ...f, exit_price: e.target.value }))}
                  style={input} />
              </div>
              <div>
                <label style={labelStyle}>Exit date</label>
                <input type="date"
                  value={form.exit_date}
                  onChange={e => setForm(f => ({ ...f, exit_date: e.target.value }))}
                  style={{ ...input, colorScheme: 'dark' }} />
              </div>
            </div>
          )}

          {/* P&L preview */}
          {pnl !== null && form.status === 'closed' && (
            <div style={{
              padding: '10px 14px', borderRadius: 9, marginBottom: 12,
              background: 'var(--bg)', border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>
                Estimated P&L
              </p>
              <p className="mono" style={{
                fontSize: 18, fontWeight: 700,
                color: pnl >= 0 ? 'var(--accent)' : 'var(--red)',
              }}>
                {pnl >= 0 ? '+' : '−'}{currency} {Math.abs(pnl).toFixed(2)}
              </p>
            </div>
          )}

          {/* Entry date */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Entry date</label>
            <input type="date"
              value={form.entry_date}
              onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
              style={{ ...input, colorScheme: 'dark' }} />
          </div>

          {/* Setup */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Setup</label>
            <input type="text" placeholder="e.g. breakout, pullback"
              value={form.setup}
              onChange={e => setForm(f => ({ ...f, setup: e.target.value }))}
              style={input} />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map(tag => {
                  const selected = form.tags.includes(tag.name)
                  return (
                    <button type="button" key={tag.id}
                      onClick={() => toggleTag(tag.name)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11,
                        fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        background: selected ? `${tag.color}25` : 'var(--bg)',
                        color: selected ? tag.color : 'var(--text-secondary)',
                        border: `1px solid ${selected ? tag.color + '50' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}>
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Screenshot */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Chart screenshot</label>
            {screenshotPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={screenshotPreview} alt="chart" style={{
                  width: '100%', borderRadius: 9,
                  border: '1px solid var(--border)',
                  maxHeight: 180, objectFit: 'cover',
                }} />
                <button type="button"
                  onClick={() => { setScreenshotPreview(null); setScreenshotFile(null) }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)', border: 'none',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                  <X size={12} color="white" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} style={{
                width: '100%', padding: '16px', borderRadius: 9,
                border: '1px dashed var(--border)', background: 'var(--bg)',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                color: 'var(--text-secondary)', fontSize: 13,
                fontFamily: 'var(--font-sans)',
              }}>
                <Image size={15} /> Upload chart image
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*"
              onChange={handleFileChange} style={{ display: 'none' }} />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Notes</label>
            <textarea placeholder="Post-trade review, observations..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ ...input, resize: 'none' }} />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px', borderRadius: 10, fontSize: 13,
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}>Cancel</button>
            <button type="submit" disabled={saving || isBlocked} style={{
              flex: 2, padding: '10px', borderRadius: 10, fontSize: 13,
              fontWeight: 600, border: 'none',
              cursor: isBlocked ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
              background: isBlocked
                ? 'var(--border-mid)'
                : 'var(--accent)',
              color: isBlocked ? 'var(--text-secondary)' : '#000',
              opacity: saving ? 0.7 : 1,
              boxShadow: isBlocked ? 'none' : '0 0 16px #22c55e25',
            }}>
              {saving ? 'Saving...'
                : isOverCapital ? '🚫 Over capital'
                : isOverRisk ? '🚫 Over risk limit'
                : editMode ? 'Save changes'
                : 'Log trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}