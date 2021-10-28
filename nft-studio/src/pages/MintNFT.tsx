import { Card } from '@centrifuge/fabric'
import * as React from 'react'
import { NavBar } from '../components/NavBar'
import { PageContainer } from '../components/PageContainer'

export const MintNFTPage: React.FC = () => {
  return (
    <>
      <NavBar
        title="Untitled NFT"
        breadcrumbs={[
          { label: 'NFT Studio', to: '/' },
          { label: 'Collection 1', to: '/collection/1' },
        ]}
      />
      <PageContainer>
        <Card p={3}></Card>
      </PageContainer>
    </>
  )
}
