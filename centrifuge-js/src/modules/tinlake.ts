import { Contract } from '@ethersproject/contracts'
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import BN from 'bn.js'
import { from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'
import { CurrencyBalance } from '../utils/BN'
import { calculateOptimalSolution, Orders, State } from '../utils/solver/tinlakeSolver'
import { abis } from './tinlake/abi'

const contracts: Record<string, Contract> = {}

export type TinlakeContractAddresses = {
  TINLAKE_CURRENCY: string
  ROOT_CONTRACT: string
  ACTIONS: string
  PROXY_REGISTRY: string
  COLLATERAL_NFT: string
  SENIOR_TOKEN: string
  JUNIOR_TOKEN: string
  JUNIOR_OPERATOR: string
  SENIOR_OPERATOR: string
  CLERK?: string | undefined
  ASSESSOR: string
  RESERVE: string
  SENIOR_TRANCHE: string
  JUNIOR_TRANCHE: string
  FEED: string
  POOL_ADMIN?: string | undefined
  SENIOR_MEMBERLIST: string
  JUNIOR_MEMBERLIST: string
  COORDINATOR: string
  PILE: string
  CLAIM_CFG: string
  MCD_VAT?: string
  MCD_JUG?: string
  MAKER_MGR?: string
}

export type TinlakeContractVersions = {
  FEED?: number
  POOL_ADMIN?: number
}

export type TinlakeContractNames = keyof TinlakeContractAddresses
type Abis = typeof abis
type AbisNames = keyof Abis

const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
const e27 = new BN(10).pow(new BN(27))

type ClaimCFGRewardsInput = [
  claimerAccountID: string, // ID of Centrifuge Chain account that should receive the rewards
  amount: string, // amount that should be received
  proof: Uint8Array[] // proof for the given claimer and amount
]

export function getTinlakeModule(inst: Centrifuge) {
  function contract(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    name: AbisNames
  ) {
    const abiName = (
      contractVersions && name in contractVersions ? `${name}_V${(contractVersions as any)[name]}` : name
    ) as AbisNames
    const contractAddress = (contractAddresses as any)[name]
    const abi = abis[abiName]
    if (!inst.config.evmSigner) throw new Error('Needs signer')
    if (!abi) throw new Error('ABI not found')
    if (!contracts[contractAddress]) {
      contracts[contractAddress] = new Contract(contractAddress, abi)
    }

    return contracts[contractAddress].connect(inst.config.evmSigner)
  }

  function pending(txPromise: Promise<TransactionResponse>) {
    return from(txPromise).pipe(
      switchMap((response) => {
        return from(response.wait()).pipe(
          map(() => response),
          startWith(response)
        )
      })
    )
  }

  function approveTrancheForCurrency(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [tranche: 'senior' | 'junior'],
    options: TransactionRequest = {}
  ) {
    const [tranche] = args
    return pending(
      contract(contractAddresses, contractVersions, 'TINLAKE_CURRENCY').approve(
        contractAddresses[tranche === 'junior' ? 'JUNIOR_TRANCHE' : 'SENIOR_TRANCHE'],
        maxUint256,
        options
      )
    )
  }

  function approveTrancheToken(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [tranche: 'senior' | 'junior'],
    options: TransactionRequest = {}
  ) {
    const [tranche] = args
    return pending(
      contract(contractAddresses, contractVersions, tranche === 'junior' ? 'JUNIOR_TOKEN' : 'SENIOR_TOKEN').approve(
        contractAddresses[tranche === 'junior' ? 'JUNIOR_TRANCHE' : 'SENIOR_TRANCHE'],
        maxUint256,
        options
      )
    )
  }

  function updateInvestOrder(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [tranche: 'senior' | 'junior', order: BN],
    options: TransactionRequest = {}
  ) {
    const [tranche, order] = args
    return pending(
      contract(
        contractAddresses,
        contractVersions,
        tranche === 'junior' ? 'JUNIOR_OPERATOR' : 'SENIOR_OPERATOR'
      ).supplyOrder(order.toString(), options)
    )
  }

  function updateRedeemOrder(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [tranche: 'senior' | 'junior', order: BN],
    options: TransactionRequest = {}
  ) {
    const [tranche, order] = args
    return pending(
      contract(
        contractAddresses,
        contractVersions,
        tranche === 'junior' ? 'JUNIOR_OPERATOR' : 'SENIOR_OPERATOR'
      ).redeemOrder(order.toString(), options)
    )
  }

  function collect(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [tranche: 'senior' | 'junior'],
    options: TransactionRequest = {}
  ) {
    const [tranche] = args
    return pending(
      contract(contractAddresses, contractVersions, tranche === 'junior' ? 'JUNIOR_OPERATOR' : 'SENIOR_OPERATOR')[
        'disburse()'
      ](options)
    )
  }

  /**
   * @param beforeClosing if true, calculate the values as if the epoch would be closed now
   */
  async function getEpochState(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [beforeClosing?: boolean]
  ) {
    const [beforeClosing] = args
    const coordinator = contract(contractAddresses, contractVersions, 'COORDINATOR')
    const assessor = contract(contractAddresses, contractVersions, 'ASSESSOR')
    const feed = contract(contractAddresses, contractVersions, 'FEED')
    const isMakerIntegrated = contractAddresses.CLERK !== undefined

    const reserve = toBN(
      await (beforeClosing
        ? isMakerIntegrated
          ? contract(contractAddresses, contractVersions, 'ASSESSOR').totalBalance()
          : contract(contractAddresses, contractVersions, 'RESERVE').totalBalance()
        : coordinator.epochReserve())
    )
    const netAssetValue = toBN(
      await (beforeClosing
        ? contractVersions?.FEED === 2
          ? feed.latestNAV()
          : feed.approximatedNAV()
        : coordinator.epochNAV())
    )
    const seniorAsset = beforeClosing
      ? isMakerIntegrated
        ? toBN(await assessor.seniorDebt()).add(toBN(await assessor.seniorBalance()))
        : toBN(await assessor.seniorDebt_()).add(toBN(await assessor.seniorBalance_()))
      : toBN(await coordinator.epochSeniorAsset())

    const minDropRatio = toBN(await assessor.minSeniorRatio())
    const maxDropRatio = toBN(await assessor.maxSeniorRatio())
    const maxReserve = toBN(await assessor.maxReserve())

    return { reserve, netAssetValue, seniorAsset, minDropRatio, maxDropRatio, maxReserve }
  }

  /**
   * @param beforeClosing if true, calculate the values as if the epoch would be closed now
   */
  async function getOrders(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [beforeClosing?: boolean]
  ) {
    const [beforeClosing] = args
    if (beforeClosing) {
      const seniorTranche = contract(contractAddresses, contractVersions, 'SENIOR_TRANCHE')
      const juniorTranche = contract(contractAddresses, contractVersions, 'JUNIOR_TRANCHE')
      const assessor = contract(contractAddresses, contractVersions, 'ASSESSOR')
      const feed = contract(contractAddresses, contractVersions, 'FEED')

      const epochNAV = toBN(await feed.currentNAV())
      const epochReserve = toBN(await contract(contractAddresses, contractVersions, 'RESERVE').totalBalance())
      const epochSeniorTokenPrice = toBN(
        await assessor['calcSeniorTokenPrice(uint256,uint256)'](epochNAV.toString(), epochReserve.toString())
      )
      const epochJuniorTokenPrice = toBN(
        await assessor['calcJuniorTokenPrice(uint256,uint256)'](epochNAV.toString(), epochReserve.toString())
      )

      return {
        dropInvest: toBN(await seniorTranche.totalSupply()),
        dropRedeem: toBN(await seniorTranche.totalRedeem())
          .mul(epochSeniorTokenPrice)
          .div(e27),
        tinInvest: toBN(await juniorTranche.totalSupply()),
        tinRedeem: toBN(await juniorTranche.totalRedeem())
          .mul(epochJuniorTokenPrice)
          .div(e27),
      }
    }
    const coordinator = contract(contractAddresses, contractVersions, 'COORDINATOR')
    const orderState = await coordinator.order()

    return {
      dropInvest: toBN(await orderState.seniorSupply),
      dropRedeem: toBN(await orderState.seniorRedeem),
      tinInvest: toBN(await orderState.juniorSupply),
      tinRedeem: toBN(await orderState.juniorRedeem),
    }
  }

  async function getSolverWeights(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined
  ) {
    const coordinator = contract(contractAddresses, contractVersions, 'COORDINATOR')

    return {
      dropInvest: toBN(await coordinator.weightSeniorSupply()),
      dropRedeem: toBN(await coordinator.weightSeniorRedeem()),
      tinInvest: toBN(await coordinator.weightJuniorSupply()),
      tinRedeem: toBN(await coordinator.weightJuniorRedeem()),
    }
  }

  function closeEpoch(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    _: [],
    options: TransactionRequest = {}
  ) {
    const coordinator = contract(contractAddresses, contractVersions, 'COORDINATOR')
    return pending(coordinator.closeEpoch({ ...options, gasLimit: 5000000 }))
  }

  function solveEpoch(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    _: [],
    options: TransactionRequest = {}
  ) {
    const submissionTx = (async () => {
      const coordinator = contract(contractAddresses, contractVersions, 'COORDINATOR')
      if ((await coordinator.submissionPeriod()) !== true) throw new Error('Not in submission period')
      const state = await getEpochState(contractAddresses, contractVersions, [])
      const orders = await getOrders(contractAddresses, contractVersions, [])
      const solution = await runSolver(contractAddresses, contractVersions, [state, orders])

      if (!solution.isFeasible) {
        throw new Error('Failed to find a solution')
      }

      return coordinator.submitSolution(
        solution.dropRedeem.toString(),
        solution.tinRedeem.toString(),
        solution.tinInvest.toString(),
        solution.dropInvest.toString(),
        options
      )
    })()

    return pending(submissionTx)
  }

  async function runSolver(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [state: State, orders: Orders, calcInvestmentCapacity?: boolean]
  ) {
    const [state, orders, calcInvestmentCapacity] = args
    const weights = await getSolverWeights(contractAddresses, contractVersions)
    const solution = await calculateOptimalSolution(state, orders, weights, calcInvestmentCapacity)

    if (!solution.isFeasible) {
      throw new Error('Failed to find a solution')
    }

    return solution
  }

  function executeEpoch(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    _: [],
    options: TransactionRequest = {}
  ) {
    const tx = (async () => {
      const coordinator = contract(contractAddresses, contractVersions, 'COORDINATOR')
      if ((await getCurrentEpochState(contractAddresses, contractVersions)) !== 'challenge-period-ended') {
        throw new Error('Current epoch is still in the challenge period')
      }

      return coordinator.executeEpoch({ ...options, gasLimit: 2000000 })
    })()
    return pending(tx)
  }

  async function getLatestBlockTimestamp() {
    const { provider } = inst.config.evmSigner!
    const latestBlock = await provider.getBlock(await provider.getBlockNumber())
    if (!latestBlock) return new Date().getTime()
    return latestBlock.timestamp
  }

  async function getCurrentEpochState(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined
  ) {
    const coordinator = contract(contractAddresses, contractVersions, 'COORDINATOR')

    const minChallengePeriodEnd = toBN(await coordinator.minChallengePeriodEnd()).toNumber()
    const latestBlockTimestamp = await getLatestBlockTimestamp()
    if (minChallengePeriodEnd !== 0) {
      if (minChallengePeriodEnd < latestBlockTimestamp) return 'challenge-period-ended'
      return 'in-challenge-period'
    }

    const submissionPeriod = await coordinator.submissionPeriod()
    if (submissionPeriod === true) {
      return 'in-submission-period'
    }

    const lastEpochClosed = toBN(await coordinator.lastEpochClosed()).toNumber()
    const minimumEpochTime = toBN(await coordinator.minimumEpochTime()).toNumber()
    if (submissionPeriod === false) {
      if (lastEpochClosed + minimumEpochTime < latestBlockTimestamp) return 'can-be-closed'
      return 'open'
    }

    throw new Error('Arrived at impossible current epoch state')
  }

  // src: tinlake-apps > tinlake.js > src > actions > claimCFG.ts
  // 1. getClaimCFGAccountID
  // 2. updateClaimCFGAccountID
  // these were used to link accounts -> not sure if this feature should be part of centrifuge-app or if it should be retired
  async function getClaimCFGAccountID(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [address: string],
    options: TransactionRequest = {}
  ) {
    const [address] = args
    const coordinator = contract(contractAddresses, contractVersions, 'CLAIM_CFG')

    const tx = coordinator.accounts(address, options)
    return pending(tx)
  }

  async function updateClaimCFGAccountID(
    contractAddresses: TinlakeContractAddresses,
    contractVersions: TinlakeContractVersions | undefined,
    args: [centAddress: string],
    options: TransactionRequest = {}
  ) {
    const [centAddress] = args
    const coordinator = contract(contractAddresses, contractVersions, 'CLAIM_CFG')

    const tx = coordinator.update(centAddress, options)
    return pending(tx)
  }

  function claimCFGRewards(args: ClaimCFGRewardsInput, options?: TransactionOptions) {
    const [claimerAccountID, amount, proof] = args

    return inst.getApi().pipe(
      switchMap((api) => {
        const submittable = api.tx.claims.claim(claimerAccountID, amount, proof)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function claimedCFGRewards(args: [centAddr: string]) {
    const [centAddr] = args

    return inst.getApi().pipe(
      switchMap((api) =>
        api.query.claims.claimedAmounts(centAddr).pipe(
          map((claimed) => {
            return new CurrencyBalance(claimed.toString(), api.registry.chainDecimals[0])
          })
        )
      )
    )
  }

  return {
    updateInvestOrder,
    updateRedeemOrder,
    approveTrancheForCurrency,
    approveTrancheToken,
    collect,
    closeEpoch,
    solveEpoch,
    executeEpoch,
    contract,
    getClaimCFGAccountID,
    updateClaimCFGAccountID,
    claimCFGRewards,
    claimedCFGRewards,
  }
}

function toBN(val: { toString(): string }) {
  return new BN(val.toString())
}
