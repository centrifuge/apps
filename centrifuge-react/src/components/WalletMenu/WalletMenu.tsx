import {
  Box,
  IconCopy,
  IconExternalLink,
  IconPower,
  IconSwitch,
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
import { useBalances } from '../../hooks/useBalances'
import { useEns } from '../../hooks/useEns'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { formatBalanceAbbreviated, truncateAddress } from '../../utils/formatting'
import { useAddress, useGetExplorerUrl, useWallet } from '../WalletProvider'
import { useNativeBalance, useNativeCurrency } from '../WalletProvider/evm/utils'
import { Logo } from '../WalletProvider/SelectButton'
import { useNeworkIcon } from '../WalletProvider/UserSelection'
import { getWalletIcon, getWalletLabel } from '../WalletProvider/WalletDialog'
import { ActionAnchor, ActionButton } from './Actions'
import { ConnectButton } from './ConnectButton'

export function WalletMenu() {
  const ctx = useWallet()
  const { connectedType, pendingConnect } = ctx
  const accounts = connectedType && ctx[connectedType].accounts
  const address = useAddress()
  return address ? (
    <ConnectedMenu />
  ) : accounts && !accounts.length ? (
    <WalletButton connectLabel="No accounts available" disabled />
  ) : (
    <ConnectButton loading={pendingConnect.isConnecting} />
  )
}

function ConnectedMenu() {
  const address = useAddress()!
  const ctx = useWallet()
  const { connectedType, substrate, disconnect, showWallets, showAccounts, connectedNetwork, connectedNetworkName } =
    ctx
  const wallet = ctx[connectedType!]?.selectedWallet
  const { name: ensName, avatar } = useEns(connectedType === 'evm' ? address : undefined)
  const balances = useBalances(connectedType === 'substrate' ? address : undefined)
  const { data: evmBalance } = useNativeBalance()
  const evmCurrency = useNativeCurrency()
  const [balance, symbol] =
    connectedType === 'evm'
      ? evmBalance && evmCurrency
        ? [evmBalance, evmCurrency.symbol]
        : []
      : balances
      ? [balances.native.balance, balances.native.currency.symbol]
      : []
  const explorer = useGetExplorerUrl(connectedNetwork ?? undefined)
  const subScanUrl = explorer.address(address, connectedNetwork ?? undefined)

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
            balance={balance ? formatBalanceAbbreviated(balance, symbol) : undefined}
            icon={
              avatar ? (
                <Box as="img" src={avatar} alt={ensName ?? ''} width="iconMedium" />
              ) : connectedType === 'evm' ? (
                'ethereum'
              ) : (
                'polkadot'
              )
            }
            {...props}
          />
        </Stack>
      )}
      renderContent={(props, ref, state) => (
        <Box {...props} ref={ref} width={220}>
          <Menu>
            <MenuItemGroup>
              <Shelf px={2} pt={1} gap={1} alignItems="center" justifyContent="space-between">
                <Shelf alignItems="center" gap={1}>
                  <Box style={{ pointerEvents: 'none' }}>
                    <Identicon value={address} size={17} theme="polkadot" />
                  </Box>
                  <Text variant="interactive1" fontWeight={400}>
                    {truncateAddress(address)}
                  </Text>
                </Shelf>

                <Shelf alignItems="center" gap="2px">
                  <ActionButton onClick={() => copyToClipboard(address)} title="Copy address to clipboard">
                    <IconCopy />
                  </ActionButton>
                  {subScanUrl && (
                    <ActionAnchor
                      href={subScanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`View account on ${subScanUrl}`}
                    >
                      <IconExternalLink />
                    </ActionAnchor>
                  )}
                </Shelf>
              </Shelf>

              <Stack gap={0} mt={1} px={2} pb={1}>
                <Text variant="label2" textAlign="center" color="textPrimary">
                  Balance
                </Text>
                <Text fontSize={22} fontWeight={500} textAlign="center">
                  {balance && formatBalanceAbbreviated(balance, symbol)}
                </Text>
              </Stack>
            </MenuItemGroup>

            <MenuItemGroup>
              <Box px={2} py={1}>
                <Text variant="label2" color="textPrimary">
                  Network
                </Text>
                <Shelf gap={1}>
                  <Logo icon={useNeworkIcon(connectedNetwork!)} size="iconSmall" />
                  <Text variant="interactive1">{connectedNetworkName}</Text>
                </Shelf>
              </Box>
            </MenuItemGroup>

            <MenuItemGroup>
              {wallet && (
                <Box px={2} py={1}>
                  <Text variant="label2" color="textPrimary">
                    Wallet
                  </Text>
                  <Shelf gap={1}>
                    <Logo icon={getWalletIcon(wallet)} size="iconSmall" />
                    <Text variant="interactive1">{getWalletLabel(wallet)}</Text>
                  </Shelf>
                </Box>
              )}
              {connectedType === 'substrate' ? (
                <MenuItem
                  label="Switch account"
                  icon={<IconSwitch size="iconSmall" />}
                  minHeight={0}
                  onClick={() => {
                    state.close()
                    showAccounts()
                  }}
                />
              ) : (
                <MenuItem
                  label="Switch wallet"
                  icon={<IconSwitch size="iconSmall" />}
                  minHeight={0}
                  onClick={() => {
                    state.close()
                    showWallets(connectedNetwork, wallet)
                  }}
                />
              )}
            </MenuItemGroup>

            <MenuItemGroup>
              <MenuItem
                label="Disconnect"
                icon={<IconPower size="iconSmall" />}
                minHeight={0}
                onClick={() => {
                  state.close()
                  disconnect()
                }}
              />
            </MenuItemGroup>
          </Menu>
        </Box>
      )}
    />
  )
}
