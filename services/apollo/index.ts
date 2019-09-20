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
  uri: tinlakeDataBackendUrl,
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
      link,
    });
  }

  async getCollateralTimeSeriesData(period:string) {
    let timeSeriesData;
    try {
      timeSeriesData = await this.client
      .query({
        query: gql`
        {
          last${period}(interval:"day"){
            timestamp
            total_debt
            total_balance
            total_value_of_nfts
            total_supply
            number_of_loans
            whitelisted_loans
            repaid_loans
          }
        }
        `,
      });
    } catch (err) {
      console.log(`error occured while fetching time series data from apollo ${err}`);
      return [];
    }
    return (timeSeriesData && timeSeriesData['data'] ? sortByTime(timeSeriesData['data'][`last${period}`]) : []);
  }
}

function sortByTime(entries:TinlakeEventEntry[]) {
  return entries.sort((a:TinlakeEventEntry, b:TinlakeEventEntry) => (a.timestamp > b.timestamp) ? 1 : -1);
}
export interface ApolloClient extends Apollo {}
export const apolloClient = new Apollo();
