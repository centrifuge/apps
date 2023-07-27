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
    }
    throw new Error('Unsupported network')
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
    }
    throw new Error('Unsupported network')
  }

  addInvestorToMemberList = async (wallet: Request['wallet'], poolId: string, trancheId: string) => {
    if (this.network === 'evmOnSubstrate' || this.network === 'substrate') {
      return addCentInvestorToMemberList(wallet, poolId, trancheId)
    } else if (this.network === 'evm') {
      return addTinlakeInvestorToMemberList(wallet, poolId, trancheId)
    }
    throw new Error('Unsupported network')
  }

  getPoolById = async (poolId: string) => {
    if (this.network === 'evmOnSubstrate' || this.network === 'substrate') {
      return getCentPoolById(poolId)
    } else if (this.network === 'evm') {
      return getTinlakePoolById(poolId)
    }
    throw new Error('Unsupported network')
  }
}
