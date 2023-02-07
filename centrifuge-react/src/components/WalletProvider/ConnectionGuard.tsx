import { Button, Card, IconChevronDown, Menu, MenuItem, MenuItemGroup, Popover, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Network } from './types'
import { useWallet } from './WalletProvider'

type Props = {
  networks: Network[]
  children: React.ReactNode
  body?: string
}

export function ConnectionGuard({ networks, children, body = 'Unsupported network.' }: Props) {
  const {
    connectedType,
    connectedNetwork,
    evm: { chains, selectedWallet },
    showWallets,
    connect,
  } = useWallet()

  if (connectedNetwork && networks.includes(connectedNetwork)) return <>{children}</>

  function switchNetwork(target: Network) {
    if (connectedType === 'evm' && selectedWallet && typeof target === 'number') {
      connect(selectedWallet, target)
    } else {
      showWallets(target)
    }
  }

  if (connectedNetwork) {
    return (
      <Card p={2}>
        <Stack gap={2} pb={3}>
          <Text variant="body3">{body}</Text>
          {networks.length === 1 ? (
            <Button onClick={() => switchNetwork(networks[0])}>
              Switch to {networks[0] === 'centrifuge' ? 'Centrifuge' : chains[networks[0]]?.name}
            </Button>
          ) : (
            <Popover
              renderTrigger={(props, ref, state) => (
                <Stack ref={ref} width="100%" alignItems="stretch">
                  <Button iconRight={IconChevronDown} active={state.isOpen} {...props}>
                    Switch Network
                  </Button>
                </Stack>
              )}
              renderContent={(props, ref, state) => (
                <div {...props} ref={ref}>
                  <Menu>
                    <MenuItemGroup>
                      {networks.map((network) => (
                        <MenuItem
                          label={network === 'centrifuge' ? 'Centrifuge' : chains[network]?.name}
                          onClick={() => {
                            state.close()
                            switchNetwork(network)
                          }}
                        />
                      ))}
                    </MenuItemGroup>
                  </Menu>
                </div>
              )}
            />
          )}
        </Stack>
      </Card>
    )
  }

  return null
}
