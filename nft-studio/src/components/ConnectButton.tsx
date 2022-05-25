import {
  Box,
  ButtonProps,
  Dialog,
  Grid,
  IconArrowUpRight,
  IconInfo,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Text,
  WalletButton,
} from '@centrifuge/fabric'
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

  const installedWallets = wallets.filter((w) => w.installed)

  if (installedWallets.length === 1) {
    return (
      <WalletButton
        connectLabel={label}
        onClick={() => connect(installedWallets[0].extensionName)}
        loading={isConnecting}
        {...rest}
      />
    )
  } else if (installedWallets.length > 1) {
    return <MultipleWalletsButton label={label} {...rest} />
  }
  return <NoWalletButton label={label} {...rest} />
}

const MultipleWalletsButton: React.FC<Props> = ({ label, ...rest }) => {
  const { connect } = useWeb3()
  const [open, setOpen] = React.useState(false)

  const installedWallets = wallets.filter((w) => w.installed)
  return (
    <>
      <WalletButton connectLabel={label} onClick={() => setOpen(true)} {...rest} />
      <Dialog
        isOpen={open}
        onClose={() => {
          setOpen(false)
        }}
        icon={IconInfo}
        title="Select wallet"
      >
        <Stack gap={1} pl={40} pr={3}>
          <Text variant="body1">Select a wallet to connect to the app:</Text>
          <Grid columns={installedWallets.length} equalColumns>
            {installedWallets.map((wallet) => (
              <Stack borderRadius="card" overflow="hidden" key={wallet.extensionName}>
                <MenuItem
                  icon={<Box as="img" src={wallet.logo.src} alt={wallet.logo.alt} width="iconMedium" />}
                  label={wallet.title}
                  onClick={() => {
                    connect(wallet.extensionName)
                  }}
                />
              </Stack>
            ))}
          </Grid>
        </Stack>
      </Dialog>
    </>
  )
}

const NoWalletButton: React.FC<Props> = ({ label }) => {
  return (
    <Popover
      renderTrigger={(props, ref, state) => (
        <Stack ref={ref} width="100%" alignItems="stretch">
          <WalletButton active={state.isOpen} connectLabel={label} {...props} />
        </Stack>
      )}
      renderContent={(props, ref, state) => (
        <div {...props} ref={ref}>
          <Menu width={300}>
            <Stack py={1}>
              <Box px={2} py={1}>
                <Text variant="body3">
                  Install a Polkadot-compatible wallet to connect to the app. The supported wallets are:
                </Text>
              </Box>
              {wallets.map((wallet) => (
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
            </Stack>
          </Menu>
        </div>
      )}
    />
  )
}
