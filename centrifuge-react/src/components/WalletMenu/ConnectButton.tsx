import { WalletButton, WalletButtonProps } from '@centrifuge/fabric'
import * as React from 'react'
import { useWallet } from '../WalletProvider'

type Props = WalletButtonProps & {
  label?: string
}

export function ConnectButton({ label = 'Connect', ...rest }: Props) {
  const { showNetworks, pendingConnect } = useWallet()

  return (
    <WalletButton connectLabel={label} loading={pendingConnect.isConnecting} onClick={() => showNetworks()} {...rest} />
  )
}
