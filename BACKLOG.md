# Tracque — Product Backlog

Spec-driven backlog (Jira-style). Status: ✅ done · 🚧 partial · 🔲 todo · ⛔ blocked-on-key.
IDs are stable; reference them in commits (`TRQ-33: ...`).

> **Legend** — *blocked-on-key* means the code is built and deployed; it just needs an API key/secret set to run.

---

## EPIC A — Foundation & Infra
| ID | Status | Title | Notes / Acceptance |
|----|--------|-------|--------------------|
| TRQ-1 | ✅ | Auth (signup/login/reset) | Supabase Auth, protected routes, real user IDs everywhere |
| TRQ-2 | ✅ | Schema + RLS + edge functions | 19 migrations, all tables RLS-scoped |
| TRQ-3 | ✅ | Deploy pipeline | Vercel prod + `tracque.com` custom domain (HTTPS) |
| TRQ-4 | ✅ | Branding + marketing site | Twin-rails logo, Inter type, premium pricing page |

## EPIC B — Client Workspaces (agency)
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-10 | ✅ | Clients table + switcher | Create clients; sidebar switcher; brands/keywords scoped |
| TRQ-11 | ✅ | Multi-tenancy isolation | All result views client-scoped + `security_invoker`; verified by adversarial review (closed a critical cross-client leak) |
| TRQ-12 | 🔲 | White-label client reports | Branded PDF/share-link "AI + SEO + reputation scorecard" per client; agency logo; scheduled email |

## EPIC C — AI Visibility
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-20 | 🚧 | Multi-model scan engine | `run-scan` built for 5 models; only `OPENAI` key live (ChatGPT) |
| TRQ-21 | ✅ | Share-of-AI-Voice grid | Per-prompt: recommended? position? rivals; SAIV %; "who shows up instead" |
| TRQ-22 | ⛔ | Light up all 5 models | Set `ANTHROPIC`, `GEMINI`, `PERPLEXITY`, `XAI` secrets → full multi-model visibility + recommendations |
| TRQ-23 | 🔲 | Geo-grid SAIV (local) | lat/long grid × "near me" prompts → neighborhood heatmap; per-point inclusion score |
| TRQ-24 | ⛔ | Frontend scraper farm | Rails built (Browserbase + scrape-task); set `BROWSERBASE_API_KEY`/`PROJECT_ID` to activate; ChatGPT adapter needs live-tuning |
| TRQ-25 | 🔲 | Knowledge Panel detection | SerpAPI knowledge-graph → flag "no entity / get a knowledge panel" |

## EPIC D — SEO Suite
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-30 | ✅ | Rank tracking + cross-client cache | SerpAPI; one SERP fetch serves all clients tracking the keyword |
| TRQ-31 | ✅ | Keyword metrics / DR / backlinks | DataForSEO (volume, KD, CPC, domain authority, backlinks) |
| TRQ-32 | ✅ | Competitor comparison | Own vs competitors: DR / traffic / keywords / ref domains |
| TRQ-33 | ✅ | Keyword Gap + competitor discovery | `competitors_domain` + `domain_intersection`; mega-domains filtered |
| TRQ-34 | 🔲 | Keyword Explorer | Seed → `keyword_ideas`/`suggestions`/`related` with volume/KD; "track" button |
| TRQ-35 | 🔲 | Rank history charts | We store snapshots; plot position-over-time per keyword |
| TRQ-36 | ⛔ | GSC integration (free first-party rank) | `sync-gsc` built; needs Google OAuth app (`GOOGLE_CLIENT_ID/SECRET`) + per-client connect flow |
| TRQ-37 | 🔲 | Bing rank (Copilot proxy) | SerpAPI Bing engine → Bing position (predicts AI citation) |

