import { OnboardingUser, userCollection } from '../database'
import { HttpError } from './httpError'

type Options = { suppressError?: boolean }

type OptionsOrNever<T> = T extends Options ? T : never
type UserOrNull<T> = T extends Options ? OnboardingUser | null : OnboardingUser

export async function fetchUser<T>(walletAddress: string, options?: OptionsOrNever<T>): Promise<UserOrNull<T>> {
  try {
    const userDoc = await userCollection.doc(walletAddress).get()
    if (!userDoc.exists) {
      if (options && options.suppressError) {
        return null as UserOrNull<T>
      }
      throw new Error("User doesn't exist")
    }
    return userDoc.data() as UserOrNull<T>
  } catch (error) {
    console.error('Firestore error:', JSON.stringify(error))
    throw new HttpError(401, 'Not allowed')
  }
}
