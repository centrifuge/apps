import { ApolloClient } from 'apollo-client';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import config from '../../config';
import fetch from 'node-fetch';
import gql from 'graphql-tag';

const { tinlakeDataBackendUrl } = config;
const cache = new InMemoryCache();
const link = new createHttpLink({
  fetch,
  uri: tinlakeDataBackendUrl
});

export interface TinlakeEventEntry {
  timestamp: string;
  total_debt: string;
  total_value_of_nfts: string;
}

class Apollo {
  client: ApolloClient<NormalizedCacheObject>;
  constructor() {
    this.client =  new ApolloClient({
      cache,
      link
    });
  }

  async getLoans(root: string) {
    let loans;
    try {
      loans = await this.client
      .query({
        query: gql`
        {
            loans (filter: {
                pool: { id: "${root}"}
            })
            {
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
        `
      });
    } catch (err) {
      console.log(`error occured while fetching time series data from apollo ${err}`);
      return [];
    }
    //console.log("loans received", loans)
    return loans;
  }
}

export default new Apollo();