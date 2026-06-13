import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Hash, Bot, Search, Globe, BarChart3, Sparkles, Zap, Settings, LogOut } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/auth'
import { Mark } from './Logo'

const nav = [
  { to: '/app/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/brands',          icon: Building2,       label: 'Brands' },
  { to: '/app/keywords',        icon: Hash,            label: 'Keywords' },
  { to: '/app/prompts',         icon: Sparkles,        label: 'Prompt Discovery' },
  { to: '/app/ai',              icon: Bot,             label: 'AI Visibility' },
  { to: '/app/seo',             icon: Search,          label: 'SEO Rankings' },
  { to: '/app/recommendations', icon: Zap,             label: 'Recommendations' },
  { to: '/app/site-audit',      icon: Globe,           label: 'Site Audit' },
  { to: '/app/attribution',     icon: BarChart3,       label: 'Attribution' },
]

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
