import { Box, Button, IconCheck, IconChevronDown, Menu, MenuItem, Text } from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { truncateAddress } from '../utils/web3'
import { LogoAltair, LogoAltairText } from './LogoAltair'
import { Popover } from './Popover'
import { useWeb3 } from './Web3Provider'

type Props = {
  title: string
}

export const NavBar: React.FC<Props> = ({ title }) => {
  const { selectedAccount, isConnecting, connect, accounts } = useWeb3()
  const {
    sizes: { navBarHeight, navBarHeightMobile },
  } = useTheme()
  const isDesktop = useIsAboveBreakpoint('M')

  return (
    <Bar px={[1, 2, 3]} height={[navBarHeightMobile, navBarHeightMobile, navBarHeight]}>
      <LogoWrapper>
        <Link to="/">
          <Box height={[32, 40, 48]} color="textPrimary">
            {isDesktop ? <LogoAltairText style={{ height: '100%' }} /> : <LogoAltair style={{ height: '100%' }} />}
          </Box>
        </Link>
      </LogoWrapper>
      <TitleWrapper>
        <Text as="h1" fontSize={24} fontWeight={600} lineHeight={1}>
          {title}
        </Text>
      </TitleWrapper>
      <AccountWrapper>
        {selectedAccount && accounts?.length ? (
          <>
            <AccountsMenu />
          </>
        ) : accounts && !accounts.length ? (
          <Button disabled variant="text">
            No accounts available
          </Button>
        ) : (
          <Button onClick={() => connect()} loading={isConnecting}>
            Connect
          </Button>
        )}
      </AccountWrapper>
    </Bar>
  )
}

const AccountsMenu: React.FC = () => {
  const { selectedAccount, accounts, selectAccount } = useWeb3()
  const isDesktop = useIsAboveBreakpoint('M')
  if (!selectedAccount || !accounts) return null
  return (
    <Popover
      renderTrigger={(props, ref, state) => (
        <div ref={ref}>
          <Button
            icon={
              <IdenticonWrapper>
                <Identicon value={selectedAccount.address} size={24} theme="polkadot" />
              </IdenticonWrapper>
            }
            active={state.isOpen}
            iconRight={isDesktop ? IconChevronDown : undefined}
            variant="text"
            small
            {...props}
          >
            {isDesktop ? selectedAccount.meta.name || truncateAddress(selectedAccount.address) : null}
          </Button>
        </div>
      )}
      renderContent={(props, ref, state) => (
        <div {...props} ref={ref}>
          <Menu>
            {accounts.map((acc) => (
              <MenuItem
                label={acc.meta.name || truncateAddress(acc.address)}
                sublabel={acc.meta.name ? acc.address : undefined}
                icon={
                  <IdenticonWrapper>
                    <Identicon value={acc.address} size={24} theme="polkadot" />
                  </IdenticonWrapper>
                }
                iconRight={selectedAccount.address === acc.address ? IconCheck : <Box width={16} />}
                onClick={() => {
                  state.close()
                  selectAccount(acc.address)
                }}
                key={acc.address}
              />
            ))}
          </Menu>
        </div>
      )}
    />
  )
}

const IdenticonWrapper = styled.div`
  pointer-events: none;
`

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 32px;
`

const TitleWrapper = styled.nav`
  flex-grow: 1;
`

const AccountWrapper = styled.div``

const Bar = styled(Box)`
  display: grid;
  align-items: center;
  grid-template-columns: 100%;
  grid-template-rows: auto;
  grid-template-areas: 'unit';
  position: relative;

  ${LogoWrapper} {
    grid-area: unit;
    justify-self: start;
  }

  ${TitleWrapper} {
    grid-area: unit;
    justify-self: center;
  }

  ${AccountWrapper} {
    grid-area: unit;
    justify-self: end;
  }
`
