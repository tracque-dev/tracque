import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useUserId } from './auth'
import { useSelectedClient } from './clientContext'
import type { Brand, Keyword, LatestScanResult, LatestSeoResult, MentionRate } from '../integrations/supabase/types'

export { useUserId }
export const USER_ID = 'demo-user' // legacy fallback

// ── Clients (agency workspaces) ───────────────────────────

export interface Client {
  id: string
  user_id: string
  name: string
  domain: string | null
  color: string
  archived: boolean
  created_at: string
}

export function useClients() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['clients', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients').select('*').eq('user_id', userId).eq('archived', false)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Client[]
    },
  })
}

export function useAddClient() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: { name: string; domain?: string; color?: string }) => {
      const { data, error } = await supabase.from('clients').insert({ ...c, user_id: userId }).select().single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients', userId] }),
  })
}

export function useArchiveClient() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').update({ archived: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients', userId] }),
  })
}

// ── Brands ────────────────────────────────────────────────

export function useBrands() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['brands', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('brands').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q.order('created_at', { ascending: true })
      if (error) throw error
      return data as Brand[]
    },
  })
}

export function useAddBrand() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (brand: { name: string; domain?: string; type: 'own' | 'competitor' }) => {
      const client_id = clientId === 'all' ? null : clientId
      const { data, error } = await supabase
        .from('brands').insert({ ...brand, user_id: userId, client_id }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', userId] }),
  })
}

export function useDeleteBrand() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brands').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', userId] }),
  })
}

// ── Keywords ──────────────────────────────────────────────

export function useKeywords() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['keywords', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('keywords').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q.order('created_at', { ascending: true })
      if (error) throw error
      return data as Keyword[]
    },
  })
}

export function useAddKeyword() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (kw: { phrase: string; intent?: 'informational' | 'commercial' | 'navigational' }) => {
      const client_id = clientId === 'all' ? null : clientId
      const { data, error } = await supabase
        .from('keywords').insert({ ...kw, user_id: userId, client_id }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keywords', userId] }),
  })
}

export function useDeleteKeyword() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('keywords').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keywords', userId] }),
  })
}

// ── Scan results ──────────────────────────────────────────

export function useLatestScanResults() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['scan_results', 'latest', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('latest_scan_results').select('*')
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q.order('scanned_at', { ascending: false })
      if (error) throw error
      return data as LatestScanResult[]
    },
  })
}

export function useMentionRates() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['mention_rates', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('mention_rates').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q
      if (error) throw error
      return data as MentionRate[]
    },
  })
}

// ── SEO results ───────────────────────────────────────────

export function useLatestSeoResults() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['seo_results', 'latest', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('latest_seo_results').select('*')
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q.order('scanned_at', { ascending: false })
      if (error) throw error
      return data as LatestSeoResult[]
    },
  })
}

// ── Scan trigger ──────────────────────────────────────────

export function useRunScan() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts?: { brand_ids?: string[]; keyword_ids?: string[]; runs_per_keyword?: number }) => {
      const { data, error } = await supabase.functions.invoke('run-scan', {
        body: { user_id: userId, ...opts },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scan_results'] })
      qc.invalidateQueries({ queryKey: ['mention_rates'] })
    },
  })
}

// ── SEO suite ─────────────────────────────────────────────

export interface DomainOverview {
  brand_id: string
  brand_name: string
  domain: string | null
  domain_rating: number | null
  organic_traffic: number | null
  organic_keywords: number | null
  referring_domains: number | null
  backlinks_total: number | null
  has_knowledge_panel: boolean | null
  knowledge_type: string | null
  type: 'own' | 'competitor'
  updated_at: string
}

export interface Backlink {
  id: string
  brand_id: string
  source_domain: string | null
  source_url: string | null
  target_url: string | null
  anchor: string | null
  domain_rating: number | null
  dofollow: boolean
  first_seen: string | null
}

export function useDomainOverview() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['domain_overview', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('domain_overview').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q.order('domain_rating', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data as DomainOverview[]
    },
  })
}

export function useBacklinks(brandId?: string) {
  return useQuery({
    queryKey: ['backlinks', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlinks').select('*').eq('brand_id', brandId!)
        .order('domain_rating', { ascending: false, nullsFirst: false }).limit(25)
      if (error) throw error
      return data as Backlink[]
    },
  })
}

// ── AI Rate-Accuracy Monitor (TRQ-70) ────────────────────

export interface RateFact {
  id: string
  brand_id: string
  label: string
  value: string
  category: string
  effective_date: string | null
}

export interface RateCheck {
  id: string
  fact_id: string
  engine: string
  ai_value: string | null
  status: string | null
  excerpt: string | null
  scanned_at: string
  label: string
  truth: string
  category: string
}

export function useRateFacts(brandId?: string) {
  return useQuery({
    queryKey: ['rate_facts', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase.from('rate_facts').select('*').eq('brand_id', brandId!).order('created_at')
      if (error) throw error
      return data as RateFact[]
    },
  })
}

