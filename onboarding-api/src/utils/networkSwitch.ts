import { verifyEthWallet, verifySubstrateWallet } from '../controllers/auth/authenticateWallet'
import { SupportedNetworks } from '../database'
import { addCentInvestorToMemberList, validateSubstrateRemark } from './centrifuge'
import { addTinlakeInvestorToMemberList, validateEvmRemark } from './tinlake'

type Methods = 'verifyWallet' | 'validateRemark' | 'addInvestorToMemberList'

const methodByNetwork: Record<SupportedNetworks, Record<Methods, (...args) => any>> = {
  evm: {
    verifyWallet: verifyEthWallet,
    validateRemark: validateEvmRemark,
    addInvestorToMemberList: addTinlakeInvestorToMemberList,
  },
  substrate: {
    verifyWallet: verifySubstrateWallet,
    validateRemark: validateSubstrateRemark,
    addInvestorToMemberList: addCentInvestorToMemberList,
  },
  evmOnSubstrate: {
    verifyWallet: verifyEthWallet,
    validateRemark: validateSubstrateRemark,
    addInvestorToMemberList: addCentInvestorToMemberList,
  },
}

export const networkSwitch = (method: Methods, network: SupportedNetworks) => {
  return methodByNetwork[network][method]
}
