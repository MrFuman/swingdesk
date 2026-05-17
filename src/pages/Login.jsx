import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Login success! Redirecting...')
    }
    setLoading(false)
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('Check your email to confirm your account!')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f0f' }}>
      <div className="p-8 rounded-2xl w-full max-w-sm" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f5f5f5' }}>SwingDesk</h1>
        <p className="text-sm mb-6" style={{ color: '#666666' }}>Track money. Trade smart. File tax.</p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', color: '#f5f5f5' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', color: '#f5f5f5' }}
          />
          {message && <p className="text-sm" style={{ color: '#6366f1' }}>{message}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-medium"
            style={{ background: '#6366f1', color: '#ffffff' }}
          >
            {loading ? 'Loading...' : 'Sign in'}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm"
            style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#666666' }}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  )
}