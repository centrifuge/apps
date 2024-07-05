import {
  CurrencyBalance,
  LoanInfoInput,
  PoolMetadata,
  PoolMetadataInput,
  Price,
  Rate,
  computeTrancheId,
  evmToSubstrateAddress,
} from '@centrifuge/centrifuge-js'
import {
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useTransactions,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { TransactionReceipt } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Keyring } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto'
import { BN } from 'bn.js'
import { useMemo, useState } from 'react'
import { combineLatest, firstValueFrom, lastValueFrom, of, switchMap } from 'rxjs'

const poolManagerKey = '0xd2f2b2de40733b8fdcc750f0b9837f99d6e2b69112e70ab224386920eb860e10'
const borrowerKey = '0x554a099c95e64fe36ef91c151d0827e2f643f7434a22adfea17ae29b5e6fbfd5'
const investorKey = '0x7778e5bbb188ed166afe9b54ca27636267f3e84042082645328bea07603b2818'
const navManagerKey = '0xa0944046706748b3f07ac494a599a4b1264a864872fcd1a9dae704e1561e8d08'
const feeReceiverKey = '0x287100f2037ad46c4ea7fa08ffe051ec9b61bdc9dc172d09e98aa82619dc6635'

const TEMPLATE_HASH = 'QmYhNkqfyPzz9huxLLvoVuJJXM4GZBtSUU6JqgGRrLGR8P'

const TEN_YEARS_FROM_NOW = Math.floor(Date.now() / 1000 + 10 * 365 * 24 * 60 * 60)

