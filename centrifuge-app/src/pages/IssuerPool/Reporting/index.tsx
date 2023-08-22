import * as React from 'react'
import { PoolReportPage } from '../../../components/Report/PoolReportPage'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolReportingPage() {
  return <PoolReportPage header={<IssuerPoolHeader />} />
}
