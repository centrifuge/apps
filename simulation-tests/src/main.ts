import Centrifuge, { Balance, LoanInfoInput, Perquintill, Pool, Rate } from '@centrifuge/centrifuge-js'
import { Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import BN from 'bn.js'
import { firstValueFrom, lastValueFrom } from 'rxjs'

const SEC_PER_YEAR = 365 * 24 * 60 * 60

const Currency = new BN(10).pow(new BN(18))

const Alice = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

const consoleFreightMetadataHash = 'QmYDnfRRty1wRFi88sPft56Sv1aJatYCTiTR4wyNLd2pne'
const forestCollectionMetadata = 'QmRL22TRYgK71zmH4fcw7YcCTRogLdGTgu4dqEtPYaSyCo'
const baobabTreeNftMetadata = 'Qmd2G2Xjo5dNfQvGxmH9Psuq23b4C8j3pJ1sP8f5BXxED7'

const curCollectionId = '593814048587'
const curPoolId = '950381600487'
const curLoanCollectionId = '123123123137'
const curAssetNftId = '124124124141'

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
      new BN(1000000).mul(Currency),
      consoleFreightMetadataHash,
      [{ overdueDays: 1, percentage: Rate.fromPercent(13) }],
    ])
  )
}

// give pool creator full admin rights
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

const createCollection = async (centrifuge: Centrifuge, assetCollectionId: string) => {
  await lastValueFrom(centrifuge.nfts.createCollection([assetCollectionId, Alice, forestCollectionMetadata]))
}

const mintNftIntoCollection = async (centrifuge: Centrifuge, assetCollectionId: string, assetNftId: string) => {
  await lastValueFrom(centrifuge.nfts.mintNft([assetCollectionId, assetNftId, Alice, baobabTreeNftMetadata]))
}

const priceLoan = async (centrifuge: Centrifuge, poolId: string, loanId: string) => {
  const loanInfoInput: LoanInfoInput = {
    type: 'CreditLineWithMaturity',
    value: Balance.fromFloat(100000),
    advanceRate: Rate.fromPercent(90),
    probabilityOfDefault: Rate.fromPercent(4.5),
    lossGivenDefault: Rate.fromPercent(4.5),
    discountRate: Rate.fromAprPercent(4.5),
    maturityDate: '2023-05-24T00:00:00.000Z',
  }

  await lastValueFrom(centrifuge.pools.priceLoan([poolId, loanId, Rate.fromAprPercent(4.5).toString(), loanInfoInput]))
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

  // TODO create and finance a loan in each riskgroup

  const poolId = curPoolId
  const loanCollectionId = curLoanCollectionId
  const assetCollectionId = curCollectionId
  const assetNftId = curAssetNftId

  console.log(
    `poolId: ${poolId}, loanCollectionId: ${loanCollectionId}, assetCollectionId: ${assetCollectionId}, assetNftId: ${assetNftId}`
  )

  // create pool based on already existing metadata (cool pool in this case)
  await createPool(centrifuge, poolId, loanCollectionId)

  const pool = await firstValueFrom(centrifuge.pools.getPool([poolId]))
  await addRolesToPool(centrifuge, poolId, pool)

  await createCollection(centrifuge, assetCollectionId)

  await mintNftIntoCollection(centrifuge, assetCollectionId, assetNftId)

  await lastValueFrom(centrifuge.pools.createLoan([poolId, assetCollectionId, assetNftId]))

  const nextLoanId = (await centrifuge.pools.getNextLoanId()).toString()
  const currentLoanId = `${Number(nextLoanId) - 1}`
  await priceLoan(centrifuge, poolId, currentLoanId)

  await lastValueFrom(centrifuge.pools.updatePool([poolId, 1, 1, 1]))

  const JUN = pool.tranches[0].id
  const MEZ = pool.tranches[1].id
  const SEN = pool.tranches[2].id

  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, SEN, new BN(2000).mul(Currency)]))
  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, MEZ, new BN(1000).mul(Currency)]))
  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, JUN, new BN(500).mul(Currency)]))

  await lastValueFrom(centrifuge.pools.closeEpoch([poolId]))

  await lastValueFrom(centrifuge.pools.collect([poolId]))
  console.log(JSON.stringify(await centrifuge.pools.getPool([poolId]), null, 4))

  await lastValueFrom(centrifuge.pools.financeLoan([poolId, currentLoanId, new BN(50).mul(Currency)]))
  console.log(JSON.stringify(await centrifuge.pools.getLoan([poolId, currentLoanId]), null, 4))

  await lastValueFrom(centrifuge.pools.updateRedeemOrder([poolId, SEN, new BN(200).mul(Currency)]))
  console.log(JSON.stringify(await centrifuge.pools.getPool([poolId]), null, 4))

  await lastValueFrom(centrifuge.pools.closeEpoch([poolId]))
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
  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getPool([poolId])), null, 4))

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getLoans([poolId])), null, 4))
  await lastValueFrom(centrifuge.pools.repayAndCloseLoan([poolId, currentLoanId]))
  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getLoans([poolId])), null, 4))

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getPool([poolId])), null, 4))

  const writeOffGroupId = 0
  await lastValueFrom(centrifuge.pools.adminWriteOff([poolId, currentLoanId, writeOffGroupId]))

  console.log(JSON.stringify(await firstValueFrom(centrifuge.pools.getPool([poolId])), null, 4))

  await lastValueFrom(centrifuge.pools.updateInvestOrder([poolId, SEN, new BN(10).mul(Currency)]))
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
