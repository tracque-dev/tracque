import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Search, Zap, BarChart3, Globe, Sparkles, TrendingUp, DollarSign, Bot } from 'lucide-react'
import { Mark } from '../components/Logo'

// ── Scroll reveal ──────────────────────────────────────────
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.disconnect() }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary mb-4">{children}</p>
}

// ── Hero product mock (the money shot) ─────────────────────
const MODELS = [
  { name: 'ChatGPT',    dot: '#10A37F', rate: 82 },
  { name: 'Claude',     dot: '#D97757', rate: 90 },
  { name: 'Perplexity', dot: '#20808D', rate: 74 },
  { name: 'Gemini',     dot: '#4285F4', rate: 61 },
  { name: 'Grok',       dot: '#9CA3AF', rate: 48 },
]

function HeroVisual() {
  return (
    <div className="relative">
      {/* main panel */}
      <div className="relative rounded-2xl border border-border bg-card shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center justify-between px-4 h-11 border-b border-border bg-background">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">tracque.com/app</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">live</span>
          </div>
        </div>

        {/* body */}
        <div className="p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Brand visibility</p>
              <p className="font-mono text-[11px] text-muted-foreground">“best geo testing tool”</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-emerald-400 nums">+18%</p>
              <p className="font-mono text-[10px] text-muted-foreground">7-day</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {MODELS.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.dot }} />
                <span className="text-[12px] text-muted-foreground w-20 shrink-0">{m.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full rounded-full origin-left"
                    style={{
                      width: `${m.rate}%`,
                      background: 'linear-gradient(90deg,#2D7FF9,#5B9DFF)',
                      animation: `bar-grow 0.9s ${0.2 + i * 0.1}s cubic-bezier(0.16,1,0.3,1) both`,
                    }}
                  />
                </div>
                <span className="font-mono text-[12px] text-foreground nums w-9 text-right">{m.rate}%</span>
              </div>
            ))}
          </div>

          {/* attribution strip */}
          <div className="mt-5 pt-4 border-t border-border flex items-center gap-2 flex-wrap font-mono text-[10.5px] text-muted-foreground">
            {['1,204 clicks', '38 signups', '$48,210'].map((s, i, a) => (
              <span key={s} className="flex items-center gap-2">
                <span className={i === a.length - 1 ? 'text-emerald-400 font-semibold' : ''}>{s}</span>
                {i < a.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/60" />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* floating accent card */}
      <div className="hidden sm:block absolute -right-5 -bottom-6 rounded-xl border border-border bg-card shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Revenue from AI</p>
        <p className="text-lg font-bold text-foreground nums">$48.2k<span className="text-emerald-400 text-xs font-semibold ml-1.5">▲</span></p>
      </div>
    </div>
  )
}

// ── Accordion ─────────────────────────────────────────────
function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card transition-colors hover:border-primary/40">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-[15px] font-medium text-foreground pr-8">{question}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[14px] text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

// ── Pricing card ───────────────────────────────────────────
function PricingCard({ name, price, period, desc, features, cta, highlighted = false }: {
  name: string; price: string; period?: string; desc: string; features: string[]; cta: string; highlighted?: boolean
}) {
  return (
    <div className={`rounded-2xl p-6 flex flex-col transition-transform duration-300 hover:-translate-y-1 ${
      highlighted ? 'bg-card border border-primary/40 ring-1 ring-primary/20 shadow-[0_24px_50px_-20px_rgba(45,127,249,0.35)]' : 'bg-card border border-border text-foreground'
    }`}>
      {highlighted && <span className="self-start font-mono text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-md mb-4">Most popular</span>}
      <p className={`font-mono text-[11px] uppercase tracking-[0.16em] mb-3 ${highlighted ? 'text-primary' : 'text-muted-foreground'}`}>{name}</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-4xl font-display font-bold tracking-tight nums text-foreground">{price}</span>
        {period && <span className="text-sm text-muted-foreground">{period}</span>}
      </div>
      <p className="text-[13px] mb-6 text-muted-foreground">{desc}</p>
      <ul className="space-y-2.5 flex-1 mb-6">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? 'text-primary' : 'text-foreground'}`} />
            <span className="text-[13px] text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>
      <Link to="/auth" className={`w-full py-2.5 rounded-lg text-[13px] font-semibold text-center transition-colors ${
        highlighted ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-foreground hover:bg-secondary/80'
      }`}>{cta}</Link>
    </div>
  )
}

// ── Comparison row ─────────────────────────────────────────
function CompRow({ feature, tracque, profound, heyamos, peec }: {
  feature: string; tracque: boolean | string; profound: boolean | string; heyamos: boolean | string; peec: boolean | string
}) {
  function Cell({ val, hl = false }: { val: boolean | string; hl?: boolean }) {
    if (val === true) return <Check className={`w-4 h-4 mx-auto ${hl ? 'text-primary' : 'text-foreground'}`} />
    if (val === false) return <span className="text-muted-foreground/50 mx-auto block text-center">—</span>
    return <span className="font-mono text-[11px] text-muted-foreground text-center block">{val}</span>
  }
  return (
    <tr className="border-b border-border">
      <td className="py-3.5 pr-6 text-[13px] text-foreground">{feature}</td>
      <td className="py-3.5 text-center bg-primary/10"><Cell val={tracque} hl /></td>
      <td className="py-3.5 text-center"><Cell val={profound} /></td>
      <td className="py-3.5 text-center"><Cell val={heyamos} /></td>
      <td className="py-3.5 text-center"><Cell val={peec} /></td>
    </tr>
  )
}

// ── Main ───────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="flex items-center justify-between px-6 lg:px-8 h-16 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="text-[17px] font-display font-bold tracking-tight">Tracque</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Compare', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-[13px] text-muted-foreground hover:text-foreground px-3 py-2">Log in</Link>
            <Link to="/auth" className="text-[13px] bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">Start free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(80%_60%_at_50%_0%,#000,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[640px] glow-radial pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <h1 className="text-[44px] md:text-[56px] font-display font-bold leading-[1.04] tracking-[-0.035em] mb-6">
                See your brand in<br />
                <span className="bg-gradient-to-r from-[#2D7FF9] to-[#5B9DFF] bg-clip-text text-transparent">every AI answer.</span><br />
                Prove what it earns.
              </h1>
              <p className="text-[17px] text-muted-foreground max-w-md mb-8 leading-relaxed">
                Tracque shows whether ChatGPT, Perplexity, Gemini, Claude, and Grok recommend your brand —
                then traces every mention through to clicks, signups, and revenue.
              </p>
              <div className="flex items-center gap-3">
                <Link to="/auth" className="group flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg text-[14px] font-semibold hover:bg-primary/90 transition-colors">
                  Start for free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a href="#compare" className="px-5 py-3 rounded-lg border border-border bg-card text-[14px] font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">
                  Compare vs Profound
                </a>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground mt-4">free plan · no credit card · live in 5 min</p>
            </Reveal>
          </div>
          <Reveal delay={120} className="lg:pl-4">
            <HeroVisual />
          </Reveal>
        </div>

        {/* trust strip */}
        <div className="relative border-t border-border bg-card/60">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-5 flex items-center gap-6 flex-wrap justify-center">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Tracks across</span>
            {['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Grok', 'Google AI Overviews'].map(n => (
              <span key={n} className="text-[14px] font-semibold text-muted-foreground">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { val: '5', label: 'AI engines tracked' },
            { val: '40–60%', label: 'monthly citation drift' },
            { val: '1', label: 'tool that proves revenue' },
            { val: '100%', label: 'attribution coverage' },
          ].map(({ val, label }) => (
            <div key={label} className="py-8 px-4 text-center">
              <p className="text-3xl font-display font-bold tracking-tight nums">{val}</p>
              <p className="font-mono text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-[32px] font-display font-bold tracking-tight mb-3 max-w-xl">From AI mention to revenue — one continuous loop.</h2>
          <p className="text-muted-foreground max-w-lg mb-14">Three moves, fully instrumented. No spreadsheets, no guesswork about whether AI search is actually working.</p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {[
            { step: '01', icon: Bot, title: 'Track', desc: 'We query every AI engine daily with your keywords — multiple runs each for statistical confidence. See exactly where you appear, at what position, with what sentiment vs competitors.' },
            { step: '02', icon: Zap, title: 'Act', desc: 'Get ranked recommendations with ready-to-paste templates. Not "improve your content" — the exact Reddit thread to answer, the G2 reviews to get, the page to rewrite.' },
            { step: '03', icon: DollarSign, title: 'Measure', desc: 'Every mention traced to a session, every session to a conversion, every conversion to revenue. See which engine drives your highest-value customers — not just clicks.' },
          ].map(({ step, icon: Icon, title, desc }, i) => (
            <Reveal key={step} delay={i * 100} className="bg-card p-7">
              <div className="flex items-center justify-between mb-5">
                <Icon className="w-5 h-5 text-foreground" strokeWidth={1.75} />
                <span className="font-mono text-[12px] text-muted-foreground/60">{step}</span>
              </div>
              <p className="font-semibold text-lg mb-2">{title}</p>
              <p className="text-[14px] text-muted-foreground leading-relaxed">{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-card border-y border-border py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <Reveal>
            <Eyebrow>Features</Eyebrow>
            <h2 className="text-[32px] font-display font-bold tracking-tight mb-14">Everything in one platform.</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden">
            {[
              { icon: Bot, title: 'AI Visibility', desc: 'Mentions across ChatGPT, Perplexity, Gemini, Claude, Grok. Rate, sentiment, position, citations — daily.' },
              { icon: Search, title: 'SEO Rankings', desc: 'Google position tracking beside AI visibility. The full picture of where you show up.' },
              { icon: Sparkles, title: 'Prompt Discovery', desc: 'What people actually ask AI about your category — from PAA, autocomplete, Reddit, Perplexity, Trends.' },
              { icon: Zap, title: 'Recommendations', desc: 'Claude turns your data into specific actions with templates, ranked by impact.' },
              { icon: Globe, title: 'Site Audit', desc: 'Crawl your site, auto-generate a GA4 event schema + GTM container. Bot tracking in minutes.' },
              { icon: BarChart3, title: 'Attribution', desc: 'AI mention → click → conversion → revenue. See which engine drives the highest LTV.' },
              { icon: TrendingUp, title: 'Confidence Scores', desc: 'Every metric from 3–5 runs per keyword, per model, per day. Real intervals, not fake precision.' },
              { icon: DollarSign, title: 'UTM Tracking', desc: 'Auto-capture utm_source=perplexity / chatgpt and AI referrers, beside paid and organic.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={(i % 4) * 80} className="group bg-card p-6 hover:bg-secondary/40 transition-colors">
                <Icon className="w-5 h-5 text-foreground mb-4 group-hover:text-primary transition-colors" strokeWidth={1.75} />
                <p className="font-semibold text-[15px] mb-1.5">{title}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The loop */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <Reveal>
          <div className="relative bg-ink border border-border rounded-3xl p-10 md:p-14 text-white overflow-hidden">
            <div className="absolute inset-0 bg-dots opacity-[0.15]" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-primary/20 blur-3xl" />
            <div className="relative text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary mb-4">The full loop</p>
              <h2 className="text-[32px] font-display font-bold tracking-tight mb-10">From AI question to closed deal.</h2>
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
                {['Buyer asks ChatGPT', 'You get mentioned', 'They click through', 'UTM captured', 'They convert', 'Revenue tracked'].map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-2.5">
                    <div className={`px-3.5 py-2 rounded-lg text-[13px] font-medium border ${i === arr.length - 1 ? 'bg-primary border-primary text-primary-foreground' : 'bg-white/[0.06] border-white/10 text-white/90'}`}>{step}</div>
                    {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-white/30" />}
                  </div>
                ))}
              </div>
              <p className="text-[14px] text-white/45 max-w-xl mx-auto">No other tool tracks this end-to-end. Profound stops at mentions. HeyAmos stops at actions. <span className="text-white/80">Tracque tracks the money.</span></p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Comparison */}
      <section id="compare" className="bg-card border-y border-border py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <Reveal>
            <Eyebrow>Compare</Eyebrow>
            <h2 className="text-[32px] font-display font-bold tracking-tight mb-2">More than monitoring.</h2>
            <p className="text-muted-foreground mb-10">Everyone tracks mentions. Tracque is the only one that adds SEO, deep recommendations, and revenue attribution — the full path from AI answer to closed deal.</p>
          </Reveal>
          <Reveal className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pr-6 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Feature</th>
                  {[
                    { name: 'Tracque', price: 'from $249', hl: true },
                    { name: 'Profound', price: '$399', hl: false },
                    { name: 'HeyAmos', price: '$99', hl: false },
                    { name: 'Peec', price: '$150', hl: false },
                  ].map(({ name, price, hl }) => (
                    <th key={name} className={`py-3 text-center ${hl ? 'bg-primary/10 rounded-t-lg' : ''}`}>
                      <p className={`text-[13px] font-bold ${hl ? 'text-primary' : 'text-foreground'}`}>{name}</p>
                      <p className={`font-mono text-[11px] mt-0.5 ${hl ? 'text-primary' : 'text-muted-foreground'}`}>{price}/mo</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompRow feature="AI visibility tracking" tracque={true} profound={true} heyamos={true} peec={true} />
                <CompRow feature="SEO rank tracking" tracque={true} profound={false} heyamos={false} peec={false} />
                <CompRow feature="Unlimited prompts" tracque={true} profound={true} heyamos={false} peec={false} />
                <CompRow feature="All 5 AI models" tracque={true} profound={true} heyamos={'Pro only'} peec={'Starter: 1'} />
                <CompRow feature="Confidence scoring" tracque={true} profound={false} heyamos={false} peec={false} />
                <CompRow feature="Revenue attribution" tracque={true} profound={false} heyamos={false} peec={false} />
                <CompRow feature="UTM tracking" tracque={true} profound={false} heyamos={false} peec={false} />
                <CompRow feature="GA4 integration" tracque={true} profound={false} heyamos={false} peec={false} />
                <CompRow feature="Prompt discovery" tracque={true} profound={true} heyamos={false} peec={false} />
                <CompRow feature="Deep recommendations" tracque={true} profound={'Basic'} heyamos={'5/week'} peec={'Basic'} />
                <CompRow feature="Site audit + GA4 setup" tracque={true} profound={false} heyamos={false} peec={false} />
                <CompRow feature="AI bot traffic tracking" tracque={true} profound={true} heyamos={false} peec={false} />
                <CompRow feature="Free tier" tracque={true} profound={false} heyamos={false} peec={false} />
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <Reveal>
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="text-[32px] font-display font-bold tracking-tight mb-3">Priced for proof, not vanity scores.</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl">The only platform that ties AI visibility to revenue. Built for teams that report to a CFO, not a dashboard. Start free, upgrade when you need the receipts.</p>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Reveal delay={0}><PricingCard name="Free" price="$0" desc="See your scores, no card" features={['1 brand', '10 prompts', '2 AI models', 'Weekly scans', 'Basic recommendations']} cta="Start free" /></Reveal>
          <Reveal delay={80}><PricingCard name="Starter" price="$249" period="/mo" desc="For growing brands" features={['3 brands', '25 prompts', 'All 5 AI models', 'Daily scans', 'SEO rank tracking', 'Deep recommendations']} cta="Start Starter" /></Reveal>
          <Reveal delay={160}><PricingCard name="Pro" price="$599" period="/mo" desc="For marketing teams" features={['10 brands', '100 prompts', 'All 5 AI models', 'Revenue attribution', 'GA4 + UTM tracking', 'Site audit', 'Content generation']} cta="Start Pro" highlighted /></Reveal>
          <Reveal delay={240}><PricingCard name="Agency" price="$1,499" period="/mo" desc="For agencies & teams" features={['Unlimited brands', 'Unlimited prompts', 'White-label reports', 'Client workspaces', 'API access', 'Priority support']} cta="Start Agency" /></Reveal>
        </div>
        {/* Enterprise strip */}
        <Reveal>
          <div className="mt-4 rounded-2xl border border-border bg-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-1">Enterprise</span>
              <div>
                <p className="font-semibold text-[16px] mb-1">Custom — for brands that live or die by AI search.</p>
                <p className="text-[13px] text-muted-foreground max-w-xl leading-relaxed">SSO &amp; SAML, custom scan volume, real frontend capture across every engine, security review, dedicated strategist, and an SLA. Everything in Agency, built around your stack.</p>
              </div>
            </div>
            <Link to="/auth" className="shrink-0 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-[14px] font-semibold hover:bg-primary/90 transition-colors">
              Talk to sales <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
        <p className="text-center font-mono text-[11px] text-muted-foreground mt-8">14-day trial on paid plans · cancel anytime · the only tool that proves AI mentions turned into revenue — at any price</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-card border-y border-border py-24">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          <Reveal>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-[32px] font-display font-bold tracking-tight mb-8">Common questions.</h2>
          </Reveal>
          <div className="space-y-2.5">
            {[
              { q: 'How does Tracque track AI visibility?', a: 'We query the AI engines (ChatGPT, Perplexity, Gemini, Claude, Grok) with your keywords daily, run each query multiple times to build statistical confidence, parse responses for brand mentions, sentiment, position, and cited sources — then store everything historically so you see trends over time.' },
              { q: 'How is this different from Profound or HeyAmos?', a: "Those tools stop at visibility scores. Tracque closes the full loop — AI mention → UTM capture → GA4 conversion → revenue. We're also the only tool combining AI visibility with traditional SEO ranking. We're priced as a premium platform because we replace a stack of point tools and tie everything to dollars — the proof your competitors can't show at any price." },
              { q: 'What is GEO / AEO?', a: 'GEO (Generative Engine Optimization) is making your brand more likely to be cited and recommended by AI engines. AEO (Answer Engine Optimization) focuses on getting chosen as the direct answer. Both matter more as AI handles the buyer research journey.' },
              { q: 'How does revenue attribution work?', a: 'When someone clicks from an AI engine, they arrive with a referrer (perplexity.ai, chat.openai.com) or UTM parameters. Tracque captures these via GA4 and a lightweight snippet, then connects them to conversion events and Stripe revenue — so you see exactly which engine drove which customers.' },
              { q: 'Is it accurate? AI responses vary every time.', a: "Exactly why we run 3–5 queries per keyword per model per day and report confidence scores, not single snapshots. An 80% mention rate means your brand appeared in 4 of 5 runs. We show the interval, not fake precision." },
              { q: 'Do I need technical knowledge to set it up?', a: 'No. Add your brand, add keywords, click Run Scan. The Site Audit generates your GA4 setup automatically — you import one JSON file into Google Tag Manager. Most customers see real data within 30 minutes.' },
              { q: 'API vs the real chat interface?', a: "We use web-grounded API calls where available (Perplexity online, Gemini with Search grounding, ChatGPT web search) which closely match the real interfaces, and we're building real frontend capture for the highest-fidelity surfaces. We're transparent: directional intelligence, not a census of every conversation." },
            ].map(({ q, a }) => <Accordion key={q} question={q} answer={a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <Reveal>
          <div className="relative bg-ink border border-border rounded-3xl px-8 py-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-[0.12]" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[560px] h-[400px] rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-[36px] font-display font-bold tracking-tight text-white mb-4">Start tracking what actually matters.</h2>
              <p className="text-white/55 mb-8 max-w-xl mx-auto text-[16px]">AI search is where your next customer starts their research. Know if you're there — and prove it drove revenue.</p>
              <Link to="/auth" className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-[15px]">
                Start free today <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="font-mono text-[11px] text-white/40 mt-4">free plan · no credit card · live in 5 min</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Mark className="w-6 h-6" />
            <span className="text-[15px] font-display font-bold">Tracque</span>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">© 2026 Tracque · AI visibility + SEO + attribution</p>
          <div className="flex gap-5">
            {[['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, to]) => <Link key={l} to={to} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">{l}</Link>)}
          </div>
        </div>
      </footer>
    </div>
  )
}
