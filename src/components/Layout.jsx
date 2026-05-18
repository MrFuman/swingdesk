import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import {
  LayoutDashboard, ArrowLeftRight, BookOpen,
  Calculator, Settings, LogOut, X, Menu,
  TrendingUp, DollarSign, BarChart2, PieChart,
  Bell, RefreshCw, Tag, Upload, FileBarChart
} from 'lucide-react'

const MODULE_GROUPS = [
  {
    id: 'money',
    label: 'Money Tracker',
    icon: DollarSign,
    color: '#22c55e',
    links: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { to: '/budget', label: 'Budget', icon: PieChart },
      { to: '/recurring', label: 'Recurring', icon: RefreshCw },
    ]
  },
  {
    id: 'trading',
    label: 'Trading',
    icon: TrendingUp,
    color: '#6366f1',
    links: [
      { to: '/journal', label: 'Journal', icon: BookOpen },
      { to: '/positions', label: 'Open Positions', icon: TrendingUp },
      { to: '/analytics', label: 'Analytics', icon: BarChart2 },
      { to: '/report', label: 'Monthly Report', icon: FileBarChart },
      { to: '/risk', label: 'Risk Calculator', icon: Calculator },
      { to: '/tags', label: 'Tag Manager', icon: Tag },
      { to: '/import', label: 'Import Trades', icon: Upload },
    ]
  },
]

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/journal': 'Journal',
  '/analytics': 'Analytics',
  '/risk': 'Risk Calculator',
  '/settings': 'Settings',
  '/budget': 'Budget',
  '/recurring': 'Recurring',
  '/positions': 'Open Positions',
  '/report': 'Monthly Report',
  '/tags': 'Tag Manager',
  '/import': 'Import Trades',
}

function AvatarMenu({ user, signOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const initials = user?.email?.[0]?.toUpperCase() || '?'

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: open ? 'var(--accent)' : 'var(--accent-dim)',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--accent-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
          color: open ? '#000' : 'var(--accent)',
          cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: 'var(--font-sans)',
        }}>
        {initials}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 40, right: 0,
          width: 220, zIndex: 100,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-mid)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          animation: 'fadeUp 0.15s ease both',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#000',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{user?.email}</p>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Signed in
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); signOut() }}
            style={{
              width: '100%', padding: '11px 16px',
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s', textAlign: 'left',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#ef444412'
              e.currentTarget.style.color = 'var(--red)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function Drawer({ open, onClose, profile }) {
  const activeModules = profile?.modules || []

  return (
    <>
      {open && (
        <div className="overlay-in" onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(2px)',
        }} />
      )}

      <div className={open ? 'drawer-slide' : ''} style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: 'var(--drawer-w)',
        zIndex: 50,
        background: 'var(--bg-drawer)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: open ? 'none' : 'transform 0.2s ease',
      }}>

        {/* Drawer header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 16px 20px',
          borderBottom: '1px solid var(--border)',
          height: 'var(--header-h)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              borderRadius: 8, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px #22c55e30',
            }}>
              <TrendingUp size={14} color="white" />
            </div>
            <span style={{
              fontWeight: 600, fontSize: 15,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-sans)',
            }}>SwingDesk</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', display: 'flex',
            padding: 4, borderRadius: 6,
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {MODULE_GROUPS.map(group => {
            if (!activeModules.includes(group.id)) return null
            return (
              <div key={group.id} style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '4px 10px 8px',
                }}>
                  <group.icon size={11} color={group.color} />
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: group.color,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{group.label}</span>
                </div>
                {group.links.map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8,
                      fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--bg-elevated)' : 'transparent',
                      textDecoration: 'none', transition: 'all 0.12s ease',
                      borderLeft: isActive ? `2px solid ${group.color}` : '2px solid transparent',
                      marginBottom: 1,
                    })}>
                    <Icon size={14} /> {label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* Drawer footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 10px' }}>
          <NavLink to="/settings" onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              fontSize: 13.5, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              textDecoration: 'none',
              borderLeft: isActive ? '2px solid var(--text-secondary)' : '2px solid transparent',
            })}>
            <Settings size={14} /> Settings
          </NavLink>
        </div>
      </div>
    </>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const title = PAGE_TITLES[location.pathname] || 'SwingDesk'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 'var(--header-h)', zIndex: 30,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12,
      }}>
        <button onClick={() => setDrawerOpen(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', display: 'flex',
          padding: 6, borderRadius: 8, transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <Menu size={18} />
        </button>

        <p style={{
          flex: 1, fontSize: 17, fontWeight: 600,
          color: 'var(--text-primary)', letterSpacing: '-0.02em',
          fontFamily: 'var(--font-sans)',
        }}>{title}</p>

        <AvatarMenu user={user} signOut={signOut} />
      </header>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
      />

      <main style={{
        minHeight: '100vh', maxWidth: 680, margin: '0 auto',
        padding: `calc(var(--header-h) + 16px) 12px 32px`,
      }}>
        <Outlet />
      </main>
    </div>
  )
}