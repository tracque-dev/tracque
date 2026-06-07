import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import type { Brand, Keyword, LatestScanResult, LatestSeoResult, MentionRate } from '../integrations/supabase/types'

// Demo user — replace with supabase.auth.getUser() when auth is wired
export const USER_ID = 'demo-user'

// ── Brands ────────────────────────────────────────────────

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Brand[]
    },
  })
}

export function useAddBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (brand: { name: string; domain?: string; type: 'own' | 'competitor' }) => {
      const { data, error } = await supabase
        .from('brands')
        .insert({ ...brand, user_id: USER_ID })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brands').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  })
}

// ── Keywords ──────────────────────────────────────────────

export function useKeywords() {
  return useQuery({
    queryKey: ['keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Keyword[]
    },
  })
}

export function useAddKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (kw: { phrase: string; intent?: 'informational' | 'commercial' | 'navigational' }) => {
      const { data, error } = await supabase
        .from('keywords')
        .insert({ ...kw, user_id: USER_ID })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keywords'] }),
  })
}

export function useDeleteKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('keywords').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keywords'] }),
  })
}

// ── Scan results ──────────────────────────────────────────

export function useLatestScanResults() {
  return useQuery({
    queryKey: ['scan_results', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('latest_scan_results')
        .select('*')
        .order('scanned_at', { ascending: false })
      if (error) throw error
      return data as LatestScanResult[]
    },
  })
}

export function useMentionRates() {
  return useQuery({
    queryKey: ['mention_rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mention_rates')
        .select('*')
        .eq('user_id', USER_ID)
      if (error) throw error
      return data as MentionRate[]
    },
  })
}

// ── SEO results ───────────────────────────────────────────

export function useLatestSeoResults() {
  return useQuery({
    queryKey: ['seo_results', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('latest_seo_results')
        .select('*')
        .order('scanned_at', { ascending: false })
      if (error) throw error
      return data as LatestSeoResult[]
    },
  })
}

// ── Scan trigger ──────────────────────────────────────────

export function useRunScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (opts?: { brand_ids?: string[]; keyword_ids?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('run-scan', {
        body: { user_id: USER_ID, ...opts },
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
