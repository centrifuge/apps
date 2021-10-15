import { Modal } from '@centrifuge/axis-modal'
import { Anchor } from 'grommet'
import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import CentChainWalletDialog from '../../containers/CentChainWalletDialog'
import SetCentAccount from '../../containers/SetCentAccount'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { useAddress } from '../../utils/useAddress'
import { useEthLink } from '../../utils/useEthLink'
import { useInvestorOnboardingState } from '../../utils/useOnboardingState'
import { usePortfolio } from '../../utils/usePortfolio'
import { Box, BoxProps, Shelf, Stack, Wrap } from '../Layout'
import { LinkIcon } from './LinkIcon'

interface OwnProps {
  showIfUserHasNoInvestments?: boolean
}

type Props = OwnProps & BoxProps

export const RewardsWarning: React.FC<Props> = ({ showIfUserHasNoInvestments, ...boxProps }) => {
  const ethAddr = useAddress()
  const { data: ethLink } = useEthLink()
  const [showLink, setShowLink] = React.useState(false)
  const { data: investorOnboardingData } = useInvestorOnboardingState()
  const { data: portfolio } = usePortfolio()
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const hasInvestments = portfolio && !portfolio.totalValue.isZero()

  const shouldShowWarning =
    ethAddr && ethLink === null && investorOnboardingData?.completed && (showIfUserHasNoInvestments || hasInvestments)

  return shouldShowWarning ? (
    <Warning p="medium" {...boxProps}>
      <Modal width="large" opened={showLink} title="Link Centrifuge Chain account" onClose={() => setShowLink(false)}>
        {cWallet.state === 'connected' && cWallet.accounts.length >= 1 ? <SetCentAccount /> : <CentChainWalletDialog />}
      </Modal>
      <Stack gap="xsmall">
        <HelpTitle>No Centrifuge Chain account linked</HelpTitle>
        <Wrap gap="xsmall" rowGap={0}>
          <span>
            {hasInvestments
              ? 'Your investment(s) in Tinlake pools are not earning any CFG rewards, since you have not linked a Centrifuge Chain account.'
              : 'Link your Centrifuge Chain account to earn CFG rewards on investments.'}
          </span>
          <Anchor
            href="https://docs.centrifuge.io/use/setup-wallet/"
            target="_blank"
            style={{ display: 'inline' }}
            label="Learn how to set up your CFG wallet"
          />
        </Wrap>
        <ShowLinkButton type="button" onClick={() => setShowLink(true)}>
          <Shelf gap="xsmall">
            <LinkIcon />
            <span>Link Centrifuge Chain account</span>
          </Shelf>
        </ShowLinkButton>
      </Stack>
    </Warning>
  ) : null
}

const Warning = styled(Box)`
  background: #fff5da;
`

const HelpTitle = styled.span`
  font-weight: 600;
`

const ShowLinkButton = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  color: black;
  font-size: 14px;
  padding: 4px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    color: #2762ff;
  }
`
