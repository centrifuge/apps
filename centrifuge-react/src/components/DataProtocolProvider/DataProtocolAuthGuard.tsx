import { Button, Card, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useWallet } from '../WalletProvider'
import { useDataProtocol } from './DataProtocolProvider'

type Props = {
  children?: React.ReactNode
  body?: string
  variant?: 'card' | 'plain'
}

export function DataProtocolAuthGuard({ children, variant = 'plain', body = 'Connect to the Data Protocol' }: Props) {
  const { connectedNetwork, showNetworks } = useWallet()
  const { initSessionAndAddKey, isAuthed, isLoading, isFetching } = useDataProtocol()
  console.log(
    'authgaurd, isAuthed isLoading isFetching',
    isAuthed,
    isLoading,

    isFetching
  )

  console.log('connectedNetwork', connectedNetwork)
  if (isAuthed) {
    return <>{children}</>
  }

  let element
  if (!connectedNetwork) {
    element = (
      <Stack gap={2} pb={3}>
        <Text variant="body3">{body}</Text>
        <Button onClick={() => showNetworks()}>Connect</Button>
      </Stack>
    )
  } else {
    element = (
      <Stack gap={2} pb={3}>
        <Text variant="body3">{body}</Text>
        <Button
          onClick={() => {
            initSessionAndAddKey(false)
          }}
          loading={isLoading}
          disabled={isFetching}
        >
          Connect to node and add keys or whatever
        </Button>
      </Stack>
    )
  }

  if (variant === 'card') return <Card p={2}>{element}</Card>
  return element
}
