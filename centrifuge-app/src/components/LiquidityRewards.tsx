import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Text } from '@centrifuge/fabric'

export function LiquidityRewards() {
  const { execute, isLoading } = useCentrifugeTransaction(
    'Claim cfg liquidity rewards',
    (cent) => cent.pools.claimLiquidityRewards,
    {
      onSuccess: (args) => {
        // const [, poolId] = args
        console.log('onSuccess received arguments', args)
      },
    }
  )

  const claimLiquidityRewards = async () => {
    execute([''])
  }

  // const { execute: closeEpochTx, isLoading: loadingClose } = useCentrifugeTransaction(
  //   'Start order execution',
  //   (cent) => cent.pools.closeEpoch,
  //   {
  //     onSuccess: () => {
  //       console.log('Started order execution successfully')
  //     },
  //   }
  // )

  // const closeEpoch = async () => {
  //   if (!pool) return
  //   // const batchCloseAndSolution = ordersLocked && !ordersFullyExecutable
  //   closeEpochTx([pool.id, false])
  // }

  return (
    <Box>
      <Text>Liquidity rewards</Text>
      <Button onClick={() => claimLiquidityRewards()}>execute</Button>
    </Box>
  )
}
