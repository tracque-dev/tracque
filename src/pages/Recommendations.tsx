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
  citation_source:  { label: 'Citation Source',   color: 'bg-blue-50 text-blue-700' },
  content_gap:      { label: 'Content Gap',        color: 'bg-violet-50 text-violet-700' },
  competitor_gap:   { label: 'Competitor Gap',     color: 'bg-red-50 text-red-700' },
  site_structure:   { label: 'Site Structure',     color: 'bg-amber-50 text-amber-700' },
  review_platform:  { label: 'Review Platform',    color: 'bg-emerald-50 text-emerald-700' },
  community:        { label: 'Community',          color: 'bg-orange-50 text-orange-700' },
  pr_coverage:      { label: 'PR Coverage',        color: 'bg-pink-50 text-pink-700' },
  keyword_coverage: { label: 'Keyword Coverage',   color: 'bg-slate-100 text-slate-700' },
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
      className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded hover:border-primary hover:text-primary transition-colors text-muted-foreground"
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
    <div className={`bg-card rounded-xl border border-border border-l-4 ${borderColor} shadow-card ${
      rec.status === 'done' ? 'opacity-60' : ''
    }`}>
      {/* Header */}
      <div
        className="px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-3">
          {/* Priority rank */}
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-muted-foreground">#{rec.priority_rank}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catMeta.color}`}>
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
            <p className="text-sm font-semibold text-foreground">{rec.title}</p>
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
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Why */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Why this matters</p>
            <p className="text-sm text-foreground">{rec.why}</p>
          </div>

          {/* Data evidence chips */}
          {rec.data_evidence && Object.keys(rec.data_evidence).some(k => rec.data_evidence[k] != null) && (
            <div className="flex flex-wrap gap-2">
              {rec.data_evidence.current_rate != null && (
                <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-lg font-medium">
                  Current: {rec.data_evidence.current_rate}% mention rate
                </span>
              )}
              {rec.data_evidence.competitor_rate != null && (
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  Competitor: {rec.data_evidence.competitor_rate}%
                </span>
              )}
              {rec.data_evidence.target_rate != null && (
                <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                  Target: {rec.data_evidence.target_rate}%
                </span>
              )}
              {rec.data_evidence.domain && (
                <span className="text-xs px-2 py-1 bg-violet-50 text-violet-700 rounded-lg font-medium">
                  {rec.data_evidence.domain}
                </span>
              )}
              {rec.data_evidence.keyword && (
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-lg font-medium">
                  "{rec.data_evidence.keyword}"
                </span>
              )}
            </div>
          )}

          {/* Specific action */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Exact action</p>
            <p className="text-sm text-foreground">{rec.action}</p>
          </div>

          {/* Template */}
          {rec.template && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ready-to-use template</p>
                <CopyButton text={rec.template} />
              </div>
              <pre className="text-xs text-foreground bg-muted/50 rounded-lg p-3 whitespace-pre-wrap font-sans border border-border overflow-auto max-h-48">
                {rec.template}
              </pre>
            </div>
          )}

          {/* Expected result */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">{rec.expected_result}</p>
          </div>

          {/* Actions */}
          {rec.status !== 'done' && (
            <div className="flex gap-2">
              {rec.status === 'pending' && (
                <button
                  onClick={() => onStatusChange(rec.id, 'in_progress')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                >
                  <ArrowRight className="w-3 h-3" /> Start working on this
                </button>
              )}
              {rec.status === 'in_progress' && (
                <button
                  onClick={() => onStatusChange(rec.id, 'done')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                >
                  <CheckCircle2 className="w-3 h-3" /> Mark as done
                </button>
              )}
              <button
                onClick={() => onStatusChange(rec.id, 'dismissed')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground"
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Recommendations</h1>
            <p className="text-xs text-muted-foreground">Specific actions to improve your AI visibility — ranked by impact</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brands.length > 1 && (
            <select
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {generate.isPending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
              : <><RefreshCw className="w-3.5 h-3.5" /> Generate</>}
          </button>
        </div>
      </div>

      {/* Progress summary */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <p className="text-2xl font-bold">{recommendations.length}</p>
            <p className="text-xs text-muted-foreground">Total recommendations</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-emerald-600">{doneCount}</p>
              {doneCount > 0 && <Star className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
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
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Empty / loading states */}
      {!activeBrandId ? (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No brands yet</p>
          <p className="text-xs mt-1">Add a brand first, then run scans to generate recommendations</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold mb-1">No recommendations yet</p>
          <p className="text-xs mb-4">Run at least one scan, then click Generate to get specific actions ranked by impact</p>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90 mx-auto"
          >
            {generate.isPending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing your data…</>
              : <><Zap className="w-3.5 h-3.5" /> Generate Recommendations</>}
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
