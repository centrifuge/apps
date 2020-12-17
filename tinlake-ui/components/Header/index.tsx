import { NavBar } from '@centrifuge/axis-nav-bar'
import { Web3Wallet } from '@centrifuge/axis-web3-wallet'
import { Box, Button, Image } from 'grommet'
import { Close as CloseIcon, Menu as MenuIcon, User as UserIcon } from 'grommet-icons'
import Link from 'next/link'
import Router, { NextRouter, withRouter } from 'next/router'
import React from 'react'
import { connect, useSelector } from 'react-redux'
import { PoolSelector } from '../../components/PoolSelector'
import config, { IpfsPools } from '../../config'
import { AuthState, clear, ensureAuthed } from '../../ducks/auth'
import { OnboardingState } from '../../ducks/onboarding'
import { selectWalletTransactions, TransactionState } from '../../ducks/transactions'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'

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
  auth?: AuthState
  router: NextRouter
  transactions?: TransactionState
  ensureAuthed?: () => Promise<void>
  clear?: () => Promise<void>
}

const Header: React.FC<Props> = (props: Props) => {
  const onboarding = useSelector<any, OnboardingState>((state) => state.onboarding)

  const connectAccount = async () => {
    try {
      await props.ensureAuthed!()
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
      const { root, slug } = props.router.query
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

  const { poolTitle, selectedRoute, menuItems, transactions, auth, clear } = props
  const { address, network, providerName } = auth!
  const logoUrl = (isDemo && '/static/demo_logo.svg') || '/static/logo.svg'

  const theme = {
    navBar: {
      icons: {
        menu: MenuIcon,
        close: CloseIcon,
        user: UserIcon,
      },
    },
  }

  const filtMenuItems = menuItems.filter(
    (item) => ((isDemo && item.env === 'demo') || item.env === '') && !item.secondary
  )

  return (
    <Box
      style={{ position: 'sticky', top: 0, height: '56px', zIndex: 2, boxShadow: '0 0 4px 0px #00000075' }}
      background="white"
      justify="center"
      align="center"
      direction="row"
      fill="horizontal"
      pad={{ horizontal: 'small' }}
    >
      <Box direction="row" width="xlarge" align="center">
        <Box align="center" direction="row" basis="full">
          <div
            style={{
              height: 32,
              paddingRight: 16,
              borderRight: '1px solid #D8D8D8',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Link href="/" shallow>
              <a title="Tinlake" style={{ display: 'block' }}>
                <Image src={logoUrl} style={{ width: 130, verticalAlign: 'middle' }} />
              </a>
            </Link>
          </div>
          {poolTitle && <PoolSelector title={poolTitle} ipfsPools={props.ipfsPools} />}
          <Box
            flex="grow"
            basis="auto"
            style={{ height: 32, padding: '0 16px 0 32px', borderRight: '1px solid #D8D8D8' }}
          >
            {filtMenuItems.length > 0 && (
              <NavBar
                border={false}
                itemGap="large"
                theme={theme}
                menuItems={filtMenuItems}
                selectedRoute={selectedRoute}
                onRouteClick={onRouteClick}
                pad={{ horizontal: 'none' }}
                menuItemProps={{ style: { fontSize: 14 } }}
                hamburgerBreakpoint={1000}
              />
            )}
          </Box>
          <div style={{ flex: '0 0 auto', paddingLeft: 16 }}>
            {!address && <Button onClick={connectAccount} label="Connect" />}
            {address && (
              <Web3Wallet
                address={address}
                providerName={providerName}
                networkName={network}
                onDisconnect={clear}
                transactions={selectWalletTransactions(transactions)}
                getAddressLink={getAddressLink}
                style={{ padding: 0 }}
                kycStatus={
                  onboarding.data?.kyc.verified ? 'verified' : onboarding.data?.kyc.created ? 'pending' : 'none'
                }
                showKycInfo={true}
              />
            )}
          </div>
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state, { ensureAuthed, clear })(withRouter(Header))
