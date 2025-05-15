import {
  CurrencyBalance,
  evmMulticall,
  EvmMulticallCall,
} from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import {  isTestEnv } from '../../../src/config'
import { currencies } from '../../../src/utils/tinlake/currencies'


export const cfgConfig = isTestEnv
  ? {
      legacy: '0x657a4556e60A6097975e2E6dDFbb399E5ee9a58b',
      iou: '0xDD1D785F26e547c72CAe501081Deb61a56288204',
      new: '0xccCccCc7323f37366f1E51da362A63B79ceA8742',
    }
  : {
      legacy: '0xc221b7e65ffc80de234bbb6667abdd46593d34f0',
      iou: '0xACF3c07BeBd65d5f7d86bc0bc716026A0C523069',
      new: '0xcccccccccc33d538dbc2ee4feab0a7a1ff4e8a94',
    }

export const useTokenBalance = (userAddress?: string) => {
  const {
    evm: { chainId: connectedEvmChainId, getProvider },
  } = useWallet()

  return useQuery(
    ['tokenBalance', userAddress],
    async () => {
      const calls: EvmMulticallCall[] = [
        {
          target: cfgConfig.legacy,
          call: ['function balanceOf(address) view returns (uint256)', userAddress!],
          returns: [['legacy']],
          allowFailure: true,
        },
        {
          target: cfgConfig.new,
          call: ['function balanceOf(address) view returns (uint256)', userAddress!],
          returns: [['new']],
          allowFailure: true,
        },
      ]

      const multicallData = await evmMulticall<{ legacy?: bigint; new?: bigint }>(calls, {
        rpcProvider: getProvider(connectedEvmChainId!),
      })

     
      return {
        legacy: {
          balance: new CurrencyBalance(multicallData.legacy ?? '0', 18).toDecimal(),
          currency: currencies.wCFG,
        },
        new: {
          balance: new CurrencyBalance(multicallData.new ?? '0', 18).toDecimal(),
          currency: currencies.CFG,
        },
      }
    },
    { enabled: !!userAddress }
  )
}
