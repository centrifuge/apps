import Centrifuge, { Balance, LoanInfoInput, Perquintill, Pool, Rate } from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { firstValueFrom, lastValueFrom } from 'rxjs'

const SEC_PER_YEAR = 365 * 24 * 60 * 60

const Alice = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

const consoleFreightMetadataHash = 'QmYDnfRRty1wRFi88sPft56Sv1aJatYCTiTR4wyNLd2pne'
const forestCollectionMetadata = 'QmRL22TRYgK71zmH4fcw7YcCTRogLdGTgu4dqEtPYaSyCo'
const baobabTreeNftMetadata = 'Qmd2G2Xjo5dNfQvGxmH9Psuq23b4C8j3pJ1sP8f5BXxED7'
const firTreeNftMetadata = 'QmTNTWJuRNd3bJgGCXoLEaC4TqhbGixq7Y4gGpbzPxAGdS'
const chestnutTreeNftMetadata = 'QmPEQNz2VSoukiiNoyVLeTmhMbTyVmy8kjkNYVFKHH8Ro2'

const makeId = (): string => {
  const min = 1
  const max = 10 ** 12
  return Math.round(Math.random() * (max - min) + min).toString()
}

const poolId = makeId()
const loanCollectionId = makeId()
const assetCollectionId = makeId()
const assetNftId1 = makeId()
const assetNftId2 = makeId()
const assetNftId3 = makeId()

const loanInputs: Record<string, LoanInfoInput & { metadata: string; interestRatePerSec: Rate }> = {
  [assetNftId1]: {
    type: 'CreditLineWithMaturity',
    value: Balance.fromFloat(7500),
    advanceRate: Rate.fromPercent(90),
    probabilityOfDefault: Rate.fromPercent(4.5),
    lossGivenDefault: Rate.fromPercent(4.5),
    discountRate: Rate.fromAprPercent(4.5),
    maturityDate: '2025-10-10T00:00:00.000Z',
    metadata: baobabTreeNftMetadata,
    interestRatePerSec: Rate.fromAprPercent(4.5),
  },
  [assetNftId2]: {
    type: 'CreditLineWithMaturity',
    value: Balance.fromFloat(5000),
    advanceRate: Rate.fromPercent(95),
    probabilityOfDefault: Rate.fromPercent(6.5),
    lossGivenDefault: Rate.fromPercent(6.5),
    discountRate: Rate.fromAprPercent(6.5),
    maturityDate: '2023-02-01T00:00:00.000Z',
    metadata: firTreeNftMetadata,
    interestRatePerSec: Rate.fromAprPercent(6.5),
  },
  [assetNftId3]: {
    type: 'CreditLineWithMaturity',
    value: Balance.fromFloat(1000),
    advanceRate: Rate.fromPercent(99),
    probabilityOfDefault: Rate.fromPercent(8.5),
    lossGivenDefault: Rate.fromPercent(8.5),
    discountRate: Rate.fromAprPercent(8.5),
    maturityDate: '2023-05-30T00:00:00.000Z',
    metadata: chestnutTreeNftMetadata,
    interestRatePerSec: Rate.fromAprPercent(8.5),
  },
}

const createPool = async (centrifuge: Centrifuge, poolId: string, loanCollectionId: string) => {
  const trancheInput = [
    {},
    {
      interestRatePerSec: Rate.fromAprPercent('12'),
      minRiskBuffer: Perquintill.fromPercent('10'),
    },
    {
      interestRatePerSec: Rate.fromAprPercent('10'),
      minRiskBuffer: Perquintill.fromPercent('12'),
    },
  ]

  await lastValueFrom(
    centrifuge.pools.createPool([
      Alice,
      poolId,
      loanCollectionId,
      trancheInput,
      'Usd',
      Balance.fromFloat(1000),
      consoleFreightMetadataHash,
      [{ overdueDays: 1, percentage: Rate.fromPercent(13) }],
    ])
  )
}

const addRolesToPool = async (centrifuge: Centrifuge, poolId: string, pool: Pool) => {
  // give pool creator full admin rights
  await lastValueFrom(
    centrifuge.pools.updatePoolRoles([
      poolId,
      [
        [Alice, 'Borrower'],
        [Alice, 'PricingAdmin'],
        [Alice, 'LiquidityAdmin'],
        [Alice, { TrancheInvestor: [pool.tranches[0].id, SEC_PER_YEAR] }],
        [Alice, { TrancheInvestor: [pool.tranches[1].id, SEC_PER_YEAR] }],
        [Alice, { TrancheInvestor: [pool.tranches[2].id, SEC_PER_YEAR] }],
      ],
      [],
    ])
  )
}

