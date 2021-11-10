import { createContext, useContext } from 'react'
import { IpfsPools } from '../../config'

const IpfsPoolsContext = createContext<IpfsPools>({
  active: [],
  archived: [],
  upcoming: [],
  launching: [],
})

export const useIpfsPools = () => useContext(IpfsPoolsContext)

export const IpfsPoolsProvider = IpfsPoolsContext.Provider
