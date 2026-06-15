#!/usr/bin/env python3
"""Seed a fully-populated demo account (a credit union — shows every feature).
Run: SVC=<service_role_key> python3 scripts/seed_demo.py
Creates demo@tracque.com / TracqueDemo2026! with data across all pages."""
import os, json, urllib.request, sys, hashlib

URL = "https://poarbxoeswwxexwnrugp.supabase.co"
SVC = os.environ["SVC"]
EMAIL, PW = "demo@tracque.com", "TracqueDemo2026!"
H = {"apikey": SVC, "Authorization": f"Bearer {SVC}", "Content-Type": "application/json"}

def req(method, path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + path, data=data, method=method, headers={**H, **(headers or {})})
    try:
        with urllib.request.urlopen(r) as resp:
            t = resp.read().decode()
            return json.loads(t) if t else None
    except urllib.error.HTTPError as e:
        return {"_err": e.code, "_body": e.read().decode()[:200]}

def insert(table, rows):
    return req("POST", f"/rest/v1/{table}", rows, {"Prefer": "return=representation"})

# ── 1. Auth user ──────────────────────────────────────────
users = req("GET", f"/auth/v1/admin/users?email={EMAIL}")
existing = (users or {}).get("users", []) if isinstance(users, dict) else []
uid = existing[0]["id"] if existing else None
if not uid:
    u = req("POST", "/auth/v1/admin/users", {"email": EMAIL, "password": PW, "email_confirm": True})
    uid = u["id"]
    print("created user", EMAIL)
else:
    print("user exists; wiping old demo data")
    for t in ["attribution_conversions","attribution_visits","tracking_sites","rate_checks","rate_facts",
              "saiv_results","reviews","local_competitors","review_profiles","keyword_gaps","seo_competitors",
              "domain_metrics","seo_results","scan_results","keywords","brands","clients"]:
        col = "user_id" if t in ("tracking_sites","attribution_visits","attribution_conversions","keywords","brands","clients") else None
        if col: req("DELETE", f"/rest/v1/{t}?{col}=eq.{uid}")
print("uid", uid)

# ── 2. Client + brands + keywords ─────────────────────────
client = insert("clients", {"user_id": uid, "name": "Summit Credit Union", "domain": "summitcu.demo", "color": "#10B981"})[0]
cid = client["id"]
own = insert("brands", {"user_id": uid, "client_id": cid, "name": "Summit Credit Union", "domain": "summitcu.demo", "type": "own"})[0]
comps = insert("brands", [
    {"user_id": uid, "client_id": cid, "name": "Lakeshore Credit Union", "domain": "lakeshorecu.demo", "type": "competitor"},
    {"user_id": uid, "client_id": cid, "name": "Premier Federal CU", "domain": "premierfcu.demo", "type": "competitor"},
])
own_id = own["id"]
kws = insert("keywords", [{"user_id": uid, "client_id": cid, "phrase": p, "intent": i} for p, i in [
    ("best credit union near me", "commercial"), ("high yield savings account", "commercial"),
    ("best auto loan rates", "commercial"), ("credit union vs bank", "informational"),
    ("best CD rates", "commercial"), ("free checking account", "commercial"),
]])

# ── 3. AI visibility (scan_results across models) ─────────
# Vary runs/mentions per (keyword, model) so confidence SPREADS realistically.
# (A flat 80% on every mention screams "seed data" — real scans run N times
#  per model and confidence = runs_mentioned / runs_total, which scatters.)
def _h(s): return int(hashlib.md5(s.encode()).hexdigest()[:6], 16)
models = ["chatgpt", "claude", "perplexity", "gemini", "grok"]
rates = {"chatgpt": .8, "claude": .9, "perplexity": .7, "gemini": .6, "grok": .4}
sr = []
for k in kws:
    for m in models:
        seed = _h(k["id"] + m)
        mn = (seed % 100) / 100 < rates[m]
        runs = 4 + (seed % 3)                          # 4–6 runs per model
        if mn:
            mentioned_runs = max(2, runs - (seed % 3))  # mentioned in most runs → 50–100%
        else:
            mentioned_runs = (seed >> 5) % 2            # 0 or 1 stray mention → 0–25%
        conf = int(round(mentioned_runs / runs * 100))
        pos = (1 + (seed % 5)) if mn else None          # vary position 1–5
        sent = None if not mn else ("neutral" if seed % 5 == 0 else "positive")
        sr.append({"keyword_id": k["id"], "brand_id": own_id, "model": m, "mentioned": mn,
                   "sentiment": sent, "position": pos,
                   "runs_total": runs, "runs_mentioned": mentioned_runs,
                   "confidence_pct": conf, "web_grounded": True,
                   "all_sentiments": [sent] if sent else [],
                   "excerpt": f"Summit Credit Union is a strong option for {k['phrase']}." if mn else None,
                   "raw_response": "..."})