const createAndFinanceAssets = async (centrifuge: Centrifuge) => {
  await lastValueFrom(centrifuge.nfts.createCollection([assetCollectionId, Alice, forestCollectionMetadata]))
  for (const assetId in loanInputs) {
    const { metadata, interestRatePerSec, ...assetInput } = loanInputs[assetId]
    await lastValueFrom(centrifuge.nfts.mintNft([assetCollectionId, assetId, Alice, metadata]))
    await lastValueFrom(centrifuge.pools.createLoan([poolId, assetCollectionId, assetId]))

    const nextLoanId = (await centrifuge.pools.getNextLoanId()).toString()
    const currentLoanId = `${Number(nextLoanId) - 1}`
    await lastValueFrom(centrifuge.pools.priceLoan([poolId, currentLoanId, interestRatePerSec.toString(), assetInput]))

    // check this transaction in UI, make sure numbers are fine
    await lastValueFrom(centrifuge.pools.financeLoan([poolId, currentLoanId, Balance.fromFloat(300)]))
    console.log(`Created and financed loan with id: ${currentLoanId}`)
  }
}

const run = async () => {
  const keyring = new Keyring({ type: 'sr25519' })
  const AliceKeyRing = keyring.addFromUri('//Alice')

  const centrifuge = new Centrifuge({
    network: 'centrifuge',
    polkadotWsUrl: 'ws://localhost:9944',
    centrifugeWsUrl: 'ws://localhost:9946',
    signingAddress: AliceKeyRing,
    printExtrinsics: true,
  })

  console.log(
    `poolId: ${poolId}, loanCollectionId: ${loanCollectionId}, assetCollectionId: ${assetCollectionId}, assetNftIds: ${assetNftId1}, ${assetNftId2}, ${assetNftId3}`
  )

  await createPool(centrifuge, poolId, loanCollectionId)

  const pool = await firstValueFrom(centrifuge.pools.getPool([poolId]))
  await addRolesToPool(centrifuge, poolId, pool)

  await lastValueFrom(centrifuge.pools.updatePool({ poolId, minEpochTime: { newValue: 1 } }))

  const JUN = pool.tranches[0].id
  const MEZ = pool.tranches[1].id
  const SEN = pool.tranches[2].id

  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, SEN, Balance.fromFloat(2000)]))
  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, MEZ, Balance.fromFloat(1000)]))
  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, JUN, Balance.fromFloat(500)]))

  await lastValueFrom(centrifuge.pools.closeEpoch([poolId]))
  console.log('EPOCH 1 CLOSED')

  await lastValueFrom(centrifuge.pools.collect([poolId]))
  console.log(JSON.stringify(await centrifuge.pools.getPool([poolId]), null, 4))

  await createAndFinanceAssets(centrifuge)

  const nextLoanId = (await centrifuge.pools.getNextLoanId()).toString()
  const currentLoanId = `${Number(nextLoanId) - 1}`

  // check this in UI as well
  await lastValueFrom(centrifuge.pools.updateRedeemOrder([poolId, SEN, Balance.fromFloat(400)]))
  console.log(JSON.stringify(await centrifuge.pools.getPool([poolId]), null, 4))

  await lastValueFrom(centrifuge.pools.closeEpoch([poolId]))
  await lastValueFrom(centrifuge.pools.collect([poolId]))
  console.log('EPOCH 2 CLOSED')

  // this one doesn't work
  await lastValueFrom(centrifuge.pools.collect([poolId, JUN]))
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

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getLoans([poolId])), null, 4))
  await lastValueFrom(centrifuge.pools.repayAndCloseLoan([poolId, currentLoanId]))
  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getLoans([poolId])), null, 4))

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getPool([poolId])), null, 4))

  const writeOffGroupId = 0
  await lastValueFrom(centrifuge.pools.adminWriteOff([poolId, currentLoanId, writeOffGroupId]))

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getPool([poolId])), null, 4))

  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, SEN, Balance.fromFloat(10)]))
  await lastValueFrom(centrifuge.pools.closeEpoch([poolId]))
  console.log('EPOCH 3 CLOSED')
  await lastValueFrom(centrifuge.pools.collect([poolId]))
}

cryptoWaitReady().then(() => {
  run()
})
