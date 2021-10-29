import { Box, Button, IconChevronDown, Text } from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import * as React from 'react'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { truncateAddress } from '../utils/web3'
import { useWeb3 } from './Web3Provider'

type Props = {
  title: string
}

export const NavBar: React.FC<Props> = ({ title }) => {
  const {
    selectedAccount,
    isConnecting,
    connect,
    accounts,
    // disconnect,
    // selectAccount,
  } = useWeb3()
  const isDesktop = useIsAboveBreakpoint('M')

  return (
    <Bar px={[1, 2, 3]} height={[64, 64, 72]}>
      <LogoWrapper>Logo</LogoWrapper>
      <TitleWrapper>
        <Text as="h1" fontSize={24} fontWeight={600} lineHeight={1}>
          {title}
        </Text>
      </TitleWrapper>
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
              icon={() => (
                <IdenticonWrapper>
                  <Identicon value={selectedAccount.address} size={24} theme="polkadot" />
                </IdenticonWrapper>
              )}
              iconRight={isDesktop ? IconChevronDown : undefined}
              variant="text"
              small
            >
              {isDesktop ? selectedAccount.meta.name || truncateAddress(selectedAccount.address) : null}
            </Button>
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
