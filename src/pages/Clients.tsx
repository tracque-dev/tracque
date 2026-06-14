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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Clients</h1>
            <p className="text-xs text-muted-foreground">Each client is its own workspace — brands, keywords, scans & reports stay scoped.</p>
          </div>
        </div>
        <button onClick={() => setAdding(a => !a)} className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New client
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-card border border-border rounded-xl p-4 shadow-card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Client name</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Acme Inc." className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Primary domain</label>
              <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="acme.com" className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-background" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Color</span>
            {COLORS.map(c => (
              <button type="button" key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''}`} style={{ background: c }} />
            ))}
            <button type="submit" disabled={addClient.isPending} className="ml-auto flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {addClient.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <Building2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No clients yet</p>
          <p className="text-xs mt-1">Create your first client workspace to start tracking their AI visibility & SEO.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <div key={c.id} className="group bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: c.color }}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <button onClick={() => archiveClient.mutate(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="font-semibold">{c.name}</p>
              {c.domain && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Globe className="w-3 h-3" /> {c.domain}</p>}
              <button onClick={() => openClient(c.id)} className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg py-2 hover:bg-muted/40 transition-colors">
                Open workspace <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
