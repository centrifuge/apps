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

    const userDoc = await userCollection.doc(walletAddress).get()
    let userData = userDoc.data() as OnboardingUser

    if (!userDoc.exists && (!body.poolId || !body.trancheId)) {
      throw new HttpsError(400, 'trancheId and poolId required for individual kyc')
    }

    if (body.poolId && body.trancheId) {
      userData = {
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
                // poolId: body.poolId
                // trancheId: body.trancheId
              },
            },
          },
        },
        email: null,
      }
      await validateAndWriteToFirestore(walletAddress, userData, 'individual')
    } else {
      const updatedUser = {
        name: body.name,
        countryOfCitizenship: body.countryOfCitizenship,
        dateOfBirth: body.dateOfBirth,
      }
      await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', [
        'name',
        'countryOfCitizenship',
        'dateOfBirth',
      ])
      const entityUserData = userDoc.data() as EntityUser
      if (entityUserData.steps.verifyIdentity.completed) {
        throw new HttpsError(400, 'Identity already verified')
      }
    }

    /**
     *
     * Face Verification, {face: {}}
     * Address  Verification, {address: {}}
     * Document Verification, {document: {}}
     *    Document Issue Date,
     *    Document Expiry Date,
     *    Document Number
     *    Name Verification,
     *    Dob Verification,
     *
     * OCR = confirmation dialog, make sure scanned info is correct
     */

    const payloadKYC = {
      reference: `KYC_${walletAddress}`,
      callback_url: '',
      email: userData.email || '',
      country: userData.countryOfCitizenship,
      language: 'EN',
      redirect_url: '',
      verification_mode: 'any',
      face: {
        proof: '',
        allow_offline: '1',
        check_duplicate_request: '1',
      },
      document: {
        proof: '',
        supported_types: ['id_card'],
        dob: body.dateOfBirth,
        issue_date: '',
        expiry_date: '',
        document_number: '',
        age: '',
        name: {
          full_name: body.name,
        },
      },
      address: {
        proof: '',
        supported_types: ['id_card', 'bank_statement', 'envelope'],
        name: {
          full_name: body.name,
        },
        issue_date: '',
        full_address: '',
        address_fuzzy_match: '1',
        backside_proof_required: '0',
        show_ocr_form: '1',
      },
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
