import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { BrowserProvider, ethers } from 'ethers'
import { useQuery } from 'react-query'
import { isTestEnv } from '../../../src/config'
import { currencies } from '../../../src/utils/tinlake/currencies'

export const cfgConfig = isTestEnv
  ? {
      legacy: '0x657a4556e60A6097975e2E6dDFbb399E5ee9a58b',
      iou: '0xDD1D785F26e547c72CAe501081Deb61a56288204',
      new: '0xccCccCc7323f37366f1E51da362A63B79ceA8742',
    }
  : {
      legacy: '0xc221b7e65ffc80de234bbb6667abdd46593d34f0',
      iou: 'TODO',
      new: 'TODO',
    }

const ABI = ['function balanceOf(address owner) view returns (uint256)']

export const useTokenBalance = (userAddress: string | undefined) => {
  return useQuery(
    ['tokenBalance', userAddress],
    async () => {
      const provider = new BrowserProvider(window.ethereum)
      const tokens = await Promise.allSettled([
        new ethers.Contract(cfgConfig.legacy, ABI, provider).balanceOf(userAddress!),
        new ethers.Contract(cfgConfig.new, ABI, provider).balanceOf(userAddress!),
      ])

      return {
        legacy: {
          balance: new CurrencyBalance(
            tokens[0].status === 'fulfilled' ? tokens[0].value.toString() : '0',
            18
          ).toDecimal(),
          currency: currencies.wCFG,
        },
        new: {
          balance: new CurrencyBalance(
            tokens[1].status === 'fulfilled' ? tokens[1].value.toString() : '0',
            18
          ).toDecimal(),
          currency: currencies.newCFG,
        },
      }
    },
    {
      enabled: !!userAddress,
    }
  )
}
