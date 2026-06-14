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
  return useQuery({
    queryKey: ['scan_results', 'latest', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('latest_scan_results').select('*')
        .order('scanned_at', { ascending: false })
      if (error) throw error
      return data as LatestScanResult[]
    },
  })
}

export function useMentionRates() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['mention_rates', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mention_rates').select('*').eq('user_id', userId)
      if (error) throw error
      return data as MentionRate[]
    },
  })
}

// ── SEO results ───────────────────────────────────────────

export function useLatestSeoResults() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['seo_results', 'latest', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('latest_seo_results').select('*')
        .order('scanned_at', { ascending: false })
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
    mutationFn: async (opts?: { brand_ids?: string[]; keyword_ids?: string[] }) => {
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
  return useQuery({
    queryKey: ['domain_overview', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domain_overview').select('*').eq('user_id', userId)
        .order('domain_rating', { ascending: false, nullsFirst: false })
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
