import { useState } from 'react'
import { Hash, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react'
import { useKeywords, useAddKeyword, useDeleteKeyword } from '../lib/hooks'

const SUGGESTED = [
  'best task management app',
  'team collaboration tools',
  'project tracking software',
  'agile project management',
  'remote work tools 2025',
]

const INTENT_COLORS: Record<string, string> = {
  commercial: 'bg-violet-50 text-violet-700',
  informational: 'bg-muted text-foreground',
  navigational: 'bg-amber-50 text-amber-700',
}

export default function Keywords() {
  const { data: keywords = [], isLoading } = useKeywords()
  const addKeyword = useAddKeyword()
  const deleteKeyword = useDeleteKeyword()
  const [showAdd, setShowAdd] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [intent, setIntent] = useState<'commercial' | 'informational' | 'navigational'>('commercial')

  async function handleAdd(kw: string) {
    if (!kw.trim()) return
    await addKeyword.mutateAsync({ phrase: kw.trim(), intent })
    setPhrase('')
    setShowAdd(false)
  }

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-violet-600">Tracking</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">Keywords</h1>
          <p className="text-sm text-muted-foreground mt-1">Phrases tracked across AI models and Google</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-all"
        >
          <Plus className="w-4 h-4" /> Add keyword
        </button>
      </div>

      {/* Suggested */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <p className="eyebrow text-muted-foreground">Suggested keywords</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.filter(s => !keywords.find(k => k.phrase === s)).map(s => (
            <button
              key={s}
              onClick={() => handleAdd(s)}
              className="text-xs px-2.5 py-1 border border-dashed border-border rounded-md text-muted-foreground hover:border-violet-600 hover:text-violet-600 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-3">
          <p className="text-sm font-display font-semibold">Add keyword</p>
          <div className="flex gap-3">
            <input
              autoFocus
              className="flex-1 text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-background"
              placeholder="best project management software"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd(phrase)}
            />
            <select
              className="text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-background"
              value={intent}
              onChange={e => setIntent(e.target.value as typeof intent)}
            >
              <option value="commercial">Commercial</option>
              <option value="informational">Informational</option>
              <option value="navigational">Navigational</option>
            </select>
            <button
              onClick={() => handleAdd(phrase)}
              disabled={addKeyword.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
            >
              {addKeyword.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Keywords table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : keywords.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-card text-muted-foreground">
          <Hash className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-base font-display font-semibold text-foreground">No keywords yet</p>
          <p className="text-sm mt-1">Add keywords to track across AI models and Google</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Keyword', 'Intent', 'Added', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr key={kw.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium">{kw.phrase}</td>
                  <td className="px-5 py-3">
                    {kw.intent && (
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${INTENT_COLORS[kw.intent]}`}>{kw.intent}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm nums text-muted-foreground">
                    {new Date(kw.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => deleteKeyword.mutate(kw.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
