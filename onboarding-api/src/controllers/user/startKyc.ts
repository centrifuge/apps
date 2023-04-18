import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { IndividualUser, validateAndWriteToFirestore } from '../../database'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { validateInput } from '../../utils/validateInput'

const kycInput = object({
  name: string().required(),
  email: string().email(),
  dateOfBirth: string().required(),
  countryOfCitizenship: string().required(),
  countryOfResidency: string().required(),
})

export const startKycController = async (req: Request<any, any, InferType<typeof kycInput>>, res: Response) => {
  try {
    const { wallet, body } = req
    await validateInput(req.body, kycInput)

    const userData = await fetchUser(wallet, { suppressError: true })

    if (!userData && !body.email) {
      throw new HttpError(400, 'email required for individual kyc')
    }

    // entity user will already be created when starting KYC
    if (
      userData?.investorType === 'entity' &&
      !userData.globalSteps.verifyEmail.completed &&
      !userData.globalSteps.verifyBusiness.completed &&
      !userData.globalSteps.confirmOwners.completed
    ) {
      throw new HttpError(400, 'Entities must complete verifyEmail, verifyBusiness, confirmOwners before starting KYC')
    }

    if (userData?.globalSteps.verifyIdentity.completed) {
      throw new HttpError(400, 'Identity already verified')
    }

    const kycReference = `KYC_${Math.random()}`

    if (userData) {
      const updatedUser = {
        name: body.name,
        countryOfCitizenship: body.countryOfCitizenship,
        countryOfResidency: body.countryOfResidency,
        dateOfBirth: body.dateOfBirth,
        kycReference,
      }
      await validateAndWriteToFirestore(wallet, updatedUser, 'entity', [
        'name',
        'countryOfCitizenship',
        'countryOfResidency',
        'dateOfBirth',
        'kycReference',
      ])
    } else {
      const newUser: IndividualUser = {
        investorType: 'individual',
        address: null,
        wallet: [req.wallet],
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
        poolSteps: {},
        email: body.email as string,
      }
      await validateAndWriteToFirestore(wallet, newUser, 'individual')
    }

    const payloadKYC = {
      reference: kycReference,
      callback_url: '',
      email: userData?.email ?? '',
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