export function useAddRateFact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (f: { brand_id: string; label: string; value: string; category?: string }) => {
      const { data, error } = await supabase.from('rate_facts').insert(f).select().single()
      if (error) throw error
      return data as RateFact
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate_facts'] }),
  })
}

export function useDeleteRateFact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('rate_facts').delete().eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate_facts'] }),
  })
}

export function useRateChecks(brandId?: string) {
  return useQuery({
    queryKey: ['rate_checks', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase.from('rate_checks_scoped').select('*').eq('brand_id', brandId!)
      if (error) throw error
      return data as RateCheck[]
    },
  })
}

export function useRunRateMonitor() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (brandId: string) => {
      const { data, error } = await supabase.functions.invoke('rate-monitor', { body: { user_id: userId, brand_id: brandId } })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate_checks'] }),
  })
}

// ── Share-of-AI-Voice ─────────────────────────────────────

export interface SaivResult {
  id: string
  brand_id: string
  prompt: string
  mentioned: boolean
  position: number | null
  competitors: string[] | null
  excerpt: string | null
  scanned_at: string
  brand_name: string
}

export function useSaivResults() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['saiv', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('saiv_results_scoped').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q.order('scanned_at', { ascending: false })
      if (error) throw error
      return data as SaivResult[]
    },
  })
}

export interface SaivGridCell {
  id: string
  label: string | null
  lat: number | null
  lng: number | null
  mentioned: boolean
  position: number | null
}

export function useSaivGrid() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['saiv_grid', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('saiv_grid_scoped').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q.order('lat', { ascending: false }).order('lng', { ascending: true })
      if (error) throw error
      return data as SaivGridCell[]
    },
  })
}

export function useRunSaivGrid() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts: { brand_id: string; category: string; location: string }) => {
      const { data, error } = await supabase.functions.invoke('saiv-grid', { body: { user_id: userId, ...opts } })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saiv_grid'] }),
  })
}

export function useRunSaivScan() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts: { brand_id: string; prompts: string[] }) => {
      const { data, error } = await supabase.functions.invoke('saiv-scan', { body: { user_id: userId, ...opts } })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saiv'] }),
  })
}

// ── Reputation (reviews + local competitors) ─────────────

export interface ReviewProfile {
  brand_id: string
  platform: string
  rating: number | null
  reviews_count: number | null
  response_rate: number | null
  topics: { topic: string; count: number }[] | null
  brand_name: string
  client_id: string | null
  type: 'own' | 'competitor'
}

export interface LocalCompetitor {
  id: string
  brand_id: string
  name: string | null
  rating: number | null
  reviews_count: number | null
  is_claimed: boolean | null
  is_self: boolean
}

export function useReviewProfiles() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['review_profiles', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('review_profiles_scoped').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q
      if (error) throw error
      return data as ReviewProfile[]
    },
  })
}

export function useLocalCompetitors(brandId?: string) {
  return useQuery({
    queryKey: ['local_competitors', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_competitors').select('*').eq('brand_id', brandId!)
        .order('rating', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data as LocalCompetitor[]
    },
  })
}

export interface Review {
  id: string
  brand_id: string
  platform: string
  author: string | null
  rating: number | null
  text: string | null
  owner_answered: boolean
  posted_at: string | null
}

export function useReviews(brandId?: string) {
  return useQuery({
    queryKey: ['reviews', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews').select('*').eq('brand_id', brandId!)
        .order('posted_at', { ascending: false, nullsFirst: false }).limit(30)
      if (error) throw error
      return data as Review[]
    },
  })
}

export function useRunReviewsSync() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (brandId: string) => {
      const { data, error } = await supabase.functions.invoke('reviews-sync', { body: { user_id: userId, brand_id: brandId } })
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); qc.invalidateQueries({ queryKey: ['review_profiles'] }) },
  })
}

export function useDraftReply() {
  return useMutation({
    mutationFn: async (opts: { review_text: string; rating?: number; business_name?: string }) => {
      const { data, error } = await supabase.functions.invoke('review-reply', { body: opts })
      if (error) throw error
      return data.reply as string
    },
  })
}

export function useRunReputationSync() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts: { brand_id: string; category?: string; location?: string }) => {
      const { data, error } = await supabase.functions.invoke('reputation-sync', { body: { user_id: userId, ...opts } })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review_profiles'] })
      qc.invalidateQueries({ queryKey: ['local_competitors'] })
    },
  })
}

// ── Attribution (conversion tracking) ────────────────────

export interface SourceAttribution {
  source: string
  is_ai: boolean
  sessions: number
  visitors: number
  conversions: number
  revenue: number
}

export interface TrackingSite {
  id: string
  user_id: string
  client_id: string | null
  site_key: string
  domain: string | null
  ga4_id: string | null
}

export function useAttributionBySource() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['attribution', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('attribution_by_source').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q
      if (error) throw error
      return data as SourceAttribution[]
    },
  })
}

