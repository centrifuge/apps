import { ButtonProps, WalletButton } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress, useWallet } from '../WalletProvider'

type Props = ButtonProps & {
  label?: string
}

export function ConnectButton({ label = 'Connect', ...rest }: Props) {
  const { connectedType, showWallets } = useWallet()
  const address = useAddress()

  if (connectedType) {
    return address ? null : <WalletButton connectLabel="No account connected" disabled {...rest} />
  }

  return <WalletButton connectLabel={label} onClick={() => showWallets()} {...rest} />
}
