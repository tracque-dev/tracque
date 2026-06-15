import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Zap, RefreshCw, Loader2, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, Copy, Check, TrendingUp,
  Star, ArrowRight
} from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { useBrands, USER_ID } from '../lib/hooks'

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  citation_source:  { label: 'Citation Source',   color: 'bg-violet-50 text-violet-700' },
  content_gap:      { label: 'Content Gap',        color: 'bg-violet-50 text-violet-700' },
  competitor_gap:   { label: 'Competitor Gap',     color: 'bg-muted text-foreground' },
  site_structure:   { label: 'Site Structure',     color: 'bg-muted text-foreground' },
  review_platform:  { label: 'Review Platform',    color: 'bg-muted text-foreground' },
  community:        { label: 'Community',          color: 'bg-muted text-foreground' },
  pr_coverage:      { label: 'PR Coverage',        color: 'bg-muted text-foreground' },
  keyword_coverage: { label: 'Keyword Coverage',   color: 'bg-muted text-foreground' },
}

const EFFORT_META: Record<string, { label: string; color: string }> = {
  low:    { label: 'Low effort',    color: 'text-emerald-600' },
  medium: { label: 'Medium effort', color: 'text-amber-600' },
  high:   { label: 'High effort',   color: 'text-red-500' },
}

function ImpactBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm ${
              i < score
                ? score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-400' : 'bg-red-400'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-foreground">{score}/10</span>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded-md hover:bg-muted hover:text-foreground transition-colors text-muted-foreground"
    >
      {copied ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  )
}

