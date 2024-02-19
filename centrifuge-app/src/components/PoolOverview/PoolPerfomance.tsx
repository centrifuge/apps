import { Card, Stack, Text } from '@centrifuge/fabric'
import PoolPerformanceChart from '../Charts/PoolPerformanceChart'

export const PoolPerformance = () => {
  return (
    <Card width="100%" height="100%" p={3}>
      <Stack gap={2}>
        <Text fontSize="18px" fontWeight="500">
          Pool performance
        </Text>
        <PoolPerformanceChart />
      </Stack>
    </Card>
  )
}
