import { useState } from 'react'
import { Building2, Plus, Trash2, Globe, CheckCircle2, Loader2 } from 'lucide-react'
import { useBrands, useAddBrand, useDeleteBrand } from '../lib/hooks'

export default function Brands() {
  const { data: brands = [], isLoading } = useBrands()
  const addBrand = useAddBrand()
  const deleteBrand = useDeleteBrand()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', domain: '', type: 'own' as 'own' | 'competitor' })

  async function handleAdd() {
    if (!form.name.trim()) return
    await addBrand.mutateAsync({ name: form.name, domain: form.domain || undefined, type: form.type })
    setForm({ name: '', domain: '', type: 'own' })
    setShowAdd(false)
  }

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-blue-600">Tracking</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">Brands</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your brand and competitors</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add brand
        </button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-4">
          <p className="eyebrow text-muted-foreground">Add a brand to track</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Brand name</label>
              <input
                autoFocus
                className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                placeholder="Acme Corp"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Domain (optional)</label>
              <input
                className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                placeholder="acmecorp.com"
                value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <select
                className="w-full text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as 'own' | 'competitor' }))}
              >
                <option value="own">My Brand</option>
                <option value="competitor">Competitor</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addBrand.isPending}
              className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {addBrand.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add brand
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-sm border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : brands.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-card text-muted-foreground">
          <Building2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-base font-display font-semibold text-foreground">No brands yet</p>
          <p className="text-sm mt-1">Add your brand and competitors to start tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {brands.map((brand) => (
            <div key={brand.id} className="bg-card rounded-2xl border border-border p-5 shadow-card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm ${
                brand.type === 'own' ? 'bg-blue-50 text-blue-600' : 'bg-muted text-foreground'
              }`}>
                {brand.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{brand.name}</p>
                  {brand.type === 'own' && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> My Brand
                    </span>
                  )}
                </div>
                {brand.domain && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Globe className="w-3 h-3" />{brand.domain}
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteBrand.mutate(brand.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
