import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { Mark } from '../components/Logo'

type Mode = 'signin' | 'signup' | 'reset'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Auto-confirm on → signUp returns a session; sign straight in.
        // Otherwise (email confirmation required) → prompt to check email.
        if (data.session) {
          navigate('/app/dashboard')
        } else {
          setSuccess('Account created — check your email to confirm, then sign in.')
        }
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/app/dashboard')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/app/settings`,
        })
        if (error) throw error
        setSuccess('Password reset email sent.')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Mark className="w-8 h-8" />
          <span className="text-xl font-display font-bold tracking-tight">Tracque</span>
        </div>

        <div className="relative overflow-hidden bg-card border border-border rounded-2xl shadow-card">
          {/* Ink-grad accent panel */}
          <div className="relative overflow-hidden bg-ink-grad text-white px-8 py-6">
            <div className="absolute inset-0 rails opacity-60 pointer-events-none" />
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-blue-600/30 blur-3xl pointer-events-none" />
            <div className="relative">
              <p className="eyebrow text-white/50">Auth</p>
              <h1 className="text-2xl font-display font-bold tracking-tight mt-1">
                {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
              </h1>
              <p className="text-sm text-white/55 mt-1">
                {mode === 'signin' ? 'Sign in to your Tracque account' :
                 mode === 'signup' ? 'Start tracking your AI visibility' :
                 "We'll send you a reset link"}
              </p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="eyebrow text-muted-foreground block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {mode !== 'reset' && (
                <div>
                  <label className="eyebrow text-muted-foreground block mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              {error && (
                <p className="text-xs text-destructive bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
              )}
              {success && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">{success}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Mode switchers */}
            <div className="mt-5 space-y-2 text-center">
              {mode === 'signin' && (
                <>
                  <button onClick={() => setMode('reset')} className="text-xs text-muted-foreground hover:text-foreground block w-full">
                    Forgot password?
                  </button>
                  <p className="text-xs text-muted-foreground">
                    No account?{' '}
                    <button onClick={() => setMode('signup')} className="text-blue-600 font-medium hover:underline">
                      Sign up free
                    </button>
                  </p>
                </>
              )}
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <button onClick={() => setMode('signin')} className="text-blue-600 font-medium hover:underline">
                    Sign in
                  </button>
                </p>
              )}
              {mode === 'reset' && (
                <button onClick={() => setMode('signin')} className="text-xs text-muted-foreground hover:text-foreground">
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By signing up you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
