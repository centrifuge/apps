import { Request, Response } from 'express'
import { InferType } from 'yup'
import { verifyEthWallet, verifySubstrateWallet } from '../../controllers/auth/authenticateWallet'
import { signAndSendDocumentsInput } from '../../controllers/emails/signAndSendDocuments'
import { SupportedNetworks } from '../../database'
import { addCentInvestorToMemberList, getCentPoolById, validateSubstrateRemark } from './centrifuge'
import { addTinlakeInvestorToMemberList, getTinlakePoolById, validateEvmRemark } from './tinlake'

export class NetworkSwitch {
  network: SupportedNetworks
  constructor(network: SupportedNetworks = 'substrate') {
    this.network = network
  }

  verifiyWallet = (req: Request, res: Response) => {
    if (this.network === 'substrate') {
      return verifySubstrateWallet(req, res)
    } else if (this.network === 'evm' || this.network === 'evmOnSubstrate') {
      return verifyEthWallet(req, res)
    } else {
      throw new Error('Unspported network')
    }
  }

  validateRemark = (
    wallet: Request['wallet'],
    transactionInfo: InferType<typeof signAndSendDocumentsInput>['transactionInfo'],
    expectedRemark: string
  ) => {
    if (this.network === 'evmOnSubstrate' || this.network === 'substrate') {
      return validateSubstrateRemark(wallet, transactionInfo, expectedRemark)
    } else if (this.network === 'evm') {
      return validateEvmRemark(wallet, transactionInfo, expectedRemark)
    } else {
      throw new Error('Unspported network')
    }
  }

  addInvestorToMemberList = async (wallet: Request['wallet'], poolId: string, trancheId: string) => {
    if (this.network === 'evmOnSubstrate' || this.network === 'substrate') {
      return addCentInvestorToMemberList(wallet, poolId, trancheId)
    } else if (this.network === 'evm') {
      return addTinlakeInvestorToMemberList(wallet, poolId, trancheId)
    } else {
      throw new Error('Unspported network')
    }
  }

  getPoolById = async (poolId: string) => {
    if (this.network === 'evmOnSubstrate' || this.network === 'substrate') {
      return getCentPoolById(poolId)
    } else if (this.network === 'evm') {
      return getTinlakePoolById(poolId)
    } else {
      throw new Error('Unspported network')
    }
  }
}
