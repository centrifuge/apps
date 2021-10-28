import { Card } from '@centrifuge/fabric'
import * as React from 'react'
import { NavBar } from '../components/NavBar'
import { PageContainer } from '../components/PageContainer'

export const CreateCollectionPage: React.FC = () => {
  return (
    <>
      <NavBar title="Create Collection" breadcrumbs={[{ label: 'NFT Studio', to: '/' }]} />
      <PageContainer>
        <Card p={3}></Card>
      </PageContainer>
    </>
  )
}
