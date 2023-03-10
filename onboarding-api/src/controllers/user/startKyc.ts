import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { IndividualUser, validateAndWriteToFirestore } from '../../database'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { validateInput } from '../../utils/validateInput'

const kycInput = object({
  name: string().required(),
  dateOfBirth: string().required(),
  countryOfCitizenship: string().required(),
  countryOfResidency: string().required(),
  poolId: string(),
  trancheId: string(),
})

export const startKycController = async (req: Request<any, any, InferType<typeof kycInput>>, res: Response) => {
  try {
    const { walletAddress, body } = req
    await validateInput(req.body, kycInput)

    const user = await fetchUser(walletAddress, { suppressError: true })

    if (!user && (!body.poolId || !body.trancheId)) {
      throw new HttpError(400, 'trancheId and poolId required for individual kyc')
    }

    if (
      user &&
      user.investorType === 'entity' &&
      !user.globalSteps.verifyEmail.completed &&
      !user.globalSteps.verifyBusiness.completed &&
      !user.globalSteps.confirmOwners.completed
    ) {
      throw new HttpError(400, 'Entities must complete verifyEmail, verifyBusiness, confirmOwners before starting KYC')
    }

    if (user && user.globalSteps.verifyIdentity.completed) {
      throw new HttpError(400, 'Identity already verified')
    }

    const kycReference = `KYC_${Math.random()}`
    if (body.poolId && body.trancheId) {
      const updatedUserData: IndividualUser = {
        investorType: 'individual',
        wallet: {
          address: walletAddress,
          network: 'polkadot',
        },
        kycReference,
        name: body.name,
        dateOfBirth: body.dateOfBirth,
        countryOfCitizenship: body.countryOfCitizenship,
        countryOfResidency: body.countryOfResidency,
        globalSteps: {
          verifyIdentity: {
            completed: false,
            timeStamp: null,
          },
          verifyEmail: {
            completed: false,
            timeStamp: null,
          },
          verifyAccreditation: { completed: false, timeStamp: null },
          verifyTaxInfo: { completed: false, timeStamp: null },
        },
        poolSteps: {
          [body.poolId]: {
            [body.trancheId]: {
              signAgreement: {
                completed: false,
                timeStamp: null,
                transactionInfo: {
                  extrinsicHash: null,
                  blockNumber: null,
                },
              },
              status: {
                status: null,
                timeStamp: null,
              },
            },
          },
        },
        email: null,
      }
      await validateAndWriteToFirestore(walletAddress, updatedUserData, 'individual')
    } else {
      const updatedUser = {
        name: body.name,
        countryOfCitizenship: body.countryOfCitizenship,
        countryOfResidency: body.countryOfResidency,
        dateOfBirth: body.dateOfBirth,
        kycReference,
      }
      await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', [
        'name',
        'countryOfCitizenship',
        'countryOfResidency',
        'dateOfBirth',
        'kycReference',
      ])
    }

    const payloadKYC = {
      reference: kycReference,
      callback_url: '',
      email: user?.email ?? '',
      country: body.countryOfCitizenship,
      language: 'EN',
      redirect_url: '',
      verification_mode: 'any',
      allow_offline: '1',
      show_feedback_form: '0',
      ttl: 1800, // 30 minutes: time in seconds for the verification url to stay active
      face: {
        proof: '',
        allow_offline: '1', // TODO: disable once we go live
        check_duplicate_request: '0', // TODO: enable once we go live
      },
      document: {
        proof: '',
        supported_types: ['id_card', 'passport', 'driving_license'],
        dob: body.dateOfBirth,
        name: {
          full_name: body.name,
        },
      },
      address: {
        proof: '',
        supported_types: ['any'],
        name: {
          full_name: body.name,
        },
        address_fuzzy_match: '1',
        show_ocr_form: '1',
      },
    }
    const kyc = await shuftiProRequest(req, payloadKYC)
    return res.send({ ...kyc })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
