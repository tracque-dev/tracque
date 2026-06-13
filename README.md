# Tracque

AI brand visibility tracking across ChatGPT, Perplexity, Gemini, Claude, and Grok — plus SEO rankings, prompt discovery, and full revenue attribution.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions + pg_cron)
- **Queue:** Upstash QStash for parallel scan dispatch
- **Hosting:** Vercel

## Local Development

```bash
# Install dependencies
bun install

# Copy env file and fill in your Supabase credentials
cp .env.example .env.local

# Start dev server (port 8081)
bun dev
```

## Supabase Setup

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push

# Deploy edge functions
supabase functions deploy

# Set API key secrets (required for scans to run)
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set PERPLEXITY_API_KEY=pplx-...
supabase secrets set GOOGLE_AI_API_KEY=...
supabase secrets set SERPAPI_KEY=...
supabase secrets set QSTASH_TOKEN=...
supabase secrets set QSTASH_URL=https://qstash.upstash.io/v2/publish/
```

## Vercel Deployment

```bash
# Deploy to production
bunx vercel --prod --scope your-team
```

Add these env vars in Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth` | Sign in / Sign up |
| `/app/dashboard` | Overview + scan trigger |
| `/app/brands` | Brand + competitor tracking |
| `/app/keywords` | Keyword management |
| `/app/prompts` | Prompt discovery (PAA, Reddit, GSC) |
| `/app/ai` | AI visibility results across all models |
| `/app/seo` | SEO rank tracking |
| `/app/recommendations` | Claude-powered action recommendations |
| `/app/site-audit` | Site crawl + GA4 event generation |
| `/app/attribution` | Revenue attribution (AI → UTM → conversion) |
| `/app/settings` | API keys, scan frequency, notifications |
