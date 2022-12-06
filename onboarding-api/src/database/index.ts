import * as admin from 'firebase-admin'
import { bool, date, InferType, object, string } from 'yup'

export const userSchema = object({
  lastUpdated: date().required(),
  address: string().required(),
  email: string().email().required(),
  businessName: string().required(),
  trancheId: string().required(),
  poolId: string().required(),
  stepsCompleted: object({
    businessInfoVerified: bool().default(false),
    emailConfirmed: bool().default(false),
    businessOwnershipConfirmed: bool().default(false), // email must be verified
    authorizedSignerVerified: bool().default(false),
    taxInfoUploaded: bool().default(false),
    subscriptionSigned: bool().default(false),
  }).required(),
})

admin.initializeApp()
const { firestore } = admin

const schemas: Record<string, any> = {
  USER: userSchema,
}

export type OnboardingUser = InferType<typeof userSchema>

export const validateAndWriteToFirestore = async (key: string, data: OnboardingUser, schema: keyof typeof schemas) => {
  const userCollection = firestore().collection('users')
  await schemas[schema].validate(data)
  await userCollection.doc(key).set(data)
}

export { firestore }
