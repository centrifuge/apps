import Centrifuge from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import BN from 'bn.js'

const Currency = new BN(10).pow(new BN(18))
const Rate = new BN(10).pow(new BN(27))

const run = async () => {
  const keyring = new Keyring({ type: 'sr25519' })
  const Alice = keyring.addFromUri('//Alice')

  const centrifuge = new Centrifuge({
    network: 'centrifuge',
    polkadotWsUrl: 'ws://localhost:9944',
    centrifugeWsUrl: 'ws://localhost:9946',
    signingAddress: Alice,
    printExtrinsics: true,
  })

  const poolId = makeId()
  const loanCollectionId = makeId()
  const assetCollectionId = makeId()
  const assetNftId = makeId()
  console.log(
    `poolId: ${poolId}, loanCollectionId: ${loanCollectionId}, assetCollectionId: ${assetCollectionId}, assetNftId: ${assetNftId}`
  )

  await centrifuge.pools.createPool([
    poolId,
    loanCollectionId,
    [
      [10, 5],
      [0, 0],
    ],
    'Usd',
    new BN(1000).mul(Currency),
    'QmUTwA6RTUb1FbJCeM1D4G4JaMHAbPehK6WwCfykJixjm3',
  ])

  await centrifuge.pools.approveRoles([poolId, ['Borrower', 'RiskAdmin'], [Alice.address, Alice.address]])

  // await centrifuge.pools.addWriteOffGroup([poolId, new BN(50).mul(new BN(10).pow(new BN(25))), 1])

  await centrifuge.nfts.createCollection([
    assetCollectionId,
    Alice.address,
    'QmUTwA6RTUb1FbJCeM1D4G4JaMHAbPehK6WwCfykJixjm3',
  ])
  await centrifuge.nfts.mintNft([
    assetCollectionId,
    assetNftId,
    Alice.address,
    'QmUTwA6RTUb1FbJCeM1D4G4JaMHAbPehK6WwCfykJixjm3',
  ])

  let loanId = await centrifuge.pools.getNextLoanId()
  await centrifuge.pools.createLoan([poolId, assetCollectionId, assetNftId])
  // await centrifuge.pools.priceLoan([
  //   poolId,
  //   loanId,
  //   '1000000003488077118214104515',
  //   'CreditLine',
  //   [Rate.toString(), new BN(100).mul(Currency).toString()],
  // ])
  await centrifuge.pools.priceLoan([
    poolId,
    loanId,
    '1000000003488077118214104515',
    'BulletLoan',
    [
      Rate.toString(),
      new BN(1).pow(new BN(25)).toString(),
      new BN(50).pow(new BN(25)).toString(),
      new BN(100).mul(Currency).toString(),
      new BN(10).pow(new BN(25)).toString(),
      '1640553336',
    ],
  ])

  await centrifuge.pools.updateInvestOrder([poolId, 1, new BN(100).mul(Currency)])
  await centrifuge.pools.updateInvestOrder([poolId, 0, new BN(100).mul(Currency)])
  await centrifuge.pools.closeEpoch([poolId])

  await centrifuge.pools.financeLoan([poolId, loanId, new BN(50).mul(Currency)])

  const writeOffGroupId = 0
  await centrifuge.pools.adminWriteOff([poolId, loanId, writeOffGroupId])

  // await centrifuge.pools.updateInvestOrder([poolId, 0, new BN(10).mul(Currency)])
  // await centrifuge.pools.closeEpoch([poolId])

  const pool = await centrifuge.pools.getPool([poolId])
  console.log(JSON.stringify(pool, null, 4))
}

cryptoWaitReady().then(() => {
  run()
})

const makeId = (): string => {
  const min = 1
  const max = 10 ** 12
  return Math.round(Math.random() * (max - min) + min).toString()
}

// const recursiveBNToString = (obj: { [key: any]: any } => {

// })
