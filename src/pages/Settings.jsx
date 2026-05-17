import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import TradingOnboarding from '../onboarding/TradingOnboarding'
import { Plus, Trash2, TrendingUp, DollarSign, User, Settings2 } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function DatePicker({ value, onChange }) {
  const parts = (value || new Date().toISOString().slice(0,10)).split('-').map(Number)
  const [y, m, d] = parts
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

export default function Settings() {
  const { user } = useAuth()
  const { profile, refetch } = useProfile()
  const [showTradingOnboarding, setShowTradingOnboarding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [topups, setTopups] = useState([])
  const [topupAmount, setTopupAmount] = useState('')
  const [topupNotes, setTopupNotes] = useState('')
  const [topupDate, setTopupDate] = useState(new Date().toISOString().slice(0, 10))
  const [addingTopup, setAddingTopup] = useState(false)

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [accountBalance, setAccountBalance] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [tradingCapital, setTradingCapital] = useState('')
  const [riskPerTrade, setRiskPerTrade] = useState('')
  const [tradingStyle, setTradingStyle] = useState('')
  const [preferredMarket, setPreferredMarket] = useState('')
  const [tradingRegion, setTradingRegion] = useState('')

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name || '')
    setAccountBalance(profile.account_balance || '')
    setMonthlyIncome(profile.monthly_income || '')
    setMonthlyBudget(profile.monthly_budget || '')
    setTradingCapital(profile.trading_capital || '')
    setRiskPerTrade(profile.risk_per_trade || '')
    setTradingStyle(profile.trading_style || 'swing')
    setPreferredMarket(profile.preferred_market || 'stocks')
    setTradingRegion(profile.trading_region || 'MY')
  }, [profile])

  useEffect(() => {
    if (!user) return
    fetchTopups()
  }, [user])

  async function fetchTopups() {
    const { data } = await supabase
      .from('capital_topups')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setTopups(data || [])
  }

  const activeModules = profile?.modules || []

