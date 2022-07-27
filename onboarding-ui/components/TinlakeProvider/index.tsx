import React, { createContext, useContext, useMemo } from 'react'
import { ContractAddresses, ContractVersions, ITinlake } from '../../../tinlake.js/dist'
import { initTinlake } from '../../services/tinlake'

interface TinlakeProviderProps {
  addresses?: ContractAddresses
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
  contractVersions?: ContractVersions
}

const TinlakeContext = createContext<ITinlake | null>(null)

export const useTinlake = (): ITinlake => {
  const ctx = useContext(TinlakeContext)
  if (!ctx) throw new Error('useTinlake must be used within TinlakeProvider')
  return ctx
}

export const TinlakeProvider: React.FC<TinlakeProviderProps> = ({
  children,
  addresses,
  contractConfig,
  contractVersions,
}) => {
  const tinlake = useMemo(
    () => initTinlake({ addresses, contractConfig, contractVersions }),
    [addresses, contractConfig, contractVersions]
  )

  return <TinlakeContext.Provider value={tinlake}>{children}</TinlakeContext.Provider>
}
