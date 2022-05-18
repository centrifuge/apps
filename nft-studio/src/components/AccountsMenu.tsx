import {
  Box,
  Button,
  IconCheck,
  IconChevronDown,
  Menu,
  MenuItem,
  Popover,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/keyring'
import Identicon from '@polkadot/react-identicon'
import * as React from 'react'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { truncateAddress } from '../utils/web3'
import { ConnectButton } from './ConnectButton'
import { useDebugFlags } from './DebugFlags'
import { useWeb3 } from './Web3Provider'

export const AccountsMenu: React.FC = () => {
  const { selectedAccount, accounts } = useWeb3()
  return selectedAccount && accounts?.length ? (
    <Accounts />
  ) : accounts && !accounts.length ? (
    <Button disabled variant="tertiary">
      No accounts available
    </Button>
  ) : (
    <ConnectButton />
  )
}

const Accounts: React.FC = () => {
  const { selectedAccount, accounts, selectAccount, proxy, selectProxy, proxies } = useWeb3()
  const { showProxies } = useDebugFlags()

  const isDesktop = useIsAboveBreakpoint('M')
  if (!selectedAccount || !accounts) return null
  return (
    <Stack alignItems="center">
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
              variant="tertiary"
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
      {showProxies && proxies && (
        <Shelf gap={1}>
          {proxies.length ? (
            <>
              <Text variant="body2">Proxy:</Text>
              <select value={proxy?.delegator ?? ''} onChange={(e) => selectProxy(e.target.value)}>
                <option value="">No Proxy</option>
                {proxies.map((p) => (
                  <option value={p.delegator} key={p.delegator}>
                    {truncateAddress(p.delegator)} ({p.types.join(', ')})
                  </option>
                ))}
              </select>{' '}
            </>
          ) : (
            <Text variant="body2" color="textSecondary">
              No proxies
            </Text>
          )}
        </Shelf>
      )}
    </Stack>
  )
}

const IdenticonWrapper = styled.div`
  pointer-events: none;
`
