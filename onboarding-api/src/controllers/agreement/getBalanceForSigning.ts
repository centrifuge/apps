import { Request, Response } from 'express'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { checkBalanceBeforeSigningRemark } from '../../utils/networks/centrifuge'

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
