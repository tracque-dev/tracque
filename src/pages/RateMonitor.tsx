import { useState } from 'react'
import { Loader2, RefreshCw, Plus, Trash2, Check, X, AlertTriangle, MinusCircle } from 'lucide-react'
import { useBrands, useRateFacts, useAddRateFact, useDeleteRateFact, useRateChecks, useRunRateMonitor } from '../lib/hooks'

const CATEGORIES = ['rate', 'fee', 'hours', 'eligibility', 'other']

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'accurate') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-700"><Check className="w-3 h-3" /> Accurate</span>
  if (status === 'wrong') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-medium"><X className="w-3 h-3" /> Wrong</span>
  return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground"><MinusCircle className="w-3 h-3" /> Not stated</span>
}

export default function RateMonitor() {
  const { data: brands = [] } = useBrands()
  const ownBrand = brands.find(b => b.type === 'own') ?? brands[0]
  const { data: facts = [] } = useRateFacts(ownBrand?.id)
  const { data: checks = [] } = useRateChecks(ownBrand?.id)
  const addFact = useAddRateFact()
  const delFact = useDeleteRateFact()
  const runMonitor = useRunRateMonitor()

  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('rate')

  const checkByFact = new Map(checks.map(c => [c.fact_id, c]))
  const wrong = checks.filter(c => c.status === 'wrong')

  function add(e: React.FormEvent) {
    e.preventDefault()
    if (!ownBrand || !label.trim() || !value.trim()) return
    addFact.mutate({ brand_id: ownBrand.id, label: label.trim(), value: value.trim(), category })
    setLabel(''); setValue('')
  }

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-blue-600">Compliance</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">AI Rate Accuracy</h1>
          <p className="text-sm text-muted-foreground mt-1">Catch when AI states the wrong rate, fee, or hours about you — before it's a compliance problem</p>
        </div>
        <button onClick={() => ownBrand && runMonitor.mutate(ownBrand.id)} disabled={runMonitor.isPending || !facts.length}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all">
          {runMonitor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {runMonitor.isPending ? 'Checking AI…' : 'Run accuracy check'}
        </button>
      </div>

      {/* Alert if anything wrong */}
      {wrong.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{wrong.length} fact{wrong.length > 1 ? 's' : ''} stated incorrectly by AI</p>
            <p className="text-xs text-red-600 mt-0.5">Wrong rate/fee info from an AI engine is a reputational and regulatory (UDAAP / fair-lending) risk. Review below and correct the source content.</p>
          </div>
        </div>
      )}

      {/* Ground-truth sheet */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="eyebrow text-muted-foreground">Ground-truth sheet — your correct values</p>
        </div>
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 p-4 border-b border-border bg-muted/20">
          <div>
            <label className="eyebrow text-muted-foreground">Fact</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="12-month CD APY" className="mt-1 w-48 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:ring-blue-500" />
          </div>
          <div>
            <label className="eyebrow text-muted-foreground">Correct value</label>
            <input value={value} onChange={e => setValue(e.target.value)} placeholder="4.50%" className="mt-1 w-28 px-3 py-2 text-sm border border-border rounded-xl bg-background nums focus:ring-blue-500" />
          </div>
          <div>
            <label className="eyebrow text-muted-foreground">Type</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 px-3 py-2 text-sm border border-border rounded-xl bg-background capitalize focus:ring-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={addFact.isPending} className="flex items-center gap-1.5 bg-foreground text-background px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
        {facts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Add your current rates, fees, and hours above, then run the check to see what AI says about them.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Fact', 'Correct', 'What AI says', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facts.map(f => {
                const c = checkByFact.get(f.id)
                return (
                  <tr key={f.id} className={`border-b border-border last:border-0 ${c?.status === 'wrong' ? 'bg-red-50/40' : 'hover:bg-muted/40'} transition-colors`}>
                    <td className="px-5 py-3 text-sm font-medium">{f.label} <span className="text-xs text-muted-foreground capitalize">· {f.category}</span></td>
                    <td className="px-5 py-3 text-sm nums">{f.value}</td>
                    <td className="px-5 py-3 text-sm nums text-muted-foreground">{c?.ai_value ?? '—'}</td>
                    <td className="px-5 py-3">{c ? <StatusBadge status={c.status} /> : <span className="text-xs text-muted-foreground">not checked</span>}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => delFact.mutate(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Monitoring only — Tracque never publishes a rate. Wrong values are flagged for your team to correct at the source (site/GBP/third-party listings).</p>
    </div>
  )
}