export function useTrackingSites() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['tracking_sites', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('tracking_sites').select('*').eq('user_id', userId)
      if (clientId !== 'all') q = q.eq('client_id', clientId)
      const { data, error } = await q.order('created_at', { ascending: true })
      if (error) throw error
      return data as TrackingSite[]
    },
  })
}

export function useCreateTrackingSite() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts: { domain?: string; ga4_id?: string }) => {
      const client_id = clientId === 'all' ? null : clientId
      const { data, error } = await supabase
        .from('tracking_sites').insert({ user_id: userId, client_id, ...opts }).select().single()
      if (error) throw error
      return data as TrackingSite
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracking_sites'] }),
  })
}

export interface KeywordGap {
  id: string
  competitor_domain: string | null
  keyword: string | null
  search_volume: number | null
  difficulty: number | null
  cpc: number | null
  competitor_position: number | null
  intent: string | null
}

export function useKeywordGaps(brandId?: string) {
  return useQuery({
    queryKey: ['keyword_gaps', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keyword_gaps').select('*').eq('brand_id', brandId!)
        .order('search_volume', { ascending: false, nullsFirst: false }).limit(60)
      if (error) throw error
      return data as KeywordGap[]
    },
  })
}

export function useRankHistory(keywordId?: string, brandId?: string, enabled = false) {
  return useQuery({
    queryKey: ['rank_history', keywordId, brandId],
    enabled: enabled && !!keywordId && !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_results').select('position, scanned_at')
        .eq('keyword_id', keywordId!).eq('brand_id', brandId!)
        .order('scanned_at', { ascending: true }).limit(60)
      if (error) throw error
      return data as { position: number | null; scanned_at: string }[]
    },
  })
}

export interface KeywordIdea {
  id: string
  seed: string | null
  keyword: string | null
  search_volume: number | null
  difficulty: number | null
  cpc: number | null
  intent: string | null
}

export function useKeywordIdeas() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  return useQuery({
    queryKey: ['keyword_ideas', userId, clientId],
    queryFn: async () => {
      let q = supabase.from('keyword_ideas').select('*').eq('user_id', userId)
      q = clientId !== 'all' ? q.eq('client_id', clientId) : q.is('client_id', null)
      const { data, error } = await q.order('search_volume', { ascending: false, nullsFirst: false }).limit(50)
      if (error) throw error
      return data as KeywordIdea[]
    },
  })
}

export function useRunKeywordExplorer() {
  const userId = useUserId()
  const { clientId } = useSelectedClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (seed: string) => {
      const { data, error } = await supabase.functions.invoke('keyword-explorer', { body: { user_id: userId, client_id: clientId, seed } })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keyword_ideas'] }),
  })
}

export function useRunCompetitorIntel() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (brandId: string) => {
      const { data, error } = await supabase.functions.invoke('competitor-intel', { body: { user_id: userId, brand_id: brandId } })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keyword_gaps'] }),
  })
}

export function useRunKnowledgeCheck() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (brandId: string) => {
      const { data, error } = await supabase.functions.invoke('knowledge-check', { body: { user_id: userId, brand_id: brandId } })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domain_overview'] }),
  })
}

export function useRunSeoSync() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts?: { brand_ids?: string[]; keyword_ids?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('sync-seo', {
        body: { user_id: userId, ...opts },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seo_results'] })
      qc.invalidateQueries({ queryKey: ['domain_overview'] })
      qc.invalidateQueries({ queryKey: ['backlinks'] })
    },
  })
}

// ── White-label client reports / share links (TRQ-12) ─────

export interface ShareLink {
  id: string
  client_id: string
  token: string
  enabled: boolean
  created_at: string
}

function randomToken(): string {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('') // 36-char hex
}

export function useShareLink(clientId?: string) {
  return useQuery({
    queryKey: ['share_link', clientId],
    enabled: !!clientId && clientId !== 'all',
    queryFn: async () => {
      const { data, error } = await supabase.from('client_reports').select('*').eq('client_id', clientId!).maybeSingle()
      if (error) throw error
      return data as ShareLink | null
    },
  })
}

export function useCreateShareLink() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (clientId: string) => {
      // Get-or-create: one share link per client (unique index on client_id).
      const { data: existing } = await supabase.from('client_reports').select('*').eq('client_id', clientId).maybeSingle()
      if (existing) {
        if (!(existing as ShareLink).enabled) {
          const { data, error } = await supabase.from('client_reports').update({ enabled: true }).eq('id', (existing as ShareLink).id).select().single()
          if (error) throw error
          return data as ShareLink
        }
        return existing as ShareLink
      }
      const { data, error } = await supabase.from('client_reports')
        .insert({ client_id: clientId, user_id: userId, token: randomToken(), enabled: true }).select().single()
      if (error) throw error
      return data as ShareLink
    },
    onSuccess: (_d, clientId) => qc.invalidateQueries({ queryKey: ['share_link', clientId] }),
  })
}

export function useToggleShareLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase.from('client_reports').update({ enabled: opts.enabled }).eq('id', opts.id).select().single()
      if (error) throw error
      return data as ShareLink
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['share_link'] }),
  })
}
