import { Loan } from '@centrifuge/tinlake-js'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import { ApolloClient, DefaultOptions } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import BN from 'bn.js'
import gql from 'graphql-tag'
import fetch from 'node-fetch'
import config, { ArchivedPool, IpfsPools, Pool, UpcomingPool } from '../../config'
import { PoolData, PoolsData } from '../../ducks/pools'
import { RewardsData } from '../../ducks/rewards'
import { UserRewardsEthData } from '../../ducks/userRewards'
import { getPoolStatus } from '../../utils/pool'
import { UintBase } from '../../utils/ratios'
import { accountIdToCentChainAddr } from '../centChain/accountIdToCentChainAddr'

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

  injectPoolData(pools: any[], poolConfigs: Pool[] | undefined): PoolData[] {
    if (!poolConfigs) {
      return []
    }
    const tinlakePools = poolConfigs?.map((poolConfig: any) => {
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

      const reserve = (pool && new BN(pool.reserve)) || new BN('0')
      const assetValue = (pool && new BN(pool.assetValue)) || new BN('0')
      const poolValueNum = parseInt(reserve.div(UintBase).toString()) + parseInt(assetValue.div(UintBase).toString())

      const poolData = {
        reserve,
        assetValue,
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
        order: poolValueNum,
        isUpcoming: false,
        isArchived: false,
        isOversubscribed: (pool && new BN(pool.maxReserve).lte(new BN(pool.reserve))) || false,
        id: poolId,
        name: poolConfig.metadata.name,
        slug: poolConfig.metadata.slug,
        asset: poolConfig?.metadata.asset,
        version: Number(pool?.version || 3),
        juniorYield14Days: (pool?.juniorYield14Days && new BN(pool.juniorYield14Days)) || null,
        seniorYield14Days: (pool?.seniorYield14Days && new BN(pool.seniorYield14Days)) || null,
        icon: poolConfig.metadata.media?.icon || null,
      }

      return { ...poolData, status: getPoolStatus(poolData) }
    })
    return tinlakePools
  }

  injectUpcomingPoolData(upcomingPools: UpcomingPool[] | undefined): PoolData[] {
    if (!upcomingPools) {
      return []
    }
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

  injectArchivedPoolData(archivedPools: ArchivedPool[] | undefined): PoolData[] {
    if (!archivedPools) {
      return []
    }
    return archivedPools.map((p) => ({
      isUpcoming: false,
      isArchived: true,
      isOversubscribed: false,
      order: orderSummandPoolClosed,
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

  async getPools(ipfsPools: IpfsPools): Promise<PoolsData> {
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
          ...this.injectPoolData(result.data.pools, ipfsPools.active),
          ...this.injectUpcomingPoolData(ipfsPools.upcoming),
          ...this.injectArchivedPoolData(ipfsPools.archived),
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

  async getRewards(): Promise<RewardsData | null> {
    let result
    try {
      result = await this.client.query({
        query: gql`
          {
            rewardDayTotals(first: 1, skip: 1, orderBy: id, orderDirection: desc) {
              toDateAggregateValue
            }
          }
        `,
      })
    } catch (err) {
      console.error(`error occured while fetching total rewards from apollo ${err}`)
      return null
    }
    if (!result.data?.rewardDayTotals[0]?.toDateAggregateValue) {
      return null
    }

    return { toDateAggregateValue: result.data?.rewardDayTotals[0]?.toDateAggregateValue }
  }

  async getUserRewards(user: string): Promise<UserRewardsEthData | null> {
    let result
    try {
      result = await this.client.query({
        query: gql`
        {
          rewardBalances(where : {id: "${user}"}) {
            links {
              centAddress
              rewardsAccumulated
            }
            claimable
    				linkableRewards
            totalRewards
            nonZeroBalanceSince
          }
        }
        `,
      })
    } catch (err) {
      console.error(`error occurred while fetching user rewards for user ${user} from apollo ${err}`)
      return null
    }

    const data = result.data?.rewardBalances[0]
    if (!data) {
      return null
    }

    return {
      links: data.links.map((link: any) => ({
        centAddress: accountIdToCentChainAddr(link.centAddress),
        rewardsAccumulated: link.rewardsAccumulated,
      })),
      claimable: data.claimable,
      linkableRewards: data.linkableRewards,
      totalRewards: data.totalRewards,
      nonZeroBalanceSince: data.nonZeroBalanceSince,
    }
  }

  // async getRewardsByUserToken(user: string) {
  //   let result
  //   try {
  //     result = await this.client.query({
  //       query: gql`
  //       {
  //         rewardByTokens(where : {account: "${user}"}) {
  //           token
  //           rewards
  //         }
  //       }
  //       `,
  //     })
  //   } catch (err) {
  //     console.error(`error occurred while fetching loans from apollo ${err}`)
  //     return {
  //       data: [],
  //     }
  //   }
  // }

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

const orderSummandPoolUpcoming = 1e15 // No pool value should be more than 1000 billion DAI
const orderSummandPoolClosed = 0