insert("scan_results", sr)

# ── 4. SEO ────────────────────────────────────────────────
seo = []
for idx, k in enumerate(kws):
    seo.append({"keyword_id": k["id"], "brand_id": own_id, "position": [3,7,12,5,18,9][idx],
                "url": f"https://summitcu.demo/{k['phrase'].replace(' ','-')}", "search_volume": [8100,40500,22200,5400,18100,12100][idx],
                "difficulty": [42,55,38,29,61,47][idx], "cpc": [3.2,5.1,4.0,1.1,2.9,3.8][idx]})
insert("seo_results", seo)
insert("domain_metrics", [
    {"brand_id": own_id, "domain": "summitcu.demo", "domain_rating": 58, "organic_traffic": 142000, "organic_keywords": 8400, "referring_domains": 1200, "backlinks_total": 38000},
    {"brand_id": comps[0]["id"], "domain": "lakeshorecu.demo", "domain_rating": 64, "organic_traffic": 210000, "organic_keywords": 11200, "referring_domains": 1850, "backlinks_total": 61000},
    {"brand_id": comps[1]["id"], "domain": "premierfcu.demo", "domain_rating": 51, "organic_traffic": 98000, "organic_keywords": 6100, "referring_domains": 890, "backlinks_total": 24000},
])
insert("seo_competitors", [{"brand_id": own_id, "domain": d, "common_keywords": c, "organic_traffic": t}
    for d,c,t in [("lakeshorecu.demo",3200,210000),("premierfcu.demo",2100,98000),("navyfederal.org",1400,2100000)]])
insert("keyword_gaps", [{"brand_id": own_id, "competitor_domain": d, "keyword": kw, "search_volume": v, "difficulty": kd, "cpc": c, "competitor_position": p, "intent": "commercial"}
    for d,kw,v,kd,c,p in [("lakeshorecu.demo","money market rates",14800,44,4.2,4),("lakeshorecu.demo","heloc rates",27100,58,6.1,6),
                          ("premierfcu.demo","student loan refinance",18100,67,8.0,9),("lakeshorecu.demo","ira cd rates",6600,39,3.1,3)]])

# ── 5. Share of AI Voice ──────────────────────────────────
insert("saiv_results", [
    {"brand_id": own_id, "engine":"chatgpt","prompt":"best credit union near me","mentioned":True,"position":2,"competitors":["Lakeshore CU","Navy Federal","Premier FCU"],"excerpt":"Top local options include Summit Credit Union..."},
    {"brand_id": own_id, "engine":"chatgpt","prompt":"high yield savings account","mentioned":False,"position":None,"competitors":["Ally","Marcus","Capital One 360","Lakeshore CU"],"excerpt":"Leading high-yield options are Ally, Marcus..."},
    {"brand_id": own_id, "engine":"chatgpt","prompt":"best auto loan rates","mentioned":True,"position":4,"competitors":["Lakeshore CU","Bank of America","Premier FCU"],"excerpt":"Credit unions like Summit often beat banks..."},
    {"brand_id": own_id, "engine":"chatgpt","prompt":"best CD rates","mentioned":False,"position":None,"competitors":["Marcus","Synchrony","Lakeshore CU","Ally"],"excerpt":"For CDs, consider Marcus, Synchrony..."},
])

# ── 6. Reputation ─────────────────────────────────────────
insert("review_profiles", {"brand_id": own_id, "platform":"google","rating":4.6,"reviews_count":312,"response_rate":0.42,
    "topics":[{"topic":"friendly staff","count":48},{"topic":"low fees","count":31},{"topic":"mobile app","count":19},{"topic":"wait times","count":12}]})
