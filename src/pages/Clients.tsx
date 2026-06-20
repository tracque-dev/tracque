import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Loader2, Trash2, ArrowRight, Globe } from 'lucide-react'
import { useClients, useAddClient, useArchiveClient } from '../lib/hooks'
import { useSelectedClient } from '../lib/clientContext'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function Clients() {
  const { data: clients = [], isLoading } = useClients()
  const addClient = useAddClient()
  const archiveClient = useArchiveClient()
  const { setClientId } = useSelectedClient()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [adding, setAdding] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const client = await addClient.mutateAsync({ name: name.trim(), domain: domain.trim() || undefined, color })
    setName(''); setDomain(''); setColor(COLORS[0]); setAdding(false)
    setClientId(client.id)
  }

  function openClient(id: string) {
    setClientId(id)
    navigate('/app/brands')
  }

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-primary">Workspaces</p>
          <h1 className="text-2xl font-display font-semibold tracking-tight mt-1">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">Each client is its own workspace — brands, keywords, scans & reports stay scoped.</p>
        </div>
        <button onClick={() => setAdding(a => !a)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New client
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow text-muted-foreground">Client name</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Acme Inc." className="mt-1.5 w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
            <div>
              <label className="eyebrow text-muted-foreground">Primary domain</label>
              <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="acme.com" className="mt-1.5 w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-muted-foreground mr-1">Color</span>
            {COLORS.map(c => (
              <button type="button" key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' : ''}`} style={{ background: c }} />
            ))}
            <button type="submit" disabled={addClient.isPending} className="ml-auto flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {addClient.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : clients.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <p className="text-base font-display font-semibold mb-1">No clients yet</p>
          <p className="text-sm text-muted-foreground">Create your first client workspace to start tracking their AI visibility & SEO.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <div key={c.id} className="group bg-card border border-border rounded-xl p-5 hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm" style={{ background: c.color }}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <button onClick={() => archiveClient.mutate(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="font-display font-semibold">{c.name}</p>
              {c.domain && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Globe className="w-3 h-3" /> {c.domain}</p>}
              <button onClick={() => openClient(c.id)} className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg py-2 hover:bg-secondary transition-colors">
                Open workspace <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
