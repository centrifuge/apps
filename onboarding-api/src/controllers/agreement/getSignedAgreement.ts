import { Request, Response } from 'express'
import { signedAgreements } from '../../database'
import { HttpsError } from '../../utils/httpsError'

export const getSignedAgreementController = async (req: Request, res: Response) => {
  try {
    const { poolId, trancheId } = req.query
    const walletAddress = req.walletAddress

    const signedAgreement = await signedAgreements.file(`${walletAddress}/${poolId}/${trancheId}.pdf`)

    const [signedAgreementExists] = await signedAgreement.exists()

    if (signedAgreementExists) {
      const pdf = await signedAgreement.download()
      return res.send({ signedAgreement: pdf[0] })
    }

    throw new Error()
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
