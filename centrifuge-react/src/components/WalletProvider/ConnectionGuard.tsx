import { Button, Card, IconChevronDown, Menu, MenuItem, MenuItemGroup, Popover, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Network } from './types'
import { useGetNetworkName } from './utils'
import { useWallet } from './WalletProvider'

type Props = {
  networks: Network[]
  children: React.ReactNode
  body?: string
}

export function ConnectionGuard({ networks, children, body = 'Unsupported network.' }: Props) {
  const {
    isEvmOnSubstrate,
    connectedType,
    connectedNetwork,
    evm: { selectedWallet },
    substrate: { evmChainId },
    showWallets,
    connect,
  } = useWallet()
  const getName = useGetNetworkName()

  if (!connectedNetwork) {
    return <>{children}</>
  }

  if (
    connectedNetwork &&
    (networks.includes(connectedNetwork) || (networks.includes('centrifuge') && isEvmOnSubstrate))
  )
    return <>{children}</>

  function switchNetwork(target: Network) {
    if (connectedType === 'evm' && selectedWallet) {
      connect(selectedWallet, target === 'centrifuge' ? evmChainId : target)
    } else {
      showWallets(target)
    }
  }

  const name = getName(networks[0])

  if (connectedNetwork) {
    return (
      <Card p={2}>
        <Stack gap={2} pb={3}>
          <Text variant="body3">{body}</Text>
          {networks.length === 1 ? (
            <Button onClick={() => switchNetwork(networks[0])}>Switch to {name}</Button>
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
                          label={getName(network)}
                          onClick={() => {
                            state.close()
                            switchNetwork(network)
                          }}
                          key={network}
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
