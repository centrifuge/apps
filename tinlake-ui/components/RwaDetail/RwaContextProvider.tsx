import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import BN from 'bn.js'
import gql from 'graphql-tag'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

interface RwaContextType {
  marketSize?: BN
  totalBorrowed?: BN
  reserves?: ReservesType[]
}

const RwaContext = createContext<RwaContextType | null>(null)

export const useRwaContext = (): RwaContextType => {
  const ctx = useContext(RwaContext)
  if (!ctx) throw new Error('useRwaContext must be used within RwaContextProvider')
  return ctx
}

interface QueryDataType {
  reserves: ReservesType[]
}
interface ReservesType {
  symbol: string
  name: string
  totalLiquidity: string
  totalCurrentVariableDebt: string
}
const fetchReserves = async (): Promise<ReservesType[]> => {
  const Apollo = new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({
      fetch: fetch as any,
      headers: {
        'user-agent': null,
      },
      uri: 'https://api.thegraph.com/subgraphs/name/aave/aave-centrifuge',
    }),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
    },
  })

  const results = await Apollo.query<QueryDataType>({
    query: gql`
      {
        reserves {
          symbol
          name
          totalLiquidity
          totalCurrentVariableDebt
        }
      }
    `,
  })

  return results.data.reserves
}

export const RwaContextProvider: React.FC = ({ children }) => {
  const [mounted, setMounted] = useState<boolean>(true)
  const [marketSize, setMarketSize] = useState<BN>()
  const [totalBorrowed, setTotalBorrowed] = useState<BN>()
  const [reserves, setReserves] = useState<ReservesType[]>()

  const loadMarketData = async () => {
    const resp = await fetchReserves()

    const reservesUSDC = resp.find((res) => res.symbol === 'USDC')

    if (!reservesUSDC || !mounted) return

    // TODO unit need to be converted to USDC
    const liquiditySum = resp.reduce((acc, rsv) => {
      return acc.add(new BN(rsv.totalLiquidity))
    }, new BN(0))

    setMarketSize(liquiditySum)
    setTotalBorrowed(new BN(reservesUSDC.totalCurrentVariableDebt))
    setReserves(resp)
  }

  useEffect(() => {
    loadMarketData()
    return () => setMounted(false)
  }, [])

  const ctxValue = useMemo(
    () => ({
      marketSize,
      totalBorrowed,
      reserves,
    }),
    [marketSize, totalBorrowed, reserves]
  )

  return <RwaContext.Provider value={ctxValue}>{children}</RwaContext.Provider>
}
