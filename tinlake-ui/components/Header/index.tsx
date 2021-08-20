import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box, Button, Layer } from 'grommet'
import { Close as CloseIcon, Menu as MenuIcon } from 'grommet-icons'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { PoolSelector } from '../../components/PoolSelector'
import config, { IpfsPools } from '../../config'
import { AuthState, clear, ensureAuthed } from '../../ducks/auth'
import { selectWalletTransactions, TransactionState } from '../../ducks/transactions'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import { toDynamicPrecision } from '../../utils/toDynamicPrecision'
import { useCFGRewards } from '../../utils/useCFGRewards'
import { usePool } from '../../utils/usePool'
import { usePortfolio } from '../../utils/usePortfolio'
import { useQueryDebugEthAddress } from '../../utils/useQueryDebugEthAddress'
import { Tooltip } from '../Tooltip'
import { Web3Wallet } from '../Web3Wallet'

const { isDemo } = config
export interface MenuItem {
  label: string
  route: string
  inPool: boolean
  secondary?: boolean
  env: string
}

interface Props {
  ipfsPools: IpfsPools
  poolTitle?: string
  selectedRoute: string
  menuItems: MenuItem[]
}

const Header: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const { root, slug } = router.query

  const { data: poolData } = usePool(root as string)

  const { poolTitle, selectedRoute, menuItems } = props

  const transactions = useSelector<any, TransactionState>((state) => state.transactions)

  const auth = useSelector<any, AuthState>((state) => state.auth)
  const connectedAddress = auth.address
  const address = useQueryDebugEthAddress() || connectedAddress
  const { formattedAmount: CFGRewardFormatted, amount: CFGRewardAmount } = useCFGRewards(address)
  const portfolio = usePortfolio(props.ipfsPools, address)
  const dispatch = useDispatch()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const connectAccount = async () => {
    try {
      await dispatch(ensureAuthed())
    } catch (e) {
      console.error(`authentication failed with Error ${e}`)
    }
  }

  const onRouteClick = (item: MenuItem) => {
    if (item.route.startsWith('/')) {
      pushWithPrefixIfInPool(item)
    } else {
      window.open(item.route)
    }
  }

  const pushWithPrefixIfInPool = (item: MenuItem) => {
    if (item.inPool) {
      const route = item.route === '/' ? '' : item.route

      if (slug === undefined) {
        Router.push(`/pool/[root]${route}`, `/pool/${root}${route}`, { shallow: true })
        return
      }
      Router.push(`/pool/[root]/[slug]${route}`, `/pool/${root}/${slug}${route}`, { shallow: true })
      return
    }
    Router.push(item.route, undefined, { shallow: true })
  }

  const { network, providerName } = auth!
  const logoUrl = (isDemo && '/static/demo_logo.svg') || '/static/logo.svg'

  const filtMenuItems = menuItems
    .filter((item) => ((isDemo && item.env === 'demo') || item.env !== 'demo') && !item.secondary)
    .filter((item) => (poolData?.isPoolAdmin ? true : item.env !== 'admin'))

  const menuButtons = filtMenuItems.map((item) => (
    <Button
      plain
      key={item.label}
      label={item.label}
      onClick={() => onRouteClick(item)}
      color={selectedRoute === item.route ? 'selected' : undefined}
      style={{ fontSize: 14, padding: '0 12px', textAlign: 'left' }}
    />
  ))

  const portfolioIsNonZero = portfolio.data?.totalValue && !portfolio.data?.totalValue.isZero()
  const portfolioLink = (
    <Link href="/portfolio">
      <Box as="a" direction="row" align="center">
        <Icon src="/static/DAI.svg" />
        <HoldingValue>
          {portfolioIsNonZero
            ? addThousandsSeparators(toDynamicPrecision(baseToDisplay(portfolio.data?.totalValue || '0', 18)))
            : 'Portfolio'}
        </HoldingValue>
        <Unit>{!portfolioIsNonZero && '0 '}DAI</Unit>
      </Box>
    </Link>
  )

  const rewardsIsNonZero = address && CFGRewardAmount && !CFGRewardAmount.isZero()
  const rewardsLink = (
    <Link href="/rewards">
      <Box as="a" direction="row" align="center">
        <Icon src="/static/cfg-white.svg" />
        <HoldingValue>{address && rewardsIsNonZero ? CFGRewardFormatted : 'Rewards'}</HoldingValue>
        {address && <Unit>{!rewardsIsNonZero && '0 '}CFG</Unit>}
      </Box>
    </Link>
  )

  return (
    <HeaderBar
      style={{ position: 'sticky', top: 0, height: '56px', zIndex: 6, boxShadow: '0 0 4px 0px #00000075' }}
      background="white"
      justify="between"
      align="center"
      direction="row"
      fill="horizontal"
      pad={{ horizontal: 'medium' }}
    >
      <LogoWrapper>
        <Link href="/" shallow>
          <a title="Tinlake" style={{ display: 'block' }}>
            <DesktopLogo hasPoolSelector={!!poolTitle} src={logoUrl} />
            <MobileLogo hasPoolSelector={!!poolTitle} src="/static/tinlake-logo-icon-only.svg" />
          </a>
        </Link>
      </LogoWrapper>
      <NavWrapper align="center" direction="row" style={{ flex: '1 1 auto' }}>
        {poolTitle && <PoolSelector title={poolTitle} ipfsPools={props.ipfsPools} />}
        {filtMenuItems.length > 0 && <DesktopNav>{menuButtons}</DesktopNav>}
      </NavWrapper>
      <AccountWrapper align="center" direction="row">
        <Holdings>
          <Box pad={{ left: '14px', right: '14px' }}>
            <Tooltip title="View your rewards">{rewardsLink}</Tooltip>
          </Box>
          {address && (
            <Box pad={{ left: '14px', right: '14px' }}>
              <Tooltip title="View your investment portfolio">{portfolioLink}</Tooltip>
            </Box>
          )}
        </Holdings>
        <WalletNav style={{ flex: '0 0 auto', paddingLeft: 16 }}>
          {!address && <ConnectButton onClick={connectAccount} label="Connect" />}
          {address && (
            <Web3Wallet
              address={address}
              providerName={providerName!}
              networkName={network}
              onDisconnect={() => dispatch(clear())}
              transactions={selectWalletTransactions(transactions)}
              getAddressLink={getAddressLink}
            />
          )}
        </WalletNav>
      </AccountWrapper>
      <MobileNav>
        <Box pad={{ left: '24px' }}>
          <MenuIcon size="24px" onClick={() => setMenuOpen(true)} />
        </Box>
        {menuOpen && (
          <Layer
            position="right"
            full="vertical"
            responsive={false}
            animate={true}
            onClickOutside={() => setMenuOpen(false)}
            onEsc={() => setMenuOpen(false)}
            style={{ borderRadius: 0 }}
          >
            <Box pad="40px" width="300px" height="100%">
              <CloseButton onClick={() => setMenuOpen(false)}>
                <CloseIcon size="16px" />
              </CloseButton>
              <Box gap="xlarge" height="100%">
                {poolTitle && filtMenuItems.length > 0 && (
                  <Box gap="medium">
                    <div>{poolTitle}</div>
                    <Box gap="medium" pad={{ left: 'small' }}>
                      {menuButtons}
                    </Box>
                  </Box>
                )}

                <Box gap="large">
                  {rewardsLink}
                  {address && portfolioLink}
                </Box>
                <Box gap="medium" margin={{ top: 'auto' }}>
                  <SocialLink href="https://t.me/centrifuge_chat" target="_blank">
                    <Icon src="/static/help/telegram.svg" />
                    <span>Telegram</span>
                  </SocialLink>
                  <SocialLink href="https://centrifuge.io/discord" target="_blank">
                    <Icon src="/static/help/slack.svg" />
                    <span>Discord</span>
                  </SocialLink>
                  <SocialLink href="mailto:support@centrifuge.io" target="_blank">
                    <Icon src="/static/help/email.svg" />
                    <span>Email</span>
                  </SocialLink>
                  <SocialLink href="https://docs.centrifuge.io/tinlake/overview/introduction/" target="_blank">
                    <Icon src="/static/help/documentation.svg" />
                    <span>Documentation</span>
                  </SocialLink>
                </Box>
              </Box>
            </Box>
          </Layer>
        )}
      </MobileNav>
    </HeaderBar>
  )
}

