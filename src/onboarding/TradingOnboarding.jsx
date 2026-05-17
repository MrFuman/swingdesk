import { useState } from 'react'

const MARKETS = [
  { id: 'stocks', label: 'Stocks', icon: '📊' },
  { id: 'forex', label: 'Forex', icon: '💱' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'futures', label: 'Futures', icon: '📉' },
]

const STYLES = [
  { id: 'day', label: 'Day trading', desc: 'Open and close same day' },
  { id: 'swing', label: 'Swing trading', desc: 'Hold days to weeks' },
  { id: 'position', label: 'Position trading', desc: 'Hold weeks to months' },
]

const REGIONS = [
  { id: 'MY', label: 'Malaysian Market', desc: 'Bursa Malaysia — currency in MYR', currency: 'MYR', flag: '🇲🇾' },
  { id: 'US', label: 'US Market', desc: 'NYSE / NASDAQ — currency in USD', currency: 'USD', flag: '🇺🇸' },
]

export default function TradingOnboarding({ onNext }) {
  const [form, setForm] = useState({
    trading_capital: '',
    risk_per_trade: '1',
    preferred_market: 'stocks',
    trading_region: 'MY',
    trading_currency: 'MYR',
    trading_style: 'swing'
  })

  function setRegion(regionId) {
    const region = REGIONS.find(r => r.id === regionId)
    setForm(f => ({
      ...f,
      trading_region: regionId,
      trading_currency: region.currency
    }))
  }

  const input = {
    background: '#0f0f0f',
    border: '1px solid #2a2a2a',
    color: '#f5f5f5'
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f0f' }}>
      <div className="w-full max-w-lg px-6 py-8">
        <div className="text-2xl mb-2">📈</div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f5f5f5' }}>
          Set up Trading Journal
        </h1>
        <p className="text-sm mb-8" style={{ color: '#666666' }}>
          Tell us about your trading setup.
        </p>

        <div className="space-y-5 mb-8">

          {/* Market Region */}
          <div>
            <label className="text-xs mb-3 block" style={{ color: '#666666' }}>
              Which market do you trade in?
            </label>
            <div className="space-y-2">
              {REGIONS.map(r => (
                <button key={r.id}
                  onClick={() => setRegion(r.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: form.trading_region === r.id ? '#1a1a1a' : '#141414',
                    border: form.trading_region === r.id ? '1px solid #6366f1' : '1px solid #2a2a2a',
                  }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.flag}</span>
                    <div>
                      <p className="text-sm" style={{ color: '#f5f5f5' }}>{r.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{r.desc}</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                    style={{
                      borderColor: form.trading_region === r.id ? '#6366f1' : '#444444',
                      background: form.trading_region === r.id ? '#6366f1' : 'transparent'
                    }} />
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Instrument */}
          <div>
            <label className="text-xs mb-3 block" style={{ color: '#666666' }}>
              Preferred market
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MARKETS.map(m => (
                <button key={m.id}
                  onClick={() => setForm(f => ({ ...f, preferred_market: m.id }))}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs transition-all"
                  style={{
                    background: form.preferred_market === m.id ? '#1a1a1a' : '#141414',
                    border: form.preferred_market === m.id ? '1px solid #6366f1' : '1px solid #2a2a2a',
                    color: form.preferred_market === m.id ? '#f5f5f5' : '#666666'
                  }}>
                  <span className="text-lg">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trading Capital */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: '#666666' }}>
              Trading capital ({form.trading_currency})
            </label>
            <input type="number" placeholder="e.g. 10000"
              value={form.trading_capital}
              onChange={e => setForm(f => ({ ...f, trading_capital: e.target.value }))}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={input} />
          </div>

          {/* Risk Per Trade */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: '#666666' }}>
              Risk per trade (%)
              <span className="ml-1" style={{ color: '#444444' }}>— recommended: 1–2%</span>
            </label>
            <input type="number" step="0.1" placeholder="e.g. 1"
              value={form.risk_per_trade}
              onChange={e => setForm(f => ({ ...f, risk_per_trade: e.target.value }))}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={input} />
            {form.trading_capital && form.risk_per_trade && (
              <p className="text-xs mt-1.5" style={{ color: '#6366f1' }}>
                Max risk per trade: {form.trading_currency} {(parseFloat(form.trading_capital) * parseFloat(form.risk_per_trade) / 100).toFixed(2)}
              </p>
            )}
          </div>

          {/* Trading Style */}
          <div>
            <label className="text-xs mb-3 block" style={{ color: '#666666' }}>
              Trading style
            </label>
            <div className="space-y-2">
              {STYLES.map(s => (
                <button key={s.id}
                  onClick={() => setForm(f => ({ ...f, trading_style: s.id }))}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: form.trading_style === s.id ? '#1a1a1a' : '#141414',
                    border: form.trading_style === s.id ? '1px solid #6366f140' : '1px solid #2a2a2a'
                  }}>
                  <div>
                    <p className="text-sm" style={{ color: '#f5f5f5' }}>{s.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{s.desc}</p>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                    style={{
                      borderColor: form.trading_style === s.id ? '#6366f1' : '#444444',
                      background: form.trading_style === s.id ? '#6366f1' : 'transparent'
                    }} />
                </button>
              ))}
            </div>
          </div>

        </div>

        <button
          onClick={() => onNext(form)}
          disabled={!form.trading_capital}
          className="w-full py-3 rounded-xl text-sm font-medium"
          style={{
            background: '#6366f1',
            color: '#ffffff',
            opacity: !form.trading_capital ? 0.4 : 1
          }}>
          Continue
        </button>
      </div>
    </div>
  )
}