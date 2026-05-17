import { useState } from 'react'

export default function MoneyOnboarding({ onNext }) {
  const [form, setForm] = useState({
    full_name: '',
    account_balance: '',
    monthly_income: '',
    monthly_budget: ''
  })

  const input = {
    background: '#0f0f0f',
    border: '1px solid #2a2a2a',
    color: '#f5f5f5'
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f0f' }}>
      <div className="w-full max-w-lg px-6">
        <div className="text-2xl mb-2">💰</div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f5f5f5' }}>
          Set up Money Tracker
        </h1>
        <p className="text-sm mb-8" style={{ color: '#666666' }}>
          Just a few details to personalise your experience.
        </p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#666666' }}>Your name</label>
            <input type="text" placeholder="e.g. Chun Khay"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={input} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#666666' }}>
              Current account balance (RM)
            </label>
            <input type="number" placeholder="e.g. 5000"
              value={form.account_balance}
              onChange={e => setForm(f => ({ ...f, account_balance: e.target.value }))}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={input} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#666666' }}>
              Monthly income (RM)
            </label>
            <input type="number" placeholder="e.g. 3000"
              value={form.monthly_income}
              onChange={e => setForm(f => ({ ...f, monthly_income: e.target.value }))}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={input} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#666666' }}>
              Monthly spending budget (RM)
            </label>
            <input type="number" placeholder="e.g. 2000"
              value={form.monthly_budget}
              onChange={e => setForm(f => ({ ...f, monthly_budget: e.target.value }))}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={input} />
          </div>
        </div>

        <button
          onClick={() => onNext(form)}
          disabled={!form.full_name}
          className="w-full py-3 rounded-xl text-sm font-medium"
          style={{
            background: '#22c55e',
            color: '#ffffff',
            opacity: !form.full_name ? 0.4 : 1
          }}>
          Continue
        </button>
      </div>
    </div>
  )
}