import { Button, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Footer } from '../components/Footer'
import { NFTCard } from '../components/NFTCard'
import { PageContainer } from '../components/PageContainer'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useWeb3 } from '../components/Web3Provider'
import { useAccountNfts } from '../utils/useNFTs'

export const AccountNFTsPage: React.FC = () => {
  return (
    <PageContainer>
      <AccountNFTs />
    </PageContainer>
  )
}

const COUNT_PER_PAGE = 16

const AccountNFTs: React.FC = () => {
  const { selectedAccount, isConnecting, connect } = useWeb3()
  const { data: nfts } = useAccountNfts(selectedAccount?.address)
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)

  if (!selectedAccount) {
    return (
      <Shelf justifyContent="center">
        <Button onClick={() => connect()} loading={isConnecting}>
          Connect
        </Button>
      </Shelf>
    )
  }

  return (
    <Stack gap={8} flex={1}>
      <Shelf justifyContent="space-between">
        <Shelf gap={[0, 1]} alignItems="baseline" flexWrap="wrap">
          <Text variant="headingLarge" as="h1">
            My NFTs
          </Text>
        </Shelf>
      </Shelf>
      {nfts?.length ? (
        <>
          <Grid gap={[2, 3]} columns={[2, 3, 4, 5]} equalColumns>
            {nfts.slice(0, shownCount).map((nft, i) => (
              <NFTCard nft={nft} key={i} />
            ))}
          </Grid>
          {nfts.length > shownCount && (
            <VisibilityChecker marginTop={400} onEnter={() => setShownCount((count) => count + COUNT_PER_PAGE)} />
          )}
        </>
      ) : (
        <Shelf justifyContent="center" mt="15vh" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            You don&rsquo;t own any NFTs yet
          </Text>
        </Shelf>
      )}
      <Footer />
    </Stack>
  )
}
