import { Button, ButtonProps } from '@centrifuge/fabric'
import * as React from 'react'
import { useWeb3 } from './Web3Provider'

type Props = ButtonProps & {
  label?: string
}

export const ConnectButton: React.FC<Props> = ({ label = 'Connect', ...rest }) => {
  const { accounts, isConnecting, connect, selectedAccount } = useWeb3()
  return accounts ? (
    selectedAccount ? null : (
      <Button disabled variant="text">
        No account connected
      </Button>
    )
  ) : (
    <Button onClick={() => connect()} loading={isConnecting} {...rest}>
      {label}
    </Button>
  )
}
