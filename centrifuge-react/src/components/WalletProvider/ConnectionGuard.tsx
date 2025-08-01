import { Button, Card, IconChevronDown, Menu, MenuItem, MenuItemGroup, Popover, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useWallet } from './WalletProvider'
import { Network } from './types'
import { useGetNetworkName } from './utils'

type Props = {
  networks: Network[]
  children: React.ReactNode
  body?: string
  variant?: 'card' | 'plain'
  showConnect?: boolean
}

export function ConnectionGuard({
  networks,
  children,
  variant = 'plain',
  showConnect,
  body = 'Unsupported network.',
  ...props
}: Props) {
  const {
    isEvmOnSubstrate,
    connectedType,
    connectedNetwork,
    evm: { selectedWallet },
    substrate: { evmChainId },
    showWallets,
    showNetworks,
    connect,
  } = useWallet()
  const getName = useGetNetworkName()

  if (!connectedNetwork) {
    if (showConnect) {
      const element = (
        <Stack gap={2} pb={3}>
          <Text variant="body3">{body}</Text>
          <Button onClick={() => showNetworks()}>Connect</Button>
        </Stack>
      )

      if (variant === 'card') return <Card p={2}>{element}</Card>
      return element
    }
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

  const element = (
    <Stack gap={2} pb={3} {...props}>
      <Text variant="body3">{body}</Text>
      {networks.length === 1 ? (
        <Button onClick={() => switchNetwork(networks[0])}>Switch to {name}</Button>
      ) : (
        <Popover
          renderTrigger={(props, ref, state) => (
            <Stack ref={ref} width="100%" alignItems="stretch">
              <Button iconRight={IconChevronDown} active={state.isOpen} {...props}>
                Switch network
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
  )

  if (connectedNetwork) {
    if (variant === 'card') return <Card p={2}>{element}</Card>
    return element
  }

  return null
}
