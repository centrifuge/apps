import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/api'
import { u8aToHex } from '@polkadot/util'
import { createKeyMulti, cryptoWaitReady } from '@polkadot/util-crypto'
import { Request, Response } from 'express'
import { combineLatestWith, lastValueFrom, switchMap, takeWhile } from 'rxjs'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { getCentrifuge } from '../../utils/networks/centrifuge'

// 1. Create pure proxy
// 2. Fund pure proxy and controller
// 3. Add PermissionManagement proxy to controller
// 4. Add multi-sig proxy to controller so pure proxy can be switched out

// for development chain only since it's the only chain that will reset after upgrades
export const initProxiesController = async (req: Request, res: Response) => {
  try {
    await cryptoWaitReady()
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 })
    const pureProxyController = keyring.addFromMnemonic(process.env.PURE_PROXY_CONTROLLER_SEED)
    const alice = keyring.addFromMnemonic('//Alice')
    const bob = keyring.addFromMnemonic('//Bob')
    const cent = getCentrifuge()
    const api = cent.getApi()

    const [pureProxyTx] = await lastValueFrom(
      api.pipe(
        switchMap((api) => {
          const submittable = api.tx.proxy.createPure('Any', 0, 0)
          return submittable.signAndSend(alice)
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
                console.log(`Transaction error [createPure]`, { result, error: { name, section } })
                throw new HttpError(400, 'Bad request')
              }
            })
          }
          return !isFinalized
        })
      )
    )

    // @ts-expect-error
    const pureProxyAddress = pureProxyTx.events?.find(({ event }) => event.method === 'PureCreated')?.event.data.pure
    console.log('Pure proxy created', pureProxyAddress.toString())

    // fund the pure proxy
    await lastValueFrom(
      api.pipe(
        switchMap((api) => {
          const fundProxySubmittable = api.tx.tokens.transfer(
            { Id: pureProxyAddress },
            'Native',
            CurrencyBalance.fromFloat(100000, 18)
          )

          // aUSD for dev/demo faucet
          const fundAUSDSubmittable = api.tx.tokens.transfer(
            {
              Id: pureProxyController.address,
            },
            { ForeignAsset: 2 },
            CurrencyBalance.fromFloat(100000, 12)
          )
          // USDT for dev/demo faucet
          const fundUSDTSubmittable = api.tx.tokens.transfer(
            {
              Id: pureProxyController.address,
            },
            { ForeignAsset: 1 },
            CurrencyBalance.fromFloat(100000, 12)
          )

          const proxiedControllerSubmittable = api.tx.proxy.proxy(
            pureProxyAddress,
            undefined,
            api.tx.proxy.addProxy({ Id: pureProxyController.address }, 'PermissionManagement', 0)
          )

          const multiAddress = u8aToHex(createKeyMulti([alice.address, bob.address], 2))
          const proxiedMultiSubmittable = api.tx.proxy.proxy(
            pureProxyAddress,
            undefined,
            api.tx.proxy.addProxy({ Id: multiAddress.toString() }, 'Any', 0)
          )
          const batchSubmittable = api.tx.utility.batchAll([
            fundProxySubmittable,
            fundAUSDSubmittable,
            fundUSDTSubmittable,
            proxiedControllerSubmittable,
            proxiedMultiSubmittable,
          ])
          return batchSubmittable.signAndSend(alice)
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
                console.log(`Transaction error`, { result, error: { name, section } })
                throw new HttpError(400, 'Transaction error')
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

    console.log('Transferred funds to pure proxy and initialized proxies')
    return res.status(200).json({ pureProxyAddress })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
