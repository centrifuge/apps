import Centrifuge from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import BN from 'bn.js'

// const Currency = 10 ** 18
const Rate = new BN(10).pow(new BN(27))

const run = async () => {
  const keyring = new Keyring({ type: 'sr25519' })
  const AliceAccount = keyring.addFromUri('//Alice')

  const centrifuge = new Centrifuge({
    network: 'centrifuge',
    polkadotWsUrl: 'ws://localhost:9944',
    centrifugeWsUrl: 'ws://localhost:9946',
    signingAddress: AliceAccount,
  })

  // const poolId = makeId()
  const poolId = '836920498006'
  const loanCollectionId = makeId()
  const assetCollectionId = makeId()
  const assetNftId = makeId()
  console.log(
    `poolId: ${poolId}, loanCollectionId: ${loanCollectionId}, assetCollectionId: ${assetCollectionId}, assetNftId: ${assetNftId}`
  )

  // console.log('Create pool')
  // await centrifuge.pools.createPool([
  //   poolId,
  //   loanCollectionId,
  //   [
  //     [10, 5],
  //     [0, 0],
  //   ],
  //   'Usd',
  //   1000,
  // ])

  // console.log('Add borrower role to Alice')
  // await centrifuge.pools.approveRole([poolId, 'Borrower', [AliceAccount.address]])

  // console.log('Create asset collection')
  // await centrifuge.nfts.createCollection([
  //   assetCollectionId,
  //   AliceAccount.address,
  //   'QmUTwA6RTUb1FbJCeM1D4G4JaMHAbPehK6WwCfykJixjm3',
  // ])

  // console.log('Mint asset NFT')
  // await centrifuge.nfts.mintNft([
  //   assetCollectionId,
  //   assetNftId,
  //   AliceAccount.address,
  //   'QmUTwA6RTUb1FbJCeM1D4G4JaMHAbPehK6WwCfykJixjm3',
  // ])

  // console.log('Create asset')
  // await centrifuge.pools.createLoan([poolId, assetCollectionId, assetNftId])

  // console.log('Price asset')
  // const loanId = '6'
  // await centrifuge.pools.priceLoan([
  //   poolId,
  //   loanId,
  //   '1000000003488077118214104515',
  //   'CreditLine',
  //   [Rate.toString(), '100'],
  // ])

  // console.log('Invest in both tranches')
  // await centrifuge.pools.updateInvestOrder([poolId, 1, 100])
  // await centrifuge.pools.updateInvestOrder([poolId, 0, 100])

  // console.log('Close epoch')
  // await centrifuge.pools.closeEpoch([poolId])

  console.log('Finance asset')
  const loanId = '6'
  await centrifuge.pools.financeLoan([poolId, loanId, '50'])
}

cryptoWaitReady().then(() => {
  run()
})

const makeId = (): string => {
  const min = 1
  const max = 10 ** 12
  return Math.round(Math.random() * (max - min) + min).toString()
}
