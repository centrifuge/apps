import { ApiPromise, WsProvider } from '@polkadot/api'
import express, { Express, Request, Response } from 'express'
const { Keyring } = require('@polkadot/keyring')

const app: Express = express()

app.get('/', async (req: Request, res: Response) => {
  try {
    const receiver = req.query.address
    const wsProvider = new WsProvider('wss://fullnode.development.cntrfg.com')
    const api = await ApiPromise.create({ provider: wsProvider })
    const keyring = new Keyring({ type: 'sr25519' })
    const alice = keyring.addFromUri('//Alice')

    const tx = api.tx.utility.batchAll([
      api.tx.tokens.transfer(receiver, 'Native', '1000000000000000000000'),
      api.tx.tokens.transfer(receiver, { AUSD: true }, '10000000000000000'),
    ])

    const hash = await tx.signAndSend(alice)

    return res.json({ hash })
  } catch (e) {
    return res.send({ error: e })
  }
})

exports.faucet = app
