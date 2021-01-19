import { Loan } from '@centrifuge/tinlake-js'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import { ApolloClient, DefaultOptions } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import gql from 'graphql-tag'
import fetch from 'node-fetch'
import config, { ArchivedPool, IpfsPools, Pool, UpcomingPool } from '../../config'
import { PoolData, PoolsData } from '../../ducks/pools'
import { RewardsData } from '../../ducks/rewards'
import { UserRewardsData } from '../../ducks/userRewards'
import { getPoolStatus } from '../../utils/pool'
import { UintBase } from '../../utils/ratios'

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
      const seniorInterestRate = (pool && pool.seniorInterestRate && new BN(pool.seniorInterestRate)) || undefined

      const totalDebtNum = parseFloat(totalDebt.toString())
      const totalRepaysAggregatedAmountNum = parseFloat(totalRepaysAggregatedAmount.toString())
      const weightedInterestRateNum = parseFloat(weightedInterestRate.toString())
      const seniorInterestRateNum = parseFloat((seniorInterestRate || new BN(0)).toString())

      const ongoingLoans = (pool && pool.ongoingLoans.length) || 0 // TODO add count field to subgraph, inefficient to query all assets
      const totalFinancedCurrency = totalRepaysAggregatedAmount.add(totalDebt)

      const reserve = (pool && new BN(pool.reserve)) || undefined
      const assetValue = (pool && new BN(pool.assetValue)) || undefined
      const poolValueNum =
        parseInt((reserve || new BN(0)).div(UintBase).toString()) +
        parseInt((assetValue || new BN(0)).div(UintBase).toString())

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

  async getInitialPools(ipfsPools: IpfsPools): Promise<PoolsData> {
    let pools = [
      ...this.injectPoolData([], ipfsPools.active),
      ...this.injectUpcomingPoolData(ipfsPools.upcoming),
      ...this.injectArchivedPoolData(ipfsPools.archived),
    ]

    // TODO: get pool value with multicall, and use this to sort
    pools = pools.sort((a, b) => a.name.localeCompare(b.name))

    return {
      pools,
      ongoingLoans: 0,
      totalFinancedCurrency: new BN(0),
      totalValue: new BN(0),
    }
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
      ongoingLoans: pools.reduce((p, c) => p + c.ongoingLoans, 0),
      totalFinancedCurrency: pools.reduce((p, c) => p.add(c.totalFinancedCurrency), new BN(0)),
      totalValue: pools.reduce((p, c) => p.add(c.reserve || new BN(0)).add(c.assetValue || new BN(0)), new BN(0)),
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
              maturityDate
              financingDate
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
    if (!result.data?.pools) return { data: [] }

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
              rewardRate
              toDateRewardAggregateValue
              todayReward
            }
          }
        `,
      })
    } catch (err) {
      console.error(`error occured while fetching total rewards from apollo ${err}`)
      return null
    }
    const data = result.data?.rewardDayTotals[0]
    if (!data) {
      return null
    }

    return {
      toDateRewardAggregateValue: new BN(new Decimal(data.toDateRewardAggregateValue).toFixed(0)),
      rewardRate: new Decimal(data.rewardRate),
      todayReward: new BN(new Decimal(data.todayReward).toFixed(0)),
    }
  }

  async getUserRewards(user: string): Promise<UserRewardsData | null> {
    let result
    try {
      result = await this.client.query({
        query: gql`
        {
          rewardBalances(where: {id: "${user.toLowerCase()}"}) {
            links {
              centAddress
              rewardsAccumulated
            }
            claimable
    				linkableRewards
            totalRewards
            nonZeroBalanceSince
          }
          accounts(where: {id: "${user.toLowerCase()}"}) {
            currentActiveInvestmentAmount
          }
        }
        `,
      })
    } catch (err) {
      console.error(`error occurred while fetching user rewards for user ${user} from apollo ${err}`)
      return null
    }

    const transformed: UserRewardsData = {
      currentActiveInvestmentAmount: new BN(0),
      nonZeroInvestmentSince: null,
      claimable: false,
      totalEarnedRewards: new BN(0),
      unlinkedRewards: new BN(0),
      links: [],
    }

    const account = result.data?.accounts[0]
    if (account) {
      transformed.currentActiveInvestmentAmount = new BN(account.currentActiveInvestmentAmount)
    }

    const rewardBalance = result.data?.rewardBalances[0]
    if (rewardBalance) {
      transformed.nonZeroInvestmentSince =
        rewardBalance.nonZeroBalanceSince && new BN(rewardBalance.nonZeroBalanceSince)
      transformed.claimable = rewardBalance.claimable
      transformed.totalEarnedRewards = new BN(new Decimal(rewardBalance.totalRewards).toFixed(0))
      transformed.unlinkedRewards = new BN(new Decimal(rewardBalance.linkableRewards).toFixed(0))
      transformed.links = (rewardBalance.links as any[]).map((link: any) => ({
        centAccountID: link.centAddress,
        earned: new BN(new Decimal(link.rewardsAccumulated).toFixed(0)),
        claimable: null,
        claimed: null,
      }))
    }

    return transformed
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
  async getAssetData(root: string) {
    let result
    try {
      // TODO: root should be root.toLowerCase() once we add lowercasing to the subgraph code (after AssemblyScript is updated)
      result = await this.client.query({
        query: gql`
        {
          dailyPoolDatas(where:{ pool: "${root}" }) {
           day {
            id
          }
            assetValue
            reserve
            seniorTokenPrice
            juniorTokenPrice
          }
        }
        `,
      })
    } catch (err) {
      console.error(`error occured while fetching asset data from apollo ${err}`)
      return {
        data: [],
      }
    }
    const assetData = result.data.dailyPoolDatas.map((item: any) => {
      return {
        day: Number(item.day.id),
        assetValue: parseFloat(new BN(item.assetValue).div(UintBase).toString()),
        reserve: parseFloat(new BN(item.reserve).div(UintBase).toString()),
        seniorTokenPrice: parseFloat(new BN(item.seniorTokenPrice).div(UintBase).toString()) / 10 ** 9,
        juniorTokenPrice: parseFloat(new BN(item.juniorTokenPrice).div(UintBase).toString()) / 10 ** 9,
      }
    })

    return assetData
  }

  async getPoolsDailyData() {
    let result
    try {
      result = await this.client.query({
        query: gql`
          {
            days {
              id
              assetValue
              reserve
            }
          }
        `,
      })
    } catch (err) {
      console.error(`error occured while fetching pools daily data from apollo ${err}`)
      return {
        data: [],
      }
    }
    const poolsDailyData = result.data.days.map((item: any) => {
      return {
        day: Number(item.id),
        poolValue: parseFloat(
          new BN(item.assetValue)
            .add(new BN(item.reserve))
            .div(UintBase)
            .toString()
        ),
      }
    })

    return poolsDailyData
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

  async getProxyOwner(proxyId: string): Promise<{ owner?: string } | null> {
    let result
    try {
      result = await this.client.query({
        query: gql`
        {
          proxies (where: {id:"${proxyId}"})
            {
              owner
            }
          }
        `,
      })
    } catch (err) {
      console.error(`no proxy found for id ${proxyId} ${err}`)
      return null
    }

    return result.data.proxies.length > 0 ? result.data.proxies[0] : null
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
      maturityDate: loan.maturityDate,
      financingDate: loan.financingDate,
      borrowsAggregatedAmount: loan.borrowsAggregatedAmount,
      repaysAggregatedAmount: loan.repaysAggregatedAmount,
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
  return 'NFT locked'
}

export default new Apollo()

const orderSummandPoolUpcoming = 1e15 // No pool value should be more than 1000 billion DAI
const orderSummandPoolClosed = 0
