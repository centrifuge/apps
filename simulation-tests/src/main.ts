import Centrifuge from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'

// const Currency = 10 ** 18

const run = async () => {
  const keyring = new Keyring({ type: 'sr25519' })
  const AliceAccount = keyring.addFromUri('//Alice')

  const centrifuge = new Centrifuge({
    network: 'centrifuge',
    polkadotWsUrl: 'ws://localhost:9944',
    centrifugeWsUrl: 'ws://localhost:9946',
    signingAddress: AliceAccount,
  })

  const poolId = makeId(16)
  const loanCollectionId = makeId(16)
  const assetCollectionId = makeId(16)

  console.log('Create pool')
  await centrifuge.pools.createPool([
    poolId,
    loanCollectionId,
    [
      [10, 5],
      [0, 0],
    ],
    'Usd',
    1000,
  ])

  console.log('Add borrower role to Alice')
  await centrifuge.pools.approveRole([poolId, 'Borrower', [AliceAccount.address]])

  console.log('Create asset collection')
  await centrifuge.nfts.createCollection([
    assetCollectionId,
    AliceAccount.address,
    'QmUTwA6RTUb1FbJCeM1D4G4JaMHAbPehK6WwCfykJixjm3',
  ])

  console.log('Mint asset NFT')
  const assetNftId = makeId(16)
  await centrifuge.nfts.mintNft([
    assetCollectionId,
    assetNftId,
    AliceAccount.address,
    'QmUTwA6RTUb1FbJCeM1D4G4JaMHAbPehK6WwCfykJixjm3',
  ])

  console.log('Create asset')
  await centrifuge.pools.createLoan([poolId, loanCollectionId, assetNftId])

  console.log('Invest in both tranches')
  await centrifuge.pools.updateInvestOrder([poolId, 1, 100])
  await centrifuge.pools.updateInvestOrder([poolId, 0, 100])

  console.log('Close epoch')
  await centrifuge.pools.closeEpoch([poolId])
}

cryptoWaitReady().then(() => {
  run()
})

const makeId = (length: number) => {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
