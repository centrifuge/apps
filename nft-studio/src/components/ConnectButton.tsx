import { ButtonProps, WalletButton } from '@centrifuge/fabric'
import * as React from 'react'
import { useWeb3 } from './Web3Provider'

type Props = ButtonProps & {
  label?: string
}

export const ConnectButton: React.FC<Props> = ({ label = 'Connect', ...rest }) => {
  const { accounts, isConnecting, connect, selectedAccount } = useWeb3()
  return accounts ? (
    selectedAccount ? null : (
      <WalletButton connectLabel="No account connected" disabled {...rest} />
    )
  ) : (
    <WalletButton connectLabel={label} onClick={() => connect()} loading={isConnecting} {...rest} />
  )
}
