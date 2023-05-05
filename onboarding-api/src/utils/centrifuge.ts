import Centrifuge, { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { ApiRx, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Request } from 'express'
import { combineLatest, firstValueFrom, lastValueFrom, switchMap, takeWhile } from 'rxjs'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../controllers/emails/signAndSendDocuments'
import { HttpError, reportHttpError } from './httpError'

const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 100 * 365 * 24 * 60 * 60)
const PROXY_ADDRESS = process.env.MEMBERLIST_ADMIN_PURE_PROXY

export const centrifuge = new Centrifuge({
  network: 'centrifuge',
  centrifugeWsUrl: process.env.COLLATOR_WSS_URL,
  polkadotWsUrl: process.env.RELAY_WSS_URL,
  printExtrinsics: true,
})

export const getSigner = async () => {
  await cryptoWaitReady()
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 })
  // the pure proxy controller (PURE_PROXY_CONTROLLER_SEED) is the wallet that controls the pure proxy being used to sign the transaction
  // the pure proxy address (MEMBERLIST_ADMIN_PURE_PROXY) has to be given MemberListAdmin permissions on each pool before being able to whitelist investors
  return keyring.addFromMnemonic(process.env.PURE_PROXY_CONTROLLER_SEED)
}

export const getCentPoolById = async (poolId: string) => {
  const pools = await firstValueFrom(centrifuge.pools.getPools())
  const pool = pools.find((p) => p.id === poolId)
  const metadata = await firstValueFrom(centrifuge.metadata.getMetadata(pool?.metadata!))
  if (!metadata) {
    throw new Error(`Pool metadata not found for pool ${poolId}`)
  }
  return { pool, metadata }
}

export const addCentInvestorToMemberList = async (walletAddress: string, poolId: string, trancheId: string) => {
  const signer = await getSigner()
  const api = ApiRx.create({ provider: new WsProvider(process.env.COLLATOR_WSS_URL) })
  const tx = await lastValueFrom(
    api.pipe(
      switchMap((api) => {
        const submittable = api.tx.permissions.add(
          { PoolRole: 'MemberListAdmin' },
          walletAddress,
          { Pool: poolId },
          { PoolRole: { TrancheInvestor: [trancheId, OneHundredYearsFromNow] } }
        )
        const proxiedSubmittable = api.tx.proxy.proxy(PROXY_ADDRESS, undefined, submittable)
        return proxiedSubmittable.signAndSend(signer)
      }),
      takeWhile(({ events, isFinalized }) => {
        if (events.length > 0) {
          events.forEach(({ event }) => {
            const proxyResult = event.data[0]?.toHuman()
            if (event.method === 'ProxyExecuted' && proxyResult === 'Ok') {
              console.log(`Executed proxy to add to MemberList`, { walletAddress, poolId, trancheId, proxyResult })
            }
            if (
              event.method === 'ProxyExecuted' &&
              proxyResult &&
              typeof proxyResult === 'object' &&
              'Err' in proxyResult
            ) {
              console.log(`An error occured executing proxy to add to MemberList`, {
                walletAddress,
                poolId,
                trancheId,
                proxyResult: proxyResult.Err,
              })
              throw new HttpError(400, 'Bad request')
            }
          })
        }
        return !isFinalized
      })
    )
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
  return tx.txHash.toString()
}

export const validateRemark = async (
  transactionInfo: InferType<typeof signAndSendDocumentsInput>['transactionInfo'],
  expectedRemark: string
) => {
  try {
    await firstValueFrom(
      centrifuge.remark.validateRemark(transactionInfo.blockNumber, transactionInfo.txHash, expectedRemark)
    )
  } catch (error) {
    reportHttpError(error)
    throw new HttpError(400, 'Invalid remark')
  }
}

export const checkBalanceBeforeSigningRemark = async (wallet: Request['wallet']) => {
  const signer = await getSigner()
  const $api = ApiRx.create({ provider: new WsProvider(process.env.COLLATOR_WSS_URL) })
  const $paymentInfo = $api.pipe(
    switchMap((api) => {
      const submittble = api.tx.system.remarkWithEvent('Signing for pool')
      return submittble.paymentInfo(wallet.address)
    })
  )
  const $nativeBalance = $api.pipe(
    switchMap((api) => {
      return api.query.system.account(wallet.address)
    })
  )
  const tx = await lastValueFrom(
    combineLatest([$api, $paymentInfo, $nativeBalance]).pipe(
      switchMap(([api, paymentInfo, nativeBalance]) => {
        const currentNativeBalance = new CurrencyBalance(
          (nativeBalance as any).data.free.toString(),
          api.registry.chainDecimals[0]
        )
        const txFee = new CurrencyBalance(paymentInfo.partialFee.toString(), api.registry.chainDecimals[0])

        if (!currentNativeBalance.lt(txFee)) {
          reportHttpError("User's balance is too low to pay for the transaction")
          throw new HttpError(400, 'Bad request')
        }

        // add 10% buffer to the transaction fee
        const submittable = api.tx.tokens.transfer({ Id: wallet.address }, 'Native', txFee.add(txFee.muln(0.1)))
        const proxiedSubmittable = api.tx.proxy.proxy(PROXY_ADDRESS, undefined, submittable)
        return proxiedSubmittable.signAndSend(signer)
      }),
      takeWhile(({ events, isFinalized }) => {
        if (events.length > 0) {
          events.forEach(({ event }) => {
            const proxyResult = event.data[0]?.toHuman()
            if (event.method === 'ProxyExecuted' && proxyResult === 'Ok') {
              console.log(`Executed proxy to add for transfer`, { walletAddress: wallet.address, proxyResult })
            }
            if (
              event.method === 'ProxyExecuted' &&
              proxyResult &&
              typeof proxyResult === 'object' &&
              'Err' in proxyResult
            ) {
              console.log(`An error occured executing proxy to transfer native currency`, {
                proxyResult: proxyResult.Err,
              })
              throw new HttpError(400, 'Bad request')
            }
          })
        }
        return !isFinalized
      })
    )
  )
  return tx.txHash.toString()
}
