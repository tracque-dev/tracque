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
  return <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7B5BF5] mb-4">{children}</p>
}

// ── Hero product mock (the money shot) ─────────────────────
const MODELS = [
  { name: 'ChatGPT',    dot: '#10A37F', rate: 82 },
  { name: 'Claude',     dot: '#D97757', rate: 90 },
  { name: 'Perplexity', dot: '#20808D', rate: 74 },
  { name: 'Gemini',     dot: '#4285F4', rate: 61 },
  { name: 'Grok',       dot: '#0A0A0A', rate: 48 },
]

function HeroVisual() {
  return (
    <div className="relative">
      {/* main panel */}
      <div className="relative rounded-2xl border border-[#E6E4F2] bg-white shadow-[0_24px_60px_-20px_rgba(10,10,10,0.22)] overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center justify-between px-4 h-11 border-b border-[#EEEDF8] bg-[#FBFAFE]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E6E4F2]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E6E4F2]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E6E4F2]" />
          </div>
          <span className="font-mono text-[11px] text-[#8C8AA3]">tracque.com/app</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-600">live</span>
          </div>
        </div>

        {/* body */}
        <div className="p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-[13px] font-semibold text-[#0A0A0A]">Brand visibility</p>
              <p className="font-mono text-[11px] text-[#8C8AA3]">“best geo testing tool”</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-emerald-600 nums">+18%</p>
              <p className="font-mono text-[10px] text-[#8C8AA3]">7-day</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {MODELS.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.dot }} />
                <span className="text-[12px] text-[#5B5772] w-20 shrink-0">{m.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[#EEEDF8] overflow-hidden">
                  <div
                    className="h-full rounded-full origin-left"
                    style={{
                      width: `${m.rate}%`,
                      background: 'linear-gradient(90deg,#7B5BF5,#7C3AED)',
                      animation: `bar-grow 0.9s ${0.2 + i * 0.1}s cubic-bezier(0.16,1,0.3,1) both`,
                    }}
                  />
                </div>
                <span className="font-mono text-[12px] text-[#0A0A0A] nums w-9 text-right">{m.rate}%</span>
              </div>
            ))}
          </div>

          {/* attribution strip */}
          <div className="mt-5 pt-4 border-t border-[#EEEDF8] flex items-center gap-2 flex-wrap font-mono text-[10.5px] text-[#8C8AA3]">
            {['1,204 clicks', '38 signups', '$48,210'].map((s, i, a) => (
              <span key={s} className="flex items-center gap-2">
                <span className={i === a.length - 1 ? 'text-emerald-600 font-semibold' : ''}>{s}</span>
                {i < a.length - 1 && <ArrowRight className="w-3 h-3 text-[#D5D2E4]" />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* floating accent card */}
      <div className="hidden sm:block absolute -right-5 -bottom-6 rounded-xl border border-[#E6E4F2] bg-white shadow-[0_16px_40px_-12px_rgba(10,10,10,0.25)] px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#8C8AA3] mb-0.5">Revenue from AI</p>
        <p className="text-lg font-bold text-[#0A0A0A] nums">$48.2k<span className="text-emerald-600 text-xs font-semibold ml-1.5">▲</span></p>
      </div>
    </div>
  )
}

// ── Accordion ─────────────────────────────────────────────
function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#E6E4F2] rounded-xl overflow-hidden bg-white transition-colors hover:border-[#D5D2E4]">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-[15px] font-medium text-[#0A0A0A] pr-8">{question}</span>
        <ChevronDown className={`w-4 h-4 text-[#8C8AA3] shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[14px] text-[#5B5772] leading-relaxed">{answer}</p>
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
      highlighted ? 'bg-ink text-white shadow-[0_24px_50px_-20px_rgba(10,10,10,0.5)]' : 'bg-white border border-[#E6E4F2] text-[#0A0A0A]'
    }`}>
      {highlighted && <span className="self-start font-mono text-[10px] uppercase tracking-wider bg-white/10 text-white px-2 py-1 rounded-md mb-4">Most popular</span>}
      <p className={`font-mono text-[11px] uppercase tracking-[0.16em] mb-3 ${highlighted ? 'text-white/50' : 'text-[#8C8AA3]'}`}>{name}</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-4xl font-display font-bold tracking-tight nums">{price}</span>
        {period && <span className={`text-sm ${highlighted ? 'text-white/50' : 'text-[#8C8AA3]'}`}>{period}</span>}
      </div>
      <p className={`text-[13px] mb-6 ${highlighted ? 'text-white/50' : 'text-[#8C8AA3]'}`}>{desc}</p>
      <ul className="space-y-2.5 flex-1 mb-6">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? 'text-[#7B5BF5]' : 'text-[#0A0A0A]'}`} />
            <span className={`text-[13px] ${highlighted ? 'text-white/75' : 'text-[#5B5772]'}`}>{f}</span>
          </li>
        ))}
      </ul>
      <Link to="/auth" className={`w-full py-2.5 rounded-lg text-[13px] font-semibold text-center transition-colors ${
        highlighted ? 'bg-white text-[#0A0A0A] hover:bg-[#E9E7F3]' : 'bg-ink text-white hover:bg-[#262626]'
      }`}>{cta}</Link>
    </div>
  )
}

// ── Comparison row ─────────────────────────────────────────
function CompRow({ feature, tracque, profound, heyamos, peec }: {
  feature: string; tracque: boolean | string; profound: boolean | string; heyamos: boolean | string; peec: boolean | string
}) {
  function Cell({ val, hl = false }: { val: boolean | string; hl?: boolean }) {
    if (val === true) return <Check className={`w-4 h-4 mx-auto ${hl ? 'text-[#7B5BF5]' : 'text-[#0A0A0A]'}`} />
    if (val === false) return <span className="text-[#D5D2E4] mx-auto block text-center">—</span>
    return <span className="font-mono text-[11px] text-[#5B5772] text-center block">{val}</span>
  }
  return (
    <tr className="border-b border-[#EEEDF8]">
      <td className="py-3.5 pr-6 text-[13px] text-[#0A0A0A]">{feature}</td>
      <td className="py-3.5 text-center bg-[#F3F1FE]"><Cell val={tracque} hl /></td>
      <td className="py-3.5 text-center"><Cell val={profound} /></td>
      <td className="py-3.5 text-center"><Cell val={heyamos} /></td>
      <td className="py-3.5 text-center"><Cell val={peec} /></td>
    </tr>
  )
}

// ── Main ───────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAFAFE] text-[#0A0A0A] antialiased">

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FAFAFE]/80 border-b border-[#E6E4F2]/70">
        <div className="flex items-center justify-between px-6 lg:px-8 h-16 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="text-[17px] font-display font-bold tracking-tight">Tracque</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Compare', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[13px] text-[#5B5772] hover:text-[#0A0A0A] transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-[13px] text-[#5B5772] hover:text-[#0A0A0A] px-3 py-2">Log in</Link>
            <Link to="/auth" className="text-[13px] bg-ink text-white px-4 py-2 rounded-lg font-medium hover:bg-[#262626] transition-colors">Start free</Link>
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E6E4F2] rounded-full text-[12px] text-[#5B5772] mb-7 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AI visibility · SEO · revenue attribution
              </div>
              <h1 className="text-[44px] md:text-[56px] font-display font-bold leading-[1.04] tracking-[-0.035em] mb-6">
                See your brand in<br />
                <span className="bg-gradient-to-r from-[#7B5BF5] to-[#7C3AED] bg-clip-text text-transparent">every AI answer.</span><br />
                Prove what it earns.
              </h1>
              <p className="text-[17px] text-[#5B5772] max-w-md mb-8 leading-relaxed">
                Tracque shows whether ChatGPT, Perplexity, Gemini, Claude, and Grok recommend your brand —
                then traces every mention through to clicks, signups, and revenue.
              </p>
              <div className="flex items-center gap-3">
                <Link to="/auth" className="group flex items-center gap-2 bg-ink text-white px-5 py-3 rounded-lg text-[14px] font-semibold hover:bg-[#262626] transition-colors">
                  Start for free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a href="#compare" className="px-5 py-3 rounded-lg border border-[#E6E4F2] bg-white text-[14px] font-medium text-[#5B5772] hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors">
                  Compare vs Profound
                </a>
              </div>
              <p className="font-mono text-[11px] text-[#8C8AA3] mt-4">free plan · no credit card · live in 5 min</p>
            </Reveal>
          </div>
          <Reveal delay={120} className="lg:pl-4">
            <HeroVisual />
          </Reveal>
        </div>

        {/* trust strip */}
        <div className="relative border-t border-[#E6E4F2] bg-white/60">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-5 flex items-center gap-6 flex-wrap justify-center">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#8C8AA3]">Tracks across</span>
            {['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Grok', 'Google AI Overviews'].map(n => (
              <span key={n} className="text-[14px] font-semibold text-[#5B5772]">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-[#E6E4F2] bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-[#EEEDF8]">
          {[
            { val: '5', label: 'AI engines tracked' },
            { val: '40–60%', label: 'monthly citation drift' },
            { val: '1', label: 'tool that proves revenue' },
            { val: '100%', label: 'attribution coverage' },
          ].map(({ val, label }) => (
            <div key={label} className="py-8 px-4 text-center">
              <p className="text-3xl font-display font-bold tracking-tight nums">{val}</p>
              <p className="font-mono text-[11px] text-[#8C8AA3] mt-1.5 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-[32px] font-display font-bold tracking-tight mb-3 max-w-xl">From AI mention to revenue — one continuous loop.</h2>
          <p className="text-[#5B5772] max-w-lg mb-14">Three moves, fully instrumented. No spreadsheets, no guesswork about whether AI search is actually working.</p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-px bg-[#E6E4F2] rounded-2xl overflow-hidden border border-[#E6E4F2]">
          {[
            { step: '01', icon: Bot, title: 'Track', desc: 'We query every AI engine daily with your keywords — multiple runs each for statistical confidence. See exactly where you appear, at what position, with what sentiment vs competitors.' },
            { step: '02', icon: Zap, title: 'Act', desc: 'Get ranked recommendations with ready-to-paste templates. Not "improve your content" — the exact Reddit thread to answer, the G2 reviews to get, the page to rewrite.' },
            { step: '03', icon: DollarSign, title: 'Measure', desc: 'Every mention traced to a session, every session to a conversion, every conversion to revenue. See which engine drives your highest-value customers — not just clicks.' },
          ].map(({ step, icon: Icon, title, desc }, i) => (
            <Reveal key={step} delay={i * 100} className="bg-white p-7">
              <div className="flex items-center justify-between mb-5">
                <Icon className="w-5 h-5 text-[#0A0A0A]" strokeWidth={1.75} />
                <span className="font-mono text-[12px] text-[#D5D2E4]">{step}</span>
              </div>
              <p className="font-semibold text-lg mb-2">{title}</p>
              <p className="text-[14px] text-[#5B5772] leading-relaxed">{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white border-y border-[#E6E4F2] py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <Reveal>
            <Eyebrow>Features</Eyebrow>
            <h2 className="text-[32px] font-display font-bold tracking-tight mb-14">Everything in one platform.</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#EEEDF8] border border-[#EEEDF8] rounded-2xl overflow-hidden">
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
              <Reveal key={title} delay={(i % 4) * 80} className="group bg-white p-6 hover:bg-[#FBFAFE] transition-colors">
                <Icon className="w-5 h-5 text-[#0A0A0A] mb-4 group-hover:text-[#7B5BF5] transition-colors" strokeWidth={1.75} />
                <p className="font-semibold text-[15px] mb-1.5">{title}</p>
                <p className="text-[13px] text-[#5B5772] leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The loop */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-24">
        <Reveal>
          <div className="relative bg-ink rounded-3xl p-10 md:p-14 text-white overflow-hidden">
            <div className="absolute inset-0 bg-dots opacity-[0.15]" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-[#7B5BF5]/20 blur-3xl" />
            <div className="relative text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7B5BF5] mb-4">The full loop</p>
              <h2 className="text-[32px] font-display font-bold tracking-tight mb-10">From AI question to closed deal.</h2>
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
                {['Buyer asks ChatGPT', 'You get mentioned', 'They click through', 'UTM captured', 'They convert', 'Revenue tracked'].map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-2.5">
                    <div className={`px-3.5 py-2 rounded-lg text-[13px] font-medium border ${i === arr.length - 1 ? 'bg-[#7B5BF5] border-[#7B5BF5] text-white' : 'bg-white/[0.06] border-white/10 text-white/90'}`}>{step}</div>
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
      <section id="compare" className="bg-white border-y border-[#E6E4F2] py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <Reveal>
            <Eyebrow>Compare</Eyebrow>
            <h2 className="text-[32px] font-display font-bold tracking-tight mb-2">More than monitoring.</h2>
            <p className="text-[#5B5772] mb-10">Everyone tracks mentions. Tracque is the only one that adds SEO, deep recommendations, and revenue attribution — the full path from AI answer to closed deal.</p>
          </Reveal>
          <Reveal className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E6E4F2]">
                  <th className="py-3 pr-6 text-left font-mono text-[11px] uppercase tracking-wider text-[#8C8AA3]">Feature</th>
                  {[
                    { name: 'Tracque', price: 'from $249', hl: true },
                    { name: 'Profound', price: '$399', hl: false },
                    { name: 'HeyAmos', price: '$99', hl: false },
                    { name: 'Peec', price: '$150', hl: false },
                  ].map(({ name, price, hl }) => (
                    <th key={name} className={`py-3 text-center ${hl ? 'bg-[#F3F1FE] rounded-t-lg' : ''}`}>
                      <p className={`text-[13px] font-bold ${hl ? 'text-[#7B5BF5]' : 'text-[#0A0A0A]'}`}>{name}</p>
                      <p className={`font-mono text-[11px] mt-0.5 ${hl ? 'text-[#7B5BF5]' : 'text-[#8C8AA3]'}`}>{price}/mo</p>
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
          <p className="text-[#5B5772] mb-12 max-w-2xl">The only platform that ties AI visibility to revenue. Built for teams that report to a CFO, not a dashboard. Start free, upgrade when you need the receipts.</p>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Reveal delay={0}><PricingCard name="Free" price="$0" desc="See your scores, no card" features={['1 brand', '10 prompts', '2 AI models', 'Weekly scans', 'Basic recommendations']} cta="Start free" /></Reveal>
          <Reveal delay={80}><PricingCard name="Starter" price="$249" period="/mo" desc="For growing brands" features={['3 brands', '25 prompts', 'All 5 AI models', 'Daily scans', 'SEO rank tracking', 'Deep recommendations']} cta="Start Starter" /></Reveal>
          <Reveal delay={160}><PricingCard name="Pro" price="$599" period="/mo" desc="For marketing teams" features={['10 brands', '100 prompts', 'All 5 AI models', 'Revenue attribution', 'GA4 + UTM tracking', 'Site audit', 'Content generation']} cta="Start Pro" highlighted /></Reveal>
          <Reveal delay={240}><PricingCard name="Agency" price="$1,499" period="/mo" desc="For agencies & teams" features={['Unlimited brands', 'Unlimited prompts', 'White-label reports', 'Client workspaces', 'API access', 'Priority support']} cta="Start Agency" /></Reveal>
        </div>
        {/* Enterprise strip */}
        <Reveal>
          <div className="mt-4 rounded-2xl border border-[#E6E4F2] bg-white p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#8C8AA3] mt-1">Enterprise</span>
              <div>
                <p className="font-semibold text-[16px] mb-1">Custom — for brands that live or die by AI search.</p>
                <p className="text-[13px] text-[#5B5772] max-w-xl leading-relaxed">SSO &amp; SAML, custom scan volume, real frontend capture across every engine, security review, dedicated strategist, and an SLA. Everything in Agency, built around your stack.</p>
              </div>
            </div>
            <Link to="/auth" className="shrink-0 inline-flex items-center justify-center gap-2 bg-ink text-white px-6 py-3 rounded-lg text-[14px] font-semibold hover:bg-[#262626] transition-colors">
              Talk to sales <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
        <p className="text-center font-mono text-[11px] text-[#8C8AA3] mt-8">14-day trial on paid plans · cancel anytime · the only tool that proves AI mentions turned into revenue — at any price</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white border-y border-[#E6E4F2] py-24">
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
          <div className="relative bg-ink rounded-3xl px-8 py-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-[0.12]" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[560px] h-[400px] rounded-full bg-[#7C3AED]/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-[36px] font-display font-bold tracking-tight text-white mb-4">Start tracking what actually matters.</h2>
              <p className="text-white/55 mb-8 max-w-xl mx-auto text-[16px]">AI search is where your next customer starts their research. Know if you're there — and prove it drove revenue.</p>
              <Link to="/auth" className="group inline-flex items-center gap-2 bg-white text-[#0A0A0A] px-7 py-3.5 rounded-lg font-semibold hover:bg-[#E9E7F3] transition-colors text-[15px]">
                Start free today <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="font-mono text-[11px] text-white/40 mt-4">free plan · no credit card · live in 5 min</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E6E4F2] py-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Mark className="w-6 h-6" />
            <span className="text-[15px] font-display font-bold">Tracque</span>
          </div>
          <p className="font-mono text-[11px] text-[#8C8AA3]">© 2026 Tracque · AI visibility + SEO + attribution</p>
          <div className="flex gap-5">
            {['Privacy', 'Terms'].map(l => <a key={l} href="#" className="text-[12px] text-[#8C8AA3] hover:text-[#0A0A0A] transition-colors">{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  )
}
