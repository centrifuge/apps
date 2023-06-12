import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Text } from '@centrifuge/fabric'
import { useInvestRedeem } from './InvestRedeemProvider'
// cent-js modules pool.d.ts
// export declare type CurrencyKey = string | {
//   ForeignAsset: number;
// } | {
//   Tranche: [string, string];
// };

// cent-js modules pools.ts
// function parseCurrencyKey(key: CurrencyKey): CurrencyKey {
//   if (typeof key === 'string' || 'ForeignAsset' in key) return key
//   return {
//     Tranche: [key.Tranche[0].replace(/\D/g, ''), key.Tranche[1]],
//   }
// }

// liquidityEpochSection L255
// wallet address with rewards: '0x3F694284e7343f838Bcb67e2bcFe67Eb02b49182'

// type CurrencyId = { Native: true } | { KSM: true } | { AUSD: true } | { Tranche: string } | { ForeignAsset: number }

export function LiquidityRewards() {
  const { state } = useInvestRedeem()

  const { execute: claimLiquidityRewards, isLoading: claimLiquidityRewardsLoading } = useCentrifugeTransaction(
    'Claim cfg liquidity rewards',
    (cent) => cent.pools.claimLiquidityRewards,
    {
      onSuccess: (args) => {
        console.log('onSuccess received arguments', args)
      },
    }
  )

  const { execute: executeStake, isLoading: stakeLoading } = useCentrifugeTransaction(
    'Stake',
    (cent) => cent.pools.collectAndStake,
    {
      onSuccess: (args) => {
        console.log('onSuccess received arguments', args)
      },
    }
  )

  const claim = async () => {
    claimLiquidityRewards([''])
  }

  return (
    <Box>
      {state?.order && !state?.order.payoutTokenAmount.isZero() && (
        <Box>
          {/* {state?.trancheCurrency?.key && (
        <Button
          onClick={() =>
            executeStake([
              state.poolId,
              state.trancheId,
              state.trancheCurrency.key,
              state.order.payoutTokenAmount.toNumber(),
            ])
          }
        >
          stake
        </Button>
      )} */}

          {stakeLoading && <Text color="red">stake loading</Text>}
          <Button onClick={() => {}}>empty button</Button>
          {/* <Button onClick={() => stake([trancheId, 1])}>stake</Button> */}
        </Box>
      )}
    </Box>
  )
}
