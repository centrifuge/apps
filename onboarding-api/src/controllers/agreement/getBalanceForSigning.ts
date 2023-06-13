import { Request, Response } from 'express'
import { checkBalanceBeforeSigningRemark } from '../../utils/centrifuge'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'

export const getBalanceForSigningController = async (req: Request, res: Response) => {
  try {
    const { wallet } = req
    const user = await fetchUser(wallet)
    if (!user.globalSteps.verifyIdentity.completed) {
      throw new HttpError(401, 'Unauthorized')
    }

    await checkBalanceBeforeSigningRemark(wallet)

    return res.status(201).end()
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
