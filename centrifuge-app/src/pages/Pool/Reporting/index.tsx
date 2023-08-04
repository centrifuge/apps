import * as React from 'react'
import { PoolReportPage } from '../../../components/Report/PoolReportPage'
import { PoolDetailHeader } from '../Header'

export function PoolDetailReportingTab() {
  return <PoolReportPage header={<PoolDetailHeader />} />
}
