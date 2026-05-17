import { useState } from 'react'

const MODULES = [
  {
    id: 'money',
    icon: '💰',
    title: 'Money Tracker',
    desc: 'Track income, expenses and budgets',
    color: '#22c55e'
  },
  {
    id: 'trading',
    icon: '📈',
    title: 'Trading Journal',
    desc: 'Log trades and track performance',
    color: '#6366f1'
  },
  {
    id: 'tax',
    icon: '📄',
    title: 'Tax Helper',
    desc: 'Prepare your LHDN filing',
    color: '#f59e0b'
  }
]

export default function ModuleSelect({ onNext }) {
  const [selected, setSelected] = useState([])

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  function handleContinue() {
    if (selected.length === 0) return
    onNext([...selected])
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f0f' }}>
      <div className="w-full max-w-lg px-6">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f5f5f5' }}>
          Welcome to SwingDesk
        </h1>
        <p className="text-sm mb-8" style={{ color: '#666666' }}>
          What do you want to use SwingDesk for? Pick one or more.
        </p>

        <div className="space-y-3 mb-8">
          {MODULES.map(m => (
            <div key={m.id} onClick={() => toggle(m.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                background: selected.includes(m.id) ? '#1a1a1a' : '#141414',
                border: selected.includes(m.id)
                  ? `1px solid ${m.color}60`
                  : '1px solid #2a2a2a'
              }}>
              <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: `${m.color}15` }}>
                {m.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#f5f5f5' }}>{m.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{m.desc}</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: selected.includes(m.id) ? m.color : '#444444',
                  background: selected.includes(m.id) ? m.color : 'transparent'
                }}>
                {selected.includes(m.id) && (
                  <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl text-sm font-medium transition-opacity"
          style={{
            background: '#6366f1',
            color: '#ffffff',
            opacity: selected.length === 0 ? 0.4 : 1,
            cursor: selected.length === 0 ? 'not-allowed' : 'pointer'
          }}>
          Continue
        </button>
      </div>
    </div>
  )
}