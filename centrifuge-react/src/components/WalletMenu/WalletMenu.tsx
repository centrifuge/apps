import {
  Box,
  Button,
  Card,
  IconAnchor,
  IconButton,
  IconCopy,
  IconExternalLink,
  IconPower,
  IconSwitch,
  Menu,
  MenuItemGroup,
  Popover,
  Shelf,
  Stack,
  Text,
  WalletButton,
} from '@centrifuge/fabric'
import { getAddress } from 'ethers'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { useBalances } from '../../hooks/useBalances'
import { useEns } from '../../hooks/useEns'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { formatBalanceAbbreviated, truncateAddress } from '../../utils/formatting'
import { useCentrifugeUtils } from '../CentrifugeProvider'
import { useAddress, useGetExplorerUrl, useWallet } from '../WalletProvider'
import { Logo } from '../WalletProvider/SelectButton'
import { useNativeBalance, useNativeCurrency } from '../WalletProvider/evm/utils'
import { useNetworkIcon } from '../WalletProvider/utils'
import { ConnectButton } from './ConnectButton'

type WalletMenuProps = {
  menuItems?: React.ReactNode[]
}

export function WalletMenu({ menuItems }: WalletMenuProps) {
  const ctx = useWallet()
  const { connectedType } = ctx
  const accounts = connectedType && ctx[connectedType].accounts
  const address = useAddress()
  return address ? (
    <ConnectedMenu menuItems={menuItems} />
  ) : accounts && !accounts.length ? (
    <ConnectButton label="No accounts available" />
  ) : (
    <ConnectButton />
  )
}

function ConnectedMenu({ menuItems }: WalletMenuProps) {
  const address = useAddress()!
  const utils = useCentrifugeUtils()
  const ctx = useWallet()
  const {
    evm,
    connectedType,
    substrate,
    disconnect,
    showWallets,
    showAccounts,
    connectedNetwork,
    connectedNetworkName,
    isEvmOnSubstrate,
  } = ctx
  const formattedAddress = connectedType === 'evm' ? getAddress(evm.selectedAddress!) : utils.formatAddress(address)
  const wallet = ctx[connectedType!]?.selectedWallet
  const { name: ensName, avatar } = useEns(connectedType === 'evm' ? evm.selectedAddress! : undefined)
  const balances = useBalances(connectedType !== 'evm' || isEvmOnSubstrate ? address : undefined)
  const { data: evmBalance } = useNativeBalance()
  const evmCurrency = useNativeCurrency()
  const [balance, symbol] =
    connectedType === 'evm' && !isEvmOnSubstrate
      ? evmBalance && evmCurrency
        ? [evmBalance, evmCurrency.symbol]
        : []
      : balances
      ? [balances.native.balance, balances.native.currency.symbol]
      : []
  const explorer = useGetExplorerUrl(connectedNetwork ?? undefined)
  const subScanUrl = explorer.address(address, isEvmOnSubstrate ? 'centrifuge' : connectedNetwork ?? undefined)

  return (
    <Popover
      renderTrigger={(props, ref, state) => (
        <Stack ref={ref} width="100%" alignItems="stretch">
          <WalletButton
            active={state.isOpen}
            title={wallet?.title || ''}
            alias={
              connectedType === 'evm'
                ? ensName ?? undefined
                : !substrate.selectedProxies
                ? substrate.selectedAccount?.name
                : undefined
            }
            balance={balance ? formatBalanceAbbreviated(balance, symbol) : undefined}
            icon={
              avatar ? (
                <Box as="img" src={avatar} alt={ensName ?? ''} width="iconMedium" />
              ) : connectedType === 'evm' && !isEvmOnSubstrate ? (
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
        <Box {...props} ref={ref} width={420}>
          <Menu backgroundColor="white" padding={3}>
            <MenuItemGroup>
              <Stack py={2}>
                <Shelf gap={1} justifyContent="space-between">
                  <Shelf gap={1}>
                    <Text variant="heading2">{truncateAddress(formattedAddress)}</Text>
                  </Shelf>

                  <Shelf gap="2px">
                    <IconButton
                      size="24px"
                      onClick={() => copyToClipboard(formattedAddress)}
                      title="Copy address to clipboard"
                    >
                      <IconCopy />
                    </IconButton>
                    {subScanUrl && (
                      <IconAnchor
                        href={subScanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`View account on ${subScanUrl}`}
                      >
                        <IconExternalLink />
                      </IconAnchor>
                    )}
                  </Shelf>
                </Shelf>
              </Stack>
            </MenuItemGroup>
            <MenuItemGroup>
              <Stack gap={0} py={2}>
                <Text variant="body3" color="textSecondary">
                  Balance
                </Text>
                <Box display="flex" alignItems="center">
                  <Link to={`/portfolio?send=${balances?.native.currency.symbol}`} onClick={() => state.close()}>
                    <Text variant="heading1">{balance && formatBalanceAbbreviated(balance)}</Text>
                  </Link>
                  <Text style={{ marginLeft: 4 }} variant="heading1" fontWeight={400}>
                    {symbol}
                  </Text>
                </Box>
              </Stack>
            </MenuItemGroup>

            {!!menuItems?.length && menuItems.map((item, index) => <MenuItemGroup key={index}>{item}</MenuItemGroup>)}

            <Card padding={2}>
              <MenuItemGroup>
                <Box py={2} display="flex" justifyContent="space-between">
                  <Text variant="body2" color="textSecondary">
                    Network
                  </Text>
                  <Shelf gap={1}>
                    <Logo icon={useNetworkIcon(connectedNetwork!)} size={24} />
                    <Text variant="interactive1">{connectedNetworkName}</Text>
                  </Shelf>
                </Box>
              </MenuItemGroup>

              <MenuItemGroup>
                {wallet && (
                  <Box py={2} display="flex" justifyContent="space-between">
                    <Text variant="body2" color="textSecondary">
                      Wallet
                    </Text>
                    <Shelf gap={1}>
                      <Logo icon={wallet.logo.src} size={24} />
                      <Text variant="interactive1">{wallet.title}</Text>
                    </Shelf>
                  </Box>
                )}
              </MenuItemGroup>

              <Stack gap={2} mt={2}>
                <Button
                  icon={<IconSwitch />}
                  onClick={
                    connectedType === 'substrate' || (evm.accounts && evm.accounts.length > 1)
                      ? () => {
                          state.close()
                          showAccounts()
                        }
                      : () => {
                          state.close()
                          showWallets(connectedNetwork, wallet)
                        }
                  }
                  variant="secondary"
                  small
                >
                  {connectedType === 'substrate' || (evm.accounts && evm.accounts.length > 1)
                    ? 'Switch account'
                    : 'Switch wallet'}
                </Button>
                <Button
                  icon={<IconPower />}
                  onClick={() => {
                    state.close()
                    disconnect()
                  }}
                  variant="inverted"
                  small
                >
                  Disconnect
                </Button>
              </Stack>
            </Card>
          </Menu>
        </Box>
      )}
    />
  )
}
