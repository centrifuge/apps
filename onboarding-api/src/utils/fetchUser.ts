import { Request } from 'express'
import { OnboardingUser, SupportedNetworks, userCollection, validateAndWriteToFirestore } from '../database'
import { HttpError } from './httpError'

type Options = { suppressError?: boolean }

type OptionsOrNever<T> = T extends Options ? T : never
type UserOrNull<T> = T extends Options ? OnboardingUser | null : OnboardingUser

const supportedNetworks: SupportedNetworks[] = ['evm', 'evmOnSubstrate', 'substrate']

export async function fetchUser<T>(wallet: Request['wallet'], options?: OptionsOrNever<T>): Promise<UserOrNull<T>> {
  if (supportedNetworks.includes(wallet.network) === false) {
    throw new HttpError(404, 'Unsupported network')
  }
  const userSnapshot = await userCollection.where(`wallets.${wallet.network}`, 'array-contains', wallet.address).get()

  // For evm chains only: if the user doesn't exist on the current network, check if they exist on another network
  if (userSnapshot.empty && wallet.network.includes('evm')) {
    for (const network of supportedNetworks.filter((n) => n.includes('evm')) as SupportedNetworks[]) {
      if (network !== wallet.network) {
        const userSnapshotOnOtherNetwork = await userCollection
          .where(`wallets.${network}`, 'array-contains', wallet.address)
          .get()
        if (!userSnapshotOnOtherNetwork.empty) {
          const { user, id } = userSnapshotOnOtherNetwork.docs.map((doc) => ({ user: doc.data(), id: doc.id }))[0]
          await validateAndWriteToFirestore(
            { address: id, network },
            {
              wallets: {
                ...user.wallets,
                [wallet.network]: [...(user.wallets[wallet.network] || []), wallet.address],
              },
            },
            user.investorType,
            ['wallets']
          )
          return user as UserOrNull<T>
        }
      }
    }
  }

  if (userSnapshot.empty) {
    if (options?.suppressError) {
      return null as UserOrNull<T>
    }
    throw new HttpError(404, "User doesn't exist")
  }
  return userSnapshot.docs.map((doc) => doc.data())[0] as UserOrNull<T>
}
