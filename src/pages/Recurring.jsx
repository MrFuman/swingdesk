import { useState } from 'react'
import { useRecurring } from '../hooks/useRecurring'
import { useCategories } from '../hooks/useCategories'
import { Trash2, Plus, Check, Bell } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function DatePicker({ value, onChange }) {
  const parts = (value || new Date().toISOString().slice(0,10)).split('-').map(Number)
  const [y, m, d] = parts
  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1, currentYear + 2]
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

function DaysChip({ nextDate, active }) {
  if (!active) return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 5,
      background: 'var(--border)', color: 'var(--text-secondary)',
    }}>Inactive</span>
  )
  const days = Math.ceil((new Date(nextDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 500,
      background: '#ef444418', color: 'var(--red)',
    }}>Overdue {Math.abs(days)}d</span>
  )
  if (days === 0) return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 500,
      background: '#f59e0b18', color: 'var(--amber)',
    }}>Due today</span>
  )
  if (days <= 7) return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 500,
      background: '#f59e0b18', color: 'var(--amber)',
    }}>Due in {days}d</span>
  )
  return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 5,
      background: 'var(--border)', color: 'var(--text-secondary)',
    }}>In {days}d</span>
  )
}

function AddModal({ onAdd, onClose, categories }) {
  const [form, setForm] = useState({
    name: '', type: 'expense', amount: '',
    category_id: '', frequency: 'monthly',
    next_date: new Date().toISOString().slice(0, 10),
    notes: '', active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.amount) {
      setError('Name and amount are required.')
      return
    }
    setSaving(true)
    const { error } = await onAdd({
      ...form,
      amount: parseFloat(form.amount),
      category_id: form.category_id || null,
    })
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
        boxShadow: '0 -24px 64px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.25s cubic-bezier(0.32,0,0.15,1) both',
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border-mid)', margin: '0 auto 18px',
        }} />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20,
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Add recurring
          </p>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 18,
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type toggle */}
          <div style={{
            display: 'flex', borderRadius: 9, overflow: 'hidden',
            border: '1px solid var(--border)', marginBottom: 14,
            padding: 3, background: 'var(--bg)', gap: 3,
          }}>
            {['expense', 'income'].map(t => (
              <button type="button" key={t}
                onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
                style={{
                  flex: 1, padding: '7px', fontSize: 12, borderRadius: 7,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 600,
                  transition: 'all 0.15s',
                  background: form.type === t
                    ? t === 'expense' ? '#ef444420' : '#22c55e20'
                    : 'transparent',
                  color: form.type === t
                    ? t === 'expense' ? 'var(--red)' : 'var(--accent)'
                    : 'var(--text-secondary)',
                }}>
                {t === 'expense' ? '↓ Expense' : '↑ Income'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" placeholder="e.g. Salary, Netflix"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Amount (RM)</label>
              <input type="number" step="0.01" placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Frequency</label>
              <select value={form.frequency}
                onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                style={inputStyle}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                style={inputStyle}>
                <option value="">No category</option>
                {categories.filter(c => c.type === form.type).map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Next due date</label>
            <DatePicker
              value={form.next_date}
              onChange={v => setForm(f => ({ ...f, next_date: v }))}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>
              Notes <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input type="text" placeholder="Any extra details..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={inputStyle} />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>
          )}

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
              background: 'var(--accent)', color: '#000',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 0 16px #22c55e25',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving...' : 'Add recurring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Recurring() {
  const {
    recurring, loading, overdue, dueSoon,
    addRecurring, markPaid, toggleRecurring, deleteRecurring
  } = useRecurring()
  const { categories } = useCategories()
  const [showAdd, setShowAdd] = useState(false)

  const activeRecurring = recurring.filter(r => r.active)
  const totalExpense = activeRecurring
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount), 0)
  const totalIncome = activeRecurring
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  return (
    <div>
      {/* Alert */}
      {(overdue.length > 0 || dueSoon.length > 0) && (
        <div className="fade-up" style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 16,
          background: overdue.length > 0 ? '#ef444412' : '#f59e0b12',
          border: `1px solid ${overdue.length > 0 ? '#ef444430' : '#f59e0b30'}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Bell size={14} style={{
            color: overdue.length > 0 ? 'var(--red)' : 'var(--amber)',
            flexShrink: 0,
          }} />
          <p style={{
            fontSize: 13,
            color: overdue.length > 0 ? 'var(--red)' : 'var(--amber)',
          }}>
            {overdue.length > 0
              ? `${overdue.length} recurring item${overdue.length > 1 ? 's' : ''} overdue — tap ✓ to log`
              : `${dueSoon.length} item${dueSoon.length > 1 ? 's' : ''} due within 7 days`}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="fade-up" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {activeRecurring.length} active recurring
        </p>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--accent)', color: '#000',
          border: 'none', borderRadius: 9, padding: '7px 14px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 0 16px #22c55e25',
        }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Summary cards */}
      <div className="fade-up-1" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14,
      }}>
        {[
          { label: 'Monthly expenses', value: `RM ${totalExpense.toFixed(2)}`, color: 'var(--red)' },
          { label: 'Monthly income', value: `RM ${totalIncome.toFixed(2)}`, color: 'var(--accent)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <p style={{
              fontSize: 10, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              marginBottom: 6, fontWeight: 500,
            }}>{label}</p>
            <p className="mono" style={{
              fontSize: 18, fontWeight: 600, color,
              letterSpacing: '-0.02em',
            }}>{value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="fade-up-2" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px 10px',
          borderBottom: '1px solid var(--border)',
        }}>
          <p style={{
            fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>All Recurrings</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Tap ✓ to log transaction and advance to next date
          </p>
        </div>

        {loading && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Loading...
          </p>
        )}
        {!loading && recurring.length === 0 && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            No recurring items yet. Add your salary, rent, subscriptions!
          </p>
        )}

        {recurring.map((r, i) => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: i < recurring.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background 0.1s',
            opacity: r.active ? 1 : 0.45,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: r.type === 'income' ? '#22c55e12' : '#ef444412',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {r.categories?.icon || (r.type === 'income' ? '💰' : '📄')}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {r.name}
                  </p>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: 'var(--border)', color: 'var(--text-secondary)',
                    textTransform: 'capitalize',
                  }}>{r.frequency}</span>
                  <DaysChip nextDate={r.next_date} active={r.active} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Next: {r.next_date}
                </p>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p className="mono" style={{
                fontSize: 13, fontWeight: 600,
                color: r.type === 'income' ? 'var(--accent)' : 'var(--red)',
              }}>
                {r.type === 'income' ? '+' : '−'}RM {Number(r.amount).toFixed(2)}
              </p>

              {/* Mark paid / log */}
              <button
                onClick={() => markPaid(r.id)}
                title="Log transaction & advance date"
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  border: '1px solid var(--accent-border)',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent-dim)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--accent)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--accent-dim)'
                  e.currentTarget.style.borderColor = 'var(--accent-border)'
                }}>
                <Check size={12} style={{ color: 'var(--accent)' }} />
              </button>

              {/* Active toggle */}
              <button
                onClick={() => toggleRecurring(r.id, !r.active)}
                style={{
                  width: 34, height: 19, borderRadius: 10, border: 'none',
                  cursor: 'pointer', transition: 'background 0.2s',
                  background: r.active ? 'var(--accent)' : 'var(--border-mid)',
                  position: 'relative', flexShrink: 0,
                }}>
                <div style={{
                  width: 13, height: 13, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: r.active ? 17 : 3,
                  transition: 'left 0.2s',
                }} />
              </button>

              {/* Delete */}
              <button onClick={() => deleteRecurring(r.id)} style={{
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

      {showAdd && (
        <AddModal
          onAdd={addRecurring}
          onClose={() => setShowAdd(false)}
          categories={categories}
        />
      )}
    </div>
  )
}