import Centrifuge, { CurrencyBalance, evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady, encodeAddress } from '@polkadot/util-crypto'
import { Request, Response } from 'express'
import { combineLatest, combineLatestWith, firstValueFrom, lastValueFrom, switchMap, take, takeWhile } from 'rxjs'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../../controllers/emails/signAndSendDocuments'
import { HttpError, reportHttpError } from '../httpError'
import { NetworkSwitch } from './networkSwitch'

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
    throw new HttpError(404, `Pool metadata not found for pool ${poolId}`)
  }
  if (!pool) {
    throw new HttpError(404, `Pool not found for pool ${poolId}`)
  }
  return { pool, metadata }
}

export const addCentInvestorToMemberList = async (wallet: Request['wallet'], poolId: string, trancheId: string) => {
  const pureProxyAddress = process.env.MEMBERLIST_ADMIN_PURE_PROXY
  const signer = await getSigner()
  const cent = getCentrifuge()
  const api = cent.getApi()
  const { metadata } = await new NetworkSwitch(wallet.network).getPoolById(poolId)
  const walletAddress = await getValidSubstrateAddress(wallet)

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
        const proxiedSubmittable = api.tx.proxy.proxy(pureProxyAddress, undefined, submittable)
        const batchSubmittable = [proxiedSubmittable]
        // give the investor PODReadAccess if they issuer enabled it
        if (!hasPodReadAccess && metadata?.onboarding?.podReadAccess) {
          const podSubmittable = api.tx.permissions.add(
            { PoolRole: 'InvestorAdmin' },
            walletAddress,
            { Pool: poolId },
            { PoolRole: 'PODReadAccess' }
          )
          const proxiedPodSubmittable = api.tx.proxy.proxy(pureProxyAddress, undefined, podSubmittable)
          batchSubmittable.push(proxiedPodSubmittable)
        }
        // add investor to liquidity pools if they are investing on any domain other than centrifuge
        if (wallet.network === 'evm') {
          const updateMemberSubmittable = api.tx.connectors.updateMember(
            poolId,
            trancheId,
            {
              EVM: [wallet.chainId, wallet.address],
            },
            OneHundredYearsFromNow
          )
          batchSubmittable.push(updateMemberSubmittable)
        }
        return api.tx.utility.batchAll(batchSubmittable).signAndSend(signer)
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
              console.log(`Extrinsic failed:`, { walletAddress, poolId, trancheId, error: { section, name } })
              throw new HttpError(400, `Extrinsic failed: ${name}.${section}`)
            }
            if (event.method === 'ProxyExecuted' && result === 'Ok') {
              console.log(`Executed proxy to add to MemberList`, { walletAddress, poolId, trancheId })
            }
            if (event.method === 'ProxyExecuted' && result && typeof result === 'object' && 'Err' in result) {
              console.log(`Extrinsic failed in addCentInvestorToMemberList`, {
                walletAddress,
                poolId,
                trancheId,
                result: result.Err,
              })
              throw new HttpError(400, 'Extrinsic failed')
            }
          })
        }
        return !isFinalized
      })
    )
  )

  return { txHash: tx.txHash.toString() }
}

export const validateSubstrateRemark = async (
  _wallet: Request['wallet'],
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
  const address = await getValidSubstrateAddress(wallet)
  const signer = await getSigner()
  const $api = getCentrifuge().getApi()
  const $paymentInfo = $api
    .pipe(switchMap((api) => api.tx.system.remarkWithEvent('Signing for pool').paymentInfo(address)))
    .pipe(take(1))
  const $nativeBalance = $api.pipe(switchMap((api) => api.query.system.account(address))).pipe(take(1))
  const tx = await lastValueFrom(
    combineLatest([$api, $paymentInfo, $nativeBalance]).pipe(
      switchMap(([api, paymentInfo, nativeBalance]) => {
        const currentNativeBalance = new CurrencyBalance(
          (nativeBalance as any).data.free.toString(),
          api.registry.chainDecimals[0]
        )
        const txFee = new CurrencyBalance(paymentInfo.partialFee.toString(), api.registry.chainDecimals[0])

        if (currentNativeBalance.gte(txFee.muln(1.1))) {
          throw new HttpError(400, 'Balance exceeded')
        }

        // add 10% buffer to the transaction fee
        const submittable = api.tx.tokens.transfer({ Id: address }, 'Native', txFee.add(txFee.muln(1.1)))
        return submittable.signAndSend(signer)
      }),
      takeWhile(({ events, isFinalized }) => {
        if (events.length > 0) {
          events.forEach(({ event }) => {
            const result = event.data[0]?.toHuman()
            if (event.method === 'ProxyExecuted' && result === 'Ok') {
              console.log(`Executed proxy for transfer`, { walletAddress: address, result })
            }
            if (event.method === 'ExtrinsicFailed') {
              console.log(`Extrinsic failed`, { walletAddress: address, result })
              throw new HttpError(400, 'Extrinsic failed')
            }
          })
        }
        return !isFinalized
      })
    )
  )
  return tx.txHash.toString()
}

export const getValidSubstrateAddress = async (wallet: Request['wallet']) => {
  try {
    const cent = getCentrifuge()
    const centChainId = await cent.getChainId()
    if (wallet.network === 'evmOnSubstrate') {
      const chainId = await firstValueFrom(cent.getApi().pipe(switchMap((api) => api.query.evmChainId.chainId())))
      return evmToSubstrateAddress(wallet.address, Number(chainId.toString()))
    }
    if (wallet.network === 'evm') {
      return evmToSubstrateAddress(wallet.address, wallet.chainId)
    }
    const validAddress = encodeAddress(wallet.address, centChainId)
    return validAddress
  } catch (error) {
    throw new HttpError(400, 'Invalid substrate address')
  }
}

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']
export async function verifySubstrateWallet(req: Request, res: Response): Promise<Request['wallet']> {
  const { jw3t: token, nonce } = req.body
  const { verified, payload } = await getCentrifuge().auth.verify(token!)

  const onBehalfOf = payload?.on_behalf_of
  const address = payload.address

  const cookieNonce = req.signedCookies[`onboarding-auth-${address.toLowerCase()}`]
  if (!cookieNonce || cookieNonce !== nonce) {
    throw new HttpError(400, 'Invalid nonce')
  }

  res.clearCookie(`onboarding-auth-${address.toLowerCase()}`)

  if (verified && onBehalfOf) {
    const isVerifiedProxy = await getCentrifuge().auth.verifyProxy(
      address,
      onBehalfOf,
      AUTHORIZED_ONBOARDING_PROXY_TYPES
    )
    if (isVerifiedProxy.verified) {
      req.wallet.address = address
    } else if (verified && !onBehalfOf) {
      req.wallet.address = address
    } else {
      throw new Error()
    }
  }
  return {
    address,
    network: payload.network || 'substrate',
    chainId: payload.chainId,
  }
}
