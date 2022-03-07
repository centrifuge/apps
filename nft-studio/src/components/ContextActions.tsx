import { Box, Button, IconCheck, IconChevronDown, Menu, MenuItem, Shelf } from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/keyring'
import Identicon from '@polkadot/react-identicon'
import * as React from 'react'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { truncateAddress } from '../utils/web3'
import { ConnectButton } from './ConnectButton'
import { Popover } from './Popover'
import { useWeb3 } from './Web3Provider'

type Props = {
  actions?: React.ReactNode
  walletShown?: boolean
}

export const ContextActions: React.FC<Props> = ({ actions, walletShown = true }) => {
  const { selectedAccount, accounts } = useWeb3()

  return (
    <Shelf gap={5}>
      {actions && <Shelf gap={3}>{actions}</Shelf>}
      {walletShown &&
        (selectedAccount && accounts?.length ? (
          <AccountsMenu />
        ) : accounts && !accounts.length ? (
          <Button disabled variant="text">
            No accounts available
          </Button>
        ) : (
          <ConnectButton />
        ))}
    </Shelf>
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
                sublabel={acc.meta.name ? encodeAddress(acc.address, 2) : undefined}
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
