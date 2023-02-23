import { Firestore } from '@google-cloud/firestore'
import { ApiPromise, WsProvider } from '@polkadot/api'
import Keyring from '@polkadot/keyring'
import BN from 'bn.js'
import * as dotenv from 'dotenv'
import { Request, Response } from 'express'

dotenv.config()

const URL = process.env.COLLATOR_WSS_URL ?? 'wss://fullnode.demo.cntrfg.com'

const ONE_AUSD = new BN(10).pow(new BN(12))
const ONE_DEVEL = new BN(10).pow(new BN(18))
const ONE_THOUSAND_DEVEL = ONE_DEVEL.muln(1000)
const TEN_DEVEL = ONE_DEVEL.muln(10)
const TEN_THOUSAND_AUSD = ONE_AUSD.muln(10000)
const ONE_HUNDRED_AUSD = ONE_AUSD.muln(100)

const MAX_API_REQUESTS_PER_WALLET = 100
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

const firestore = new Firestore({
  projectId: 'peak-vista-185616',
})
const wsProvider = new WsProvider(URL)

const centrifugeDomains = [
  /^(https:\/\/.*cntrfg\.com)/,
  /^(https:\/\/.*centrifuge\.io)/,
  /^(https:\/\/.*altair\.network)/,
  /^(https:\/\/.*k-f\.dev)/,
]

function hexToBN(value: string | number) {
  if (typeof value === 'number') return new BN(value)
  return new BN(value.toString().substring(2), 'hex')
}

async function faucet(req: Request, res: Response) {
  console.log('faucet running')

  const origin = req.get('origin') || ''
  const isCentrifugeDomain = centrifugeDomains.some((regex) => regex.test(origin))
  const isLocalhost = /^(http:\/\/localhost:)./.test(origin)
  if (isCentrifugeDomain || isLocalhost) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Access-Control-Allow-Methods', ['GET', 'POST'])
  } else {
    return res.status(405).send('Not allowed')
  }

  try {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET')
      res.set('Access-Control-Allow-Headers', 'Content-Type')
      res.set('Access-Control-Max-Age', '3600')
      return res.status(204).send('')
    }
    const { address } = req.query

    if (!address) {
      return res.status(400).send('Invalid address param')
    }

    const api = await ApiPromise.create({ provider: wsProvider })

    // check DEVEL and aUSD balances
    const [nativeBalanceResponse, ausdBalanceResponse] = await Promise.all([
      api.query.system.account(address),
      api.query.ormlTokens.accounts(address, 'AUSD'),
    ])
    const nativeBalance = hexToBN((nativeBalanceResponse?.toJSON() as any)?.data?.free || 0)
    const ausdBalance = hexToBN((ausdBalanceResponse?.toJSON() as any)?.free || 0)
    if (ausdBalance.gte(ONE_HUNDRED_AUSD) || nativeBalance.gte(TEN_DEVEL)) {
      api.disconnect()
      return res.status(400).send('Wallet already has sufficient aUSD/DEVEL balances')
    }

    const dripRef = firestore.collection('drips').doc(`${address}`)
    const doc = await dripRef.get()
    const data = doc.data()

    if (doc.exists && data?.address !== address) {
      const twentyFourHourFreeze = new Date(data?.timestamp).getTime() + TWENTY_FOUR_HOURS
      // allow access once every 24 hours
      if (new Date().getTime() < twentyFourHourFreeze) {
        api.disconnect()
        return res.status(400).send('Faucet can only be used once in 24 hours')
      }

      if (data?.count > MAX_API_REQUESTS_PER_WALLET) {
        api.disconnect()
        return res.status(400).send('Maximum claims exceeded')
      }
    }

    await firestore
      .collection('drips')
      .doc(address as string)
      .set({
        address,
        timestamp: Date.now(),
        count: (doc.data()?.count ?? 0) + 1,
      })

    const txBatch = api.tx.utility.batchAll([
      api.tx.tokens.transfer(address, { Native: true }, ONE_THOUSAND_DEVEL.toString()),
      api.tx.tokens.transfer(address, { AUSD: true }, TEN_THOUSAND_AUSD.toString()),
    ])

    const keyring = new Keyring({ type: 'sr25519' })
    console.log('signing and sending tx')
    const hash = await txBatch.signAndSend(keyring.addFromUri((process.env.FAUCET_SEED_HEX as string) || '//Alice'))
    console.log('signed and sent tx')
    api.disconnect()
    return res.status(200).json({ hash })
  } catch (e) {
    console.error('Error', e)
    return res.status(500).send(e)
  }
}

exports.faucetDev = faucet
exports.faucetDemo = faucet
