import { WalletContextType } from '@centrifuge/centrifuge-react'

export const getSelectedWallet = (wallet: WalletContextType) => {
  if (wallet?.connectedType === 'substrate') {
    return {
      address: wallet.substrate.selectedAccount?.address,
      network: 'substrate',
    }
  }

  if (wallet?.connectedType === 'evm') {
    return {
      address: wallet.evm.selectedAddress,
      network: 'evm',
    }
  }

  return null
}
