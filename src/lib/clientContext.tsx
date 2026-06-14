import { createContext, useContext, useState, useEffect } from 'react'

// The currently-active client workspace. 'all' = show everything across
// clients (and new entities land unassigned). A uuid = scoped to one client.
type ClientId = string | 'all'

interface ClientCtx {
  clientId: ClientId
  setClientId: (id: ClientId) => void
}

const Ctx = createContext<ClientCtx>({ clientId: 'all', setClientId: () => {} })
const KEY = 'tracque.client'

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clientId, setClientIdState] = useState<ClientId>(() => (localStorage.getItem(KEY) as ClientId) || 'all')

  useEffect(() => { localStorage.setItem(KEY, clientId) }, [clientId])

  return <Ctx.Provider value={{ clientId, setClientId: setClientIdState }}>{children}</Ctx.Provider>
}

export function useSelectedClient() {
  return useContext(Ctx)
}
