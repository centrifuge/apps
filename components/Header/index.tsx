import React from 'react'
import styled from 'styled-components'
import { Box, Button, Image, Drop } from 'grommet'
import { Menu as MenuIcon, User as UserIcon, Close as CloseIcon } from 'grommet-icons'
import { connect } from 'react-redux'
import Link from 'next/link'
import { AuthState, ensureAuthed, clear } from '../../ducks/auth'
import config from '../../config'
import Router, { withRouter, NextRouter } from 'next/router'
import { NavBar } from '@centrifuge/axis-nav-bar'
import { Web3Wallet } from '@centrifuge/axis-web3-wallet'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import { ToastContainer } from '../../components/Toast'
import { Toast, showTimedToast } from '../../ducks/toasts'
import { PoolSelector } from '../../components/PoolSelector'

const WalletContainer = styled.div``

const { isDemo } = config
export interface MenuItem {
  label: string
  route: string
  inPool: boolean
  secondary?: boolean
  env: string
}

interface Props {
  poolTitle?: string
  selectedRoute: string
  menuItems: MenuItem[]
  toasts: Toast[]
  auth?: AuthState
  router: NextRouter
  showTimedToast?: (toast: Toast, timeInMs: number) => Promise<void>
  ensureAuthed?: () => Promise<void>
  clear?: () => Promise<void>
}

const Header: React.FC<Props> = (props: Props) => {
  const walletRef = React.useRef<HTMLDivElement>(null)

  const connectAccount = async () => {
    try {
      await props.ensureAuthed!()
    } catch (e) {
      console.error(`authentication failed with Error ${e}`)
    }
  }

  const onRouteClick = (item: MenuItem) => {
    // setChosenRoute(item.route)

    if (item.route.startsWith('/')) {
      pushWithPrefixIfInPool(item)
    } else {
      window.open(item.route)
    }
  }

  const pushWithPrefixIfInPool = (item: MenuItem) => {
    if (item.inPool) {
      const { root } = props.router.query
      const route = item.route === '/' ? '' : item.route
      Router.push(`/[root]${route}`, `/${root}${route}`, { shallow: true })
      return
    }
    Router.push(item.route, undefined, { shallow: true })
  }

  const { poolTitle, selectedRoute, toasts, menuItems, showTimedToast, auth, clear } = props
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
              <a
                title="Tinlake"
                style={{ display: 'block' }}
                onClick={() =>
                  showTimedToast({ title: 'Go to homepage', description: 'Now!', status: 'pending' }, 2000)
                }
              >
                <Image src={logoUrl} style={{ width: 130, verticalAlign: 'middle' }} />
              </a>
            </Link>
          </div>
          {poolTitle && <PoolSelector title={poolTitle} />}
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
              <>
                <WalletContainer ref={walletRef}>
                  <Web3Wallet
                    address={address}
                    providerName={providerName}
                    networkName={network}
                    onDisconnect={clear}
                    transactions={[]}
                    getAddressLink={getAddressLink}
                    style={{ padding: 0 }}
                  />
                </WalletContainer>

                {walletRef.current && (
                  <Drop
                    plain
                    responsive
                    style={{ padding: 6, marginTop: 20 }}
                    target={walletRef.current}
                    align={{ right: 'right', top: 'bottom' }}
                  >
                    <ToastContainer toasts={toasts} />
                  </Drop>
                )}
              </>
            )}
          </div>
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state, { showTimedToast, ensureAuthed, clear })(withRouter(Header))
