-- ============================================================
-- TRACQUE — Recommendations Engine
-- ============================================================

create table if not exists recommendations (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  brand_id        uuid references brands(id) on delete cascade,

  -- Classification
  category        text not null check (category in (
    'citation_source',   -- get listed/mentioned on a specific domain
    'content_gap',       -- create content for a topic you're missing
    'competitor_gap',    -- specific keyword where competitor beats you
    'site_structure',    -- fix a page so AI can extract it properly
    'review_platform',   -- G2, Capterra, Trustpilot etc
    'community',         -- Reddit, Quora, forums
    'pr_coverage',       -- TechCrunch, Forbes, industry press
    'keyword_coverage'   -- prompts you should be tracking but aren't
  )),

  -- Priority scoring
  impact_score    int check (impact_score between 1 and 10),  -- expected AI visibility lift
  effort          text check (effort in ('low', 'medium', 'high')),
  priority_rank   int,  -- 1 = do first

  -- The actual recommendation
  title           text not null,        -- short: "Get 50 more G2 reviews"
  why             text not null,        -- data-backed reason: "G2 cited in 73% of ChatGPT responses..."
  action          text not null,        -- specific: exact URL, subreddit, publication, page
  template        text,                 -- email template, content brief, or rewrite
  expected_result text,                 -- "Move from 0% → 25% mention rate within 6 weeks"
  data_evidence   jsonb,                -- raw numbers backing the recommendation

  -- Tracking
  status          text default 'pending' check (status in ('pending', 'in_progress', 'done', 'dismissed')),
  generated_at    timestamptz default now(),
  completed_at    timestamptz
);

create index if not exists recommendations_user_brand on recommendations(user_id, brand_id, priority_rank);
create index if not exists recommendations_status on recommendations(user_id, status);

-- RLS
alter table recommendations enable row level security;
create policy "recommendations_owner" on recommendations for all using (user_id = auth.uid()::text);
