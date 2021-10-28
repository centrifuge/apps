import { Card } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { NavBar } from '../components/NavBar'
import { PageContainer } from '../components/PageContainer'

export const NFTPage: React.FC = () => {
  const { cid, nftid } = useParams<{ cid: string; nftid: string }>()

  return (
    <>
      <NavBar
        title={`NFT Name ${nftid}`}
        breadcrumbs={[
          { label: 'NFT Studio', to: '/' },
          { label: 'Collections', to: '/' },
          { label: `Collection ${cid}`, to: '/collection/1' },
        ]}
      />
      <PageContainer>
        <Card p={3}></Card>
      </PageContainer>
    </>
  )
}
