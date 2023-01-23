import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { EntityUser, OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { validateInput } from '../../utils/validateInput'

const kycInput = object({
  name: string().required(),
  dateOfBirth: string().required(),
  countryOfCitizenship: string().required(),
  poolId: string(),
  trancheId: string(),
})

export const startKycController = async (req: Request<any, any, InferType<typeof kycInput>>, res: Response) => {
  try {
    const { walletAddress, body } = req
    await validateInput(req, kycInput)
    const kycReference = `KYC_${Math.random()}`

    const userDoc = await userCollection.doc(walletAddress).get()
    let userData = userDoc.data() as OnboardingUser

    if (!userDoc.exists && (!body.poolId || !body.trancheId)) {
      throw new HttpsError(400, 'trancheId and poolId required for individual kyc')
    }

    if (body.poolId && body.trancheId) {
      userData = {
        kycReference,
        investorType: 'individual',
        wallet: {
          address: walletAddress,
          network: 'polkadot',
        },
        name: body.name,
        dateOfBirth: body.dateOfBirth,
        countryOfCitizenship: body.countryOfCitizenship,
        steps: {
          verifyIdentity: {
            completed: false,
            timeStamp: null,
          },
          signAgreements: {
            [body.poolId]: {
              [body.trancheId]: {
                completed: false,
                timeStamp: null,
              },
            },
          },
        },
        email: null,
      }
      await validateAndWriteToFirestore(walletAddress, userData, 'individual')
    } else {
      const updatedUser = {
        kycReference,
        name: body.name,
        countryOfCitizenship: body.countryOfCitizenship,
        dateOfBirth: body.dateOfBirth,
      }
      await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', [
        'name',
        'countryOfCitizenship',
        'dateOfBirth',
        'kycReference',
      ])
      const entityUserData = userDoc.data() as EntityUser
      if (entityUserData.steps.verifyIdentity.completed) {
        throw new HttpsError(400, 'Identity already verified')
      }
    }

    const payloadKYC = {
      reference: kycReference,
      callback_url: '',
      email: userData.email || '',
      country: userData.countryOfCitizenship,
      language: 'EN',
      redirect_url: '',
      verification_mode: 'any',
      document: {
        proof: '',
        supported_types: ['id_card'],
        name: '',
        dob: '',
        issue_date: '',
        expiry_date: '',
        document_number: '',
        age: '', // minimum age for someone doing KYC
      },
      // address: {
      //   proof: '',
      //   supported_types: ['id_card', 'bank_statement'],
      //   name: '',
      //   issue_date: '',
      //   full_address: '',
      //   address_fuzzy_match: '1',
      //   document_number: '',
      // },
    }
    const kyc = await shuftiProRequest(req, payloadKYC)
    return res.send({ ...kyc })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
