import * as React from 'react'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PoolDetailHeader } from '../Header'

export const PoolDetailAssetsTab: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const PoolDetailAssets: React.FC = () => {
  return <div>Assets</div>
}
