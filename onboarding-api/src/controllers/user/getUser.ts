import { Request, Response } from 'express'
import { fetchUser } from '../../utils/fetchUser'
import { reportHttpError } from '../../utils/httpError'

export const getUserController = async (req: Request, res: Response) => {
  try {
    const user = await fetchUser(req.wallet, { suppressError: true })
    return res.send(user)
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
