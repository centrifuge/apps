import Centrifuge from '@centrifuge/centrifuge-js'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { firstValueFrom } from 'rxjs'

const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 100 * 365 * 24 * 60 * 60)
const PROXY_ADDRESS = process.env.MEMBERLIST_ADMIN_PURE_PROXY

export const centrifuge = new Centrifuge({
  network: 'centrifuge',
  centrifugeWsUrl: process.env.COLLATOR_WSS_URL,
  polkadotWsUrl: process.env.RELAY_WSS_URL,
  printExtrinsics: true,
})

export const getPoolById = async (poolId: string) => {
  const pools = await firstValueFrom(centrifuge.pools.getPools())
  const pool = pools.find((p) => p.id === poolId)
  const metadata = await firstValueFrom(centrifuge.metadata.getMetadata(pool?.metadata!))
  if (!metadata) {
    throw new Error(`Pool metadata not found for pool ${poolId}`)
  }
  return { pool, metadata }
}

export const addInvestorToMemberList = async (walletAddress: string, poolId: string, trancheId: string) => {
  await cryptoWaitReady()
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 })
  // both Dave and Alice can execute the proxy call because they have been added to the pure proxy
  const signer = keyring.addFromUri('//Dave')
  const api = await ApiPromise.create({ provider: new WsProvider(process.env.COLLATOR_WSS_URL) })
  const submittable = api.tx.permissions.add(
    { PoolRole: 'MemberListAdmin' },
    walletAddress,
    { Pool: poolId },
    { PoolRole: { TrancheInvestor: [trancheId, OneHundredYearsFromNow] } }
  )

  // this doens't work b/c .connect() exepcts a Signer, not a KeyringPair
  // how it is: cent-js.signAndSend(signingAddress, { signer, era })
  // how it should be: cent-js.signAndSend(signer)
  // centrifuge.config.proxy = proxyAddress
  // const result = await firstValueFrom(
  //   centrifuge
  //     .connect(signer.address, signer)
  //     .pools.updatePoolRoles([poolId, [[walletAddress, { TrancheInvestor: [trancheId, TenYearsFromNow] }]], []])
  // )
  const proxiedSubmittable = api.tx.proxy.proxy(PROXY_ADDRESS, undefined, submittable)
  const hash = await proxiedSubmittable.signAndSend(signer)
  await api.disconnect()
  return hash
}
