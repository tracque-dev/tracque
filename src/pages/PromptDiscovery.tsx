import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Plus, TrendingUp, Search, MessageSquare, BarChart2, Globe, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { useAddKeyword } from '../lib/hooks'
import { USER_ID } from '../lib/hooks'

const SOURCE_META: Record<string, { label: string; icon: typeof Sparkles; color: string; desc: string }> = {
  people_also_ask:    { label: 'People Also Ask', icon: Search,        color: 'text-blue-600 bg-blue-50',    desc: 'Real Google questions' },
  autocomplete:       { label: 'Autocomplete',    icon: Search,        color: 'text-violet-600 bg-violet-50', desc: 'Google suggestions' },
  perplexity_related: { label: 'Perplexity AI',   icon: Sparkles,      color: 'text-emerald-600 bg-emerald-50', desc: 'AI-related questions' },
  google_trends:      { label: 'Trending',        icon: TrendingUp,    color: 'text-amber-600 bg-amber-50',  desc: 'Rising queries' },
  reddit:             { label: 'Reddit',          icon: MessageSquare, color: 'text-orange-600 bg-orange-50', desc: 'Real user questions' },
  gsc:                { label: 'Your Site',       icon: BarChart2,     color: 'text-pink-600 bg-pink-50',    desc: 'Your actual traffic' },
}

export default function PromptDiscovery() {
  const qc = useQueryClient()
  const addKeyword = useAddKeyword()
  const [seeds, setSeeds] = useState('')
  const [activeSource, setActiveSource] = useState<string | null>(null)

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['discovered_prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discovered_prompts')
        .select('*')
        .eq('user_id', USER_ID)
        .order('estimated_volume', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const discover = useMutation({
    mutationFn: async (seedKeywords: string[]) => {
      const { data, error } = await supabase.functions.invoke('discover-prompts', {
        body: { user_id: USER_ID, seed_keywords: seedKeywords },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discovered_prompts'] }),
  })

  const syncGSC = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-gsc', {
        body: { user_id: USER_ID },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discovered_prompts'] }),
  })

  async function addToKeywords(phrase: string, promptId: string) {
    await addKeyword.mutateAsync({ phrase, intent: 'commercial' })
    await supabase.from('discovered_prompts').update({ already_tracked: true }).eq('id', promptId)
    qc.invalidateQueries({ queryKey: ['discovered_prompts'] })
  }

  const filtered = activeSource ? prompts.filter((p: any) => p.source === activeSource) : prompts
  const sources = [...new Set(prompts.map((p: any) => p.source as string))]

  const sourceCounts = sources.reduce((acc, s) => ({
    ...acc,
    [s]: prompts.filter((p: any) => p.source === s).length,
  }), {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Prompt Discovery</h1>
            <p className="text-xs text-muted-foreground">Real questions people ask AI — sourced from Google, Perplexity, Reddit</p>
          </div>
        </div>
        <button
          onClick={() => syncGSC.mutate()}
          disabled={syncGSC.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-50 transition-colors"
        >
          {syncGSC.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
          Sync Google Search Console
        </button>
      </div>

      {/* Discover form */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card space-y-3">
        <p className="text-sm font-semibold">Discover prompts for your industry</p>
        <p className="text-xs text-muted-foreground">Enter 1–5 seed keywords. Tracque pulls real questions from Google PAA, autocomplete, Perplexity, Reddit, and Google Trends.</p>
        <div className="flex gap-3">
          <input
            className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
            placeholder="e.g. project management software, CRM tools, email marketing"
            value={seeds}
            onChange={e => setSeeds(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && discover.mutate(seeds.split(',').map(s => s.trim()).filter(Boolean))}
          />
          <button
            onClick={() => discover.mutate(seeds.split(',').map(s => s.trim()).filter(Boolean))}
            disabled={discover.isPending || !seeds.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {discover.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Discovering…</> : <><RefreshCw className="w-3.5 h-3.5" /> Discover</>}
          </button>
        </div>
        {discover.isSuccess && (
          <p className="text-xs text-emerald-600 font-medium">
            Found {(discover.data as any)?.total_discovered} prompts across {Object.keys((discover.data as any)?.sources ?? {}).length} sources
          </p>
        )}
      </div>

      {/* Source filter pills */}
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSource(null)}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${!activeSource ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
          >
            All ({prompts.length})
          </button>
          {sources.map(source => {
            const meta = SOURCE_META[source]
            const Icon = meta?.icon ?? Sparkles
            return (
              <button
                key={source}
                onClick={() => setActiveSource(activeSource === source ? null : source)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium transition-colors ${activeSource === source ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
              >
                <Icon className="w-3 h-3" />
                {meta?.label ?? source} ({sourceCounts[source]})
              </button>
            )
          })}
        </div>
      )}

      {/* Prompts table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No prompts discovered yet</p>
          <p className="text-xs mt-1">Enter seed keywords above to find real questions people ask AI</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {filtered.length} prompts discovered
            </p>
            <p className="text-xs text-muted-foreground">Click + to add to your tracked keywords</p>
          </div>
          <div className="divide-y divide-border">
            {filtered.slice(0, 100).map((prompt: any) => {
              const meta = SOURCE_META[prompt.source]
              const Icon = meta?.icon ?? Sparkles
              return (
                <div key={prompt.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta?.color ?? 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{prompt.phrase}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta?.desc ?? prompt.source}</p>
                  </div>
                  {prompt.estimated_volume > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-foreground">{prompt.estimated_volume.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">vol</p>
                    </div>
                  )}
                  {prompt.trend_score > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">{Math.round(prompt.trend_score * 100)}%</span>
                    </div>
                  )}
                  {prompt.already_tracked ? (
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded shrink-0">Tracking</span>
                  ) : (
                    <button
                      onClick={() => addToKeywords(prompt.phrase, prompt.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors shrink-0 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Track
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
