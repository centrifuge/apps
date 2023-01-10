import { Request, Response } from 'express'
import { Business, businessCollection } from '../../database'
import { HttpsError } from '../../utils/httpsError'

export const getBusinessController = async (req: Request, res: Response) => {
  try {
    const business = (await businessCollection.doc(req.walletAddress).get()).data() as Business
    return res.send({ business })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
