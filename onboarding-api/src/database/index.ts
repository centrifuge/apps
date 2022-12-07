import * as admin from 'firebase-admin'
import { HttpsError } from 'firebase-functions/v1/auth'
import { array, bool, date, InferType, object, string } from 'yup'

admin.initializeApp()
const { firestore } = admin

export const businessSchema = object({
  lastUpdated: date().required(),
  address: string().required(),
  email: string().email().required(),
  businessName: string().required(),
  trancheId: string().required(),
  poolId: string().required(),
  steps: object({
    email: object({
      verified: bool().default(false),
      verificationCode: string(),
    }),
    kyb: object({
      verified: bool().default(false),
      verificationCode: string(),
    }), // business AML verified, KYB verified, and email verified
    kyc: object({
      verified: bool().default(false),
      users: array().default([]),
    }),
  }).required(),
})

export const businessCollection = firestore().collection('businesses')

const schemas: Record<'BUSINESS', any> = {
  BUSINESS: { schema: businessSchema, collection: businessCollection },
}

export type BusinessOnboarding = InferType<typeof businessSchema>

export const validateAndWriteToFirestore = async (
  key: string,
  data: BusinessOnboarding,
  schema: keyof typeof schemas
) => {
  try {
    await schemas[schema].schema.validate(data)
    await schemas[schema].collection.doc(key).set(data)
  } catch (error) {
    if (error instanceof HttpsError) {
      throw new HttpsError('invalid-argument', error.message)
    }
    throw new HttpsError('internal', 'An unknown error occured')
  }
}

export { firestore }
