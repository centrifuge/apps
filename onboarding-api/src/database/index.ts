import { CollectionReference, DocumentData, Firestore } from '@google-cloud/firestore'
import * as dotenv from 'dotenv'
import { array, bool, date, InferType, object, string } from 'yup'
import { OptionalObjectSchema } from 'yup/lib/object'
import { HttpsError } from '../utils/httpsError'
import { Subset } from '../utils/types'

dotenv.config()

export const userSchema = object({
  walletAddress: string().required(),
  email: string().optional(),
  fullName: string(),
  dateOfBrith: date().min(new Date(1900, 0, 1)).max(new Date()),
  citizenship: string(),
  accreditedInvestor: bool(),
  taxInfo: string(),
  pools: array(
    object({
      investorType: string().oneOf(['individual', 'entity']),
      poolId: string(),
      trancheId: string(),
    })
  )
    .required()
    .min(1),
  businessId: string(),
  kycCompleted: bool(),
})

export const businessSchema = object({
  walletAddress: string().required(),
  email: string().email(),
  businessName: string(),
  incorporationDate: date(),
  registrationNumber: string(),
  jurisdictionCode: string(), // country of incorporation
  ultimateBeneficialOwners: array(
    object({
      name: string().required(),
      dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
    })
  ).max(3),
  emailVerified: bool(),
  kybCompleted: bool(),
})

const firestore = new Firestore()
export const businessCollection = firestore.collection('onboarding-businesses')
export const userCollection = firestore.collection('onboarding-users')

const schemas: Record<
  'BUSINESS' | 'USER',
  { schema: OptionalObjectSchema<any>; collection: CollectionReference<DocumentData> }
> = {
  BUSINESS: {
    schema: businessSchema,
    collection: businessCollection,
  },
  USER: {
    schema: userSchema,
    collection: userCollection,
  },
}

export type Business = InferType<typeof businessSchema>
export type User = InferType<typeof userSchema>

/**
 *
 * @param key primary key (documentID) for firestore collection
 * @param data data to be set to firestore
 * @param schema name of the validation schema e.g BUSINESS
 * @param mergeFields optional, pass a value to update data in an existing collection e.g steps.kyb.verified
 */
export const validateAndWriteToFirestore = async <T = undefined | string[]>(
  key: string,
  data: T extends 'undefined' ? Business : Subset<Business>,
  schema: keyof typeof schemas,
  mergeFields?: T
) => {
  try {
    const validationSchema = schemas[schema]
    if (typeof mergeFields !== 'undefined') {
      const mergeValidations = (mergeFields as unknown as string[]).map((field) =>
        validationSchema.schema.validateAt(field, data)
      )
      await Promise.all(mergeValidations)
      await validationSchema.collection.doc(key).set(data, { mergeFields: mergeFields as unknown as string[] })
    } else {
      await validationSchema.schema.validate(data)
      await validationSchema.collection.doc(key).set(data)
    }
  } catch (error) {
    // @ts-expect-error error typing
    throw new HttpsError('invalid-argument', error.message)
  }
}
