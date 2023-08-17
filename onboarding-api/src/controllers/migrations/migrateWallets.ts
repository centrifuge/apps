import { userCollection } from '../../database'
import { reportHttpError } from '../../utils/httpError'

/**
 *
 * Jul 26th 2023
 *
 * Migrate wallets to new schema
 *
 * Old: {wallet : [{address: string, network: string}]}
 * New: {wallets: {evm: string[], substrate: string[], evmOnSubstrate: string[]}
 *
 * Purpose: we need to be able to query the users just by wallet address and not necessarily by network
 * so that evm wallets can be used both for cent-chain and for tinlake pools.
 *
 * With the old implementation we would have had to query all users before filtering for just the address
 * which is a limitation by firestore (query arrays of objects for just one property isn't supported)
 *
 * This migration needs to be run in the prod database when the next release goes out. Then this method can be deleted.
 */
export const migrateWalletsController = async (req, res) => {
  let failedMigrations = 0
  try {
    const userSanpshot = await userCollection.get()
    const users = userSanpshot?.docs.map((doc) => {
      return doc.data()
    })

    for (const user of users) {
      const { wallet, ...rest } = user
      if (wallet?.length > 0) {
        const [newWallets] = wallet.map((wal) => {
          if (wal.network === 'evm') {
            return {
              evm: [wal.address],
              substrate: [],
              evmOnSubstrate: [],
            }
          } else if (wal.network === 'substrate') {
            return {
              evm: [],
              substrate: [wal.address],
              evmOnSubstrate: [],
            }
          }
          return {
            evm: [],
            substrate: [],
            evmOnSubstrate: [],
          }
        })
        const theUser = {
          ...rest,
          wallets: newWallets,
        }
        await userCollection.doc(wallet[0].address).set(theUser)
      } else {
        failedMigrations = failedMigrations + 1
        console.log(`user wallet not found or already migrated: ${JSON.stringify(user)}`)
      }
    }

    return res.json({ complete: true, failedMigrations, totalUsers: users.length })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
