import { Tooltip as AxisTooltip } from '@centrifuge/axis-tooltip'
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
import { OnboardingState } from '../../ducks/onboarding'
import { PoolData, PoolState } from '../../ducks/pool'
import { loadPortfolio, PortfolioState } from '../../ducks/portfolio'
import { selectWalletTransactions, TransactionState } from '../../ducks/transactions'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import { toPrecision } from '../../utils/toPrecision'
import { useCFGRewards } from '../../utils/useCFGRewards'
import { useQueryDebugEthAddress } from '../../utils/useQueryDebugEthAddress'
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
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const { poolTitle, selectedRoute, menuItems } = props
  const router = useRouter()

  const onboarding = useSelector<any, OnboardingState>((state) => state.onboarding)
  const portfolio = useSelector<any, PortfolioState>((state) => state.portfolio)
  const transactions = useSelector<any, TransactionState>((state) => state.transactions)

  const auth = useSelector<any, AuthState>((state) => state.auth)
  const connectedAddress = auth.address
  const address = useQueryDebugEthAddress() || connectedAddress
  const { formattedAmount: CFGRewardAmount } = useCFGRewards(address)
  const dispatch = useDispatch()
  const [menuOpen, setMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (address) dispatch(loadPortfolio(address, props.ipfsPools))
  }, [address])

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
      const { root, slug } = router.query
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

  const portfolioLink = (
    <Link href="/portfolio">
      <Box as="a" direction="row">
        <Icon src="/static/DAI.svg" />
        <HoldingValue>
          {portfolio.totalValue && addThousandsSeparators(toPrecision(baseToDisplay(portfolio.totalValue, 18), 0))}
        </HoldingValue>
        <Unit>DAI</Unit>
      </Box>
    </Link>
  )

  const rewardsLink = (
    <Link href="/rewards">
      <Box as="a" direction="row">
        <Icon src="/static/cfg-white.svg" />
        <HoldingValue>{CFGRewardAmount}</HoldingValue>
        <Unit>CFG</Unit>
      </Box>
    </Link>
  )

  return (
    <HeaderBar
      style={{ position: 'sticky', top: 0, height: '56px', zIndex: 2, boxShadow: '0 0 4px 0px #00000075' }}
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
            <DesktopLogo src={logoUrl} />
            <MobileLogo src="/static/tinlake-logo-icon-only.svg" />
          </a>
        </Link>
      </LogoWrapper>
      <NavWrapper align="center" direction="row" flex="grow" basis="auto">
        {poolTitle && <PoolSelector title={poolTitle} ipfsPools={props.ipfsPools} />}
        {filtMenuItems.length > 0 && <DesktopNav>{menuButtons}</DesktopNav>}
      </NavWrapper>
      <AccountWrapper align="center" direction="row">
        <Holdings>
          {address && (
            <Box pad={{ left: '14px', right: '14px' }}>
              <AxisTooltip title="View your rewards">{rewardsLink}</AxisTooltip>
            </Box>
          )}
          {address && portfolio.totalValue && !portfolio.totalValue.isZero() && (
            <Box pad={{ left: '14px', right: '14px' }}>
              <AxisTooltip title="View your investment portfolio">{portfolioLink}</AxisTooltip>
            </Box>
          )}
        </Holdings>
        <WalletNav style={{ flex: '0 0 auto', paddingLeft: 16 }}>
          {!address && <Button onClick={connectAccount} label="Connect" />}
          {address && (
            <Web3Wallet
              address={address}
              providerName={providerName!}
              networkName={network}
              onDisconnect={() => dispatch(clear())}
              transactions={selectWalletTransactions(transactions)}
              getAddressLink={getAddressLink}
              kycStatus={onboarding.data?.kyc?.status === 'verified' ? 'verified' : 'none'}
            />
          )}
        </WalletNav>
      </AccountWrapper>
      <MobileNav>
        <Hamburger width="24" onClick={() => setMenuOpen(true)}>
          <MenuIcon size="menu" />
        </Hamburger>
        {menuOpen && (
          <Layer
            position="right"
            full="vertical"
            responsive={false}
            animate={true}
            onClickOutside={() => setMenuOpen(false)}
            onEsc={() => setMenuOpen(false)}
          >
            <Box pad="40px" width="300px">
              <CloseButton onClick={() => setMenuOpen(false)}>
                <CloseIcon size="16px" />
              </CloseButton>
              <Box gap="xlarge">
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
                  {portfolioLink}
                </Box>
                <Box gap="medium">
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

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 32px;
  padding-right: 32px;
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
  line-height: 20px;
`

const Unit = styled.div`
  font-weight: 500;
  font-size: 11px;
  line-height: 21px;
  margin-left: 5px;
`

const Icon = styled.img`
  width: 18px;
  height: 18px;
  margin-right: 5px;
`

const Holdings = styled.div`
  display: flex;
  flex-direction: row;

  @media (min-width: 900px) and (max-width: 1199px) {
    ${Icon} {
      width: 30px;
      height: 30px;
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

const DesktopLogo = styled.img`
  width: 130px;
  vertical-align: middle;

  @media (max-width: 1199px) {
    display: none;
  }
`

const DesktopNav = styled.div`
  @media (max-width: 899px) {
    display: none;
  }
`

const WalletNav = styled.div``

const MobileNav = styled.div`
  @media (min-width: 900px) {
    display: none;
  }
`

const Hamburger = styled(Box)`
  width: 40px;
  height: 40px;
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border: 1px solid #000;
  background-color: #fff;
  box-shadow: 0px 3px 4px rgba(0, 0, 0, 0.1);
  z-index: 5;

  svg {
    width: 20px;
    height: 20px;
  }
`

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 50%;
  background-color: #000;

  path {
    stroke: #fff !important;
  }
`

const MobileLogo = styled.img`
  height: 20px;
  vertical-align: middle;

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
