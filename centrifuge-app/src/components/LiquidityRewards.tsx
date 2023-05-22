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

  return (
    <Box>
      <Text>Liquidity rewards</Text>
      <Button onClick={() => execute(['foo'])}>execute</Button>
    </Box>
  )
}
