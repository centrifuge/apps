import { firstValueFrom } from 'rxjs'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../controllers/emails/signAndSendDocuments'
import { centrifuge } from './centrifuge'
import { HttpError } from './HttpError'

export const validateRemark = async (
  transactionInfo: InferType<typeof signAndSendDocumentsInput>['transactionInfo'],
  expectedRemark: string
) => {
  const block = await firstValueFrom(centrifuge.getBlockByBlockNumber(Number(transactionInfo.blockNumber)))
  const extrinsic = block?.block.extrinsics.find(
    (extrinsic) => extrinsic.hash.toString() === transactionInfo.extrinsicHash
  )
  const actualRemark = extrinsic?.method.args[0].toHuman()

  if (actualRemark !== expectedRemark) {
    throw new HttpError(400, 'Invalid remark')
  }
}
