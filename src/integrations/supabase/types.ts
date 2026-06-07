export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type AIModel = 'chatgpt' | 'perplexity' | 'gemini' | 'claude' | 'grok'
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type BrandType = 'own' | 'competitor'
export type Intent = 'informational' | 'commercial' | 'navigational'

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          user_id: string
          name: string
          domain: string | null
          type: BrandType
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['brands']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['brands']['Insert']>
      }
      keywords: {
        Row: {
          id: string
          user_id: string
          phrase: string
          intent: Intent | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['keywords']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['keywords']['Insert']>
      }
      brand_keywords: {
        Row: { keyword_id: string; brand_id: string }
        Insert: Database['public']['Tables']['brand_keywords']['Row']
        Update: Partial<Database['public']['Tables']['brand_keywords']['Row']>
      }
      scan_results: {
        Row: {
          id: string
          keyword_id: string
          brand_id: string
          model: AIModel
          mentioned: boolean
          sentiment: Sentiment | null
          position: number | null
          excerpt: string | null
          sources: string[] | null
          citation_urls: string[] | null
          runs_total: number
          runs_mentioned: number
          confidence_pct: number | null
          all_sentiments: string[] | null
          web_grounded: boolean | null
          raw_response: string | null
          scanned_at: string
        }
        Insert: Omit<Database['public']['Tables']['scan_results']['Row'], 'id' | 'scanned_at'>
        Update: Partial<Database['public']['Tables']['scan_results']['Insert']>
      }
      seo_results: {
        Row: {
          id: string
          keyword_id: string
          brand_id: string
          position: number | null
          url: string | null
          search_volume: number | null
          difficulty: number | null
          scanned_at: string
        }
        Insert: Omit<Database['public']['Tables']['seo_results']['Row'], 'id' | 'scanned_at'>
        Update: Partial<Database['public']['Tables']['seo_results']['Insert']>
      }
    }
    Views: {
      latest_scan_results: {
        Row: Database['public']['Tables']['scan_results']['Row'] & {
          phrase: string
          brand_name: string
          brand_type: BrandType
        }
      }
      mention_rates: {
        Row: {
          brand_id: string
          brand_name: string
          user_id: string
          model: AIModel
          total_scans: number
          mentions: number
          mention_rate_pct: number
          positive_pct: number | null
        }
      }
      latest_seo_results: {
        Row: Database['public']['Tables']['seo_results']['Row'] & {
          phrase: string
          brand_name: string
        }
      }
    }
  }
}

// Convenience aliases
export type Brand = Database['public']['Tables']['brands']['Row']
export type Keyword = Database['public']['Tables']['keywords']['Row']
export type ScanResult = Database['public']['Tables']['scan_results']['Row']
export type SeoResult = Database['public']['Tables']['seo_results']['Row']
export type MentionRate = Database['public']['Views']['mention_rates']['Row']
export type LatestScanResult = Database['public']['Views']['latest_scan_results']['Row']
export type LatestSeoResult = Database['public']['Views']['latest_seo_results']['Row']
