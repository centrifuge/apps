import { Firestore } from '@google-cloud/firestore'
import { ApiPromise, WsProvider } from '@polkadot/api'
import Keyring from '@polkadot/keyring'
import BN from 'bn.js'
import cors from 'cors'
import * as dotenv from 'dotenv'
import express, { Express, Request, Response } from 'express'
dotenv.config()

const URL = process.env.COLLATOR_WSS_URL ?? 'wss://fullnode.demo.cntrfg.com'
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const CORS_ORIGIN = process.env.CORS_ORIGIN

const ONE_AUSD = new BN(10).pow(new BN(12))
const ONE_DEVEL = new BN(10).pow(new BN(18))
const ONE_THOUSAND_DEVEL = ONE_DEVEL.muln(1000)
const TEN_DEVEL = ONE_DEVEL.muln(10)
const TEN_THOUSAND_AUSD = ONE_AUSD.muln(10000)
const ONE_HUNDRED_AUSD = ONE_AUSD.muln(100)

const wsProvider = new WsProvider(URL)

const firestore = new Firestore({
  projectId: GOOGLE_PROJECT_ID,
  credentials: {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
})

function hexToBN(value: string | number) {
  if (typeof value === 'number') return new BN(value)
  return new BN(value.toString().substring(2), 'hex')
}

// regex from https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses
function validateIpAddress(ipAddress: string | undefined) {
  return (
    ipAddress &&
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ipAddress
    )
  )
}

var corsOptions = {
  origin: CORS_ORIGIN,
}

const app: Express = express()
app.use(cors(corsOptions))

app.get('/', async (req: Request, res: Response) => {
  try {
    const { address, ip } = req.query

    if (!address || !ip || !validateIpAddress(ip as string)) {
      return res.status(400).send({ error: 'Invalid ip or address params' })
    }
    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PROJECT_ID) {
      return res.status(400).send({ error: 'Some env variables are missing' })
    }

    const api = await ApiPromise.create({ provider: wsProvider })

    // check DEVEL and aUSD balances
    const [nativeBalanceResponse, ausdBalanceResponse] = await Promise.all([
      api.query.system.account(address),
      api.query.ormlTokens.accounts(address, 'AUSD'),
    ])
    // @ts-expect-error
    const nativeBalance = hexToBN(nativeBalanceResponse?.toJSON()?.data?.free || 0)
    // @ts-expect-error
    const ausdBalance = hexToBN(ausdBalanceResponse?.toJSON()?.free || 0)
    if (ausdBalance.gte(ONE_HUNDRED_AUSD) || nativeBalance.gte(TEN_DEVEL)) {
      return res.status(400).send({ error: 'Wallet already has sufficient balances' })
    }

    const docId = `${ip}-${address}`
    const dripRef = firestore.collection('drips').doc(docId)
    const doc = await dripRef.get()
    const timestamp = doc.data()?.timestamp
    const twentyFourHourLimit = new Date(timestamp).getTime() + 24 * 60 * 60 * 1000

    // allow access once every 24 hours and maximum 100 times globally
    if (doc.exists && (new Date().getTime() < twentyFourHourLimit || doc.data()?.count < 100)) {
      return res.status(400).send({ error: 'Faucet can only be used once in 24 hours' })
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
    return res.status(500).send({ error: e })
  }
})

exports.faucet = app
