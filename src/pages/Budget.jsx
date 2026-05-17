import { useState } from 'react'
import { useBudgets } from '../hooks/useBudgets'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import MonthPicker from '../components/MonthPicker'
import { X } from 'lucide-react'

function BudgetRow({ category, budget, spent, setBudget, deleteBudget }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(budget?.amount?.toString() || '')

  const amount = budget ? Number(budget.amount) : 0
  const pct = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0
  const over = spent > amount && amount > 0
  const barColor = over ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--accent)'
  const remaining = amount - spent

  async function handleSave() {
    const parsed = parseFloat(val)
    if (!isNaN(parsed) && parsed > 0) {
      await setBudget(category.id, parsed)
    }
    setEditing(false)
  }

  return (
    <div style={{
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      {/* Top row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: amount > 0 ? 10 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: `${category.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>
            {category.icon}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
            {category.name}
          </p>
        </div>

        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, overflow: 'hidden',
            }}>
              <span style={{ padding: '0 8px', fontSize: 11, color: 'var(--text-secondary)' }}>RM</span>
              <input
                type="number" step="any" autoFocus
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                style={{
                  width: 80, padding: '6px 8px 6px 0',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 13, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                }} />
            </div>
            <button onClick={handleSave} style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 11,
              fontWeight: 600, cursor: 'pointer', border: 'none',
              background: 'var(--accent-dim)', color: 'var(--accent)',
              fontFamily: 'var(--font-sans)',
            }}>Save</button>
            <button onClick={() => setEditing(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: 2, display: 'flex',
            }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {amount > 0 && (
              <span className="mono" style={{
                fontSize: 11,
                color: over ? 'var(--red)' : 'var(--text-secondary)',
              }}>
                RM {spent.toFixed(2)} / RM {amount.toFixed(2)}
              </span>
            )}
            <button
              onClick={() => { setVal(amount > 0 ? amount.toString() : ''); setEditing(true) }}
              style={{
                padding: '4px 10px', borderRadius: 7, fontSize: 11,
                fontWeight: 500, cursor: 'pointer',
                background: amount > 0 ? 'var(--bg)' : 'var(--accent-dim)',
                color: amount > 0 ? 'var(--text-secondary)' : 'var(--accent)',
                fontFamily: 'var(--font-sans)',
                border: `1px solid ${amount > 0 ? 'var(--border)' : 'var(--accent-border)'}`,
              }}>
              {amount > 0 ? 'Edit' : '+ Set'}
            </button>
            {amount > 0 && (
              <button onClick={() => deleteBudget(budget.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', padding: 2,
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {amount > 0 && (
        <>
          <div style={{
            height: 5, borderRadius: 3,
            background: 'var(--border-mid)', overflow: 'hidden',
            marginBottom: 5,
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${pct}%`,
              background: barColor,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: barColor, fontWeight: 500 }}>
              {pct.toFixed(0)}% used
            </span>
            <span style={{ fontSize: 10, color: over ? 'var(--red)' : 'var(--text-secondary)' }}>
              {over
                ? `RM ${Math.abs(remaining).toFixed(2)} over`
                : `RM ${remaining.toFixed(2)} left`}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default function Budget() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const { budgets, loading: budgetsLoading, setBudget, deleteBudget } = useBudgets(month)
  const { transactions, loading: txLoading, totalExpense } = useTransactions(month)
  const { categories, loading: catLoading } = useCategories()

  const expenseCategories = categories.filter(c => c.type === 'expense')

  const spentByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (t.category_id) {
        acc[t.category_id] = (acc[t.category_id] || 0) + Number(t.amount)
      }
      return acc
    }, {})

  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  const overBudgetCount = budgets.filter(b => {
    const spent = spentByCategory[b.category_id] || 0
    return spent > Number(b.amount)
  }).length

  return (
    <div>
      {/* Header */}
      <div className="fade-up" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
      }}>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Summary cards */}
      <div className="fade-up-1" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 14,
      }}>
        {[
          {
            label: 'Budgeted',
            value: `RM ${totalBudgeted.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
            color: 'var(--text-primary)',
          },
          {
            label: 'Spent',
            value: `RM ${totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
            color: totalExpense > totalBudgeted && totalBudgeted > 0 ? 'var(--red)' : 'var(--accent)',
          },
          {
           label: 'Over budget',
  value: overBudgetCount === 0 ? 'None' : `${overBudgetCount} ${overBudgetCount === 1 ? 'category' : 'categories'}`,
  color: overBudgetCount > 0 ? 'var(--red)' : 'var(--accent)',
},
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
              fontSize: 14, fontWeight: 600, color,
              letterSpacing: '-0.02em',
            }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {totalBudgeted > 0 && (
        <div className="fade-up-2" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px 18px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
              Overall
            </p>
            <p className="mono" style={{
              fontSize: 12, fontWeight: 500,
              color: totalExpense > totalBudgeted ? 'var(--red)' : 'var(--accent)',
            }}>
              {Math.min((totalExpense / totalBudgeted) * 100, 100).toFixed(0)}%
            </p>
          </div>
          <div style={{
            height: 8, borderRadius: 4,
            background: 'var(--border-mid)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${Math.min((totalExpense / totalBudgeted) * 100, 100)}%`,
              background: totalExpense > totalBudgeted ? 'var(--red)'
                : totalExpense / totalBudgeted > 0.8 ? 'var(--amber)'
                : 'var(--accent)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              RM {totalExpense.toFixed(2)} spent
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              RM {totalBudgeted.toFixed(2)} budgeted
            </span>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="fade-up-3" style={{
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
          }}>Category Budgets</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Tap any row to set a budget
          </p>
        </div>

        {(budgetsLoading || txLoading || catLoading) && (
          <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Loading...
          </p>
        )}

        {!budgetsLoading && !txLoading && !catLoading && expenseCategories.map(cat => (
          <BudgetRow
            key={cat.id}
            category={cat}
            budget={budgets.find(b => b.category_id === cat.id)}
            spent={spentByCategory[cat.id] || 0}
            setBudget={setBudget}
            deleteBudget={deleteBudget}
          />
        ))}
      </div>
    </div>
  )
}