import {
  Box,
  Button,
  IconCopy,
  Menu,
  MenuItem,
  MenuItemGroup,
  Popover,
  Stack,
  Text,
  WalletButton,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useBalances } from '../../hooks/useBalances'
import { useEnsName } from '../../hooks/useEnsName'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { useAddress, useWallet } from '../WalletProvider'
import { ConnectButton } from './ConnectButton'

export function WalletMenu() {
  const ctx = useWallet()
  const { connectedType } = ctx
  const accounts = connectedType && ctx[connectedType].accounts
  const address = useAddress()
  return address ? (
    <ConnectedMenu />
  ) : accounts && !accounts.length ? (
    <WalletButton connectLabel="No accounts available" disabled />
  ) : (
    <ConnectButton />
  )
}

function ConnectedMenu() {
  const address = useAddress()!
  const ctx = useWallet()
  const {
    connectedType,
    substrate,
    disconnect,
    showWallets,
    showAccounts,
    connectedNetwork,
    connectedNetworkName,
    substrate: { accounts, proxies },
  } = ctx
  const wallet = ctx[connectedType!]?.selectedWallet
  const ensName = useEnsName(connectedType === 'evm' ? address : undefined)
  const balances = useBalances(connectedType === 'substrate' ? address : undefined)

  return (
    <Popover
      renderTrigger={(props, ref, state) => (
        <Stack ref={ref} width="100%" alignItems="stretch">
          <WalletButton
            active={state.isOpen}
            address={address}
            alias={
              connectedType === 'evm'
                ? ensName ?? undefined
                : !substrate.proxy
                ? substrate.selectedAccount?.name
                : undefined
            }
            balance={
              balances ? formatBalanceAbbreviated(balances.native.balance, balances.native.currency.symbol) : undefined
            }
            iconStyle={connectedType === 'evm' ? 'ethereum' : 'polkadot'}
            {...props}
          />
        </Stack>
      )}
      renderContent={(props, ref, state) => (
        <div {...props} ref={ref}>
          <Menu>
            <MenuItemGroup>
              <Button icon={IconCopy} variant="tertiary" small onClick={() => copyToClipboard(address)}></Button>
              <Text>network: {connectedNetworkName}</Text>
              <MenuItem
                label="Switch wallet"
                icon={<Box minWidth="iconMedium" />}
                onClick={() => {
                  state.close()
                  showWallets(connectedNetwork, wallet)
                }}
              />
              {connectedType === 'substrate' && (accounts!.length > 1 || !!proxies?.[address]?.length) && (
                <MenuItem
                  label="Switch account"
                  icon={<Box minWidth="iconMedium" />}
                  onClick={() => {
                    state.close()
                    showAccounts()
                  }}
                />
              )}
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
