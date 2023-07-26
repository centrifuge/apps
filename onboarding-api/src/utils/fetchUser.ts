import { Request } from 'express'
import { OnboardingUser, SupportedNetworks, userCollection } from '../database'
import { HttpError, reportHttpError } from './httpError'

type Options = { suppressError?: boolean }

type OptionsOrNever<T> = T extends Options ? T : never
type UserOrNull<T> = T extends Options ? OnboardingUser | null : OnboardingUser

const supportedNetworks: SupportedNetworks[] = ['evm', 'evmOnSubstrate', 'substrate']

export async function fetchUser<T>(wallet: Request['wallet'], options?: OptionsOrNever<T>): Promise<UserOrNull<T>> {
  try {
    if (supportedNetworks.includes(wallet.network) === false) {
      throw new HttpError(404, 'Unsupported network')
    }
    const userSnapshot = await userCollection.where(`wallets.${wallet.network}`, 'array-contains', wallet.address).get()

    if (userSnapshot.empty) {
      if (options?.suppressError) {
        return null as UserOrNull<T>
      }
      throw new Error("User doesn't exist")
    }
    return userSnapshot.docs.map((doc) => doc.data())[0] as UserOrNull<T>
  } catch (error) {
    reportHttpError(error)
    throw new HttpError(401, 'Not allowed')
  }
}