export function CreateAndSetupPool() {
  const {
    substrate: { evmChainId },
    evm: { getProvider },
  } = useWallet()
  const [[PoolManagerKeyring, BorrowerKeyring, InvestorKeyring, NavManagerKeyring, FeeReceiverKeyring]] = useState(
    () => {
      const keyring = new Keyring({ type: 'sr25519' })
      return [
        keyring.addFromUri('//Alice'),
        keyring.addFromUri('//Bob'),
        keyring.addFromUri('//Charlie'),
        keyring.addFromUri('//Dave'),
        keyring.addFromUri('//Eve'),
      ]
    }
  )
  const cent = useCentrifuge()
  const api = useCentrifugeApi()
  const consts = useCentrifugeConsts()

  const { updateTransaction } = useTransactions()

  const [PoolManager, Borrower, Investor, NavManager, FeeReceiver] = useMemo(() => {
    const provider = evmChainId ? getProvider(evmChainId) : undefined
    return [
      new Wallet(poolManagerKey, provider),
      new Wallet(borrowerKey, provider),
      new Wallet(investorKey, provider),
      new Wallet(navManagerKey, provider),
      new Wallet(feeReceiverKey, provider),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evmChainId])

  const { execute, isLoading } = useCentrifugeTransaction('Create pool', () => ([txId]: [string], options) => {
    async function doTransactions(useEvm = false) {
      if (!evmChainId) throw new Error('No evm chain id')

      const poolId = makeId()
      const nftCollectionId = makeId()
      const assetNftId1 = makeId()
      const assetNftId2 = makeId()
      const assetNftId3 = makeId()
      const juniorTranche = computeTrancheId(0, poolId)
      const isin1 = makeIsin()

      const poolManagerCentAddress = useEvm
        ? evmToSubstrateAddress(PoolManager.address, evmChainId)
        : PoolManagerKeyring.address
      const borrowerCentAddress = useEvm ? evmToSubstrateAddress(Borrower.address, evmChainId) : BorrowerKeyring.address
      const investorCentAddress = useEvm ? evmToSubstrateAddress(Investor.address, evmChainId) : InvestorKeyring.address
      const navManagerCentAddress = useEvm
        ? evmToSubstrateAddress(NavManager.address, evmChainId)
        : NavManagerKeyring.address
      const feeReceiverCentAddress = useEvm
        ? evmToSubstrateAddress(FeeReceiver.address, evmChainId)
        : FeeReceiverKeyring.address
      const poolManagerCent = useEvm
        ? cent.connectEvm(PoolManager.address, PoolManager, evmChainId)
        : cent.connect(PoolManagerKeyring)
      const borrowerCent = useEvm
        ? cent.connectEvm(Borrower.address, Borrower, evmChainId)
        : cent.connect(BorrowerKeyring)
      const investorCent = useEvm
        ? cent.connectEvm(Investor.address, Investor, evmChainId)
        : cent.connect(InvestorKeyring)
      const navManagerCent = useEvm
        ? cent.connectEvm(NavManager.address, NavManager, evmChainId)
        : cent.connect(NavManagerKeyring)
      const feeReceiveCent = useEvm
        ? cent.connectEvm(FeeReceiver.address, FeeReceiver, evmChainId)
        : cent.connect(FeeReceiverKeyring)

      console.log(
        'poolManagerCentAddress',
        poolManagerCentAddress,
        borrowerCentAddress,
        investorCentAddress,
        navManagerCentAddress,
        feeReceiverCentAddress
      )

      const feeId = await firstValueFrom(cent.pools.getNextPoolFeeId())

      const metadata: PoolMetadata = {
        version: 1,
        pool: {
          name: 'E2E Test Pool',
          icon: { uri: 'ipfs://QmTocPtJYu2sXYoir52dR6iqDjg56v4Tc3sH8fxGNuLDWQ', mime: 'image/svg+xml' },
          asset: { class: 'Public credit', subClass: 'US Treasuries' },
          issuer: {
            name: 'E2E Issuer',
            repName: 'Alice',
            description: 'We issue things',
            email: 'test@k-f.co',
            logo: { uri: 'ipfs://QmaJVD2b53xYFSRDBxg6X8977fwvyzoDuCxvambe4QvrqT', mime: 'image/png' },
          },
          links: {
            executiveSummary: { uri: 'ipfs://QmSPNN2QsqBB9MkiifWQi55iVZ2CLicq7X6EezZwB98uLE', mime: 'application/pdf' },
            forum: '',
            website: '',
          },
          details: [],
          status: 'open',
          listed: false,
          poolFees: [
            { name: 'Protocol fee', feePosition: 'Top of waterfall', id: feeId },
            { name: 'Issuer fee', feePosition: 'Top of waterfall', id: feeId + 1 },
          ],
          reports: [
            {
              author: { avatar: null, name: 'Bob Alison', title: 'Facilitator of the E2E Credit Group' },
              uri: 'https://gov.centrifuge.io/',
            },
          ],
        },
        pod: {},
        tranches: { [juniorTranche]: { minInitialInvestment: '0' } },
        // onboarding: {
        //   tranches: { [juniorTranche]: { openForOnboarding: true } },
        //   kycRestrictedCountries: ['us', 'um'],
        //   kybRestrictedCountries: ['us'],
        //   externalOnboardingUrl: 'https://www.anemoy.io/funds/ltf#get-access',
        //   podReadAccess: true,
        //   taxInfoRequired: true,
        // },
        loanTemplates: [{ id: TEMPLATE_HASH, createdAt: new Date().toISOString() }],
      }
      const metadataInput: Partial<PoolMetadataInput> = {
        poolName: 'E2E Test Pool',
        tranches: [
          {
            minInvestment: 0,
            tokenName: 'Junior',
            symbolName: 'E2EJUN',
            interestRate: '',
            minRiskBuffer: '',
          },
        ],
      }

      const result: TransactionReceipt = await lastValueFrom(
        poolManagerCent.wrapSignAndSend(
          api,
          api.tx.utility.batchAll([api.tx.proxy.createPure('Any', 0, 0), api.tx.proxy.createPure('Any', 0, 1)])
        )
      )
      const blockEvents: any = await firstValueFrom(
        api.rpc.chain
          .getBlockHash(result.blockNumber)
          .pipe(switchMap((blockHash) => api.query.system.events.at(blockHash)))
      )

      console.log('events', blockEvents)
      const events = blockEvents.filter(({ event }: any) => api.events.proxy.PureCreated.is(event))
      if (!events?.length) throw new Error('no events')
      const { pure: adminProxy } = (events[0].toHuman() as any).event.data
      const { pure: aoProxy } = (events[1].toHuman() as any).event.data

      updateTransaction(txId, {
        title: 'Create pool',
        status: 'pending',
      })

      const [poolTx, permissionTx, metadataTx] = await firstValueFrom(
        combineLatest([
          poolManagerCent.pools.createPool(
            [
              adminProxy,
              poolId,
              [{}],
              { LocalAsset: '1' },
              CurrencyBalance.fromFloat(1000000, 6),
              metadataInput as any,
              [
                {
                  destination: import.meta.env.REACT_APP_TREASURY,
                  feeType: 'fixed',
                  limit: 'ShareOfPortfolioValuation',
                  name: 'Protocol fee',
                  amount: Rate.fromPercent(0.075),
                  feePosition: 'Top of waterfall',
                },
                {
                  destination: feeReceiverCentAddress,
                  feeType: 'chargedUpTo',
                  limit: 'ShareOfPortfolioValuation',
                  name: 'Issuer fee',
                  amount: Rate.fromPercent(0.5),
                  feePosition: 'Top of waterfall',
                },
              ],
            ],
            { createType: 'immediate', batch: true }
          ),
          poolManagerCent.pools.updatePoolRoles(
            [
              poolId,
              [
                [poolManagerCentAddress, 'InvestorAdmin'],
                [poolManagerCentAddress, 'LiquidityAdmin'],
                [adminProxy, 'InvestorAdmin'],
                [aoProxy, 'Borrower'],
                [aoProxy, 'LoanAdmin'],
                [aoProxy, 'LiquidityAdmin'],
                [aoProxy, { TrancheInvestor: [juniorTranche, TEN_YEARS_FROM_NOW] }],
                [investorCentAddress, { TrancheInvestor: [juniorTranche, TEN_YEARS_FROM_NOW] }],
              ],
              [],
            ],
            { batch: true }
          ),
          poolManagerCent.pools.setMetadata([poolId, metadata], { batch: true }),
        ])
      )

      const feederInfo = {
        minFeeders: 1,
        feeders: [{ system: { Signed: navManagerCentAddress } }, { system: { Signed: aoProxy } }],
      }
      const feederChange = api.createType('RuntimeCommonChangesRuntimeChange', {
        OracleCollection: { CollectionInfo: feederInfo },
      })

      const createTx = api.tx.utility.batchAll([
        api.tx.balances.transferKeepAlive(adminProxy, consts.proxy.proxyDepositFactor),
        api.tx.balances.transferKeepAlive(
          aoProxy,
          consts.proxy.proxyDepositFactor
            .mul(new BN(5))
            .add(consts.uniques.collectionDeposit)
            // Enough to mint some assets
            .add(CurrencyBalance.fromFloat(1000, 18))
        ),

        // Setup the AO
        // * Add admin proxy and borrower as proxies to the AO proxy
        // * Create collateral NFT collection
        api.tx.proxy.proxy(
          aoProxy,
          undefined,
          api.tx.utility.batchAll([
            api.tx.proxy.addProxy(adminProxy, 'Any', 0),
            api.tx.proxy.removeProxy(poolManagerCentAddress, 'Any', 0),
            api.tx.proxy.addProxy(borrowerCentAddress, 'Borrow', 0),
            api.tx.proxy.addProxy(borrowerCentAddress, 'Invest', 0),
            api.tx.proxy.addProxy(borrowerCentAddress, 'Transfer', 0),
            api.tx.proxy.addProxy(borrowerCentAddress, 'PodOperation', 0),
            api.tx.uniques.create(nftCollectionId, aoProxy),
          ])
        ),

        // Create the pool
        poolTx,

        // Setup permissions and metadata
        api.tx.proxy.proxy(adminProxy, undefined, permissionTx),
        api.tx.proxy.proxy(
          adminProxy,
          undefined,
          api.tx.utility.batchAll([
            metadataTx,
            api.tx.oraclePriceCollection.proposeUpdateCollectionInfo(poolId, feederInfo),
            api.tx.oraclePriceCollection.applyUpdateCollectionInfo(poolId, blake2AsHex(feederChange.toU8a(), 256)),
          ])
        ),
      ])

      await lastValueFrom(poolManagerCent.wrapSignAndSend(api, createTx))

      updateTransaction(txId, {
        title: 'Invest',
        status: 'pending',
      })

      // Invest
      const investTx = api.tx.investments.updateInvestOrder(
        [poolId, juniorTranche],
        CurrencyBalance.fromFloat(10000, 6)
      )
      await lastValueFrom(investorCent.wrapSignAndSend(api, investTx))

      const cashAssetPricing: LoanInfoInput = {
        valuationMethod: 'cash',
        advanceRate: Rate.fromPercent(100),
        interestRate: Rate.fromPercent(0),
        value: new BN(2).pow(new BN(128)).subn(1), // max uint128
        maxBorrowAmount: 'upToOutstandingDebt',
        maturityDate: new Date('2025-12-31'),
      }
      const oracleAssetPricing: LoanInfoInput = {
        valuationMethod: 'oracle',
        maxPriceVariation: Rate.fromPercent(9999),
        maxBorrowAmount: null,
        withLinearPricing: false,
        priceId: { isin: isin1 },
        maturityDate: new Date('2025-12-31'),
        interestRate: Rate.fromPercent(0),
        notional: CurrencyBalance.fromFloat(100, 6),
      }
      const [createLoanTx1, createLoanTx2] = await firstValueFrom(
        combineLatest([
          borrowerCent.pools.createLoan([poolId, nftCollectionId, assetNftId1, cashAssetPricing], { batch: true }),
          borrowerCent.pools.createLoan([poolId, nftCollectionId, assetNftId2, oracleAssetPricing], { batch: true }),
        ])
      )

      updateTransaction(txId, {
        title: 'Create assets',
        status: 'pending',
      })

      // Create loans
      const loanBatch = api.tx.utility.batchAll([
        api.tx.proxy.proxy(
          aoProxy,
          'PodOperation',
          api.tx.utility.batchAll([
            // Cash asset
            api.tx.uniques.mint(nftCollectionId, assetNftId1, aoProxy),
            api.tx.uniques.setMetadata(
              nftCollectionId,
              assetNftId1,
              'ipfs://bafkreifoqmrsa52txf4pzy5slexbdjw6a76gcjpwuwujh72vgepib4xzdi',
              true
            ),
            // Oracle priced asset
            api.tx.uniques.mint(nftCollectionId, assetNftId2, aoProxy),
            api.tx.uniques.setMetadata(
              nftCollectionId,
              assetNftId2,
              'ipfs://bafkreifzrvxydawhudxe337aorkxuapkchq2rdfhjnbpvxmdge55vg2f6y',
              true
            ),
          ])
        ),
        api.tx.proxy.proxy(aoProxy, 'Borrow', api.tx.utility.batchAll([createLoanTx1, createLoanTx2])),
      ])

      await lastValueFrom(
        borrowerCent.wrapSignAndSend(api, loanBatch)
        // borrowerCent.wrapSignAndSend(api, loanBatch, { onStatusChange: options?.onStatusChange })
      )

      // return res

      updateTransaction(txId, {
        title: 'Feed oracle values',
        status: 'pending',
      })

      // Feed oracle values
      const navBatch = api.tx.utility.batchAll([
        api.tx.oraclePriceFeed.feed({ Isin: isin1 }, CurrencyBalance.fromFloat(100.1, 18)),
        api.tx.oraclePriceCollection.updateCollection(poolId),
        api.tx.loans.updatePortfolioValuation(poolId),
      ])

      await lastValueFrom(navManagerCent.wrapSignAndSend(api, navBatch))

      // await lastValueFrom(
      //   navManagerCent.wrapSignAndSend(
      //     api,
      //     api.tx.oraclePriceFeed.feed({ Isin: isin1 }, CurrencyBalance.fromFloat(100.1, 18))
      //   )
      // )
      // updateTransaction(txId, {
      //   title: 'Update collection',
      //   status: 'pending',
      // })

      // await lastValueFrom(navManagerCent.wrapSignAndSend(api, api.tx.oraclePriceCollection.updateCollection(poolId)))

      // updateTransaction(txId, {
      //   title: 'Update valuation',
      //   status: 'pending',
      // })
      // await lastValueFrom(navManagerCent.wrapSignAndSend(api, api.tx.loans.updatePortfolioValuation(poolId)))

      // updateTransaction(txId, {
      //   title: 'Close epoch',
      //   status: 'pending',
      // })

      updateTransaction(txId, {
        title: 'Close epoch',
        status: 'pending',
      })

      // Close epoch and borrow
      const epochBatch = api.tx.proxy.proxy(
        adminProxy,
        undefined,
        api.tx.utility.batchAll([
          api.tx.poolSystem.closeEpoch(poolId),
          api.tx.investments.collectInvestmentsFor(investorCentAddress, [poolId, juniorTranche]),
        ])
      )

      await lastValueFrom(poolManagerCent.wrapSignAndSend(api, epochBatch))

      updateTransaction(txId, {
        title: 'Borrow',
        status: 'pending',
      })

      const borrowBatch = api.tx.proxy.proxy(
        aoProxy,
        'Borrow',
        api.tx.utility.batchAll([
          api.tx.loans.borrow(poolId, 2, {
            external: { quantity: Price.fromFloat(10), settlementPrice: CurrencyBalance.fromFloat(100.1, 6) },
          }),
        ])
      )

      const lastResult = await lastValueFrom(
        // borrowerCent.wrapSignAndSend(api, epochBatch)
        borrowerCent.wrapSignAndSend(api, borrowBatch, { onStatusChange: options?.onStatusChange })
      )

      return lastResult
    }

    return of(doTransactions())
  })
  return (
    <button
      onClick={() => {
        const txId = Math.random().toString(36).substring(2)
        execute([txId], undefined, txId)
        updateTransaction(txId, {
          title: 'Create proxies',
          status: 'pending',
        })
      }}
    >
      {isLoading ? 'Creating...' : 'Create pool'}
    </button>
  )
}

function makeId() {
  const min = 1
  const max = 10 ** 12
  return Math.round(Math.random() * (max - min) + min).toString()
}

function makeIsin() {
  return addCheckDigit('US' + Math.random().toString(36).slice(2, 11).padEnd(9, '0').toUpperCase())
}

function addCheckDigit(isinWithoutDigit: string) {
  const v = [...isinWithoutDigit].flatMap((c) => (isNaN(c as any) ? String(c.charCodeAt(0) - 55).split('') : c))
  const sum = v.reduce((sum, c, i) => {
    if (i % 2 === 0) {
      const d = Number(c) * 2
      return sum + Math.floor(d / 10) + (d % 10)
    } else {
      return sum + Number(c)
    }
  }, 0)

  return `${isinWithoutDigit}${(10 - (sum % 10)) % 10}`
}
