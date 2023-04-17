import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import * as dotenv from 'dotenv'
import { Request } from 'express'
import { array, bool, date, InferType, lazy, mixed, object, string, StringSchema } from 'yup'
import { HttpError } from '../utils/httpError'
import { Subset, SupportedNetworks } from '../utils/types'

dotenv.config()

type Individual = 'individual'
type Entity = 'entity'
export type InvestorType = Individual | Entity

const uboSchema = object({
  name: string().required(),
  dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
  countryOfResidency: string().required(),
  countryOfCitizenship: string().required(),
})

const walletSchema = array()
  .of(
    object({
      address: string().required(),
      network: string().required() as StringSchema<SupportedNetworks>,
    })
  )
  .required()
export type Wallet = InferType<typeof walletSchema>

const poolSpecificStepsSchema = object({
  signAgreement: object({
    completed: bool(),
    timeStamp: string().nullable(),
    transactionInfo: object({
      extrinsicHash: string().nullable(),
      blockNumber: string().nullable(),
    }),
  }),
  status: object({
    status: mixed().nullable().oneOf(['approved', 'rejected', 'pending', null]),
    timeStamp: string().nullable(),
  }),
})

const poolStepsSchema = lazy((value) => {
  const poolId = Object.keys(value)[0]
  if (poolId && typeof poolId !== 'string') throw new Error('Bad poolId')
  if (!poolId) return object({})
  return object({
    [poolId]: lazy((value) => {
      const trancheId = Object.keys(value)[0]
      if (trancheId && typeof trancheId !== 'string') throw new Error('Bad trancheId')
      return object({
        [trancheId]: poolSpecificStepsSchema,
      })
    }),
  })
})

const globalStepsSchema = object({
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
})

export const entityUserSchema = object({
  investorType: string().default('entity') as StringSchema<Entity>,
  wallet: walletSchema,
  kycReference: string().optional(),
  email: string().email().required(),
  businessName: string().required(),
  registrationNumber: string().required(),
  jurisdictionCode: string().required(),
  ultimateBeneficialOwners: array(uboSchema).max(3),
  name: string().nullable().default(null),
  dateOfBirth: string().nullable().default(null),
  countryOfCitizenship: string().nullable().default(null), // TODO: validate with list of countries
  countryOfResidency: string().nullable().default(null), // TODO: validate with list of countries
  globalSteps: globalStepsSchema,
  poolSteps: poolStepsSchema,
  address: string().nullable().default(null),
})

export const individualUserSchema = object({
  investorType: string().default('individual') as StringSchema<Individual>,
  wallet: walletSchema,
  kycReference: string().optional(),
  email: string().default(null).nullable(), // TODO: coming soon
  name: string().required(),
  dateOfBirth: string().required(),
  countryOfCitizenship: string().required(), // TODO: validate with list of countries
  countryOfResidency: string().required(), // TODO: validate with list of countries
  globalSteps: globalStepsSchema.pick(['verifyIdentity', 'verifyAccreditation', 'verifyTaxInfo', 'verifyEmail']),
  poolSteps: poolStepsSchema,
  address: string().nullable().default(null),
})

export type EntityUser = InferType<typeof entityUserSchema>
export type IndividualUser = InferType<typeof individualUserSchema>
export type OnboardingUser = IndividualUser | EntityUser

export const firestore = new Firestore()
export const userCollection = firestore.collection(`onboarding-users`)

export const storage = new Storage()
export const onboardingBucket = storage.bucket('centrifuge-onboarding-api-dev') // TODO: make an env variable

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
 * @param mergeFields optional, pass a value to update data in an existing collection
 */
export const validateAndWriteToFirestore = async <T = undefined | string[]>(
  wallet: Request['wallet'],
  data: T extends 'undefined' ? OnboardingUser : Subset<OnboardingUser>,
  schemaKey: keyof typeof schemas,
  mergeFields?: T
) => {
  try {
    const { collection, schema } = schemas[schemaKey]
    // mergeFields implies that the user has already been created
    if (typeof mergeFields !== 'undefined') {
      const mergeValidations = (mergeFields as string[]).map((field) => schema.validateAt(field, data))
      const userSnapshot = await userCollection.where(`wallet`, 'array-contains', wallet).get()
      if (userSnapshot.empty) {
        throw new Error('User not found')
      }
      const key = userSnapshot.docs[0].id
      await Promise.all(mergeValidations)
      await collection.doc(key).set(data, { mergeFields: mergeFields as string[] })
    } else {
      await schema.validate(data)
      await collection.doc(wallet.address).set(data)
    }
  } catch (error) {
    // @ts-expect-error error typing
    throw new HttpError(400, error?.message || 'Validation or write error')
  }
}

/**
 *
 * @param document document as Uint8Array to be uploaded
 * @param path path to the file in the bucket
 */
export const writeToOnboardingBucket = async (document: Uint8Array, path: string): Promise<boolean> => {
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
    throw new HttpError(400, error?.message || 'Error uploading to bucket')
  }
}
