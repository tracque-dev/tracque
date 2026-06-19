import { useState } from 'react'
import { Key, Bell, RefreshCw, CheckCircle2 } from 'lucide-react'

const AI_MODELS = [
  { id: 'openai', label: 'ChatGPT (GPT-4o)', envKey: 'OPENAI_API_KEY', connected: false },
  { id: 'perplexity', label: 'Perplexity', envKey: 'PERPLEXITY_API_KEY', connected: false },
  { id: 'gemini', label: 'Google Gemini', envKey: 'GEMINI_API_KEY', connected: false },
  { id: 'anthropic', label: 'Claude (Anthropic)', envKey: 'ANTHROPIC_API_KEY', connected: false },
  { id: 'grok', label: 'Grok (xAI)', envKey: 'XAI_API_KEY', connected: false },
]

export default function Settings() {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [serpKey, setSerpKey] = useState('')
  const [scanFreq, setScanFreq] = useState('daily')
  const [saved, setSaved] = useState(false)

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-blue-600">Account</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">API keys and scan preferences</p>
        </div>
        <button
          onClick={save}
          className={`px-4 py-2.5 text-sm rounded-xl font-medium transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-foreground text-background hover:opacity-90'}`}
        >
          {saved ? 'Saved' : 'Save settings'}
        </button>
      </div>

      {/* AI API Keys */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Key className="w-4 h-4 text-muted-foreground" />
          <p className="eyebrow text-muted-foreground">AI model API keys</p>
        </div>
        <div className="divide-y divide-border">
          {AI_MODELS.map(model => (
            <div key={model.id} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">{model.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{model.envKey}</p>
              </div>
              <input
                type="password"
                placeholder="sk-..."
                value={keys[model.id] ?? ''}
                onChange={e => setKeys(k => ({ ...k, [model.id]: e.target.value }))}
                className="w-56 text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background font-mono"
              />
              {keys[model.id] ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SEO API Key */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Key className="w-4 h-4 text-muted-foreground" />
          <p className="eyebrow text-muted-foreground">SEO data</p>
        </div>
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">SerpAPI</p>
            <p className="text-xs text-muted-foreground">For Google rank tracking · ~$50/mo for 5k searches</p>
          </div>
          <input
            type="password"
            placeholder="serpapi key..."
            value={serpKey}
            onChange={e => setSerpKey(e.target.value)}
            className="w-56 text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background font-mono"
          />
          {serpKey ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0" />}
        </div>
      </div>

      {/* Scan frequency */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
          <p className="eyebrow text-muted-foreground">Scan frequency</p>
        </div>
        <div className="px-5 py-4 flex gap-3">
          {['hourly', 'daily', 'weekly'].map(f => (
            <button
              key={f}
              onClick={() => setScanFreq(f)}
              className={`px-4 py-2 text-sm rounded-xl border font-medium capitalize transition-colors ${
                scanFreq === f ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="px-5 pb-4">
          <p className="text-xs text-muted-foreground">
            {scanFreq === 'hourly' && 'Runs every hour. Higher API cost — recommended for Enterprise.'}
            {scanFreq === 'daily' && 'Runs once per day at 6am UTC. Best for most teams.'}
            {scanFreq === 'weekly' && 'Runs every Monday. Lowest cost — good for small brands.'}
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <p className="eyebrow text-muted-foreground">Notifications</p>
        </div>
        <div className="px-5 py-4 space-y-2">
          {['Alert when mention rate drops >10%', 'Alert when competitor overtakes you in AI', 'Weekly summary email'].map(label => (
            <label key={label} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
