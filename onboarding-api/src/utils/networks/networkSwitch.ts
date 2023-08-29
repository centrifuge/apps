import { Request, Response } from 'express'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../../controllers/emails/signAndSendDocuments'
import { SupportedNetworks } from '../../database'
import { HttpError } from '../httpError'
import {
  addCentInvestorToMemberList,
  getCentPoolById,
  validateSubstrateRemark,
  verifySubstrateWallet,
} from './centrifuge'
import { validateEvmRemark, verifyEvmWallet } from './evm'
import { addTinlakeInvestorToMemberList, getTinlakePoolById } from './tinlake'

export class NetworkSwitch {
  network: SupportedNetworks
  constructor(network: SupportedNetworks = 'substrate') {
    this.network = network
  }

  verifiyWallet = (req: Request, res: Response) => {
    if (this.network === 'substrate') {
      return verifySubstrateWallet(req, res)
    } else if (this.network === 'evm' || this.network === 'evmOnSubstrate') {
      return verifyEvmWallet(req, res)
    }
    throw new HttpError(404, 'Unsupported network')
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
    throw new HttpError(404, 'Unsupported network')
  }

  addInvestorToMemberList = async (wallet: Request['wallet'], poolId: string, trancheId: string) => {
    if (this.network === 'evm' && poolId.startsWith('0x')) {
      return addTinlakeInvestorToMemberList(wallet, poolId, trancheId)
    }
    return addCentInvestorToMemberList(wallet, poolId, trancheId)
  }

  getPoolById = async (poolId: string) => {
    if (this.network === 'evm' && poolId.startsWith('0x')) {
      return getTinlakePoolById(poolId)
    }
    return getCentPoolById(poolId)
  }
}
