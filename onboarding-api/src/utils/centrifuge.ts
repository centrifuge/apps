import Centrifuge, { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/keyring'
import { hexToU8a, isHex } from '@polkadot/util'
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto'
import { Request } from 'express'
import { combineLatest, combineLatestWith, firstValueFrom, lastValueFrom, switchMap, take, takeWhile } from 'rxjs'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../controllers/emails/signAndSendDocuments'
import { getPoolById } from './getPoolById'
import { HttpError, reportHttpError } from './httpError'

const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 100 * 365 * 24 * 60 * 60)

export const getCentrifuge = () =>
  new Centrifuge({
    network: 'centrifuge',
    centrifugeWsUrl: process.env.COLLATOR_WSS_URL,
    polkadotWsUrl: process.env.RELAY_WSS_URL,
    printExtrinsics: true,
  })

export const getSigner = async () => {
  await cryptoWaitReady()
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 })
  // the pure proxy controller (PURE_PROXY_CONTROLLER_SEED) is the wallet that controls the pure proxy being used to sign the transaction
  // the pure proxy address (MEMBERLIST_ADMIN_PURE_PROXY) has to be given InvestorAdmin permissions on each pool before being able to whitelist investors
  return keyring.addFromMnemonic(process.env.PURE_PROXY_CONTROLLER_SEED)
}

export const getCentPoolById = async (poolId: string) => {
  const cent = getCentrifuge()
  const pools = await firstValueFrom(cent.pools.getPools())
  const pool = pools.find((p) => p.id === poolId)
  const metadata = await firstValueFrom(cent.metadata.getMetadata(pool?.metadata!))
  if (!metadata) {
    throw new Error(`Pool metadata not found for pool ${poolId}`)
  }
  return { pool, metadata }
}

export const addCentInvestorToMemberList = async (walletAddress: string, poolId: string, trancheId: string) => {
  const pureProxyAddress = process.env.MEMBERLIST_ADMIN_PURE_PROXY
  const signer = await getSigner()
  const cent = getCentrifuge()
  const api = cent.getApi()
  const { metadata } = await getPoolById(poolId)

  const hasPodReadAccess = (await firstValueFrom(cent.pools.getPoolPermissions([poolId])))?.[
    walletAddress
  ]?.roles.includes('PODReadAccess')

  const [tx] = await lastValueFrom(
    api.pipe(
      switchMap((api) => {
        const submittable = api.tx.permissions.add(
          { PoolRole: 'InvestorAdmin' },
          walletAddress,
          { Pool: poolId },
          { PoolRole: { TrancheInvestor: [trancheId, OneHundredYearsFromNow] } }
        )
        if (!hasPodReadAccess && metadata?.onboarding?.podReadAccess) {
          const address = cent.utils.formatAddress(walletAddress)
          const podSubmittable = api.tx.permissions.add(
            { PoolRole: 'InvestorAdmin' },
            address,
            { Pool: poolId },
            { PoolRole: 'PODReadAccess' }
          )
          const proxiedSubmittable = api.tx.proxy.proxy(pureProxyAddress, undefined, submittable)
          const proxiedPodSubmittable = api.tx.proxy.proxy(pureProxyAddress, undefined, podSubmittable)
          const batchSubmittable = api.tx.utility.batchAll([proxiedPodSubmittable, proxiedSubmittable])
          return batchSubmittable.signAndSend(signer)
        }
        const proxiedSubmittable = api.tx.proxy.proxy(pureProxyAddress, undefined, submittable)
        return proxiedSubmittable.signAndSend(signer)
      }),
      combineLatestWith(api),
      takeWhile(([{ events, isFinalized }, api]) => {
        if (events.length > 0) {
          events.forEach(({ event }) => {
            const result = event.data[0]?.toHuman()
            // @ts-expect-error
            if (result?.Module?.error) {
              // @ts-expect-error
              const { name, section } = api.registry.findMetaError(event.data[0].asModule)
              console.log(`Transaction error`, { walletAddress, poolId, trancheId, error: { section, name } })
              throw new HttpError(400, 'Bad request')
            }
            if (event.method === 'ProxyExecuted' && result === 'Ok') {
              console.log(`Executed proxy to add to MemberList`, { walletAddress, poolId, trancheId })
            }
            if (event.method === 'ProxyExecuted' && result && typeof result === 'object' && 'Err' in result) {
              console.log(`An error occured executing proxy to add to MemberList`, {
                walletAddress,
                poolId,
                trancheId,
                result: result.Err,
              })
              throw new HttpError(400, 'Bad request')
            }
          })
        }
        return !isFinalized
      })
    )
  )

  return { txHash: tx.txHash.toString() }
}

export const validateRemark = async (
  transactionInfo: InferType<typeof signAndSendDocumentsInput>['transactionInfo'],
  expectedRemark: string
) => {
  try {
    await firstValueFrom(
      getCentrifuge().remark.validateRemark(
        transactionInfo.blockNumber,
        transactionInfo.txHash,
        expectedRemark,
        transactionInfo?.isEvmOnSubstrate
      )
    )
  } catch (error) {
    reportHttpError(error)
    throw new HttpError(400, 'Invalid remark')
  }
}

export const checkBalanceBeforeSigningRemark = async (wallet: Request['wallet']) => {
  const signer = await getSigner()
  const $api = getCentrifuge().getApi()
  const $paymentInfo = $api
    .pipe(switchMap((api) => api.tx.system.remarkWithEvent('Signing for pool').paymentInfo(wallet.address)))
    .pipe(take(1))
  const $nativeBalance = $api.pipe(switchMap((api) => api.query.system.account(wallet.address))).pipe(take(1))
  const tx = await lastValueFrom(
    combineLatest([$api, $paymentInfo, $nativeBalance]).pipe(
      switchMap(([api, paymentInfo, nativeBalance]) => {
        const currentNativeBalance = new CurrencyBalance(
          (nativeBalance as any).data.free.toString(),
          api.registry.chainDecimals[0]
        )
        const txFee = new CurrencyBalance(paymentInfo.partialFee.toString(), api.registry.chainDecimals[0])

        if (currentNativeBalance.gte(txFee.muln(1.1))) {
          throw new HttpError(400, 'Bad request: balance exceeded')
        }

        // add 10% buffer to the transaction fee
        const submittable = api.tx.tokens.transfer({ Id: wallet.address }, 'Native', txFee.add(txFee.muln(1.1)))
        return submittable.signAndSend(signer)
      }),
      takeWhile(({ events, isFinalized }) => {
        if (events.length > 0) {
          events.forEach(({ event }) => {
            const result = event.data[0]?.toHuman()
            if (event.method === 'ProxyExecuted' && result === 'Ok') {
              console.log(`Executed proxy for transfer`, { walletAddress: wallet.address, result })
            }
            if (event.method === 'ExtrinsicFailed') {
              console.log(`Extrinsic for transfer failed`, { walletAddress: wallet.address, result })
              throw new HttpError(400, 'Bad request: extrinsic failed')
            }
          })
        }
        return !isFinalized
      })
    )
  )
  return tx.txHash.toString()
}

// https://polkadot.js.org/docs/util-crypto/examples/validate-address/
export const getValidSubstrateAddress = (address: string) => {
  try {
    const validAddress = encodeAddress(
      isHex(address) ? hexToU8a(address) : decodeAddress(address),
      getCentrifuge().getChainId()
    )
    return validAddress
  } catch (error) {
    throw new Error('Invalid address')
  }
}
