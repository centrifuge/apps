import { Request } from 'express'
import { OnboardingUser, userCollection } from '../database'
import { HttpError } from './httpError'

type Options = { suppressError?: boolean }

type OptionsOrNever<T> = T extends Options ? T : never
type UserOrNull<T> = T extends Options ? OnboardingUser | null : OnboardingUser

export async function fetchUser<T>(wallet: Request['wallet'], options?: OptionsOrNever<T>): Promise<UserOrNull<T>> {
  try {
    const userSnapshot = await userCollection.where(`wallet`, 'array-contains', wallet).get()
    if (userSnapshot.empty) {
      if (options?.suppressError) {
        return null as UserOrNull<T>
      }
      throw new Error("User doesn't exist")
    }
    return userSnapshot.docs.map((doc) => doc.data())[0] as UserOrNull<T>
  } catch (error) {
    console.error('Firestore error:', JSON.stringify(error))
    throw new HttpError(401, 'Not allowed')
  }
}
