import { Request, Response } from 'express'
import { object, string } from 'yup'
import { unsignedAgreements } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'

type Params = {
  poolId: string
  trancheId: string
}

const getUnsignedAgreementInput = object({
  poolId: string().required(),
  trancheId: string().required(),
})

export const getUnsignedAgreementController = async (req: Request<{}, {}, {}, Params>, res: Response) => {
  try {
    await validateInput(req.query, getUnsignedAgreementInput)
    const { poolId, trancheId } = req.query
    const unsignedAgreement = await unsignedAgreements.file(`${poolId}/${trancheId}.pdf`)

    const [unsignedAgreementExists] = await unsignedAgreement.exists()

    if (unsignedAgreementExists) {
      const pdf = await unsignedAgreement.download()
      return res.send({ unsignedAgreement: pdf[0] })
    }

    throw new HttpsError(400, 'Agreement not found')
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
