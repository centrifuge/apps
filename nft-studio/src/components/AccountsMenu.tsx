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
import { Dec } from '../utils/Decimal'
import { formatBalanceAbbreviated } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { truncate } from '../utils/web3'
import { ConnectButton } from './ConnectButton'
import { useWeb3 } from './Web3Provider'

export const AccountsMenu: React.FC = () => {
  const { selectedAccount, accounts } = useWeb3()
  return selectedAccount && accounts?.length ? (
    <Accounts />
  ) : accounts && !accounts.length ? (
    <WalletButton connectLabel="No accounts available" disabled />
  ) : (
    <ConnectButton />
  )
}

const PROXY_TYPE_LABELS = {
  Any: 'Any rights',
  Borrower: 'Borrower',
  Investor: 'Investor',
}

const Accounts: React.FC = () => {
  const { selectedAccount, accounts, selectAccount, proxy, selectProxy, proxies } = useWeb3()
  const balances = useBalances(useAddress())

  if (!selectedAccount || !accounts) return null
  return (
    <Popover
      renderTrigger={(props, ref, state) => (
        <Stack ref={ref} width="100%" alignItems="stretch">
          <WalletButton
            active={state.isOpen}
            address={proxy?.delegator ?? selectedAccount.address}
            alias={!proxy ? selectedAccount.meta.name : undefined}
            balance={
              balances
                ? formatBalanceAbbreviated(
                    Dec(balances?.native.balance.toString()).div(Dec(10).pow(balances?.native.decimals)),
                    'AIR'
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
                    acc.meta.name ? (
                      <Text
                        style={{
                          display: 'block',
                          maxWidth: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {acc.meta.name}
                      </Text>
                    ) : (
                      truncate(acc.address)
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
                          {acc.meta.name || truncate(acc.address)}
                        </Text>
                        <span>/</span>
                        <span>{truncate(p.delegator)}</span>
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
          </Menu>
        </div>
      )}
    />
  )
}

const IdenticonWrapper = styled.div`
  pointer-events: none;
`
