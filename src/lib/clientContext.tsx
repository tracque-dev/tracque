import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth'

// The currently-active client workspace. 'all' = show everything across
// clients (and new entities land unassigned). A uuid = scoped to one client.
type ClientId = string | 'all'

interface ClientCtx {
  clientId: ClientId
  setClientId: (id: ClientId) => void
}

const Ctx = createContext<ClientCtx>({ clientId: 'all', setClientId: () => {} })

// Per-user storage key so one user's selection can never leak into another
// user's session on a shared browser (the stale-clientId-across-logout bug).
const keyFor = (uid: string | undefined) => `tracque.client.${uid ?? 'anon'}`

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const uid = user?.id
  const [clientId, setClientIdState] = useState<ClientId>('all')

  // Re-hydrate the selection whenever the signed-in user changes (login,
  // logout, account switch). Defaults to 'all' for a user with no saved pick.
  useEffect(() => {
    const stored = localStorage.getItem(keyFor(uid)) as ClientId | null
    setClientIdState(stored || 'all')
  }, [uid])

  function setClientId(id: ClientId) {
    setClientIdState(id)
    localStorage.setItem(keyFor(uid), id)
  }

  return <Ctx.Provider value={{ clientId, setClientId }}>{children}</Ctx.Provider>
}

export function useSelectedClient() {
  return useContext(Ctx)
}
