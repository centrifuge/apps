import { useWallet } from '@centrifuge/centrifuge-react'
import { Contract, Provider } from 'ethers'
import { useQuery } from 'react-query'
import { Dec } from './Decimal'

async function getWCFGPrice(provider: Provider) {
  const usdcWcfgPool = '0x7270233cCAE676e776a659AFfc35219e6FCfbB10'
  const uniswapPoolAbi = ['function observe(uint32[] secondsAgos) external view returns (int56[], uint160[])']
  const poolContract = new Contract(usdcWcfgPool, uniswapPoolAbi, provider)
  const observations = (await poolContract.observe([0, 1]))[0]
  const first = Dec(observations[0].toString())
  const second = Dec(observations[1].toString())
  const price = Dec(1.0001).toPower(second.sub(first)).times(Dec(10).toPower(12)).toNumber()
  return price
}

export const useCFGTokenPrice = () => {
  const { getProvider } = useWallet().evm
  const provider = getProvider(1)
  const { data: CFGPrice } = useQuery('wCFGPrice', () => getWCFGPrice(provider))
  return CFGPrice
}

export const useDailyCFGPrice = (filter: 'YTD' | '30days' | '90days') => {
  return useQuery(['dailyCFGPrice', filter], async () => {
    let dateGt: number = 0
    const currentYear = new Date().getFullYear()
    if (filter === 'YTD') {
      const januaryFirst = new Date(currentYear, 0, 1)
      const unixTimestampJanuaryFirst = Math.floor(januaryFirst.getTime() / 1000)
      dateGt = unixTimestampJanuaryFirst
    }
    if (filter === '30days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const unixTimestampThirtyDaysAgo = Math.floor(thirtyDaysAgo.getTime() / 1000)
      dateGt = unixTimestampThirtyDaysAgo
    }
    if (filter === '90days') {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const unixTimestampNinetyDaysAgo = Math.floor(ninetyDaysAgo.getTime() / 1000)
      dateGt = unixTimestampNinetyDaysAgo
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query DailyTokenPrice($dateGt: Int!) {
            tokenDayDatas(where: { token: "0xc221b7e65ffc80de234bbb6667abdd46593d34f0",  date_gt: $dateGt}, first: 365 ) {
              date
              priceUSD
            }
          }
        `,
        variables: {
          dateGt,
        },
      }),
    }

    const res = await fetch(
      `https://gateway.thegraph.com/api/9cdc906f79cb4b557d79846a994f6564/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`,
      options
    )
    return res.json()
  })
}
