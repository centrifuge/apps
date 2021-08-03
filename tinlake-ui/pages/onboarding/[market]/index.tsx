import { Box, Button } from 'grommet'
import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import * as React from 'react'
import Container from '../../../components/Container'
import Header from '../../../components/Header'
import WithFooter from '../../../components/WithFooter'
import OnboardingSteps from '../../../containers/Onboarding/OnboardingSteps'

interface Props extends WithRouterProps {
  market: 'aave'
}

const OnboardingPage: React.FC<Props> = (props: Props) => {
  return (
    <WithFooter hideHelpMenu={true}>
      <Head>
        <title>Investor Onboarding for ${props.market} | Tinlake | Centrifuge</title>
      </Head>
      <Header
        ipfsPools={{ active: [], archived: [], upcoming: [] }}
        selectedRoute={'/onboarding'}
        menuItems={[]}
        secondaryContent={<Button label="Return to Aave" primary />}
      />
      <Container>
        <Box justify="center" direction="row">
          <Box width="xlarge">
            <Box>
              <OnboardingSteps
                hidePageTitle={true}
                activePool={{
                  network: 'mainnet',
                  version: 3,
                  isUpcoming: false,
                  addresses: {
                    ROOT_CONTRACT: '0x0',
                    ACTIONS: '0x0',
                    PROXY_REGISTRY: '0x0',
                    COLLATERAL_NFT: '0x0',
                    SENIOR_TOKEN: '0x0',
                    JUNIOR_TOKEN: '0x0',
                    ASSESSOR: '0x0',
                    RESERVE: '0x0',
                    SENIOR_TRANCHE: '0x0',
                    JUNIOR_TRANCHE: '0x0',
                    FEED: '0x0',
                  },
                  metadata: { name: 'Aave', slug: 'aave', asset: '-' },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </WithFooter>
  )
}

export async function getStaticPaths() {
  // We'll pre-render only these paths at build time.
  const paths = [{ params: { market: 'aave' } }]

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return {
    props: {
      market: params?.market,
    },
  }
}

export default OnboardingPage
