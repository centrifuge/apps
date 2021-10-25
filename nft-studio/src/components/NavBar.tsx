import { Box, Button, IconChevronDown, Shelf } from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import * as React from 'react'
import styled from 'styled-components'
import { truncateAddress } from '../utils/web3'
import { RouterLinkButton } from './RouterLinkButton'
import { useWeb3Context } from './Web3Provider'

export const NavBar: React.FC = () => {
  const {
    selectedAccount,
    isConnecting,
    connect,
    accounts,
    // disconnect,
    // selectAccount,
  } = useWeb3Context()

  return (
    <Bar px={[2, 3]} bg="backgroundPrimary">
      <LogoWrapper>Logo</LogoWrapper>
      <NavWrapper>
        <Shelf>
          <RouterLinkButton to="/" variant="text" showActive exact small>
            Home
          </RouterLinkButton>{' '}
          <RouterLinkButton to="/collection/1" variant="text" showActive small>
            Collection 1
          </RouterLinkButton>
        </Shelf>
      </NavWrapper>
      <AccountWrapper>
        {selectedAccount && accounts?.length ? (
          <>
            {/* <div title={encodeAddress(selectedAccount.address, 2)}>
              <select onChange={(e) => selectAccount(e.target.value)} value={selectedAccount.address}>
                {accounts.map((acc) => (
                  <option value={acc.address} key={acc.address}>
                    {acc.meta.name || truncateAddress(acc.address)}
                  </option>
                ))}
              </select>
            </div> */}
            <Button
              icon={
                <IdenticonWrapper>
                  <Identicon value={selectedAccount.address} size={24} theme="polkadot" />
                </IdenticonWrapper>
              }
              iconRight={IconChevronDown}
              variant="outlined"
            >
              {selectedAccount.meta.name || truncateAddress(selectedAccount.address)}
            </Button>
          </>
        ) : accounts && !accounts.length ? (
          <Button disabled variant="outlined">
            No accounts available
          </Button>
        ) : (
          <Button onClick={connect} loading={isConnecting}>
            Connect
          </Button>
        )}
      </AccountWrapper>
    </Bar>
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

const NavWrapper = styled.nav`
  flex-grow: 1;
`

const AccountWrapper = styled.div``

const Bar = styled(Box)`
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 6;
  box-shadow: 0 0 4px 0px #00000075;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => `calc(${theme.space[3]} * 1px)`};

  @media (min-width: 1500px) {
    display: grid;
    grid-template-columns: ${({ theme }) => `1fr calc(${theme.sizes.container} * 1px) 1fr`};

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
