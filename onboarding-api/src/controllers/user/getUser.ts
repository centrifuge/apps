import { Request, Response } from 'express'
import { userCollection } from '../../database'
import { HttpsError } from '../../utils/httpsError'

export const getUserController = async (req: Request, res: Response) => {
  try {
    const user = (await userCollection.doc(req.walletAddress).get())?.data()
    return res.send({ user })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
