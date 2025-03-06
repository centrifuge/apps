import { Pool } from '@centrifuge/centrifuge-js'
import React, { ReactNode, createContext, useContext, useState } from 'react'
import { PoolWithMetadata, useGetPoolsMetadata } from '../../components/Dashboard/utils'
import { usePoolsThatAnyConnectedAddressHasPermissionsFor } from '../usePermissions'
import { usePools } from '../usePools'

interface SelectedPoolsContextProps {
  selectedPoolIds: string[]
  selectedPoolsWithMetadata: PoolWithMetadata[]
  togglePoolIdSelection: (poolId: string) => void
  setSelectedPoolIds: React.Dispatch<React.SetStateAction<string[]>>
  clearSelectedPoolsIds: () => void
  pools: Pool[] | undefined // pools that the user has permissions for
  poolsWithMetadata: PoolWithMetadata[] // pools with metadata that the user has permissions for
}

const SelectedPoolsContext = createContext<SelectedPoolsContextProps | undefined>(undefined)

export const useSelectedPools = (defaultSelectAll: boolean = false): SelectedPoolsContextProps => {
  const context = useContext(SelectedPoolsContext)
  if (!context) {
    throw new Error('useSelectedPools must be used within a SelectedPoolsProvider')
  }

  React.useEffect(() => {
    if (defaultSelectAll && context.pools?.length && context.pools.length > 0) {
      context.setSelectedPoolIds(context.pools.map((pool) => pool.id))
    }
  }, [])

  return context
}

interface SelectedPoolsProviderProps {
  children: ReactNode
}

export const SelectedPoolsProvider = ({ children }: SelectedPoolsProviderProps) => {
  const pools = usePools()
  const a = usePoolsThatAnyConnectedAddressHasPermissionsFor()
  const poolsWithMetadata = useGetPoolsMetadata(pools || [])
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([])
  const selectedPoolsWithMetadata = poolsWithMetadata.filter((pool) => selectedPoolIds.includes(pool.id))

  const togglePoolIdSelection = (poolId: string) => {
    setSelectedPoolIds((prevSelected) =>
      prevSelected.includes(poolId) ? prevSelected.filter((id) => id !== poolId) : [...prevSelected, poolId]
    )
  }

  const clearSelectedPoolsIds = () => {
    setSelectedPoolIds([])
  }

  return (
    <SelectedPoolsContext.Provider
      value={{
        selectedPoolIds,
        togglePoolIdSelection,
        setSelectedPoolIds,
        clearSelectedPoolsIds,
        pools: pools ?? [],
        poolsWithMetadata,
        selectedPoolsWithMetadata,
      }}
    >
      {children}
    </SelectedPoolsContext.Provider>
  )
}
