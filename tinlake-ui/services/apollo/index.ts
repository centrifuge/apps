import { Loan } from '@centrifuge/tinlake-js'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import { ApolloClient, DefaultOptions } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import BN from 'bn.js'
import gql from 'graphql-tag'
import fetch from 'node-fetch'
import config, { ArchivedPool, UpcomingPool } from '../../config'
import { PoolData, PoolsData } from '../../ducks/pools'
import { getPoolStatus } from '../../utils/pool'

const { tinlakeDataBackendUrl } = config
const cache = new InMemoryCache()
const link = createHttpLink({
  fetch: fetch as any,
  headers: {
    'user-agent': null,
  },
  // fetchOptions: '',
  uri: tinlakeDataBackendUrl,
})

export interface TinlakeEventEntry {
  timestamp: string
  total_debt: string
  total_value_of_nfts: string
}

const defaultOptions: DefaultOptions = {
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
}

class Apollo {
  client: ApolloClient<NormalizedCacheObject>
  constructor() {
    this.client = new ApolloClient({
      cache,
      link,
      defaultOptions,
    })
  }

  getPoolOrder = (p: { totalDebt: BN; totalRepaysAggregatedAmount: BN; totalDebtNum: number; version: number }) => {
    if ((p.version === 3 && p.totalDebt.gtn(0)) || (p.totalDebt.eqn(0) && p.totalRepaysAggregatedAmount.eqn(0))) {
      return orderSummandPoolActive + p.totalDebtNum
    }

    if (p.totalDebt.gtn(0)) {
      return orderSummandPoolDeployed + p.totalDebtNum
    }

    if (p.totalDebt.eqn(0) && p.totalRepaysAggregatedAmount.gtn(0)) {
      return orderSummandPoolClosed + p.totalDebtNum
    }

    return 0
  }

  injectPoolData(pools: any[]): PoolData[] {
    const poolConfigs = config.pools
    const tinlakePools = poolConfigs.map((poolConfig) => {
      const poolId = poolConfig.addresses.ROOT_CONTRACT
      const pool = pools.find((p) => p.id.toLowerCase() === poolId.toLowerCase())

      const totalDebt = (pool && new BN(pool.totalDebt)) || new BN('0')
      const totalRepaysAggregatedAmount = (pool && new BN(pool.totalRepaysAggregatedAmount)) || new BN('0')
      const weightedInterestRate = (pool && new BN(pool.weightedInterestRate)) || new BN('0')
      const seniorInterestRate = (pool && pool.seniorInterestRate && new BN(pool.seniorInterestRate)) || new BN('0')

      const totalDebtNum = parseFloat(totalDebt.toString())
      const totalRepaysAggregatedAmountNum = parseFloat(totalRepaysAggregatedAmount.toString())
      const weightedInterestRateNum = parseFloat(weightedInterestRate.toString())
      const seniorInterestRateNum = parseFloat(seniorInterestRate.toString())

      const ongoingLoans = (pool && pool.ongoingLoans.length) || 0 // TODO add count field to subgraph, inefficient to query all assets
      const totalFinancedCurrency = totalRepaysAggregatedAmount.add(totalDebt)
      const poolData = {
        totalFinancedCurrency,
        ongoingLoans,
        totalDebt,
        totalRepaysAggregatedAmount,
        weightedInterestRate,
        seniorInterestRate,
        totalDebtNum,
        totalRepaysAggregatedAmountNum,
        weightedInterestRateNum,
        seniorInterestRateNum,
        order: this.getPoolOrder({
          totalDebt,
          totalDebtNum,
          totalRepaysAggregatedAmount,
          version: Number(pool?.version || 3),
        }),
        isUpcoming: false,
        isArchived: false,
        isOversubscribed: (pool && new BN(pool.maxReserve).lte(new BN(pool.reserve))) || false,
        id: poolId,
        name: poolConfig.metadata.name,
        slug: poolConfig.metadata.slug,
        asset: poolConfig?.metadata.asset,
        version: Number(pool?.version || 3),
        reserve: (pool && new BN(pool.reserve)) || new BN('0'),
        assetValue: (pool && new BN(pool.assetValue)) || new BN('0'),
        juniorYield14Days: (pool && new BN(pool.juniorYield14Days)) || null,
        seniorYield14Days: (pool && new BN(pool.seniorYield14Days)) || null,
        icon: poolConfig.metadata.media?.icon || null,
      }

      return { ...poolData, status: getPoolStatus(poolData) }
    })
    return tinlakePools
  }
  injectUpcomingPoolData(upcomingPools: UpcomingPool[]): PoolData[] {
    return upcomingPools.map((p) => ({
      isUpcoming: true,
      isArchived: false,
      isOversubscribed: false,
      totalFinancedCurrency: new BN('0'),
      order: orderSummandPoolUpcoming,
      totalDebt: new BN('0'),
      totalRepaysAggregatedAmount: new BN('0'),
      weightedInterestRate: new BN('0'),
      seniorInterestRate: new BN(p.presetValues?.seniorInterestRate || 0),
      id: p.metadata.slug,
      name: p.metadata.name,
      slug: p.metadata.slug,
      asset: p.metadata.asset,
      ongoingLoans: 0,
      totalDebtNum: 0,
      totalRepaysAggregatedAmountNum: 0,
      weightedInterestRateNum: 0,
      seniorInterestRateNum: parseFloat(new BN(p.presetValues?.seniorInterestRate || 0).toString()),
      status: 'Upcoming',
      version: p.version,
      reserve: new BN('0'),
      assetValue: new BN('0'),
      juniorYield14Days: null,
      seniorYield14Days: null,
      icon: p.metadata.media?.icon || null,
    }))
  }