insert("local_competitors", [
    {"brand_id": own_id, "name":"Summit Credit Union","rating":4.6,"reviews_count":312,"is_claimed":True,"is_self":True},
    {"brand_id": own_id, "name":"Lakeshore Credit Union","rating":4.8,"reviews_count":540,"is_claimed":True,"is_self":False},
    {"brand_id": own_id, "name":"Premier Federal CU","rating":4.3,"reviews_count":188,"is_claimed":True,"is_self":False},
    {"brand_id": own_id, "name":"First National Bank","rating":3.9,"reviews_count":421,"is_claimed":False,"is_self":False},
])
insert("reviews", [
    {"brand_id": own_id, "platform":"google","author":"Maria G.","rating":5,"text":"Switched from a big bank and never looked back. Staff is wonderful and the auto loan rate beat everyone.","owner_answered":True,"posted_at":"2026-05-28"},
    {"brand_id": own_id, "platform":"google","author":"Devon R.","rating":2,"text":"Waited 40 minutes in the branch lobby and the app logged me out twice. Frustrating.","owner_answered":False,"posted_at":"2026-06-02"},
    {"brand_id": own_id, "platform":"google","author":"Aisha K.","rating":5,"text":"Best CD rates in town and zero monthly fees on checking.","owner_answered":False,"posted_at":"2026-06-08"},
])

# ── 7. Rate monitor (with one WRONG — the moat moment) ────
facts = insert("rate_facts", [
    {"brand_id": own_id, "label":"12-month CD APY","value":"4.50%","category":"rate"},
    {"brand_id": own_id, "label":"new auto loan APR (60mo)","value":"5.99%","category":"rate"},
    {"brand_id": own_id, "label":"monthly checking fee","value":"$0","category":"fee"},
    {"brand_id": own_id, "label":"Saturday branch hours","value":"9am-1pm","category":"hours"},
])
insert("rate_checks", [
    {"brand_id": own_id,"fact_id":facts[0]["id"],"engine":"chatgpt","ai_value":"3.25%","status":"wrong","excerpt":"Summit Credit Union offers a 12-month CD at around 3.25% APY."},
    {"brand_id": own_id,"fact_id":facts[1]["id"],"engine":"chatgpt","ai_value":"5.99%","status":"accurate","excerpt":"New auto loans start at 5.99% APR for 60 months."},
    {"brand_id": own_id,"fact_id":facts[2]["id"],"engine":"chatgpt","ai_value":"$0","status":"accurate","excerpt":"Free checking with no monthly fee."},
    {"brand_id": own_id,"fact_id":facts[3]["id"],"engine":"chatgpt","ai_value":None,"status":"not_stated","excerpt":"I couldn't find specific Saturday hours."},
])

# ── 8. Attribution ────────────────────────────────────────
site = insert("tracking_sites", {"user_id": uid, "client_id": cid, "domain":"summitcu.demo","ga4_id":"G-DEMO12345"})[0]
visits, convs = [], []
mix = [("chatgpt",True,420,18,52000),("perplexity",True,180,9,26000),("google",False,1900,41,118000),
       ("paid_google",False,640,22,61000),("gemini",True,95,4,9800),("direct",False,1100,28,74000)]
for src, ai, sess, conv, rev in mix:
    for i in range(min(sess,12)):  # sample rows (aggregation view counts these)
        visits.append({"user_id":uid,"client_id":cid,"visitor_id":f"{src}-{i}","source":src,"is_ai":ai,"landing_path":"/"})
    # store true counts via duplicated rows would be heavy; seed proportional sample + conversions
    for j in range(min(conv,8)):
        convs.append({"user_id":uid,"client_id":cid,"visitor_id":f"{src}-c{j}","source":src,"is_ai":ai,"value":round(rev/conv,2),"event_name":"signup"})
insert("attribution_visits", visits)
insert("attribution_conversions", convs)

print("\n✅ DEMO SEEDED")
print(f"   URL:   {URL.replace('poarbxoeswwxexwnrugp.supabase.co','tracque.com')}/auth")
print(f"   Login: {EMAIL}")
print(f"   Pass:  {PW}")
