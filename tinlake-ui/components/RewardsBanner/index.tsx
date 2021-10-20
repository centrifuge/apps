import Link from 'next/link'
import * as React from 'react'
import styled from 'styled-components'
import { useAddress } from '../../utils/useAddress'
import { useEthLink } from '../../utils/useEthLink'
import { useInvestorOnboardingState } from '../../utils/useOnboardingState'
import { usePortfolio } from '../../utils/usePortfolio'
import { Box, Center, Shelf, Wrap } from '../Layout'
import { Text } from '../Text'
import { IconExternalLink } from './IconExternalLink'

export const RewardsBanner: React.FC = () => {
  const ethAddr = useAddress()
  const { data: ethLink } = useEthLink()
  const { data: investorOnboardingData } = useInvestorOnboardingState()
  const { data: portfolio } = usePortfolio()
  const hasInvestments = portfolio && !portfolio.totalValue.isZero() && !portfolio.totalSupplyRemaining.isZero()

  const shouldShowWarning = ethAddr && ethLink === null && investorOnboardingData?.completed && hasInvestments

  return shouldShowWarning || true ? (
    <Center
      px="medium"
      py={['medium', 'medium', 'small']}
      width="100%"
      backgroundColor="#0828be"
      style={{ color: 'white' }}
    >
      <Box width="page" maxWidth="100%">
        <Wrap gap="medium" rowGap="small" justifyContent="space-between">
          <Wrap gap="small" rowGap="xsmall" alignItems="flex-start">
            <Shelf gap="4px">
              <Logo src="/static/cfg-white-transparent.svg" width="32" height="32" />
              <Text color="inherit" fontWeight={600}>
                Earn CFG Rewards
              </Text>
            </Shelf>
            <Box flexBasis="500px" flexGrow={1}>
              <Text color="inherit">Link your Centrifuge Chain account to earn CFG rewards on investments.</Text>
            </Box>
          </Wrap>
          <Shelf gap="medium" justifyContent={['space-between', 'flex-start', 'flex-end']} flexGrow={1}>
            <HelpLink href="https://docs.centrifuge.io/use/setup-wallet/" target="_blank">
              <Shelf gap="xsmall">
                <span>Learn more</span>
                <IconExternalLink />
              </Shelf>
            </HelpLink>
            <Link href="/rewards?link=true">
              <Button>Link Centrifuge account</Button>
            </Link>
          </Shelf>
        </Wrap>
      </Box>
    </Center>
  ) : null
}

const Logo = styled.img`
  margin: -8px 0;
`

const Button = styled.div`
  appearance: none;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 16px;
  padding: 6px 16px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid currentcolor;
  border-radius: 40px;
`

const HelpLink = styled.a`
  color: inherit;
  font-weight: 500;
  text-decoration: none;
  font-size: 16px;
`
