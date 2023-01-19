import { Request, Response } from 'express'
import { entityCollection, individualCollection } from '../../database'
import { HttpsError } from '../../utils/httpsError'

export const getUserController = async (req: Request, res: Response) => {
  try {
    const entityUser = (await entityCollection.doc(req.walletAddress).get())?.data()
    const individualUser = (await individualCollection.doc(req.walletAddress).get())?.data()
    return res.send({ ...(entityUser ?? individualUser ?? {}) })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
