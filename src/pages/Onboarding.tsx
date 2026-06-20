import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, Store, Boxes, Users2, Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useUserId } from '../lib/auth'
import { useSelectedClient } from '../lib/clientContext'
import { useRunScan } from '../lib/hooks'

// First-run setup — a new account is never empty. Pick a segment, give us your
// name + city + category, and we seed the brand, segment-appropriate keywords,
// (a starter rate sheet for CUs/lenders), and fire the first scan.

type Segment = 'cu' | 'local' | 'saas' | 'agency'

const SEGMENTS: { key: Segment; icon: typeof Landmark; label: string; desc: string }[] = [
  { key: 'cu', icon: Landmark, label: 'Credit union / lender', desc: 'Rate accuracy + local AI visibility' },
  { key: 'local', icon: Store, label: 'Local business', desc: 'Near-me visibility + reputation' },
  { key: 'saas', icon: Boxes, label: 'SaaS / tech', desc: 'Category visibility + competitors' },
  { key: 'agency', icon: Users2, label: 'Agency', desc: 'Manage many clients' },
]

function keywordsFor(seg: Segment, name: string, city: string, category: string): string[] {
  const c = city.trim(), cat = (category.trim() || 'business')
  const sets: Record<Segment, string[]> = {
    cu: [`best credit union in ${c}`, `${c} credit union`, `best auto loan rates ${c}`, 'best CD rates', 'credit union vs bank', 'best high yield savings account', `free checking account ${c}`],
    local: [`best ${cat} in ${c}`, `${cat} near me`, `top rated ${cat} ${c}`, `affordable ${cat} ${c}`, `${cat} ${c} reviews`],
    saas: [`best ${cat} software`, `${cat} alternatives`, `${name} vs competitors`, `top ${cat} tools`, `best ${cat} for teams`],
    agency: [`best ${cat} agency`, `${cat} agency ${c}`, `top ${cat} agencies`, `${name} reviews`],
  }
  return sets[seg].map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s && !/\bin $|\b $/.test(s)).slice(0, 8)
}

const CU_FACTS = [
  { label: '12-month CD APY', value: '—', category: 'rate' },
  { label: 'new auto loan APR', value: '—', category: 'rate' },
  { label: 'monthly checking fee', value: '—', category: 'fee' },
  { label: 'Saturday branch hours', value: '—', category: 'hours' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  const qc = useQueryClient()
  const runScan = useRunScan()

  const [step, setStep] = useState<1 | 2>(1)
  const [seg, setSeg] = useState<Segment | null>(null)
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsCity = seg === 'cu' || seg === 'local'
  const needsCategory = seg === 'local' || seg === 'saas' || seg === 'agency'

  async function finish() {
    if (!seg || !name.trim()) return
    setBusy(true); setError(null)
    try {
      const client_id = clientId === 'all' ? null : clientId
      const { data: brand, error: be } = await supabase.from('brands')
        .insert({ user_id: userId, name: name.trim(), domain: domain.trim() || null, type: 'own', client_id })
        .select().single()
      if (be) throw be

      const phrases = keywordsFor(seg, name.trim(), city, category)
      if (phrases.length) {
        await supabase.from('keywords').insert(phrases.map(phrase => ({ user_id: userId, phrase, client_id })))
      }
      if (seg === 'cu' && brand) {
        await supabase.from('rate_facts').insert(CU_FACTS.map(f => ({ brand_id: brand.id, ...f })))
      }
      localStorage.setItem(`tracque.segment.${userId}`, seg)

      await qc.invalidateQueries()
      runScan.mutate()             // fire the first scan in the background
      navigate('/app/dashboard')
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong'); setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl shadow-card">
          <div className="relative overflow-hidden bg-ink-grad text-white px-8 py-6">
            <div className="absolute inset-0 rails opacity-60 pointer-events-none" />
            <div className="relative">
              <p className="eyebrow text-white/50">Get set up · step {step} of 2</p>
              <h1 className="text-2xl font-display font-bold tracking-tight mt-1">
                {step === 1 ? 'What are you tracking?' : 'Tell us about it'}
              </h1>
              <p className="text-sm text-white/55 mt-1">
                {step === 1 ? 'We tailor your keywords, rate sheet, and first scan to fit.' : 'We seed everything and run your first scan automatically.'}
              </p>
            </div>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SEGMENTS.map(({ key, icon: Icon, label, desc }) => (
                    <button key={key} onClick={() => setSeg(key)}
                      className={`text-left rounded-xl border p-4 transition-all ${seg === key ? 'border-violet-500 ring-1 ring-violet-500/30 bg-violet-50' : 'border-border hover:border-violet-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><Icon className="w-4 h-4 text-foreground" /></div>
                        {seg === key && <Check className="w-4 h-4 text-violet-600" />}
                      </div>
                      <p className="font-medium text-sm mt-3">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => seg && setStep(2)} disabled={!seg}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors">
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="eyebrow text-muted-foreground block mb-1.5">{seg === 'cu' ? 'Institution name' : 'Brand / business name'}</label>
                  <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={seg === 'cu' ? 'Summit Credit Union' : 'Acme Inc.'}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="eyebrow text-muted-foreground block mb-1.5">Website (optional)</label>
                  <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="acme.com"
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {needsCity && (
                    <div>
                      <label className="eyebrow text-muted-foreground block mb-1.5">City</label>
                      <input value={city} onChange={e => setCity(e.target.value)} placeholder="Denver, CO"
                        className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                  )}
                  {needsCategory && (
                    <div>
                      <label className="eyebrow text-muted-foreground block mb-1.5">Category</label>
                      <input value={category} onChange={e => setCategory(e.target.value)} placeholder={seg === 'saas' ? 'CRM software' : 'plumber'}
                        className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                  )}
                </div>

                {error && <p className="text-xs text-destructive bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}

                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => setStep(1)} disabled={busy} className="flex items-center gap-1.5 border border-border px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted disabled:opacity-50">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button onClick={finish} disabled={busy || !name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors">
                    {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up &amp; scanning…</> : <>Set up my account <ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
