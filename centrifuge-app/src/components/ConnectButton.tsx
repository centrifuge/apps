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
import { useWeb3, wallets } from './Web3Provider'

type Props = ButtonProps & {
  label?: string
}

export const ConnectButton: React.FC<Props> = ({ label = 'Connect', ...rest }) => {
  const { accounts, isConnecting, connect, selectedAccount } = useWeb3()

  if (accounts) {
    return selectedAccount ? null : <WalletButton connectLabel="No account connected" disabled {...rest} />
  }

  const installed: Wallet[] = []
  const notInstalled: Wallet[] = []
  wallets.forEach((w) => {
    if (w.installed) {
      installed.push(w)
    } else {
      notInstalled.push(w)
    }
  })

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
                    icon={<Box as="img" src={wallet.logo.src} alt={wallet.logo.alt} width="iconMedium" />}
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
                    icon={<Box as="img" src={wallet.logo.src} alt={wallet.logo.alt} width="iconMedium" />}
                    iconRight={IconArrowUpRight}
                    onClick={() => {
                      state.close()
                    }}
                  />
                ))}
              </MenuItemGroup>
            )}
          </Menu>
        </div>
      )}
    />
  )
}
