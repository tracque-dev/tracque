import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useUserId } from './auth'
import type { Brand, Keyword, LatestScanResult, LatestSeoResult, MentionRate } from '../integrations/supabase/types'

export { useUserId }
export const USER_ID = 'demo-user' // legacy fallback

// ── Brands ────────────────────────────────────────────────

export function useBrands() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['brands', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands').select('*').eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Brand[]
    },
  })
}

export function useAddBrand() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (brand: { name: string; domain?: string; type: 'own' | 'competitor' }) => {
      const { data, error } = await supabase
        .from('brands').insert({ ...brand, user_id: userId }).select().single()
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
  return useQuery({
    queryKey: ['keywords', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keywords').select('*').eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Keyword[]
    },
  })
}

export function useAddKeyword() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (kw: { phrase: string; intent?: 'informational' | 'commercial' | 'navigational' }) => {
      const { data, error } = await supabase
        .from('keywords').insert({ ...kw, user_id: userId }).select().single()
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