## EPIC E — Reputation
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-40 | ✅ | Ratings + local grid + AI-recommendable gauge | DataForSEO Business Data; geocoded city input |
| TRQ-41 | 🚧 | Individual reviews + response rate | `reviews-sync` (task-based) deployed; slow async path needs hardening/retry UX |
| TRQ-42 | ✅ | AI-drafted review replies | Tone-aware (empathetic for low ratings); copyable |
| TRQ-43 | 🚧 | Trustpilot / Yelp / Tripadvisor sources | ✅ Trustpilot live (verified monday.com 2.5★/3406); Yelp deferred (needs business id) |
| TRQ-44 | 🔲 | Review-request workflow | SMS/email ask after a job → grow review volume (lifts AI-recommendability) |

## EPIC F — Attribution & Analytics
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-50 | ✅ | Conversion tracking | `t.js` snippet → ingest → per-source revenue; client-scoped; verified e2e |
| TRQ-51 | ✅ | GA4 event mirroring | Snippet co-fires conversions into the client's GA4 |
| TRQ-52 | ✅ | AI GA4 config generator | Site → AI event plan + importable GTM container + `tracque_source` dim |
| TRQ-53 | ⛔ | GA4 Data API read | Pull the client's GA revenue into Tracque; needs Google OAuth |
| TRQ-54 | 🔲 | Call tracking | Tracked numbers per source → "this call came from ChatGPT" (key for plumber/lender/CU) |

## EPIC G — Recommendations & Content
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-60 | ⛔ | Recommendations engine | `generate-recommendations` built; needs `ANTHROPIC` key |
| TRQ-61 | 🔲 | AEO content / FAQ engine | Generate the QAPage/FAQ content AI pulls from (schema-first) |
| TRQ-62 | 🔲 | Public AI-citable trust page | Hosted `trust.tracque.com/[client]` with Org+AggregateRating+FAQ JSON-LD → become the cited source |
| TRQ-63 | 🔲 | Blog generator + backlink builder | Last per founder ("blog and backlink can come last") |

## EPIC H — Credit-union / compliance wedge
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-70 | ✅ | AI Rate-Accuracy Monitor | Ground-truth sheet → probe AI per fact → judge accurate/wrong/not-stated → compliance-risk alert. Monitoring only (no auto-publish). Verified: caught a planted wrong APY |
| TRQ-71 | 🔲 | Compliance scorecard + vendor one-pager | Citation accuracy, freshness lag; NCUA examiner doc; human-approval gate before any rate publishes; no PII/decisioning |

## EPIC I — Billing & Plans
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-80 | ✅ | Plan tiers + limits | `plan_limits`: Free/$249/$599/$1499 + Enterprise |
| TRQ-81 | 🔲 | Stripe checkout + webhooks | **LAST** — checkout, webhook → `user_plans`, plan enforcement; needs `STRIPE_*` keys |
| TRQ-82 | 🔲 | Per-tier usage enforcement | Cap prompts/scan-frequency per plan so API cost can't run away |

## EPIC J — Scale & Ops
| ID | Status | Title | Acceptance |
|----|--------|-------|------------|
| TRQ-90 | ⛔ | Parallel dispatch | `queue-dispatcher` built; set `QSTASH_TOKEN` for true parallel scanning |
| TRQ-91 | 🔲 | Alerts & monitoring | "visibility dropped", "new 1★ review", "AI stated wrong rate", "competitor overtook you" |
| TRQ-92 | 🔲 | Scraper health dashboard | `scraper_health` view → ban-rate/captcha/latency UI |

---

## Next-up (recommended order)
1. **TRQ-22** — paste `ANTHROPIC` + `GEMINI` → unblocks full AI visibility **and TRQ-60 recommendations** (~$5, you)
2. **TRQ-34 / TRQ-35** — Keyword Explorer + rank history (finish Ahrefs parity; Labs already live)
3. **TRQ-43** — Trustpilot/Yelp in Reputation (same key)
4. **TRQ-54** — call tracking (completes attribution for local/lender/CU)
5. **TRQ-81** — Stripe (last)

*Updated: 2026-06-14*
