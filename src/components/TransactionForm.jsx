import { useState } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function DatePicker({ value, onChange }) {
  const [y, m, d] = value.split('-').map(Number)
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]
  const daysInMonth = new Date(y, m, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function update(newY, newM, newD) {
    const maxD = new Date(newY, newM, 0).getDate()
    const safeD = Math.min(newD, maxD)
    onChange(`${newY}-${String(newM).padStart(2,'0')}-${String(safeD).padStart(2,'0')}`)
  }

  const sel = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 8,
    padding: '7px 8px', fontSize: 12, outline: 'none',
    fontFamily: 'var(--font-sans)', flex: 1,
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select value={d} onChange={e => update(y, m, Number(e.target.value))} style={sel}>
        {days.map(day => <option key={day} value={day}>{day}</option>)}
      </select>
      <select value={m} onChange={e => update(y, Number(e.target.value), d)} style={sel}>
        {MONTHS.map((mn, i) => <option key={i} value={i+1}>{mn}</option>)}
      </select>
      <select value={y} onChange={e => update(Number(e.target.value), m, d)} style={sel}>
        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  )
}

export default function TransactionForm({ categories, onAdd, onClose }) {
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = categories.filter(c => c.type === form.type)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.description) {
      setError('Amount and description are required.')
      return
    }
    setSaving(true)
    const { error } = await onAdd({ ...form, amount: parseFloat(form.amount) })
    if (error) setError(error.message)
    else onClose()
    setSaving(false)
  }

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

  const isExpense = form.type === 'expense'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', padding: '0',
    }}>
      {/* Bottom sheet style on mobile */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-mid)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 36px',
        boxShadow: '0 -24px 64px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.25s cubic-bezier(0.32,0,0.15,1) both',
      }}>

        {/* Handle bar */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border-mid)',
          margin: '0 auto 18px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 20,
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Add transaction
          </p>
          <button onClick={onClose} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 7, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14,
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Type toggle */}
          <div style={{
            display: 'flex', borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--border)', marginBottom: 18,
            padding: 3, background: 'var(--bg)', gap: 3,
          }}>
            {['expense', 'income'].map(t => (
              <button type="button" key={t}
                onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
                style={{
                  flex: 1, padding: '8px', fontSize: 13, borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 600,
                  transition: 'all 0.15s',
                  background: form.type === t
                    ? t === 'expense' ? '#ef444420' : '#22c55e20'
                    : 'transparent',
                  color: form.type === t
                    ? t === 'expense' ? 'var(--red)' : 'var(--accent)'
                    : 'var(--text-secondary)',
                  boxShadow: form.type === t
                    ? `0 0 12px ${t === 'expense' ? '#ef444415' : '#22c55e15'}`
                    : 'none',
                }}>
                {t === 'expense' ? '↓ Expense' : '↑ Income'}
              </button>
            ))}
          </div>

          {/* Amount — big and prominent */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Amount (RM)</label>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--bg)', border: `1px solid ${isExpense ? '#ef444440' : '#22c55e40'}`,
              borderRadius: 9, padding: '4px 12px',
              boxShadow: `0 0 0 1px ${isExpense ? '#ef444410' : '#22c55e10'}`,
            }}>
              <span className="mono" style={{
                fontSize: 20, fontWeight: 700, marginRight: 6,
                color: isExpense ? 'var(--red)' : 'var(--accent)',
              }}>
                {isExpense ? '−' : '+'}
              </span>
              <input
                type="number" step="0.01" placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  outline: 'none', fontSize: 22, fontWeight: 700,
                  color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em',
                }} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Description</label>
            <input type="text" placeholder="What was this for?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={inputStyle} />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Category</label>
            <select value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              style={inputStyle}>
              <option value="">No category</option>
              {filtered.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Date</label>
            <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Notes <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
            <input type="text" placeholder="Any extra details..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={inputStyle} />
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
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '10px', borderRadius: 10, fontSize: 13,
              fontWeight: 600, cursor: 'pointer', border: 'none',
              fontFamily: 'var(--font-sans)',
              background: isExpense ? 'var(--red)' : 'var(--accent)',
              color: isExpense ? '#fff' : '#000',
              boxShadow: `0 0 16px ${isExpense ? '#ef444425' : '#22c55e25'}`,
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving...' : `Add ${form.type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}