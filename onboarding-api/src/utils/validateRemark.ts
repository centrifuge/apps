import { Contract } from '@ethersproject/contracts'
import { InfuraProvider } from '@ethersproject/providers'
import { Request } from 'express'
import { firstValueFrom } from 'rxjs'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../controllers/emails/signAndSendDocuments'
import RemarkerAbi from './abi/Remarker.abi.json'
import { centrifuge } from './centrifuge'
import { HttpError } from './httpError'

export const validateRemark = async (
  wallet: Request['wallet'],
  transactionInfo: InferType<typeof signAndSendDocumentsInput>['transactionInfo'],
  expectedRemark: string
) => {
  const EVM_NETWORK = process.env.EVM_NETWORK
  const INFURA_KEY = process.env.INFURA_KEY
  const REMARKER_CONTRACT = process.env.REMARKER_CONTRACT
  if (wallet.network === 'substrate') {
    const block = await firstValueFrom(centrifuge.getBlockByBlockNumber(Number(transactionInfo.blockNumber)))
    const extrinsic = block?.block.extrinsics.find((extrinsic) => extrinsic.hash.toString() === transactionInfo.txHash)
    const actualRemark = extrinsic?.method.args[0].toHuman()

    if (actualRemark !== expectedRemark) {
      throw new HttpError(400, 'Invalid remark')
    }
  } else {
    const provider = new InfuraProvider(EVM_NETWORK, INFURA_KEY)
    const contract = new Contract(REMARKER_CONTRACT, RemarkerAbi).connect(provider)
    const filteredEvents = await contract.queryFilter(
      'Remarked',
      Number(transactionInfo.blockNumber),
      Number(transactionInfo.blockNumber)
    )

    const [sender, actualRemark] = filteredEvents.flatMap((ev) => ev.args?.map((arg) => arg.toString()))
    if (actualRemark !== expectedRemark || sender !== wallet.address) {
      throw new HttpError(400, 'Invalid remark')
    }
  }
}
