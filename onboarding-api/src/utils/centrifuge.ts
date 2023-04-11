import Centrifuge from '@centrifuge/centrifuge-js'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Request } from 'express'
import { firstValueFrom } from 'rxjs'
import { HttpError } from './httpError'

const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 100 * 365 * 24 * 60 * 60)
const PROXY_ADDRESS = process.env.MEMBERLIST_ADMIN_PURE_PROXY

export const centrifuge = new Centrifuge({
  network: 'centrifuge',
  centrifugeWsUrl: process.env.COLLATOR_WSS_URL,
  polkadotWsUrl: process.env.RELAY_WSS_URL,
  printExtrinsics: true,
})

export const getPoolById = async (poolId: string, wallet: Request['wallet']) => {
  if (wallet.network === 'substrate') {
    const pools = await firstValueFrom(centrifuge.pools.getPools())
    const pool = pools.find((p) => p.id === poolId)
    const metadata = await firstValueFrom(centrifuge.metadata.getMetadata(pool?.metadata!))
    if (!metadata) {
      throw new Error(`Pool metadata not found for pool ${poolId}`)
    }
    return { pool, metadata }
  } else {
    throw new HttpError(400, 'Pools not supported for tinlake pools')
  }
}

export const addInvestorToMemberList = async (walletAddress: string, poolId: string, trancheId: string) => {
  await cryptoWaitReady()
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 })
  // the pure proxy controller (PURE_PROXY_CONTROLLER_SEED) is the wallet that controls the pure proxy being used to sign the transaction
  // the pure proxy address (MEMBERLIST_ADMIN_PURE_PROXY) has to be given MemberListAdmin permissions on each pool before being able to whtelist investors
  const signer = keyring.addFromMnemonic(process.env.PURE_PROXY_CONTROLLER_SEED as string)
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
