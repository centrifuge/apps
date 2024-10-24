import {
  Box,
  IconAnchor,
  IconButton,
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
import { getAddress } from 'ethers'
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
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
            address={address}
            displayAddress={formattedAddress}
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
        <Box {...props} ref={ref} width={220}>
          <Menu backgroundColor="white">
            <MenuItemGroup>
              {!isEvmOnSubstrate && (
                <Stack pt={2} pb={0} px={2} gap="4px" alignItems="center">
                  <Shelf gap={1} justifyContent="space-between">
                    <Shelf gap={1}>
                      <Text variant="interactive1" fontWeight={400}>
                        {truncateAddress(formattedAddress)}
                      </Text>
                    </Shelf>

                    <Shelf gap="2px">
                      <IconButton onClick={() => copyToClipboard(formattedAddress)} title="Copy address to clipboard">
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
              )}

              <Stack gap={0} mt={1} px={2} pb={1}>
                <Text variant="label2" textAlign="center" color="textPrimary">
                  Balance
                </Text>
                <Link to={`/portfolio?send=${balances?.native.currency.symbol}`} onClick={() => state.close()}>
                  <BalanceLink fontSize={22} fontWeight={500} textAlign="center">
                    {balance && formatBalanceAbbreviated(balance, symbol)}
                  </BalanceLink>
                </Link>
              </Stack>
            </MenuItemGroup>

            {!!menuItems?.length && menuItems.map((item, index) => <MenuItemGroup key={index}>{item}</MenuItemGroup>)}

            <MenuItemGroup>
              <Box px={2} py={1}>
                <Text variant="label2" color="textPrimary">
                  Network
                </Text>
                <Shelf gap={1}>
                  <Logo icon={useNetworkIcon(connectedNetwork!)} size="iconSmall" />
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
                    <Logo icon={wallet.logo.src} size="iconSmall" />
                    <Text variant="interactive1">{wallet.title}</Text>
                  </Shelf>
                </Box>
              )}
              {connectedType === 'substrate' || (evm.accounts && evm.accounts.length > 1) ? (
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

const BalanceLink = styled(Text)`
  &:hover {
    color: ${({ theme }) => theme.colors.textInteractive};
  }
`
