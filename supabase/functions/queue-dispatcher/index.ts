// Tracque — Queue Dispatcher
// Called by pg_cron every minute
// Fans out pending tasks to individual workers via Upstash QStash
// This enables TRUE parallelism — each task runs in its own Edge Function invocation
// Handles millions of tasks/day without any single function timing out

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const QSTASH_TOKEN = Deno.env.get('QSTASH_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Max tasks to dispatch per cron tick (QStash batch limit = 100)
const DISPATCH_BATCH = 100

Deno.serve(async () => {
  // Pull pending tasks not yet dispatched.
  // `source` decides which worker handles it: 'api' → process-single-task,
  // 'frontend' → scrape-task (managed browser + proxy rotation).
  const { data: tasks } = await supabase
    .from('scan_tasks')
    .select('id, job_id, model, source')
    .eq('status', 'pending')
    .lt('attempts', 3)
    .order('created_at', { ascending: true })
    .limit(DISPATCH_BATCH)

  if (!tasks?.length) {
    return new Response(JSON.stringify({ dispatched: 0 }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // If QStash available — true parallel dispatch
  if (QSTASH_TOKEN) {
    const messages = tasks.map(task => {
      const worker = task.source === 'frontend' ? 'scrape-task' : 'process-single-task'
      return {
        destination: `${SUPABASE_URL}/functions/v1/${worker}`,
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: task.id }),
        // Frontend scrapes are slower + more ban-sensitive → larger stagger.
        delay: task.source === 'frontend' ? getFrontendDelay(task.model) : getModelDelay(task.model),
      }
    })

    // Batch publish to QStash
    const batchSize = 10
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize)
      await fetch('https://qstash.upstash.io/v2/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      })
    }

    // Mark all as 'queued' so they're not re-dispatched
    await supabase
      .from('scan_tasks')
      .update({ status: 'running', attempts: 1 })
      .in('id', tasks.map(t => t.id))

  } else {
    // Fallback: process sequentially (no QStash key)
    // Just invoke process-scan-queue directly
    await supabase.functions.invoke('process-scan-queue', { body: {} })
  }

  return new Response(JSON.stringify({ dispatched: tasks.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

function getModelDelay(model: string): number {
  // Stagger same-model calls to stay under rate limits
  const rpm: Record<string, number> = {
    chatgpt: 60, perplexity: 50, gemini: 60, claude: 50, grok: 60
  }
  return Math.ceil(60 / (rpm[model] ?? 50)) // seconds between calls
}

function getFrontendDelay(model: string): number {
  // Frontend scrapes spread wider: each consumes a proxy + browser session,
  // and bunched requests from one surface raise ban risk. ~6–10 rpm/surface.
  const rpm: Record<string, number> = { chatgpt: 8, perplexity: 10 }
  const jitter = Math.floor(Math.random() * 5) // de-synchronize workers
  return Math.ceil(60 / (rpm[model] ?? 8)) + jitter
}