  injectArchivedPoolData(archivedPools: ArchivedPool[]): PoolData[] {
    return archivedPools.map((p) => ({
      isUpcoming: false,
      isArchived: true,
      isOversubscribed: false,
      order: p.archivedValues?.status === 'Deployed' ? orderSummandPoolDeployed : orderSummandPoolClosed,
      totalDebt: new BN('0'),
      totalRepaysAggregatedAmount: new BN('0'),
      weightedInterestRate: new BN('0'),
      seniorInterestRate: new BN(p.archivedValues?.seniorInterestRate || 0),
      id: p.metadata.slug,
      name: p.metadata.name,
      slug: p.metadata.slug,
      asset: p.metadata.asset,
      financingsCount: parseFloat(new BN(p.archivedValues?.financingsCount || 0).toString()),
      totalFinancedCurrency: new BN(p.archivedValues?.totalFinancedCurrency || 0),
      seniorInterestRateNum: parseFloat(new BN(p.archivedValues?.seniorInterestRate || 0).toString()),
      status: p.archivedValues?.status || 'Closed',
      version: p.version,
      ongoingLoans: 0,
      totalDebtNum: 0,
      totalRepaysAggregatedAmountNum: 0,
      weightedInterestRateNum: 0,
      reserve: new BN('0'),
      assetValue: new BN('0'),
      juniorYield14Days: null,
      seniorYield14Days: null,
      icon: p.metadata.media?.icon || null,
    }))
  }

