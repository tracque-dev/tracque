import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Hash, Bot, Search, Globe, BarChart3, Sparkles, Zap, Settings, LogOut, Users2, ChevronsUpDown, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/auth'
import { useClients } from '../lib/hooks'
import { useSelectedClient } from '../lib/clientContext'
import { Mark } from './Logo'

const nav = [
  { to: '/app/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/clients',         icon: Users2,          label: 'Clients' },
  { to: '/app/brands',          icon: Building2,       label: 'Brands' },
  { to: '/app/keywords',        icon: Hash,            label: 'Keywords' },
  { to: '/app/prompts',         icon: Sparkles,        label: 'Prompt Discovery' },
  { to: '/app/ai',              icon: Bot,             label: 'AI Visibility' },
  { to: '/app/seo',             icon: Search,          label: 'SEO Rankings' },
  { to: '/app/recommendations', icon: Zap,             label: 'Recommendations' },
  { to: '/app/site-audit',      icon: Globe,           label: 'Site Audit' },
  { to: '/app/attribution',     icon: BarChart3,       label: 'Attribution' },
]

function ClientSwitcher() {
  const { data: clients = [] } = useClients()
  const { clientId, setClientId } = useSelectedClient()
  const [open, setOpen] = useState(false)
  const active = clients.find(c => c.id === clientId)
  const label = clientId === 'all' ? 'All clients' : active?.name ?? 'All clients'
  const color = clientId === 'all' ? '#64748B' : active?.color ?? '#64748B'

  return (
    <div className="relative px-2 pb-2">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
        <span className="w-4 h-4 rounded shrink-0" style={{ background: color }} />
        <span className="text-sm text-white/90 truncate flex-1 text-left">{label}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 mt-1 z-20 bg-[hsl(var(--sidebar-accent))] border border-white/10 rounded-lg shadow-xl py-1 max-h-72 overflow-auto">
            <button onClick={() => { setClientId('all'); setOpen(false) }} className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-white/90 hover:bg-white/5">
              <span className="w-3.5 h-3.5 rounded shrink-0 bg-slate-500" />
              <span className="flex-1 text-left">All clients</span>
              {clientId === 'all' && <Check className="w-3.5 h-3.5 text-[hsl(var(--sidebar-primary))]" />}
            </button>
            {clients.map(c => (
              <button key={c.id} onClick={() => { setClientId(c.id); setOpen(false) }} className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-white/90 hover:bg-white/5">
                <span className="w-3.5 h-3.5 rounded shrink-0" style={{ background: c.color }} />
                <span className="flex-1 text-left truncate">{c.name}</span>
                {clientId === c.id && <Check className="w-3.5 h-3.5 text-[hsl(var(--sidebar-primary))]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 flex flex-col bg-[hsl(var(--sidebar))] shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
          <Mark className="w-7 h-7" badge="hsl(var(--sidebar-primary))" rail="#0A0A0A" node="#ffffff" />
          <span className="text-white font-semibold text-base tracking-tight">Tracque</span>
        </div>

        {/* Client workspace switcher */}
        <div className="pt-2">
          <ClientSwitcher />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-[hsl(var(--sidebar-accent))] text-white'
                    : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[hsl(var(--sidebar-primary))]' : '')} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-white/5">
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-[hsl(var(--sidebar-accent))] text-white'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white'
              )
            }
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
          {user && (
            <div className="px-3 pt-2">
              <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-50 truncate">{user.email}</p>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-50 hover:opacity-100 transition-opacity"
              >
                <LogOut className="w-3 h-3" /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
