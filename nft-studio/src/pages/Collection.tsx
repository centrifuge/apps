import { Box, Grid, IconPlus } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { NavBar } from '../components/NavBar'
import { NFTCard } from '../components/NFTCard'
import { PageContainer } from '../components/PageContainer'
import { RouterLinkButton } from '../components/RouterLinkButton'

export const CollectionPage: React.FC = () => {
  const { cid } = useParams<{ cid: string }>()

  return (
    <>
      <NavBar
        title={`Collection ${cid}`}
        breadcrumbs={[
          { label: 'NFT Studio', to: '/' },
          { label: 'Collections', to: '/' },
        ]}
      />
      <PageContainer>
        <Grid gap={[1, 2, 3]} columns={[2, 3, 4, 5]} equalColumns>
          <NFTCard />
          <NFTCard />
          <NFTCard />
          <NFTCard />
          <NFTCard />
          <NFTCard />
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            alignSelf="center"
            style={{ aspectRatio: '1' }}
          >
            <RouterLinkButton to="/collection/1/object/mint" icon={IconPlus} variant="outlined">
              Mint NFT
            </RouterLinkButton>
          </Box>
        </Grid>
      </PageContainer>
    </>
  )
}
