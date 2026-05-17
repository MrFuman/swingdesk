import { useState } from 'react'
import { useTax, RELIEF_CATEGORIES, TAX_BRACKETS } from '../hooks/useTax'
import { useProfile } from '../hooks/useProfile'
import { Plus, ChevronDown, ChevronUp, Info, CheckCircle, FileText } from 'lucide-react'

const YEARS = [2025, 2024, 2023, 2022]

function ReliefRow({ relief, category, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(relief?.amount?.toString() || '')

  function handleSave() {
    const amount = parseFloat(val) || 0
    const capped = category.max ? Math.min(amount, category.max) : amount
    onSave(category.id, category.label, capped)
    setEditing(false)
  }

  const amount = relief ? Number(relief.amount) : 0
  const pct = category.max ? Math.round((amount / category.max) * 100) : null

  return (
    <div className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid #1f1f1f' }}>
      <div className="flex items-center gap-3 flex-1">
        <span className="text-base w-7">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: '#f5f5f5' }}>{category.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {category.max && (
              <p className="text-xs" style={{ color: '#444444' }}>
                Max: RM {category.max.toLocaleString()}
              </p>
            )}
            {amount > 0 && category.max && (
              <>
                <span style={{ color: '#333' }}>·</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#22c55e' : '#6366f1' }} />
                  </div>
                  <span className="text-xs" style={{ color: pct >= 100 ? '#22c55e' : '#6366f1' }}>{pct}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg overflow-hidden"
              style={{ border: '1px solid #2a2a2a', background: '#0f0f0f' }}>
              <span className="px-2 text-xs" style={{ color: '#666' }}>RM</span>
              <input type="number" step="any"
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
                className="w-24 py-1.5 pr-2 text-sm outline-none"
                style={{ background: 'transparent', color: '#f5f5f5' }} />
            </div>
            <button onClick={handleSave}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#6366f120', color: '#6366f1' }}>
              Save
            </button>
            <button onClick={() => setEditing(false)}
              className="text-xs" style={{ color: '#444' }}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setVal(amount.toString()); setEditing(true) }}
              className="text-right"
              style={{ minWidth: 80 }}>
              <p className="text-sm font-medium"
                style={{ color: amount > 0 ? '#f5f5f5' : '#444444' }}>
                {amount > 0 ? `RM ${amount.toLocaleString()}` : '+ Add'}
              </p>
            </button>
            {amount > 0 && (
              <button onClick={() => onDelete(relief.id)}
                className="text-xs" style={{ color: '#333' }}>✕</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TaxBracketTable({ chargeableIncome }) {
  return (
    <div className="space-y-1">
      {TAX_BRACKETS.filter(b => b.max !== Infinity ? chargeableIncome > b.min : chargeableIncome > b.min).map((b, i) => {
        const taxable = Math.min(chargeableIncome, b.max === Infinity ? chargeableIncome : b.max) - b.min
        const tax = taxable * b.rate
        const isActive = chargeableIncome > b.min && chargeableIncome <= (b.max === Infinity ? Infinity : b.max)
        return (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
            style={{
              background: isActive ? '#6366f115' : '#0f0f0f',
              border: `1px solid ${isActive ? '#6366f140' : '#1f1f1f'}`
            }}>
            <span style={{ color: '#666' }}>
              RM {b.min.toLocaleString()} – {b.max === Infinity ? '∞' : `RM ${b.max.toLocaleString()}`}
            </span>
            <span style={{ color: '#888' }}>{(b.rate * 100).toFixed(1)}%</span>
            <span style={{ color: isActive ? '#6366f1' : '#f5f5f5' }}>
              RM {tax.toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function TaxHelper() {
  const { profile } = useProfile()
  const [year, setYear] = useState(2024)
  const [showBrackets, setShowBrackets] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const {
    reliefs, submission, annualIncome, loading,
    totalReliefs, chargeableIncome, estimatedTax,
    bracket, effectiveRate,
    saveRelief, deleteRelief, saveSubmission
  } = useTax(year)

  const card = { background: '#1a1a1a', border: '1px solid #2a2a2a' }

  async function handleSaveSubmission() {
    setSaving(true)
    await saveSubmission({
      gross_income: annualIncome,
      total_reliefs: totalReliefs,
      chargeable_income: chargeableIncome,
      estimated_tax: estimatedTax,
      status: 'saved',
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#f5f5f5' }}>Tax Helper</h1>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>LHDN BE form estimator for Malaysian residents</p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="rounded-lg px-3 py-1.5 text-sm outline-none"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#f5f5f5' }}>
          {YEARS.map(y => (
            <option key={y} value={y}>YA {y}</option>
          ))}
        </select>
      </div>

      {/* Trading income note */}
      {showInfo && (
        <div className="p-3 rounded-xl mb-4 flex gap-3"
          style={{ background: '#f59e0b10', border: '1px solid #f59e0b30' }}>
          <Info size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: '#f59e0b' }}>About trading income & tax</p>
            <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
              In Malaysia, capital gains from stocks (Bursa & foreign), forex, and crypto are generally
              <strong style={{ color: '#aaa' }}> not subject to income tax</strong> for individual retail traders.
              Trading P&L is excluded from this estimator. Consult a tax professional if trading is your primary income source.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 rounded-xl" style={card}>
          <p className="text-xs mb-1" style={{ color: '#666' }}>Gross income ({year})</p>
          <p className="text-xl font-semibold" style={{ color: '#f5f5f5' }}>
            RM {annualIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs mt-1" style={{ color: '#444' }}>From Money Tracker</p>
        </div>
        <div className="p-4 rounded-xl" style={card}>
          <p className="text-xs mb-1" style={{ color: '#666' }}>Total reliefs</p>
          <p className="text-xl font-semibold" style={{ color: '#6366f1' }}>
            RM {totalReliefs.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs mt-1" style={{ color: '#444' }}>{reliefs.length} relief{reliefs.length !== 1 ? 's' : ''} entered</p>
        </div>
        <div className="p-4 rounded-xl" style={card}>
          <p className="text-xs mb-1" style={{ color: '#666' }}>Chargeable income</p>
          <p className="text-xl font-semibold" style={{ color: '#f5f5f5' }}>
            RM {chargeableIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs mt-1" style={{ color: '#444' }}>After deductions</p>
        </div>
        <div className="p-4 rounded-xl" style={card}>
          <p className="text-xs mb-1" style={{ color: '#666' }}>Estimated tax</p>
          <p className="text-xl font-semibold" style={{ color: estimatedTax > 0 ? '#ef4444' : '#22c55e' }}>
            RM {estimatedTax.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs mt-1" style={{ color: '#444' }}>
            Effective rate: {effectiveRate.toFixed(1)}% · Bracket: {(bracket.rate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Reliefs */}
      <div className="rounded-xl mb-4 overflow-hidden" style={card}>
        <div className="px-4 py-3 border-b" style={{ borderColor: '#2a2a2a' }}>
          <p className="text-sm font-medium" style={{ color: '#f5f5f5' }}>Tax reliefs & deductions</p>
          <p className="text-xs mt-0.5" style={{ color: '#444' }}>Click any row to enter your amount</p>
        </div>
        <div className="px-4">
          {loading
            ? <p className="py-4 text-sm" style={{ color: '#666' }}>Loading...</p>
            : RELIEF_CATEGORIES.map(cat => (
              <ReliefRow
                key={cat.id}
                category={cat}
                relief={reliefs.find(r => r.category === cat.id)}
                onSave={saveRelief}
                onDelete={deleteRelief}
              />
            ))
          }
        </div>
      </div>

      {/* Tax breakdown */}
      <div className="rounded-xl mb-4 overflow-hidden" style={card}>
        <button
          className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => setShowBrackets(v => !v)}>
          <p className="text-sm font-medium" style={{ color: '#f5f5f5' }}>Tax bracket breakdown</p>
          {showBrackets
            ? <ChevronUp size={14} style={{ color: '#666' }} />
            : <ChevronDown size={14} style={{ color: '#666' }} />}
        </button>
        {showBrackets && (
          <div className="px-4 pb-4">
            <TaxBracketTable chargeableIncome={chargeableIncome} />
            <div className="flex items-center justify-between mt-3 pt-3"
              style={{ borderTop: '1px solid #2a2a2a' }}>
              <p className="text-sm font-medium" style={{ color: '#f5f5f5' }}>Total estimated tax</p>
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                RM {estimatedTax.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submission record */}
      <div className="rounded-xl mb-4 p-4" style={card}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium" style={{ color: '#f5f5f5' }}>YA {year} record</p>
            <p className="text-xs mt-0.5" style={{ color: '#444' }}>
              {submission ? `Last saved · Status: ${submission.status}` : 'Not saved yet'}
            </p>
          </div>
          {submission?.status === 'submitted' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: '#22c55e20', border: '1px solid #22c55e40' }}>
              <CheckCircle size={12} style={{ color: '#22c55e' }} />
              <span className="text-xs" style={{ color: '#22c55e' }}>Submitted</span>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4 p-3 rounded-lg text-xs"
          style={{ background: '#0f0f0f', border: '1px solid #1f1f1f' }}>
          {[
            { label: 'Gross income', value: `RM ${annualIncome.toFixed(2)}` },
            { label: 'Total reliefs', value: `− RM ${totalReliefs.toFixed(2)}` },
            { label: 'Chargeable income', value: `RM ${chargeableIncome.toFixed(2)}` },
            { label: 'Tax rate (bracket)', value: `${(bracket.rate * 100).toFixed(1)}%` },
            { label: 'Estimated tax payable', value: `RM ${estimatedTax.toFixed(2)}`, bold: true },
            { label: 'Effective rate', value: `${effectiveRate.toFixed(2)}%` },
          ].map(({ label, value, bold }) => (
            <div key={label} className="flex justify-between">
              <span style={{ color: '#666' }}>{label}</span>
              <span style={{ color: bold ? '#f5f5f5' : '#888', fontWeight: bold ? 600 : 400 }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveSubmission}
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: saved ? '#22c55e20' : '#6366f120',
              color: saved ? '#22c55e' : '#6366f1',
              border: `1px solid ${saved ? '#22c55e40' : '#6366f140'}`
            }}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save record'}
          </button>
          {submission && submission.status !== 'submitted' && (
            <button
              onClick={async () => {
                await saveSubmission({
                  gross_income: annualIncome,
                  total_reliefs: totalReliefs,
                  chargeable_income: chargeableIncome,
                  estimated_tax: estimatedTax,
                  status: 'submitted',
                  submitted_at: new Date().toISOString(),
                })
              }}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}>
              Mark as submitted
            </button>
          )}
        </div>
      </div>

      {/* Trading income disclaimer */}
      <button
        onClick={() => setShowInfo(v => !v)}
        className="flex items-center gap-2 text-xs mb-4"
        style={{ color: '#444' }}>
        <Info size={12} />
        {showInfo ? 'Hide' : 'Why is trading income excluded?'}
      </button>
    </div>
  )
}