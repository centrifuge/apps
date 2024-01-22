import * as React from 'react'
import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolDetailOverview } from '../../Pool/PoolFees'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolFeesPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </LayoutBase>
  )
}
