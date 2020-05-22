import { ApolloClient, DefaultOptions } from 'apollo-client';
import { Loan } from 'tinlake';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import config from '../../config';
import fetch from 'node-fetch';
import gql from 'graphql-tag';
import BN from 'bn.js';
import { PoolData, PoolsData } from '../../ducks/pools';

const { tinlakeDataBackendUrl } = config;
const cache = new InMemoryCache();
const link = createHttpLink({
  fetch: fetch as any,
  headers: {
    'user-agent': null
  },
  // fetchOptions: '',
  uri: tinlakeDataBackendUrl
});

export interface TinlakeEventEntry {
  timestamp: string;
  total_debt: string;
  total_value_of_nfts: string;
}

const defaultOptions: DefaultOptions = {
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all'
  }
};

class Apollo {
  client: ApolloClient<NormalizedCacheObject>;
  constructor() {
    this.client = new ApolloClient({
      cache,
      link,
      defaultOptions
    });
  }

  injectPoolData(pools: any[]): PoolData[] {
    const configPools = config.pools;
    const tinlakePools = configPools.map((configPool: any) => {
      const poolId = configPool.addresses.ROOT_CONTRACT;
      const pool = pools.find(p => p.id === poolId);
      return {
        id: poolId,
        name: configPool.name,
        asset: configPool?.asset,
        ongoingLoans: pool && pool.ongoingLoans.length || 0, // TODO add count field to subgraph, inefficient to query all loans
        totalDebt: pool && new BN(pool.totalDebt) || new BN('0'),
        totalRepaysAggregatedAmount: pool && new BN(pool.totalRepaysAggregatedAmount) || new BN('0'),
        weightedInterestRate: pool && new BN(pool.weightedInterestRate) || new BN('0'),
        seniorInterestRate: pool && pool.seniorInterestRate && new BN(pool.seniorInterestRate) || new BN('0') // TODO how to get this value?
      };
    });
    return tinlakePools;
  }

  async getPools(): Promise<PoolsData> {
    let result;
    try {
      result = await this.client
        .query({
          query: gql`
        {
          pools {
            id,
            totalDebt,
            totalRepaysAggregatedAmount,
            ongoingLoans: loans (where: {opened_gt:0, closed:null, debt_gt:0}) {
							id
            },
            weightedInterestRate,
            seniorInterestRate
          }
        }
        `
        });
    } catch (err) {
      throw new Error(`error occured while fetching loans from apollo ${err}`);
    }

    const pools = (!result.data || !result.data.pools) ? [] : this.injectPoolData(result.data.pools);

    return {
      pools,
      ongoingPools: pools.filter(pool => pool.ongoingLoans > 0).length,
      ongoingLoans: pools.reduce((p, c) => p + c.ongoingLoans, 0),
      totalDebt: pools.reduce((p, c) => p.add(c.totalDebt), new BN(0)),
      totalRepaysAggregatedAmount: pools.reduce((p, c) => p.add(c.totalRepaysAggregatedAmount), new BN(0))
    };
  }

  async getLoans(root: string) {
    let result;
    try {
      result = await this.client
        .query({
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
        `
        });
    } catch (err) {
      console.log(`error occured while fetching loans from apollo ${err}`);
      return {
        data: []
      };
    }
    const pool = result.data.pools[0];
    const tinlakeLoans = pool && toTinlakeLoans(pool.loans) || [];
    return tinlakeLoans;
  }

  async getProxies(user: string) {
    let result;
    try {
      result = await this.client
        .query({
          query: gql`
        {
          proxies (where: {owner:"${user}"})
            {
              id
              owner
            }
          }
        `
        });
    } catch (err) {
      console.log(`no proxies found for address ${user} ${err}`);
      return {
        data: []
      };
    }
    const proxies = result.data.proxies.map((e: { id: string, owner: string }) => e.id);
    return { data: proxies };
  }
}

function toTinlakeLoans(loans: any[]): { data: Loan[] } {
  const tinlakeLoans: Loan[] = [];

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
      status: getLoanStatus(loan)
    };
    tinlakeLoans.push(tinlakeLoan);
  });

  tinlakeLoans.length && tinlakeLoans.sort((l1: Loan, l2: Loan) => {
    return (l1.loanId as unknown as number) - (l2.loanId as unknown as number);
  });

  return { data: tinlakeLoans };
}

function getLoanStatus(loan: any) {
  if (loan.closed) {
    return 'closed';
  }
  if (loan.debt && loan.debt !== '0') {
    return 'ongoing';
  }
  return 'opened';
}

export default new Apollo();
