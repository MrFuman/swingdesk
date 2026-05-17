import { Component } from 'react'

class ErrorBoundary extends Component {
  state = { error: null }
  componentDidCatch(error) {
    console.error('PAGE CRASH:', error)
    this.setState({ error })
  }
  render() {
    if (this.state.error) return (
      <div style={{ color: 'red', padding: 20, background: '#000', minHeight: '100vh' }}>
        <h2>Crash caught!</h2>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
          {this.state.error.toString()}
          {'\n'}
          {this.state.error.stack}
        </pre>
      </div>
    )
    return this.props.children
  }
}
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useProfile } from './hooks/useProfile'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Journal from './pages/Journal'
import Settings from './pages/Settings'
import RiskCalculator from './pages/RiskCalculator'
import Layout from './components/Layout'
import Onboarding from './onboarding/Onboarding'
import Analytics from './pages/Analytics'
import Budget from './pages/Budget'
import Recurring from './pages/Recurring'
import OpenPositions from './pages/OpenPositions'
import TradingReport from './pages/TradingReport'
import TradeImport from './pages/TradeImport'
import TagManager from './pages/TagManager'


function AppContent() {
  const { user } = useAuth()
  const { profile, loading, refetch } = useProfile()

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#0f0f0f' }}>
        <p style={{ color: '#666666' }}>Loading...</p>
      </div>
    )
  }

  if (!profile?.onboarding_complete) {
    return <Onboarding onComplete={refetch} />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="journal" element={<Journal />} />
        <Route path="risk" element={<RiskCalculator />} />
        <Route path="settings" element={<Settings />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="budget" element={<Budget />} />
        <Route path="recurring" element={<Recurring />} />
        <Route path="positions" element={<OpenPositions />} />
        <Route path="report" element={<TradingReport />} />
        <Route path="import" element={<TradeImport />} />
        <Route path="tags" element={<TagManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
          </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}