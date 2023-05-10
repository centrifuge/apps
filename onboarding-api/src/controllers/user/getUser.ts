import { Request, Response } from 'express'
import { fetchUser } from '../../utils/fetchUser'
import { reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'

export const getUserController = async (req: Request, res: Response) => {
  try {
    const user = await fetchUser(req.wallet, { suppressError: true })

    if (!user) {
      return res.send(null)
    }

    let status

    if (user.investorType === 'entity' && user.manualKybReference) {
      status = await shuftiProRequest({ reference: user.manualKybReference }, { path: 'status' })
    }

    return res.send({
      ...user,
      ...(status && { manualKybStatus: status.event }),
    })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