  async getPools(): Promise<PoolsData> {
    let result
    try {
      result = await this.client.query({
        query: gql`
          {
            pools {
              id
              totalDebt
              totalRepaysAggregatedAmount
              ongoingLoans: loans(where: { opened_gt: 0, closed: null, debt_gt: 0 }) {
                id
              }
              weightedInterestRate
              seniorInterestRate
              version
              reserve
              maxReserve
              assetValue
              juniorYield14Days
              seniorYield14Days
            }
          }
        `,
      })
    } catch (err) {
      throw new Error(`error occured while fetching assets from apollo ${err}`)
    }

    let pools = result.data?.pools
      ? [
          ...this.injectPoolData(result.data.pools),
          ...this.injectUpcomingPoolData(config.upcomingPools),
          ...this.injectArchivedPoolData(config.archivedPools),
        ]
      : []

    pools = pools.sort((a, b) => a.name.localeCompare(b.name))

    return {
      pools,
      ongoingPools: pools.filter((pool) => pool.ongoingLoans > 0).length,
      ongoingLoans: pools.reduce((p, c) => p + c.ongoingLoans, 0),
      totalDebt: pools.reduce((p, c) => p.add(c.totalDebt), new BN(0)),
      totalRepaysAggregatedAmount: pools.reduce((p, c) => p.add(c.totalRepaysAggregatedAmount), new BN(0)),
      totalFinancedCurrency: pools.reduce((p, c) => p.add(c.totalFinancedCurrency), new BN(0)),
      totalValue: pools.reduce((p, c) => p.add(c.reserve).add(c.assetValue), new BN(0)),
    }
  }

  async getLoans(root: string) {
    let result
    try {
      // TODO: root should be root.toLowerCase() once we add lowercasing to the subgraph code (after AssemblyScript is updated)
      result = await this.client.query({
        query: gql`
        {
          pools (where : {id: "${root}"}){
            id
            loans {
              id
              pool {
                id
              }
              index
              owner
              opened
              closed
              debt
              interestRatePerSecond
              ceiling
              threshold
              borrowsCount
              borrowsAggregatedAmount
              repaysCount
              repaysAggregatedAmount
              nftId
              nftRegistry
            }
          }
        }
        `,
      })
    } catch (err) {
      console.error(`error occured while fetching loans from apollo ${err}`)
      return {
        data: [],
      }
    }
    const pool = result.data.pools[0]
    const tinlakeLoans = (pool && toTinlakeLoans(pool.loans)) || []
    return tinlakeLoans
  }

  async getProxies(user: string) {
    let result
    try {
      result = await this.client.query({
        query: gql`
        {
          proxies (where: {owner:"${user}"})
            {
              id
              owner
            }
          }
        `,
      })
    } catch (err) {
      console.error(`no proxies found for address ${user} ${err}`)
      return {
        data: [],
      }
    }
    const proxies = result.data.proxies.map((e: { id: string; owner: string }) => e.id)
    return { data: proxies }
  }
}

function toTinlakeLoans(loans: any[]): { data: Loan[] } {
  const tinlakeLoans: Loan[] = []

  loans.forEach((loan) => {
    const tinlakeLoan = {
      loanId: loan.index,
      registry: loan.nftRegistry,
      tokenId: new BN(loan.nftId),
      principal: loan.ceiling ? new BN(loan.ceiling) : new BN(0),
      ownerOf: loan.owner,
      interestRate: loan.interestRatePerSecond ? new BN(loan.interestRatePerSecond) : new BN(0),
      debt: new BN(loan.debt),
      threshold: loan.threshold ? new BN(loan.threshold) : new BN(0),
      price: loan.price || new BN(0),
      status: getLoanStatus(loan),
    }
    tinlakeLoans.push(tinlakeLoan)
  })

  tinlakeLoans.length &&
    tinlakeLoans.sort((l1: Loan, l2: Loan) => {
      return ((l1.loanId as unknown) as number) - ((l2.loanId as unknown) as number)
    })

  return { data: tinlakeLoans }
}

function getLoanStatus(loan: any) {
  if (loan.closed) {
    return 'closed'
  }
  if (loan.debt && loan.debt !== '0') {
    return 'ongoing'
  }
  return 'opened'
}

export default new Apollo()

const orderSummandPoolUpcoming = 3e30 // NOTE 18 decimals for dai + 1 trillion DAI as max assumed debt
const orderSummandPoolActive = 2e30
const orderSummandPoolDeployed = 1e30 // NOTE 18 decimals for dai + 1 trillion DAI as max assumed debt
const orderSummandPoolClosed = 0 // NOTE 18 decimals for dai + 1 trillion DAI as max assumed debt