export default Header

const ConnectButton = styled(Button)`
  @media (max-width: 899px) {
    display: none;
  }
`

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 32px;
  padding-right: 24px;
`
const NavWrapper = styled(Box)`
  flex-grow: 1;
`
const AccountWrapper = styled(Box)``

const HeaderBar = styled(Box)`
  @media (min-width: 1500px) {
    display: grid;
    grid-template-columns: 1fr 1152px 1fr;

    ${LogoWrapper} {
      grid-column: 1 / 1;
      grid-row: 1;
    }

    ${NavWrapper} {
      grid-column: 2 / 3;
      grid-row: 1;
    }

    ${AccountWrapper} {
      grid-column: 2 / 4;
      grid-row: 1;
      justify-self: right;
    }
  }
`

const HoldingValue = styled.div`
  font-weight: 500;
  font-size: 14px;
`

const Unit = styled.div`
  font-weight: 500;
  font-size: 11px;
  margin-left: 5px;
  position: relative;
  top: 2px;
`

const Icon = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 5px;
`

const Holdings = styled.div`
  display: flex;
  flex-direction: row;

  a:hover {
    color: #2762ff;
  }

  @media (min-width: 900px) and (max-width: 1199px) {
    ${Icon} {
      margin-right: 0;
    }
    ${Unit}, ${HoldingValue} {
      display: none;
    }
  }

  @media (max-width: 899px) {
    display: none;
  }
`

const DesktopLogo = styled.img<{ hasPoolSelector: boolean }>`
  width: 130px;
  vertical-align: middle;

  @media (max-width: 1199px) {
    display: ${(props) => (props.hasPoolSelector ? 'none' : 'initial')};
  }
`

const DesktopNav = styled.div`
  @media (max-width: 899px) {
    display: none;
  }
`

const WalletNav = styled.div``

const MobileNav = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  @media (min-width: 900px) {
    display: none;
  }
`

const CloseButton = styled.button`
  width: 24px;
  height: 24px;
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  background-color: transparent;
`

const MobileLogo = styled.img<{ hasPoolSelector: boolean }>`
  width: 34px;
  vertical-align: middle;
  display: ${(props) => (props.hasPoolSelector ? 'initial' : 'none')};

  @media (min-width: 1200px) {
    display: none;
  }
`

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  color: #000;
  font-weight: 500;
  text-decoration: none;
`
