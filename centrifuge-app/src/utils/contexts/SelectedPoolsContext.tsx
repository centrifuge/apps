import { Pool } from '@centrifuge/centrifuge-js'
import React, { ReactNode, createContext, useContext, useState } from 'react'
import { PoolWithMetadata, useGetPoolsMetadata } from '../../components/Dashboard/utils'
import { usePoolsThatAnyConnectedAddressHasPermissionsFor } from '../usePermissions'

interface SelectedPoolsContextProps {
  selectedPoolIds: string[]
  selectedPoolsWithMetadata: PoolWithMetadata[]
  togglePoolIdSelection: (poolId: string) => void
  setSelectedPoolIds: React.Dispatch<React.SetStateAction<string[]>>
  clearSelectedPoolsIds: () => void
  pools: Pool[] | undefined
  poolsWithMetadata: PoolWithMetadata[]
}

const SelectedPoolsContext = createContext<SelectedPoolsContextProps | undefined>(undefined)

export const useSelectedPools = (defaultSelectAll: boolean = false): SelectedPoolsContextProps => {
  const context = useContext(SelectedPoolsContext)
  if (!context) {
    throw new Error('useSelectedPools must be used within a SelectedPoolsProvider')
  }

  const { pools, selectedPoolIds, setSelectedPoolIds } = context

  // If defaultSelectAll is true and nothing has been selected yet,
  // select all available pools on the first render.
  React.useEffect(() => {
    if (defaultSelectAll && pools && pools.length > 0 && selectedPoolIds.length === 0) {
      setSelectedPoolIds(pools.map((pool) => pool.id))
    }
  }, [defaultSelectAll, pools, selectedPoolIds, setSelectedPoolIds])

  return context
}

interface SelectedPoolsProviderProps {
  children: ReactNode
}

export const SelectedPoolsProvider = ({ children }: SelectedPoolsProviderProps) => {
  const pools = usePoolsThatAnyConnectedAddressHasPermissionsFor()
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
        selectedPoolsWithMetadata,
        togglePoolIdSelection,
        setSelectedPoolIds,
        clearSelectedPoolsIds,
        pools: pools ?? [],
        poolsWithMetadata,
      }}
    >
      {children}
    </SelectedPoolsContext.Provider>
  )
}
