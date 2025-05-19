import { Card, Stack } from '@centrifuge/fabric'
import React from 'react'
import PoolPerformanceChart from '../Charts/PoolPerformanceChart'
import { Spinner } from '../Spinner'

export const PoolPerformance = () => (
  <React.Suspense fallback={<Spinner style={{ height: 480 }} />}>
    <Card height={480}>
      <Stack gap={2}>
        <PoolPerformanceChart />
      </Stack>
    </Card>
  </React.Suspense>
)
