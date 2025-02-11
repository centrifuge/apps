import { Pool } from '@centrifuge/centrifuge-js'
import React, { ReactNode, createContext, useContext, useState } from 'react'
import { usePoolsThatAnyConnectedAddressHasPermissionsFor } from '../usePermissions'

interface SelectedPoolsContextProps {
  selectedPools: string[]
  togglePoolSelection: (poolId: string) => void
  setSelectedPools: React.Dispatch<React.SetStateAction<string[]>>
  clearSelectedPools: () => void
  pools: Pool[] | undefined
}

const SelectedPoolsContext = createContext<SelectedPoolsContextProps | undefined>(undefined)

export const useSelectedPools = (): SelectedPoolsContextProps => {
  const context = useContext(SelectedPoolsContext)
  if (!context) {
    throw new Error('useSelectedPools must be used within a SelectedPoolsProvider')
  }
  return context
}

interface SelectedPoolsProviderProps {
  children: ReactNode
}

export const SelectedPoolsProvider = ({ children }: SelectedPoolsProviderProps) => {
  const pools = usePoolsThatAnyConnectedAddressHasPermissionsFor()
  const [selectedPools, setSelectedPools] = useState<string[]>([])

  const togglePoolSelection = (poolId: string) => {
    setSelectedPools((prevSelected) =>
      prevSelected.includes(poolId) ? prevSelected.filter((id) => id !== poolId) : [...prevSelected, poolId]
    )
  }

  const clearSelectedPools = () => {
    setSelectedPools([])
  }

  return (
    <SelectedPoolsContext.Provider
      value={{ selectedPools, togglePoolSelection, setSelectedPools, clearSelectedPools, pools: pools ?? [] }}
    >
      {children}
    </SelectedPoolsContext.Provider>
  )
}
