import { Firestore } from '@google-cloud/firestore'
import { ApiPromise, WsProvider } from '@polkadot/api'
import Keyring from '@polkadot/keyring'
import BN from 'bn.js'
import * as dotenv from 'dotenv'
import express, { Express, Request, Response } from 'express'
dotenv.config()

const URL = process.env.COLLATOR_WSS_URL ?? 'wss://fullnode.demo.cntrfg.com'
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL

const ONE_AUSD = new BN(10).pow(new BN(12))
const ONE_DEVEL = new BN(10).pow(new BN(18))
const ONE_THOUSAND_DEVEL = ONE_DEVEL.muln(1000)
const TEN_DEVEL = ONE_DEVEL.muln(10)
const TEN_THOUSAND_AUSD = ONE_AUSD.muln(10000)
const ONE_HUNDRED_AUSD = ONE_AUSD.muln(100)

function hexToBN(value: string | number) {
  if (typeof value === 'number') return new BN(value)
  return new BN(value.toString().substring(2), 'hex')
}

const app: Express = express()
app.get('/', async (req: Request, res: Response) => {
  try {
    const { address, ip } = req.query

    // validate IP address

    if (!address || !ip) {
      return res.status(400).send('Address and ip are required params')
    }
    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PROJECT_ID) {
      return res.status(400).send('Some env variables are missing')
    }

    const wsProvider = new WsProvider(URL)
    const api = await ApiPromise.create({ provider: wsProvider })

    const [nativeBalanceResponse, ausdBalanceResponse] = await Promise.all([
      api.query.system.account(address),
      api.query.ormlTokens.accounts(address, 'AUSD'),
    ])
    // @ts-expect-error
    const nativeBalance = hexToBN(nativeBalanceResponse?.toJSON()?.data?.free || 0)
    // @ts-expect-error
    const ausdBalance = hexToBN(ausdBalanceResponse?.toJSON()?.free || 0)
    if (ausdBalance.gte(ONE_HUNDRED_AUSD) || nativeBalance.gte(TEN_DEVEL)) {
      return res.status(500).send({ error: 'Wallet already has sufficient balances' })
    }

    const firestore = new Firestore({
      projectId: GOOGLE_PROJECT_ID,
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
    })
    const docId = `${ip}-${address}`
    const dripRef = firestore.collection('drips').doc(docId)
    const doc = await dripRef.get()
    const timestamp = doc.data()?.timestamp
    const twentyFourHourLimit = new Date(timestamp).getTime() + 24 * 60 * 60 * 1000

    if (doc.exists && new Date().getTime() < twentyFourHourLimit) {
      return res.status(500).send({ error: 'Faucet can only be used once in 24 hours' })
    }

    const data = {
      address,
      ipAddress: ip,
      timestamp: Date.now(),
      count: (doc.data()?.count ?? 0) + 1,
    }
    await firestore.collection('drips').doc(docId).set(data)

    const txBatch = api.tx.utility.batchAll([
      api.tx.tokens.transfer(address, { Native: true }, ONE_THOUSAND_DEVEL.toString()),
      api.tx.tokens.transfer(address, { AUSD: true }, TEN_THOUSAND_AUSD.toString()),
    ])

    const keyring = new Keyring({ type: 'sr25519' })
    const hash = await txBatch.signAndSend(keyring.addFromUri('//Alice'))

    return res.status(200).json({ hash })
  } catch (e) {
    console.error('Error', e)
    return res.status(400).send({ error: e })
  }
})

exports.faucet = app
