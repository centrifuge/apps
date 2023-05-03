import { Request } from 'express'
import { addCentInvestorToMemberList } from './centrifuge'
import { addTinlakeInvestorToMemberList } from './tinlake'

export const addInvestorToMemberList = (wallet: Request['wallet'], poolId: string, trancheId: string) => {
  if (wallet.network === 'evm') {
    return addTinlakeInvestorToMemberList(wallet.address, poolId, trancheId)
  }
  return addCentInvestorToMemberList(wallet.address, poolId, trancheId)
}
