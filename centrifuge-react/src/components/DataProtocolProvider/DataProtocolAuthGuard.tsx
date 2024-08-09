import { Button, Card, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useCentrifugeQuery } from '../../hooks/useCentrifugeQuery'
import { useCentrifugeTransaction } from '../../hooks/useCentrifugeTransaction'
import { useAddress, useWallet } from '../WalletProvider'
import { useDataProtocol } from './DataProtocolProvider'

type Props = {
  children: React.ReactNode
  body?: string
  variant?: 'card' | 'plain'
}

export function DataProtocolAuthGuard({ children, variant = 'plain', body = 'Connect to the Data Protocol' }: Props) {
  const { connectedNetwork, showNetworks } = useWallet()
  const { session, initSession } = useDataProtocol()
  const address = useAddress('substrate')
  const [keys] = useCentrifugeQuery(['keys', address], (cent) => cent.dataProtocol.getKeys([address!]), {
    enabled: !!address,
  })
  const { execute, isLoading, lastCreatedTransaction } = useCentrifugeTransaction(
    'Add key',
    (cent) => cent.dataProtocol.addKey
  )
  console.log('keys', keys)

  const publicKey = session?.publicKeyHex

  console.log('session', session, publicKey, keys)

  if (keys?.includes(publicKey ?? '')) {
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
          onClick={async () => {
            const sesh = session ?? (await initSession())
            const { publicKeyHex } = sesh
            console.log('sesh', sesh, publicKeyHex)
            if (keys!.includes(publicKeyHex)) return
            execute([publicKeyHex])
          }}
          loading={isLoading}
          disabled={!keys}
        >
          Connect to node and add keys or whatever
        </Button>
      </Stack>
    )
  }

  if (variant === 'card') return <Card p={2}>{element}</Card>
  return element
}
