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
  commercial: 'bg-blue-50 text-blue-700',
  informational: 'bg-violet-50 text-violet-700',
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Hash className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Keywords</h1>
            <p className="text-xs text-muted-foreground">Phrases tracked across AI models and Google</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add Keyword
        </button>
      </div>

      {/* Suggested */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggested Keywords</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.filter(s => !keywords.find(k => k.phrase === s)).map(s => (
            <button
              key={s}
              onClick={() => handleAdd(s)}
              className="text-xs px-2.5 py-1 border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-card space-y-3">
          <p className="text-sm font-semibold">Add keyword</p>
          <div className="flex gap-3">
            <input
              autoFocus
              className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
              placeholder="best project management software"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd(phrase)}
            />
            <select
              className="text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-medium disabled:opacity-50"
            >
              {addKeyword.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Keywords table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : keywords.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Hash className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No keywords yet</p>
          <p className="text-xs mt-1">Add keywords to track across AI models and Google</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Keyword', 'Intent', 'Added', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr key={kw.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{kw.phrase}</td>
                  <td className="px-4 py-3">
                    {kw.intent && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INTENT_COLORS[kw.intent]}`}>{kw.intent}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(kw.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteKeyword.mutate(kw.id)}
                      className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
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
