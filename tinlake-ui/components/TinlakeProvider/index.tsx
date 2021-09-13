import { createContext, useContext, useState } from 'react'
import { ContractAddresses, ITinlake } from '../../../tinlake.js/dist'
import { createTinlakeInstance } from '../../services/tinlake'

interface TinlakeProviderProps {
  addresses?: ContractAddresses
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
}

interface ITinlakeContext {
  tinlake: ITinlake | null
  setTinlake: (t: ITinlake) => void
}

const TinlakeContext = createContext<ITinlakeContext>({
  tinlake: null,
  setTinlake: () => {},
})

export const useTinlake = (arg?: TinlakeProviderProps): ITinlake => {
  const ctx = useContext(TinlakeContext)

  if (!ctx) throw new Error('useTinlake must be used within TinlakeProvider')

  if (arg) {
    const tinlake = createTinlakeInstance(arg)
    ctx.setTinlake(tinlake)
    return tinlake
  }

  if (!ctx.tinlake) throw Error('TinlakeContext was not initialized')
  return ctx.tinlake
}

export const TinlakeProvider: React.FC<TinlakeProviderProps> = ({ children, addresses, contractConfig }) => {
  const [tinlake, setTinlake] = useState<ITinlake>(createTinlakeInstance({ addresses, contractConfig }))

  const value = { tinlake, setTinlake }
  return <TinlakeContext.Provider value={value}>{children}</TinlakeContext.Provider>
}
