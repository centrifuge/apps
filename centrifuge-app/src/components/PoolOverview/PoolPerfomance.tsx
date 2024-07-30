import { Card, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import PoolPerformanceChart from '../Charts/PoolPerformanceChart'
import { Spinner } from '../Spinner'

export const PoolPerformance = () => (
  <React.Suspense fallback={<Spinner style={{ height: 400 }} />}>
    <Card p={3} height={400}>
      <Stack gap={2}>
        <Text fontSize="18px" fontWeight="500">
          Pool performance
        </Text>
        <PoolPerformanceChart />
      </Stack>
    </Card>
  </React.Suspense>
)