async function toggleModule(id) {
  const current = Array.isArray(profile?.modules) ? profile.modules : []
  
  if (current.includes(id)) {
    setSaving(true)
    const updated = current.filter(m => m !== id)
    await supabase.from('profiles')
      .update({ modules: updated.length > 0 ? updated : ['money'] })
      .eq('id', user.id)
    await refetch()
    setSaving(false)
  } else {
    if (id === 'trading' && !profile?.trading_capital) {
      setShowTradingOnboarding(true)
    } else {
      setSaving(true)
      const updated = [...current, id]
      await supabase.from('profiles').update({ modules: updated }).eq('id', user.id)
      await refetch()
      setSaving(false)
    }
  }
}

  async function handleTradingOnboardingDone(data) {
    setSaving(true)
    const current = Array.isArray(profile?.modules) ? profile.modules : ['money']
    const updated = current.includes('trading') ? current : [...current, 'trading']
    
    await supabase.from('profiles').update({
      modules: [...activeModules, 'trading'],
      trading_capital: parseFloat(data.trading_capital) || 0,
      risk_per_trade: parseFloat(data.risk_per_trade) || 1,
      preferred_market: data.preferred_market,
      trading_currency: data.trading_currency,
      trading_style: data.trading_style,
      trading_region: data.trading_region,
    }).eq('id', user.id)
    await refetch()
    setShowTradingOnboarding(false)
    setSaving(false)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: fullName,
    }).eq('id', user.id)
    await refetch()
    setSaving(false)
    setSaved('profile')
    setTimeout(() => setSaved(''), 2000)
  }

  async function saveMoney() {
    setSaving(true)
    await supabase.from('profiles').update({
      account_balance: parseFloat(accountBalance) || 0,
      monthly_income: parseFloat(monthlyIncome) || 0,
      monthly_budget: parseFloat(monthlyBudget) || 0,
    }).eq('id', user.id)
    await refetch()
    setSaving(false)
    setSaved('money')
    setTimeout(() => setSaved(''), 2000)
  }

  async function saveTrading() {
    setSaving(true)
    await supabase.from('profiles').update({
      trading_capital: parseFloat(tradingCapital) || 0,
      risk_per_trade: parseFloat(riskPerTrade) || 1,
      trading_style: tradingStyle,
      preferred_market: preferredMarket,
      trading_region: tradingRegion,
      trading_currency: tradingRegion === 'MY' ? 'MYR' : 'USD',
    }).eq('id', user.id)
    await refetch()
    setSaving(false)
    setSaved('trading')
    setTimeout(() => setSaved(''), 2000)
  }

  async function addTopup() {
    if (!topupAmount) return
    setAddingTopup(true)
    const amount = parseFloat(topupAmount)

    // Save topup record
    await supabase.from('capital_topups').insert({
      user_id: user.id,
      amount,
      notes: topupNotes || null,
      date: topupDate,
    })

    // Update trading capital
    const newCapital = (parseFloat(profile?.trading_capital) || 0) + amount
    await supabase.from('profiles').update({
      trading_capital: newCapital,
    }).eq('id', user.id)

    await refetch()
    await fetchTopups()
    setTradingCapital(newCapital.toString())
    setTopupAmount('')
    setTopupNotes('')
    setTopupDate(new Date().toISOString().slice(0, 10))
    setAddingTopup(false)
    setSaved('topup')
    setTimeout(() => setSaved(''), 2000)
  }

  async function deleteTopup(id, amount) {
    // Remove topup and subtract from capital
    await supabase.from('capital_topups').delete().eq('id', id)
    const newCapital = Math.max(0, (parseFloat(profile?.trading_capital) || 0) - amount)
    await supabase.from('profiles').update({ trading_capital: newCapital }).eq('id', user.id)
    await refetch()
    await fetchTopups()
    setTradingCapital(newCapital.toString())
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

  const card = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '16px 18px', marginBottom: 12,
  }

  const sectionTitle = (icon, label, color = 'var(--text-primary)') => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
    </div>
  )

  function SaveButton({ section, onClick }) {
    const isSaved = saved === section
    return (
      <button onClick={onClick} disabled={saving} style={{
        marginTop: 14, width: '100%', padding: '9px',
        borderRadius: 9, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', border: 'none',
        fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
        background: isSaved ? '#22c55e18' : 'var(--accent-dim)',
        color: isSaved ? 'var(--accent)' : 'var(--accent)',
        border: `1px solid ${isSaved ? 'var(--accent-border)' : 'var(--accent-border)'}`,
      }}>
        {isSaved ? '✓ Saved!' : 'Save changes'}
      </button>
    )
  }

  const MODULES = [
    { id: 'money', icon: '💰', title: 'Money Tracker', desc: 'Track income, expenses and budgets', color: '#22c55e', required: true },
    { id: 'trading', icon: '📈', title: 'Trading Journal', desc: 'Log trades and track performance', color: '#6366f1' },
  ]

  const currency = profile?.trading_currency || 'MYR'
  const totalTopups = topups.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Manage your profile, modules and preferences
        </p>
      </div>

      {/* ── Modules ─────────────────────────────────────── */}
      <div className="fade-up-1" style={card}>
        {sectionTitle(<Settings2 size={14} color="var(--text-secondary)" />, 'Modules')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MODULES.map(m => {
            const isActive = activeModules.includes(m.id)
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: `${m.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {m.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => !m.required && toggleModule(m.id)}
                  disabled={saving || (m.required && isActive)}
                  style={{
                    padding: '5px 14px', borderRadius: 8, fontSize: 12,
                    fontWeight: 500, cursor: m.required && isActive ? 'default' : 'pointer',
                    fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                    background: isActive ? `${m.color}20` : 'var(--bg)',
                    color: isActive ? m.color : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? m.color + '40' : 'var(--border)'}`,
                    opacity: m.required && isActive ? 0.6 : 1,
                  }}>
                  {isActive ? (m.required ? 'Core' : 'Active') : 'Activate'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Profile ──────────────────────────────────────── */}
      <div className="fade-up-1" style={card}>
        {sectionTitle(<User size={14} color="var(--text-secondary)" />, 'Profile')}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Full name</label>
          <input type="text" placeholder="Your name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={inputStyle} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <label style={labelStyle}>Email</label>
          <input type="text" value={user?.email || ''} disabled
            style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
        </div>
        <SaveButton section="profile" onClick={saveProfile} />
      </div>

      {/* ── Money Tracker settings ───────────────────────── */}
      {activeModules.includes('money') && (
        <div className="fade-up-2" style={card}>
          {sectionTitle(<DollarSign size={14} color="#22c55e" />, 'Money Tracker', '#22c55e')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Account balance (RM)</label>
              <input type="number" step="any" placeholder="0.00"
                value={accountBalance}
                onChange={e => setAccountBalance(e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Monthly income (RM)</label>
              <input type="number" step="any" placeholder="0.00"
                value={monthlyIncome}
                onChange={e => setMonthlyIncome(e.target.value)}
                style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Monthly budget (RM)</label>
            <input type="number" step="any" placeholder="0.00"
              value={monthlyBudget}
              onChange={e => setMonthlyBudget(e.target.value)}
              style={inputStyle} />
          </div>
          <SaveButton section="money" onClick={saveMoney} />
        </div>
      )}

      {/* ── Trading settings ─────────────────────────────── */}
      {activeModules.includes('trading') && (
        <div className="fade-up-2" style={card}>
          {sectionTitle(<TrendingUp size={14} color="#6366f1" />, 'Trading Journal', '#6366f1')}

          {/* Market region */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Market region</label>
            <div style={{
              display: 'flex', borderRadius: 9, overflow: 'hidden',
              border: '1px solid var(--border)', padding: 3,
              background: 'var(--bg)', gap: 3,
            }}>
              {[
                { id: 'MY', flag: '🇲🇾', label: 'Malaysian Market (MYR)' },
                { id: 'US', flag: '🇺🇸', label: 'US Market (USD)' },
              ].map(r => (
                <button type="button" key={r.id}
                  onClick={() => setTradingRegion(r.id)}
                  style={{
                    flex: 1, padding: '7px', fontSize: 12, borderRadius: 7,
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 500,
                    background: tradingRegion === r.id ? 'var(--bg-elevated)' : 'transparent',
                    color: tradingRegion === r.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}>
                  {r.flag} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Trading capital ({tradingRegion === 'MY' ? 'MYR' : 'USD'})</label>
              <input type="number" step="any" placeholder="0.00"
                value={tradingCapital}
                onChange={e => setTradingCapital(e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Risk per trade (%)</label>
              <input type="number" step="0.1" placeholder="1"
                value={riskPerTrade}
                onChange={e => setRiskPerTrade(e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            <div>
              <label style={labelStyle}>Preferred market</label>
              <select value={preferredMarket}
                onChange={e => setPreferredMarket(e.target.value)}
                style={inputStyle}>
                <option value="stocks">Stocks</option>
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="futures">Futures</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Trading style</label>
              <select value={tradingStyle}
                onChange={e => setTradingStyle(e.target.value)}
                style={inputStyle}>
                <option value="day">Day trading</option>
                <option value="swing">Swing trading</option>
                <option value="position">Position trading</option>
              </select>
            </div>
          </div>

          <SaveButton section="trading" onClick={saveTrading} />
        </div>
      )}

      {/* ── Capital Top-up ───────────────────────────────── */}
      {activeModules.includes('trading') && (
        <div className="fade-up-3" style={card}>
          {sectionTitle(<TrendingUp size={14} color="var(--accent)" />, 'Capital Top-up', 'var(--accent)')}

          {/* Current capital display */}
          <div style={{
            padding: '12px 14px', borderRadius: 10, marginBottom: 16,
            background: 'var(--bg)', border: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>Current capital</p>
              <p className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                {currency} {Number(profile?.trading_capital || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {topups.length > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3 }}>Total topped up</p>
                <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currency} {totalTopups.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          {/* Add top-up form */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Add top-up</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: 4 }}>Amount ({currency})</label>
                <input type="number" step="any" placeholder="0.00"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: 4 }}>Date</label>
                <DatePicker value={topupDate} onChange={setTopupDate} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 4 }}>
                Notes <span style={{ color: 'var(--text-muted)', textTransform: 'none' }}>(optional)</span>
              </label>
              <input type="text" placeholder="e.g. Monthly top-up, bonus"
                value={topupNotes}
                onChange={e => setTopupNotes(e.target.value)}
                style={inputStyle} />
            </div>
            <button
              onClick={addTopup}
              disabled={!topupAmount || addingTopup}
              style={{
                width: '100%', padding: '9px', borderRadius: 9,
                fontSize: 13, fontWeight: 600, cursor: topupAmount ? 'pointer' : 'not-allowed',
                border: 'none', fontFamily: 'var(--font-sans)',
                background: saved === 'topup' ? '#22c55e18' : 'var(--accent)',
                color: saved === 'topup' ? 'var(--accent)' : '#000',
                border: saved === 'topup' ? '1px solid var(--accent-border)' : 'none',
                opacity: !topupAmount ? 0.5 : 1,
                transition: 'all 0.15s',
              }}>
              {addingTopup ? 'Adding...' : saved === 'topup' ? '✓ Capital updated!' : `+ Add ${topupAmount ? `${currency} ${parseFloat(topupAmount).toFixed(2)}` : 'top-up'}`}
            </button>
          </div>

          {/* Top-up history */}
          {topups.length > 0 && (
            <div style={{
              borderRadius: 10, overflow: 'hidden',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Top-up History
                </p>
              </div>
              {topups.map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: i < topups.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: 'var(--accent-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                    }}>💰</div>
                    <div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {t.notes || 'Capital top-up'}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.date}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                      +{currency} {Number(t.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </p>
                    <button onClick={() => deleteTopup(t.id, Number(t.amount))} style={{
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
          )}
        </div>
      )}

      {/* Trading onboarding overlay */}
      {showTradingOnboarding && (
        <div className="fixed inset-0 z-50 overflow-auto" style={{ background: '#0f0f0f' }}>
          <TradingOnboarding onNext={handleTradingOnboardingDone} />
        </div>
      )}
    </div>
  )
}