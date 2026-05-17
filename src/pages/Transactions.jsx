import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionForm from '../components/TransactionForm'
import MonthPicker from '../components/MonthPicker'
import { Plus, Trash2, Search, Calendar } from 'lucide-react'

export default function Transactions() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('month')
  const [specificDate, setSpecificDate] = useState(() => new Date().toISOString().slice(0, 10))
  const { transactions, categories, loading, addTransaction, deleteTransaction } = useTransactions(month)

  const filtered = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => t.description.toLowerCase().includes(search.toLowerCase()))
    .filter(t => viewMode === 'month' ? true : t.date === specificDate)

  const totalFiltered = filtered.reduce((sum, t) =>
    t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0)

  return (
    <div>
      {/* Top row */}
      <div className="fade-up" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        {/* View mode toggle */}
        <div style={{
          display: 'flex', borderRadius: 9, overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <button onClick={() => setViewMode('month')} style={{
            padding: '7px 14px', fontSize: 12, border: 'none', cursor: 'pointer',
            background: viewMode === 'month' ? 'var(--bg-elevated)' : 'transparent',
            color: viewMode === 'month' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
          }}>Month</button>
          <button onClick={() => setViewMode('day')} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', fontSize: 12, border: 'none', cursor: 'pointer',
            background: viewMode === 'day' ? 'var(--bg-elevated)' : 'transparent',
            color: viewMode === 'day' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
          }}>
            <Calendar size={12} /> Day
          </button>
        </div>

        <button onClick={() => setShowForm(true)} style={{
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

      {/* Date picker row */}
      <div className="fade-up-1" style={{ marginBottom: 12 }}>
        {viewMode === 'month' ? (
          <MonthPicker value={month} onChange={setMonth} />
        ) : (
          <input type="date" value={specificDate}
            onChange={e => {
              setSpecificDate(e.target.value)
              setMonth(e.target.value.slice(0, 7))
            }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', borderRadius: 9,
              padding: '6px 10px', fontSize: 12, outline: 'none',
              colorScheme: 'dark', fontFamily: 'var(--font-sans)',
            }} />
        )}
      </div>

      {/* Search + filter */}
      <div className="fade-up-2" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flex: 1,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 9, padding: '7px 12px',
        }}>
          <Search size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input type="text" placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }} />
        </div>
        <div style={{
          display: 'flex', borderRadius: 9, overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          {['all', 'income', 'expense'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 12px', fontSize: 12, border: 'none', cursor: 'pointer',
              background: filter === f ? 'var(--bg-elevated)' : 'transparent',
              color: filter === f
                ? f === 'income' ? 'var(--accent)'
                : f === 'expense' ? 'var(--red)'
                : 'var(--text-primary)'
                : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      {filtered.length > 0 && (
        <div className="fade-up-2" style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 10, marginBottom: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="mono" style={{
            fontSize: 12, fontWeight: 500,
            color: totalFiltered >= 0 ? 'var(--accent)' : 'var(--red)',
          }}>
            {totalFiltered >= 0 ? '+' : '−'}RM {Math.abs(totalFiltered).toFixed(2)}
          </span>
        </div>
      )}

      {/* Transaction list */}
      <div className="fade-up-3" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {loading && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>Loading...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            No transactions found.
          </p>
        )}
        {filtered.map((t, i) => (
          <div key={t.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 18px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: t.type === 'income' ? '#22c55e12' : '#ef444412',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {t.categories?.icon || '📦'}
              </div>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 400 }}>
                  {t.description}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {t.categories?.name || 'No category'} · {t.date}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p className="mono" style={{
                fontSize: 13, fontWeight: 500,
                color: t.type === 'income' ? 'var(--accent)' : 'var(--red)',
              }}>
                {t.type === 'income' ? '+' : '−'}RM {Number(t.amount).toFixed(2)}
              </p>
              <button onClick={() => deleteTransaction(t.id)} style={{
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
        <TransactionForm
          categories={categories}
          onAdd={addTransaction}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}