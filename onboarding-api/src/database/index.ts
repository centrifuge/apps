import { Firestore } from '@google-cloud/firestore'
import * as dotenv from 'dotenv'
import { array, bool, date, InferType, lazy, object, string, StringSchema } from 'yup'
import { HttpsError } from '../utils/httpsError'
import { Subset } from '../utils/types'

dotenv.config()

const uboSchema = object({
  name: string().required(),
  dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
})

const stepsSchema = object({
  verifyBusiness: object({
    completed: bool(),
    timeStamp: string().nullable(),
  }),
  verifyEmail: object({
    completed: bool(),
    timeStamp: string().nullable(),
  }),
  confirmOwners: object({
    completed: bool(),
    timeStamp: string().nullable(),
  }),
  taxInfo: object({
    completed: bool(),
    timeStamp: string().nullable(),
  }),
  verifyIdentity: object({
    completed: bool(),
    timeStamp: string().nullable(),
  }),
  signAgreements: lazy((value) => {
    const poolId = Object.keys(value)[0]
    if (typeof poolId === 'string') {
      return object({
        [poolId]: lazy((value) => {
          const trancheId = Object.keys(value)[0]
          if (typeof trancheId === 'string') {
            return object({
              [trancheId]: object({
                completed: bool(),
                timeStamp: string().nullable(),
              }),
            })
          }
          throw new Error('Bad trancheId')
        }),
      })
    }
    throw new Error('Bad poolId')
  }),
})

export const entityUserSchema = object({
  investorType: string() as StringSchema<'entity'>,
  walletAddress: string(),
  email: string().email(),
  businessName: string(),
  incorporationDate: date(),
  registrationNumber: string(),
  jurisdictionCode: string(),
  ultimateBeneficialOwners: array(uboSchema).max(3),
  steps: stepsSchema,
})

export const individualUserSchema = object({
  investorType: string() as StringSchema<'individual'>,
  walletAddress: string().required(),
  email: string(),
  steps: stepsSchema.pick(['verifyIdentity', 'signAgreements']),
})

export type EntityUser = InferType<typeof entityUserSchema>
export type IndividualUser = InferType<typeof individualUserSchema>
export type OnboardingUser = IndividualUser | EntityUser

export const firestore = new Firestore()
export const individualCollection = firestore.collection(`onboarding-individuals`)
export const entityCollection = firestore.collection(`onboarding-entities`)

const schemas = {
  ENTITY: {
    schema: entityUserSchema,
    collection: entityCollection,
  },
  INDIVIDUAL: {
    schema: individualUserSchema,
    collection: individualCollection,
  },
}

/**
 *
 * @param key primary key (documentID) for firestore collection
 * @param data data to be set to firestore
 * @param schemaKey name of the validation schema e.g BUSINESS or USER
 * @param mergeFields optional, pass a value to update data in an existing collection e.g steps.kyb.verified
 */
export const validateAndWriteToFirestore = async <T = undefined | string[]>(
  key: string,
  data: T extends 'undefined' ? OnboardingUser : Subset<OnboardingUser>,
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
