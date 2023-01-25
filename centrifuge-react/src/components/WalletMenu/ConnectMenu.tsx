import {
  Box,
  ButtonProps,
  IconArrowUpRight,
  Menu,
  MenuItem,
  MenuItemGroup,
  Popover,
  Stack,
  Text,
  WalletButton,
} from '@centrifuge/fabric'
import { Wallet } from '@subwallet/wallet-connect/types'
import * as React from 'react'
import { EvmConnectorMeta } from '../../utils/evmConnectors'
import { useEvmWallet, useWallet, wallets } from '../WalletProvider'

type Props = ButtonProps & {
  label?: string
}

export function ConnectMenu({ label = 'Connect', ...rest }: Props) {
  const { accounts, isConnecting, connect, selectedAccount } = useWallet()
  const {
    connectors,
    connect: connectEvm,
    selectedAccount: selectedEvmAccount,
    selectedConnector,
    activating,
    chainId,
    accounts: evmAccounts,
  } = useEvmWallet()

  if (accounts) {
    return selectedAccount ? null : <WalletButton connectLabel="No account connected" disabled {...rest} />
  }

  const installed: Wallet[] = []
  const notInstalled: Wallet[] = []
  wallets.forEach((wallet) => {
    if (wallet.installed) {
      installed.push(wallet)
    } else {
      notInstalled.push(wallet)
    }
  })

  const evmInstalled: EvmConnectorMeta[] = []
  const evmNotInstalled: EvmConnectorMeta[] = []
  connectors.forEach((wallet) => {
    if (wallet.isInstalled()) {
      evmInstalled.push(wallet)
    } else {
      evmNotInstalled.push(wallet)
    }
  })

  console.log(
    'selectedEvmAccount',
    selectedEvmAccount,
    'selectedConnector',
    selectedConnector,
    'activating',
    activating,
    'chainId',
    chainId,
    'evmAccounts',
    evmAccounts
  )

  return (
    <Popover
      renderTrigger={(props, ref, state) => (
        <Stack ref={ref} width="100%" alignItems="stretch">
          <WalletButton active={state.isOpen} loading={isConnecting} connectLabel={label} {...props} />
        </Stack>
      )}
      renderContent={(props, ref, state) => (
        <div {...props} ref={ref}>
          <Menu width={300}>
            <Box px={2} py={1}>
              <Text variant="body3">Select or install a Polkadot-compatible wallet to connect the app.</Text>
            </Box>
            {installed.length > 0 && (
              <MenuItemGroup>
                {installed.map((wallet) => (
                  <MenuItem
                    target="_blank"
                    rel="noopener noreferrer"
                    key={wallet.extensionName}
                    label={wallet.title}
                    icon={<Box as="img" src={wallet.logo.src} alt={wallet.logo.alt ?? ''} width="iconMedium" />}
                    onClick={() => {
                      state.close()
                      connect(wallet.extensionName)
                    }}
                  />
                ))}
              </MenuItemGroup>
            )}
            {notInstalled.length > 0 && (
              <MenuItemGroup>
                {notInstalled.map((wallet) => (
                  <MenuItem
                    as="a"
                    href={wallet.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={wallet.extensionName}
                    label={wallet.title}
                    icon={<Box as="img" src={wallet.logo.src} alt={wallet.logo.alt ?? ''} width="iconMedium" />}
                    iconRight={IconArrowUpRight}
                    onClick={() => {
                      state.close()
                    }}
                  />
                ))}
              </MenuItemGroup>
            )}
            <MenuItemGroup>
              {evmInstalled.map((wallet) => (
                <MenuItem
                  target="_blank"
                  rel="noopener noreferrer"
                  key={wallet.name}
                  label={wallet.name}
                  icon={<Box as="img" src={wallet.logo.src} alt={wallet.logo.alt ?? ''} width="iconMedium" />}
                  onClick={() => {
                    state.close()
                    connectEvm(wallet.connector)
                  }}
                />
              ))}
            </MenuItemGroup>
          </Menu>
        </div>
      )}
    />
  )
}
