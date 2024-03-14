import { Box, Stack, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { LayoutBase } from '../components/LayoutBase'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { TransactionHistory } from '../components/PoolOverview/TransactionHistory'
import { usePool, usePoolMetadata } from '../utils/usePools'

const PoolTransactions = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)

  return (
    <LayoutBase>
      <LayoutSection py={5}>
        <Stack gap={4}>
          <Text as="h1" variant="heading1">
            {metadata?.pool?.name}
          </Text>
          <Box>
            <TransactionHistory poolId={poolId} preview={false} />
          </Box>
        </Stack>
      </LayoutSection>
    </LayoutBase>
  )
}

export default PoolTransactions
