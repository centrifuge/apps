import { Firestore } from '@google-cloud/firestore'
import { ApiPromise, WsProvider } from '@polkadot/api'
import Keyring from '@polkadot/keyring'
import BN from 'bn.js'
import * as dotenv from 'dotenv'
import { Request, Response } from 'express'

dotenv.config()

const URL = process.env.COLLATOR_WSS_URL ?? 'wss://fullnode.demo.cntrfg.com'
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ?? ''
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID ?? ''
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL ?? ''
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'https://pr-1049--dev-app-cntrfg.netlify.app'

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

exports.faucet = async function faucet(req: Request, res: Response) {
  console.log('faucet running')
  res.set('Access-Control-Allow-Origin', CORS_ORIGIN)
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    res.set('Access-Control-Max-Age', '3600')
    return res.status(204).send('')
  }
  try {
    const { address } = req.query

    if (!address || (address as string).length !== 48) {
      return res.status(400).send('Invalid address param')
    }

    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PROJECT_ID) {
      return res.status(400).send('Some env variables are missing')
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
      const twentyFourHourFreeze = new Date(data?.timestamp).getTime() + 24 * 60 * 60 * 1000
      // allow access once every 24 hours
      if (new Date().getTime() < twentyFourHourFreeze) {
        api.disconnect()
        return res.status(400).send('Faucet can only be used once in 24 hours')
      }

      if (data?.count > 100) {
        api.disconnect()
        return res.status(400).send('Maximum claims exceeded')
      }
    }

    const newData = {
      address,
      timestamp: Date.now(),
      count: (doc.data()?.count ?? 0) + 1,
    }

    await firestore
      .collection('drips')
      .doc(address as string)
      .set(newData)

    const txBatch = api.tx.utility.batchAll([
      api.tx.tokens.transfer(address, { Native: true }, ONE_THOUSAND_DEVEL.toString()),
      api.tx.tokens.transfer(address, { AUSD: true }, TEN_THOUSAND_AUSD.toString()),
    ])

    const keyring = new Keyring({ type: 'sr25519' })
    console.log('signing and sending tx')
    const hash = await txBatch.signAndSend(keyring.addFromUri('//Alice'))

    api.disconnect()
    return res.status(200).json({ hash })
  } catch (e) {
    console.error('Error', e)
    return res.status(500).send(e)
  }
}
