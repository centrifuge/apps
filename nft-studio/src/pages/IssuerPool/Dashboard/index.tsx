import * as React from 'react'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { IssuerPoolHeader } from '../Header'

export const IssuerPoolDashboardPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolDashboard />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const IssuerPoolDashboard: React.FC = () => {
  return <div>Dashboard</div>
}
