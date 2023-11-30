import { ethers } from 'ethers'
import { useQuery } from 'react-query'
import { Dec } from './Decimal'

async function getWCFGPrice() {
  const usdcWcfgPool = '0x7270233cCAE676e776a659AFfc35219e6FCfbB10'
  const uniswapPoolAbi = ['function observe(uint32[] secondsAgos) external view returns (int56[], uint160[])']
  const provider2 = new ethers.providers.InfuraProvider()
  const poolContract = new ethers.Contract(usdcWcfgPool, uniswapPoolAbi, provider2)
  const observations = (await poolContract.observe([0, 1]))[0]
  const first = Dec(observations[0].toString())
  const second = Dec(observations[1].toString())
  const price = Dec(1.0001).toPower(second.sub(first)).times(Dec(10).toPower(12)).toNumber()
  return price
}

export const useCFGTokenPrice = () => {
  const { data: CFGPrice } = useQuery('wCFGPrice', () => getWCFGPrice())
  return CFGPrice
}
