import { WalletButton } from '@centrifuge/fabric'
import * as React from 'react'
import { useWallet } from '../WalletProvider'

export function ConnectButton({ label = 'Connect wallet', ...rest }) {
  const { showNetworks, pendingConnect } = useWallet()

  return (
    <WalletButton connectLabel={label} loading={pendingConnect.isConnecting} onClick={() => showNetworks()} {...rest} />
  )
}
