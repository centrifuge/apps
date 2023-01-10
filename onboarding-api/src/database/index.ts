import { CollectionReference, DocumentData, Firestore } from '@google-cloud/firestore'
import * as dotenv from 'dotenv'
import { array, bool, date, InferType, object, string } from 'yup'
import { OptionalObjectSchema } from 'yup/lib/object'
import { HttpsError } from '../utils/httpsError'
import { Subset } from '../utils/types'

dotenv.config()

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

const firestore = new Firestore()
export const businessCollection = firestore.collection(`onboarding-business`)
export const userCollection = firestore.collection(`onboarding-users`)

const schemas: Record<
  'BUSINESS' | 'USER',
  {
    schema: OptionalObjectSchema<any>
    collection: CollectionReference<DocumentData>
  }
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
 * @param schemaKey name of the validation schema e.g BUSINESS or USER
 * @param mergeFields optional, pass a value to update data in an existing collection e.g steps.kyb.verified
 */
export const validateAndWriteToFirestore = async <T = undefined | string[]>(
  key: string,
  data: T extends 'undefined' ? Business : Subset<Business>,
  schemaKey: keyof typeof schemas,
  mergeFields?: T
) => {
  try {
    const { collection, schema } = schemas[schemaKey]
    if (typeof mergeFields !== 'undefined') {
      const mergeValidations = (mergeFields as unknown as string[]).map((field) => schema.validateAt(field, data))
      await Promise.all(mergeValidations)
      await collection.doc(key).set(data, { mergeFields: mergeFields as unknown as string[] })
    } else {
      await schema.validate(data)
      await collection.doc(key).set(data)
    }
  } catch (error) {
    // @ts-expect-error error typing
    throw new HttpsError(400, error.message)
  }
}
