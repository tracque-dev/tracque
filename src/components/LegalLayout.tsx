import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Mark } from './Logo'

export default function LegalLayout({ title, updated, children }: {
  title: string; updated: string; children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark className="w-7 h-7" badge="transparent" rail="#fff" node="#2D7FF9" />
            <span className="font-display font-bold tracking-tight">Tracque</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="eyebrow text-primary">Legal</p>
        <h1 className="text-3xl font-display font-bold tracking-tight mt-1">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated {updated}</p>
        <div className="mt-8 space-y-7 text-sm text-muted-foreground leading-relaxed">
          {children}
        </div>
        <p className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
          Questions? Email <a href="mailto:privacy@tracque.com" className="text-primary hover:underline">privacy@tracque.com</a>.
        </p>
      </main>
    </div>
  )
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-display font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  )
}
