import { Card, Stack } from '@centrifuge/fabric'
import React from 'react'
import PoolPerformanceChart from '../Charts/PoolPerformanceChart'
import { Spinner } from '../Spinner'

export const PoolPerformance = () => (
  <React.Suspense fallback={<Spinner style={{ height: 420 }} />}>
    <Card height={420}>
      <Stack gap={2}>
        <PoolPerformanceChart />
      </Stack>
    </Card>
  </React.Suspense>
)
