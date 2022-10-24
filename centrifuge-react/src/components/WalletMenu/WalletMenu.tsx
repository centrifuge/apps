import {
  Box,
  IconCheck,
  Menu,
  MenuItem,
  MenuItemGroup,
  Popover,
  Shelf,
  Stack,
  Text,
  WalletButton,
} from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import * as React from 'react'
import styled from 'styled-components'
import { useBalances } from '../../hooks/useBalances'
import { Dec } from '../../utils/Decimal'
import { formatBalanceAbbreviated, truncateAddress } from '../../utils/formatting'
import { useAddress, useWallet } from '../WalletProvider'
import { ConnectMenu } from './ConnectMenu'

export function WalletMenu() {
  const { selectedAccount, accounts } = useWallet()
  return selectedAccount && accounts?.length ? (
    <Accounts />
  ) : accounts && !accounts.length ? (
    <WalletButton connectLabel="No accounts available" disabled />
  ) : (
    <ConnectMenu />
  )
}

const PROXY_TYPE_LABELS = {
  Any: 'Any rights',
  Borrow: 'Borrower',
  Invest: 'Investor',
  Price: 'Pricing',
}

function Accounts() {
  const { selectedAccount, accounts, selectAccount, proxy, selectProxy, proxies, disconnect } = useWallet()
  const address = useAddress()
  const balances = useBalances(address)

  if (!selectedAccount || !accounts) return null
  return (
    <Popover
      renderTrigger={(props, ref, state) => (
        <Stack ref={ref} width="100%" alignItems="stretch">
          <WalletButton
            active={state.isOpen}
            address={address}
            alias={!proxy ? selectedAccount.name : undefined}
            balance={
              balances
                ? formatBalanceAbbreviated(
                    Dec(balances?.native.balance.toString()).div(Dec(10).pow(balances?.native.decimals)),
                    balances?.native.symbol
                  )
                : undefined
            }
            {...props}
          />
        </Stack>
      )}
      renderContent={(props, ref, state) => (
        <div {...props} ref={ref}>
          <Menu>
            {accounts.map((acc) => (
              <MenuItemGroup key={acc.address}>
                <MenuItem
                  label={
                    acc.name ? (
                      <Text
                        style={{
                          display: 'block',
                          maxWidth: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {acc.name}
                      </Text>
                    ) : (
                      truncateAddress(acc.address)
                    )
                  }
                  sublabel={acc.address}
                  icon={
                    <IdenticonWrapper>
                      <Identicon value={acc.address} size={24} theme="polkadot" />
                    </IdenticonWrapper>
                  }
                  iconRight={selectedAccount.address === acc.address && !proxy ? IconCheck : <Box width={16} />}
                  onClick={() => {
                    state.close()
                    selectAccount(acc.address)
                  }}
                />
                {proxies?.[acc.address]?.map((p) => (
                  <MenuItem
                    label={
                      <Shelf alignItems="baseline" gap="5px">
                        <Text
                          variant="interactive2"
                          color="inherit"
                          style={{
                            maxWidth: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {acc.name || truncateAddress(acc.address)}
                        </Text>
                        <span>/</span>
                        <span>{truncateAddress(p.delegator)}</span>
                        <Text variant="label2">
                          {p.types.map((type) => (PROXY_TYPE_LABELS as any)[type] ?? type).join(' / ')}
                        </Text>
                      </Shelf>
                    }
                    sublabel={p.delegator}
                    key={p.delegator}
                    icon={
                      <IdenticonWrapper>
                        <Identicon value={p.delegator} size={24} theme="polkadot" />
                      </IdenticonWrapper>
                    }
                    iconRight={
                      selectedAccount.address === acc.address && proxy?.delegator === p.delegator ? (
                        IconCheck
                      ) : (
                        <Box width={16} />
                      )
                    }
                    onClick={() => {
                      state.close()
                      if (acc.address !== selectedAccount.address) selectAccount(acc.address)
                      selectProxy(p.delegator)
                    }}
                  />
                ))}
              </MenuItemGroup>
            ))}
            <MenuItemGroup>
              <MenuItem
                label="Disconnect"
                icon={<Box minWidth="iconMedium" />}
                onClick={() => {
                  state.close()
                  disconnect()
                }}
              />
            </MenuItemGroup>
          </Menu>
        </div>
      )}
    />
  )
}

const IdenticonWrapper = styled.div`
  pointer-events: none;
`
