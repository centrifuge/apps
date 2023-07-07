import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/api'
import { u8aToHex } from '@polkadot/util'
import { createKeyMulti, cryptoWaitReady } from '@polkadot/util-crypto'
import { Request, Response } from 'express'
import { lastValueFrom, switchMap, takeWhile } from 'rxjs'
import { getCentrifuge } from '../../utils/centrifuge'
import { HttpError, reportHttpError } from '../../utils/httpError'

// for development chain only
export const initProxiesController = async (req: Request, res: Response) => {
  try {
    await cryptoWaitReady()
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 })
    const pureProxyController = keyring.addFromMnemonic(process.env.PURE_PROXY_CONTROLLER_SEED)
    const alice = keyring.addFromMnemonic('//Alice')
    const bob = keyring.addFromMnemonic('//Bob')
    const cent = getCentrifuge()
    const api = cent.getApi()

    const pureProxyTx = await lastValueFrom(
      api.pipe(
        switchMap((api) => {
          const submittable = api.tx.proxy.createPure('Any', 0, 0)
          return submittable.signAndSend(alice)
        }),
        takeWhile(({ events, isFinalized }) => {
          if (events.length > 0) {
            events.forEach(({ event }) => {
              const result = event.data[0]?.toHuman()
              // @ts-expect-error
              if (result?.Module?.error) {
                console.log(`Transaction error [createPure]`, { result })
                throw new HttpError(400, 'Bad request')
              }
              if (event.method === 'PureCreated') {
                console.log(`Pure proxy created`, { result })
              }
            })
          }
          return !isFinalized
        })
      )
    )

    // @ts-expect-error
    const pureProxyAddress = pureProxyTx.events.find(({ event }) => event.method === 'PureCreated')?.event.data.pure

    // fund the pure proxy
    await lastValueFrom(
      api.pipe(
        switchMap((api) => {
          const fundProxySubmittable = api.tx.tokens.transfer(
            { Id: pureProxyAddress },
            'Native',
            CurrencyBalance.fromFloat(10, 18)
          )

          // aUSD for dev/demo faucet
          const fundAUSDSubmittable = api.tx.tokens.transfer(
            {
              Id: pureProxyController.address,
            },
            { ForeignAsset: 2 },
            CurrencyBalance.fromFloat(1000, 12)
          )
          // aUSD for dev/demo faucet
          const fundUSDTSubmittable = api.tx.tokens.transfer(
            {
              Id: pureProxyController.address,
            },
            { ForeignAsset: 1 },
            CurrencyBalance.fromFloat(1000, 12)
          )
          const batchSubmittable = api.tx.utility.batchAll([
            fundProxySubmittable,
            fundAUSDSubmittable,
            fundUSDTSubmittable,
          ])
          return batchSubmittable.signAndSend(alice)
        }),
        takeWhile(({ events, isFinalized }) => {
          if (events.length > 0) {
            events.forEach(({ event }) => {
              const result = event.data[0]?.toHuman()
              // @ts-expect-error
              if (result?.Module?.error) {
                console.log(`Transaction error [transfer]`, { result })
                throw new HttpError(400, 'Bad request')
              }
              if (event.method === 'PureCreated') {
                console.log(`Funding complete`, { result })
                return
              }
            })
          }
          return !isFinalized
        })
      )
    )

    await lastValueFrom(
      api.pipe(
        switchMap((api) => {
          const multisigAddresses = [alice.address, bob.address]
          const multiAddress = u8aToHex(createKeyMulti(multisigAddresses, 2))

          const proxiedControllerSubmittable = api.tx.proxy.proxy(
            pureProxyAddress,
            undefined,
            api.tx.proxy.addProxy({ Id: pureProxyController.address }, 'PermissionManagement', 0)
          )
          const proxiedMultiSubmittable = api.tx.proxy.proxy(
            pureProxyAddress,
            undefined,
            api.tx.proxy.addProxy({ Id: multiAddress.toString() }, 'Any', 0)
          )
          const batchSubmittable = api.tx.utility.batchAll([proxiedControllerSubmittable, proxiedMultiSubmittable])
          return batchSubmittable.signAndSend(alice)
        }),
        takeWhile(({ events, isFinalized }) => {
          if (events.length > 0) {
            events.forEach(({ event }) => {
              const result = event.data[0]?.toHuman()
              console.log('in proxy', result)
              // @ts-expect-error
              if (result?.Module?.error) {
                console.log(`Transaction error`, { result })
                throw new HttpError(400, 'Transaction error [addProxy]')
              }
              if (event.method === 'ProxyExecuted' && result === 'Ok') {
                console.log(`Executed proxy to add proxies`, { result })
              }
              if (event.method === 'ProxyExecuted' && result && typeof result === 'object' && 'Err' in result) {
                console.log(`An error occured executing proxy`, {
                  proxyResult: result.Err,
                })
                throw new HttpError(400, 'Bad request')
              }
            })
          }
          return !isFinalized
        })
      )
    )

    // return res.status(200).json({ txHash: tx.txHash.toString() })
    return res.status(200).json({ pureProxyAddress })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