function RecommendationCard({ rec, onStatusChange }: {
  rec: any
  onStatusChange: (id: string, status: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const catMeta = CATEGORY_META[rec.category] ?? { label: rec.category, color: 'bg-muted text-muted-foreground' }
  const effortMeta = EFFORT_META[rec.effort] ?? { label: rec.effort, color: 'text-muted-foreground' }

  const borderColor = rec.impact_score >= 8 ? 'border-l-emerald-500' :
    rec.impact_score >= 5 ? 'border-l-amber-400' : 'border-l-red-400'

  return (
    <div className={`bg-card rounded-2xl border border-border border-l-4 ${borderColor} shadow-card ${
      rec.status === 'done' ? 'opacity-60' : ''
    }`}>
      {/* Header */}
      <div
        className="px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-3">
          {/* Priority rank */}
          <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-display font-bold nums text-foreground">#{rec.priority_rank}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${catMeta.color}`}>
                {catMeta.label}
              </span>
              <span className={`text-xs font-medium ${effortMeta.color}`}>
                {effortMeta.label}
              </span>
              {rec.status === 'done' && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Done
                </span>
              )}
              {rec.status === 'in_progress' && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Clock className="w-3 h-3" /> In progress
                </span>
              )}
            </div>
            <p className="text-sm font-display font-semibold text-foreground">{rec.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rec.why}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ImpactBar score={rec.impact_score} />
            {expanded
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          {/* Why */}
          <div>
            <p className="eyebrow text-muted-foreground mb-1.5">Why this matters</p>
            <p className="text-sm text-foreground">{rec.why}</p>
          </div>

          {/* Data evidence chips */}
          {rec.data_evidence && Object.keys(rec.data_evidence).some(k => rec.data_evidence[k] != null) && (
            <div className="flex flex-wrap gap-2">
              {rec.data_evidence.current_rate != null && (
                <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-md font-medium nums">
                  Current: {rec.data_evidence.current_rate}% mention rate
                </span>
              )}
              {rec.data_evidence.competitor_rate != null && (
                <span className="text-xs px-2 py-1 bg-muted text-foreground rounded-md font-medium nums">
                  Competitor: {rec.data_evidence.competitor_rate}%
                </span>
              )}
              {rec.data_evidence.target_rate != null && (
                <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-medium nums">
                  Target: {rec.data_evidence.target_rate}%
                </span>
              )}
              {rec.data_evidence.domain && (
                <span className="text-xs px-2 py-1 bg-violet-50 text-violet-700 rounded-md font-medium">
                  {rec.data_evidence.domain}
                </span>
              )}
              {rec.data_evidence.keyword && (
                <span className="text-xs px-2 py-1 bg-muted text-foreground rounded-md font-medium">
                  "{rec.data_evidence.keyword}"
                </span>
              )}
            </div>
          )}

          {/* Specific action */}
          <div>
            <p className="eyebrow text-muted-foreground mb-1.5">Exact action</p>
            <p className="text-sm text-foreground">{rec.action}</p>
          </div>

          {/* Template */}
          {rec.template && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="eyebrow text-muted-foreground">Ready-to-use template</p>
                <CopyButton text={rec.template} />
              </div>
              <pre className="text-xs text-foreground bg-muted/50 rounded-xl p-3 whitespace-pre-wrap font-sans border border-border overflow-auto max-h-48">
                {rec.template}
              </pre>
            </div>
          )}

          {/* Expected result */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">{rec.expected_result}</p>
          </div>

          {/* Actions */}
          {rec.status !== 'done' && (
            <div className="flex gap-2">
              {rec.status === 'pending' && (
                <button
                  onClick={() => onStatusChange(rec.id, 'in_progress')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
                >
                  <ArrowRight className="w-3 h-3" /> Start working on this
                </button>
              )}
              {rec.status === 'in_progress' && (
                <button
                  onClick={() => onStatusChange(rec.id, 'done')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
                >
                  <CheckCircle2 className="w-3 h-3" /> Mark as done
                </button>
              )}
              <button
                onClick={() => onStatusChange(rec.id, 'dismissed')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <XCircle className="w-3 h-3" /> Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Recommendations() {
  const qc = useQueryClient()
  const { data: brands = [] } = useBrands()
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  const activeBrandId = selectedBrandId || brands.find(b => b.type === 'own')?.id || brands[0]?.id

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations', activeBrandId, statusFilter],
    queryFn: async () => {
      if (!activeBrandId) return []
      let q = supabase
        .from('recommendations')
        .select('*')
        .eq('brand_id', activeBrandId)
        .order('priority_rank', { ascending: true })
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data, error } = await q
      if (error) throw error
      return data
    },
    enabled: !!activeBrandId,
  })

  const generate = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error('No brand selected')
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { user_id: USER_ID, brand_id: activeBrandId },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('recommendations')
        .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  })

  const doneCount = recommendations.filter(r => r.status === 'done').length
  const inProgressCount = recommendations.filter(r => r.status === 'in_progress').length

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-violet-600">Actions</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">Recommendations</h1>
          <p className="text-sm text-muted-foreground mt-1">Specific actions to improve your AI visibility — ranked by impact</p>
        </div>
        <div className="flex items-center gap-2">
          {brands.length > 1 && (
            <select
              className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-500"
              value={activeBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
            >
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending || !activeBrandId}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-foreground text-background rounded-xl font-medium hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {generate.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
              : <><RefreshCw className="w-4 h-4" /> Generate</>}
          </button>
        </div>
      </div>

      {/* Progress summary */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <p className="text-3xl font-display font-bold nums tracking-tight">{recommendations.length}</p>
            <p className="eyebrow text-muted-foreground mt-1">Total recommendations</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <p className="text-3xl font-display font-bold nums tracking-tight text-amber-600">{inProgressCount}</p>
            <p className="eyebrow text-muted-foreground mt-1">In progress</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-display font-bold nums tracking-tight text-emerald-600">{doneCount}</p>
              {doneCount > 0 && <Star className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="eyebrow text-muted-foreground mt-1">Completed</p>
          </div>
        </div>
      )}

      {/* Status filter */}
      {recommendations.length > 0 && (
        <div className="flex gap-2">
          {[
            { value: 'pending', label: 'To do' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'done', label: 'Done' },
            { value: 'all', label: 'All' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Empty / loading states */}
      {!activeBrandId ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-card">
          <p className="text-base font-display font-semibold mb-1">No brands yet</p>
          <p className="text-sm text-muted-foreground">Add a brand first, then run scans to generate recommendations</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-card">
          <p className="text-base font-display font-semibold mb-1">No recommendations yet</p>
          <p className="text-sm text-muted-foreground mb-5">Run at least one scan, then click Generate to get specific actions ranked by impact</p>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-40 mx-auto"
          >
            {generate.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your data…</>
              : <><Zap className="w-4 h-4" /> Generate Recommendations</>}
          </button>
          {generate.isPending && (
            <p className="text-xs text-muted-foreground mt-3">
              Claude is analyzing your scan results, citations, competitor gaps, and SEO data…
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map(rec => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
