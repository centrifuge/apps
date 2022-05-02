import Centrifuge from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import BN from 'bn.js'
import { firstValueFrom, lastValueFrom } from 'rxjs'

const Currency = new BN(10).pow(new BN(18))
const Rate = new BN(10).pow(new BN(27))

const run = async () => {
  const keyring = new Keyring({ type: 'sr25519' })
  const Alice = keyring.addFromUri('//Alice')

  const centrifuge = new Centrifuge({
    network: 'centrifuge',
    polkadotWsUrl: 'wss://fullnode-relay-2.development.cntrfg.com',
    centrifugeWsUrl: 'wss://fullnode-collator-2.development.cntrfg.com',
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

  await lastValueFrom(
    centrifuge.pools.createPool([
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      poolId,
      loanCollectionId,
      [{}, { interestPerSec: centrifuge.utils.aprToFee(0.1), minRiskBuffer: centrifuge.utils.toPerquintill(0.1) }],
      'Usd',
      new BN(1000).mul(Currency),
      'QmTPNcy1R18o6Z2NW2nD8a43GoHs5HZoWQUxoY89kV188g',
    ])
  )

  await lastValueFrom(centrifuge.pools.updatePool([poolId, new BN(0), new BN(0), new BN(10000)]))

  const SEC_PER_YEAR = 365 * 24 * 60 * 60

  await lastValueFrom(
    centrifuge.pools.approveRoles([
      poolId,
      [
        'Borrower',
        'RiskAdmin',
        'PricingAdmin',
        { TrancheInvestor: [0, SEC_PER_YEAR] },
        { TrancheInvestor: [1, SEC_PER_YEAR] },
        'Borrower',
        'RiskAdmin',
        'PricingAdmin',
        { TrancheInvestor: [0, SEC_PER_YEAR] },
        { TrancheInvestor: [1, SEC_PER_YEAR] },
      ],
      [
        Alice.address,
        Alice.address,
        Alice.address,
        Alice.address,
        Alice.address,
        '5CHxUQgq69ay2Sw36Duo78txL9RynKH4tAE5NxergqJZWw3f',
        '5CHxUQgq69ay2Sw36Duo78txL9RynKH4tAE5NxergqJZWw3f',
        '5CHxUQgq69ay2Sw36Duo78txL9RynKH4tAE5NxergqJZWw3f',
        '5CHxUQgq69ay2Sw36Duo78txL9RynKH4tAE5NxergqJZWw3f',
        '5CHxUQgq69ay2Sw36Duo78txL9RynKH4tAE5NxergqJZWw3f',
      ],
    ])
  )

  await lastValueFrom(centrifuge.pools.addWriteOffGroup([poolId, new BN(centrifuge.utils.toRate(0.5)), 1]))

  await lastValueFrom(
    centrifuge.nfts.createCollection([
      assetCollectionId,
      Alice.address,
      'data:application/json;base64,eyJuYW1lIjoiU29tZSBjb2xsZWN0aW9uIiwiZGVzY3JpcHRpb24iOiJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCBjb25zZWN0ZXR1ciBhZGlwaXNpY2luZyBlbGl0In0=',
    ])
  )
  await lastValueFrom(
    centrifuge.nfts.mintNft([
      assetCollectionId,
      assetNftId,
      Alice.address,
      'data:application/json;base64,eyJuYW1lIjoiU29tZSBORlQgMiIsImRlc2NyaXB0aW9uIjoiSnVzdCBzb21lIE5GVCIsImltYWdlIjoiaXBmczovL2lwZnMvUW1lUHgyV3Z4eG1qbWgyZkpXNWJyMkZCcHE2ekRFWEVHanpQelRjVjVoamF0VyJ9',
    ])
  )

  let loanId = await centrifuge.pools.getNextLoanId()
  await lastValueFrom(centrifuge.pools.createLoan([poolId, assetCollectionId, assetNftId]))
  await lastValueFrom(
    centrifuge.pools.priceLoan([
      poolId,
      loanId,
      centrifuge.utils.aprToFee(0.1),
      'BulletLoan',
      [
        centrifuge.utils.toRate(1),
        centrifuge.utils.toRate(0),
        centrifuge.utils.toRate(0),
        new BN(100).mul(Currency).toString(),
        centrifuge.utils.aprToFee(0.12),
        new Date(2022, 12, 25).getTime().toString(),
      ],
    ])
  )

  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, 1, new BN(200).mul(Currency)]))
  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, 0, new BN(100).mul(Currency)]))
  await lastValueFrom(centrifuge.pools.closeEpoch([poolId]))
  await lastValueFrom(centrifuge.pools.collect([poolId]))
  console.log(JSON.stringify(await centrifuge.pools.getPool([poolId]), null, 4))

  await lastValueFrom(centrifuge.pools.financeLoan([poolId, loanId, new BN(50).mul(Currency)]))
  console.log(JSON.stringify(await centrifuge.pools.getLoan([poolId, loanId]), null, 4))

  await lastValueFrom(centrifuge.pools.updateRedeemOrder([poolId, 1, new BN(200).mul(Currency)]))
  console.log(JSON.stringify(await centrifuge.pools.getPool([poolId]), null, 4))

  await lastValueFrom(centrifuge.pools.closeEpoch([poolId]))
  await lastValueFrom(centrifuge.pools.collect([poolId, 0]))
  await lastValueFrom(
    centrifuge.pools.submitSolution([
      poolId,
      [
        [centrifuge.utils.toPerquintill(1), centrifuge.utils.toPerquintill(1)],
        [centrifuge.utils.toPerquintill(1), centrifuge.utils.toPerquintill(0.95)],
      ],
    ])
  )
  await lastValueFrom(centrifuge.pools.collect([poolId]))
  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getPool([poolId])), null, 4))

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getLoans([poolId])), null, 4))
  await lastValueFrom(centrifuge.pools.repayAndCloseLoan([poolId, loanId]))
  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getLoans([poolId])), null, 4))

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getPool([poolId])), null, 4))

  const writeOffGroupId = 0
  await lastValueFrom(centrifuge.pools.adminWriteOff([poolId, loanId, writeOffGroupId]))

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getPool([poolId])), null, 4))

  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, 1, new BN(10).mul(Currency)]))
  await lastValueFrom(centrifuge.pools.closeEpoch([poolId]))
  await lastValueFrom(centrifuge.pools.collect([poolId]))
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
