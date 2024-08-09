import type { DataProtocolSession } from '@centrifuge/libp2p-test'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import * as React from 'react'
import { useMutation } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { useCentrifugeQuery } from '../../hooks/useCentrifugeQuery'
import { useCentrifugeTransaction } from '../../hooks/useCentrifugeTransaction'
import { useCentrifuge } from '../CentrifugeProvider'
import { useAddress } from '../WalletProvider'

export const DataProtocolContext = React.createContext<{
  session: DataProtocolSession | null
  isAuthed: boolean
  isLoading: boolean
  initSession: () => Promise<DataProtocolSession>
  initSessionAndAddKey: (batch: boolean) => Promise<null | SubmittableExtrinsic<'rxjs', any>>
}>({} as any)

export type DataProtocolProviderProps = {
  children: React.ReactNode
}

const PERSIST_KEY = 'centrifugeDataProtocolPersist'
function getStoredKey() {
  return localStorage.getItem(PERSIST_KEY)
}
function storeKey(key: string) {
  localStorage.setItem(PERSIST_KEY, key)
}

export function DataProtocolProvider({ children }: DataProtocolProviderProps) {
  const cent = useCentrifuge()
  const { mutateAsync, data, ...rest } = useMutation(async () => {
    const key = getStoredKey()
    if (key) {
      return cent.dataProtocol.createSession({ key })
    }
    const session = await cent.dataProtocol.createSession()
    storeKey(await session.privateKey.export(''))
    return session
  })

  const address = useAddress('substrate')
  const [keys] = useCentrifugeQuery(['keys', address], (cent) => cent.dataProtocol.getKeys([address!]), {
    enabled: !!address,
  })
  const { execute, isLoading, lastCreatedTransaction } = useCentrifugeTransaction(
    'Add key',
    (cent) => cent.dataProtocol.addKey
  )

  console.log('useMutation data', data, rest)
  const ctx = React.useMemo(() => {
    return {
      session: data ?? null,
      isAuthed: keys?.includes(data?.publicKeyHex ?? '') ?? false,
      isLoading: isLoading,
      initSession: async () => {
        if (data) return data
        return mutateAsync()
      },
      initSessionAndAddKey: async (batch = false) => {
        const sesh = data ?? (await mutateAsync())
        const { publicKeyHex } = sesh
        console.log('sesh', sesh, publicKeyHex)
        if (keys?.includes(publicKeyHex)) {
          if (batch) return null
        }
        if (batch) return firstValueFrom(cent.dataProtocol.addKey([publicKeyHex], { batch: true }))
        else execute([publicKeyHex])
      },
    }
  }, [])

  return <DataProtocolContext.Provider value={ctx}>{children}</DataProtocolContext.Provider>
}

export function useDataProtocol() {
  const ctx = React.useContext(DataProtocolContext)
  if (!ctx) throw new Error('useDataProtocol must be used within Provider')
  return ctx
}
