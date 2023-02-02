import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import * as dotenv from 'dotenv'
import { array, bool, date, InferType, lazy, object, string, StringSchema } from 'yup'
import { HttpsError } from '../utils/httpsError'
import { Subset } from '../utils/types'

dotenv.config()

type Individual = 'individual'
type Entity = 'entity'
export type InvestorType = Individual | Entity

export type SupportedNetworks = 'polkadot'

const uboSchema = object({
  name: string().required(),
  dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
})

const walletSchema = object({
  address: string().required(),
  network: string().required().default('polkadot') as StringSchema<SupportedNetworks>,
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
  verifyTaxInfo: object({
    completed: bool(),
    timeStamp: string().nullable(),
  }),
  verifyAccreditation: object({
    completed: bool(),
    timeStamp: string().nullable(),
  }),
  verifyIdentity: object({
    completed: bool(),
    timeStamp: string().nullable(),
  }),
  signAgreements: lazy((value) => {
    const poolId = Object.keys(value)[0]
    if (typeof poolId !== 'string') {
      throw new Error('Bad poolId')
    }
    return object({
      [poolId]: lazy((value) => {
        const trancheId = Object.keys(value)[0]
        if (typeof trancheId !== 'string') {
          throw new Error('Bad trancheId')
        }
        return object({
          [trancheId]: object({
            completed: bool(),
            timeStamp: string().nullable(),
          }),
        })
      }),
    })
  }),
})

export const entityUserSchema = object({
  investorType: string().default('entity') as StringSchema<Entity>,
  wallet: walletSchema,
  kycReference: string().optional(),
  email: string().email().default(null),
  businessName: string().required(),
  incorporationDate: date().required(),
  registrationNumber: string().required(),
  jurisdictionCode: string().required(),
  ultimateBeneficialOwners: array(uboSchema).max(3),
  name: string().nullable().default(null),
  dateOfBirth: string().nullable().default(null),
  countryOfCitizenship: string().nullable().default(null), // TODO: validate with list of countries
  steps: stepsSchema,
})

export const individualUserSchema = object({
  investorType: string().default('individual') as StringSchema<Individual>,
  wallet: walletSchema,
  kycReference: string().optional(),
  email: string().default(null).nullable(),
  name: string().nullable().default(null),
  dateOfBirth: string().nullable().default(null),
  countryOfCitizenship: string().nullable().default(null), // TODO: validate with list of countries
  steps: stepsSchema.pick(['verifyIdentity', 'verifyAccreditation', 'verifyTaxInfo', 'signAgreements']),
})

export type EntityUser = InferType<typeof entityUserSchema>
export type IndividualUser = InferType<typeof individualUserSchema>
export type OnboardingUser = IndividualUser | EntityUser

export const firestore = new Firestore()
export const userCollection = firestore.collection(`onboarding-users`)

export const storage = new Storage()
export const onboardingBucket = storage.bucket('onboarding-api-dev')

const schemas: Record<InvestorType, Record<'schema' | 'collection', any>> = {
  entity: {
    schema: entityUserSchema,
    collection: userCollection,
  },
  individual: {
    schema: individualUserSchema,
    collection: userCollection,
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
      const mergeValidations = (mergeFields as string[]).map((field) => schema.validateAt(field, data))
      await Promise.all(mergeValidations)
      await collection.doc(key).set(data, { mergeFields: mergeFields as string[] })
    } else {
      await schema.validate(data)
      await collection.doc(key).set(data)
    }
  } catch (error) {
    // @ts-expect-error error typing
    throw new HttpsError(400, error.message)
  }
}

/**
 *
 * @param signedAgreement signed agreement pdf
 * @param walletAddress wallet address of investor
 * @param poolId poolId of the pool
 * @param trancheId trancheId of the tranche
 */
export const writeToOnboardingBucket = async (document: Uint8Array, path: string) => {
  try {
    const blob = onboardingBucket.file(path)
    const blobStream = blob.createWriteStream({
      resumable: false,
    })

    blobStream.end(document)

    return new Promise((resolve, reject) => {
      blobStream.on('finish', () => {
        resolve(true)
      })
      blobStream.on('error', (err) => {
        reject(err)
      })
    })
  } catch (error) {
    // @ts-expect-error error typing
    throw new HttpsError(400, error.message)
  }
}
