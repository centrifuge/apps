import { CollectionReference, DocumentData, Firestore } from '@google-cloud/firestore'
import * as dotenv from 'dotenv'
import { array, bool, date, InferType, object, string } from 'yup'
import { OptionalObjectSchema } from 'yup/lib/object'
import { HttpsError } from '../utils/httpsError'
import { Subset } from '../utils/types'

dotenv.config()

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
    }), // business AML verified, KYB verified, and email verified
    kyc: object({
      verified: bool().default(false),
      users: array().default([]),
    }),
  }).required(),
  ultimateBeneficialOwners: array().of(
    object({
      name: string(),
    })
  ),
})

const firestore = new Firestore()
export const businessCollection = firestore.collection('businesses')

const schemas: Record<
  'BUSINESS',
  { schema: OptionalObjectSchema<any>; collection: CollectionReference<DocumentData> }
> = {
  BUSINESS: {
    schema: businessSchema,
    collection: businessCollection,
  },
}

export type BusinessOnboarding = InferType<typeof businessSchema>

/**
 *
 * @param key primary key (documentID) for firestore collection
 * @param data data to be set to firestore
 * @param schema name of the validation schema e.g BUSINESS
 * @param mergeFields optional, pass a value to update data in an existing collection e.g steps.kyb.verified
 */
export const validateAndWriteToFirestore = async <T = undefined | string[]>(
  key: string,
  data: T extends 'undefined' ? BusinessOnboarding : Subset<BusinessOnboarding>,
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
