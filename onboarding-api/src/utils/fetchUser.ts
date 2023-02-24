import { OnboardingUser, userCollection } from '../database'
import { HttpsError } from './httpsError'

type FetchUserOptions<T> = T extends { suppressError?: boolean } ? T : never
type OnboardingUserOrNull<T> = T extends { suppressError?: boolean } ? OnboardingUser | null : OnboardingUser

export async function fetchUser<T>(
  walletAddress: string,
  options?: FetchUserOptions<T>
): Promise<OnboardingUserOrNull<T>> {
  try {
    const userDoc = await userCollection.doc(walletAddress).get()
    if (!userDoc.exists) {
      if (options && options.suppressError) {
        return null as OnboardingUserOrNull<T>
      }
      throw new Error("User doesn't exist")
    }
    return userDoc.data() as OnboardingUserOrNull<T>
  } catch (error) {
    console.error('Firestore error:', JSON.stringify(error))
    throw new HttpsError(401, 'Not allowed')
  }
}
