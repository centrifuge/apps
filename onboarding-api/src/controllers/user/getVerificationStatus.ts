import { Request, Response } from 'express'
import { fetchUser } from '../../utils/fetchUser'
import { reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'

export const getVerificationStatusController = async (req: Request, res: Response) => {
  try {
    const user = await fetchUser(req.wallet)

    let reference

    if (req.body.verificationType === 'kyb' && user.investorType === 'entity') {
      reference = user.manualKybReference
    }

    if (req.body.verificationType === 'kyc') {
      reference = user.kycReference
    }

    const status = await shuftiProRequest({ reference }, { path: 'status', dryRun: false })

    return res.send(status.event)
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
