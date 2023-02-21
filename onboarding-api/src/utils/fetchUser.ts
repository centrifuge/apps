import { OnboardingUser, userCollection } from '../database'
import { HttpsError } from './httpsError'

export async function fetchUser(walletAddress: string) {
  try {
    const userDoc = await userCollection.doc(walletAddress).get()
    if (!userDoc.exists) {
      throw new Error("User doesn't exist")
    }
    return userDoc.data() as OnboardingUser
  } catch (error) {
    console.error('Firestore error:', JSON.stringify(error))
    throw new HttpsError(401, 'Not allowed')
  }
}
