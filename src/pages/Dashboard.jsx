import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { useSeedCategories } from '../hooks/useCategories'
import TransactionForm from '../components/TransactionForm'
import MonthPicker from '../components/MonthPicker'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

export default function Dashboard() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm] = useState(false)
  const { transactions, categories, loading, totalIncome, totalExpense, balance, addTransaction, deleteTransaction } = useTransactions(month)

  useSeedCategories()

  const chartData = Object.values(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const cat = t.categories?.name || 'Others'
        const color = t.categories?.color || '#444444'
        acc[cat] = acc[cat] || { name: cat, value: 0, color }
        acc[cat].value += Number(t.amount)
        return acc
      }, {})
  ).sort((a, b) => b.value - a.value)

  const spendPct = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0
  const spendColor = totalExpense > totalIncome ? 'var(--red)' : spendPct > 80 ? 'var(--amber)' : 'var(--accent)'

  function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const pct = totalExpense > 0 ? ((payload[0].value / totalExpense) * 100).toFixed(0) : 0
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
        borderRadius: 8, padding: '8px 12px', fontSize: 12,
      }}>
        <p style={{ color: 'var(--text-primary)', marginBottom: 2, fontWeight: 500 }}>{payload[0].name}</p>
        <p className="mono" style={{ color: 'var(--red)', fontSize: 13 }}>
          RM {Number(payload[0].value).toFixed(2)}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 2 }}>{pct}% of spending</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="fade-up" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <MonthPicker value={month} onChange={setMonth} />
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--accent)', color: '#000',
          border: 'none', borderRadius: 9, padding: '8px 16px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 0 20px #22c55e30',
          flexShrink: 0,
        }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Income + Expense */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {[
          { label: 'Income', value: totalIncome, color: 'var(--accent)', icon: <TrendingUp size={13} color="#22c55e" /> },
          { label: 'Expenses', value: totalExpense, color: 'var(--red)', icon: <TrendingDown size={13} color="#ef4444" /> },
        ].map(({ label, value, color, icon }, i) => (
          <div key={label} className={`fade-up-${i + 1}`} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{
                fontSize: 10, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500,
              }}>{label}</p>
              {icon}
            </div>
            <p className="mono" style={{
              fontSize: 17, fontWeight: 600, color,
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              RM {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Balance */}
      <div className="fade-up-3" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{
            fontSize: 10, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500,
          }}>Balance</p>
          {totalIncome > 0 && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 5, fontWeight: 500,
              background: spendPct > 100 ? '#ef444420' : spendPct > 80 ? '#f59e0b20' : '#22c55e20',
              color: spendColor,
            }}>
              {spendPct.toFixed(0)}% spent
            </span>
          )}
        </div>
        <p className="mono" style={{
          fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em',
          color: balance >= 0 ? 'var(--text-primary)' : 'var(--red)',
          marginBottom: 10,
        }}>
          {balance < 0 ? '−' : ''}RM {Math.abs(balance).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </p>
        {totalIncome > 0 && (
          <>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--border-mid)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${spendPct}%`,
                background: spendColor,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                Spent RM {totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                Income RM {totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Spending breakdown */}
      {chartData.length > 0 && (
        <div className="fade-up-3" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 10,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
          }}>Spending breakdown</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Donut chart */}
            <div style={{ flexShrink: 0, width: 110, height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={50} innerRadius={24} paddingAngle={2}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category list */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {chartData.slice(0, 4).map((d, i) => {
                const pct = totalExpense > 0 ? ((d.value / totalExpense) * 100).toFixed(0) : 0
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{
                          fontSize: 11, color: 'var(--text-primary)', fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: '60%',
                        }}>{d.name}</span>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ height: 2, borderRadius: 1, background: 'var(--border-mid)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 1, width: `${pct}%`, background: d.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="fade-up-4" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 16px 10px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{
            fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>Recent transactions</p>
          {transactions.length > 6 && (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              +{transactions.length - 6} more
            </span>
          )}
        </div>

        {loading && (
          <p style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>Loading...</p>
        )}
        {!loading && transactions.length === 0 && (
          <div style={{ padding: '28px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>💸</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No transactions this month</p>
          </div>
        )}

        {transactions.slice(0, 6).map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: i < Math.min(transactions.length, 6) - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: t.type === 'income' ? '#22c55e12' : '#ef444412',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
              }}>
                {t.categories?.icon || '📦'}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.description}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {t.categories?.name || 'No category'} · {formatDate(t.date)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
              <p className="mono" style={{
                fontSize: 12, fontWeight: 600,
                color: t.type === 'income' ? 'var(--accent)' : 'var(--red)',
              }}>
                {t.type === 'income' ? '+' : '−'}RM {Number(t.amount).toFixed(2)}
              </p>
              <button onClick={() => deleteTransaction(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', padding: 2,
                transition: 'color 0.15s', flexShrink: 0,
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Trash2 size={12} />
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