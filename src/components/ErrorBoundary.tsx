import { Component, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { AlertTriangle } from 'lucide-react'

// Top-level safety net: any render-time throw is caught here (instead of
// white-screening the SPA — including the public /r/:token report and /auth),
// reported to Sentry (no-op if VITE_SENTRY_DSN isn't set), and shown a
// friendly recovery fallback.

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
    console.error('Uncaught render error:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-5 h-5 text-primary" />
          </div>
          <p className="eyebrow text-primary">Something broke</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">This page hit an error</h1>
          <p className="text-sm text-muted-foreground mt-2">
            It’s been logged automatically. Reloading usually fixes it — if it keeps happening, let us know.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
