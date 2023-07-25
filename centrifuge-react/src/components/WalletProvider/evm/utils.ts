import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useQuery } from 'react-query'
import { useProviderForConnector } from '../multichain/utils'
import { useWallet } from '../WalletProvider'
import { getChainInfo } from './chains'

export function useEvmProvider() {
  const { evm } = useWallet()
  return useProviderForConnector(evm.selectedWallet?.connector, evm.chainId)
}

export function useNativeBalance(address?: string) {
  const provider = useEvmProvider()
  const { evm } = useWallet()

  const addr = address || evm.selectedAddress

  const query = useQuery(
    ['evmNativeBalance', addr, evm.chainId],
    async () => {
      const balance = await provider!.getBalance(addr!)
      return new CurrencyBalance(balance.toString(), 18)
    },
    { enabled: !!provider && !!addr }
  )
  return query
}

export function useNativeCurrency() {
  const { evm } = useWallet()
  if (!evm.chainId) return null
  const chain = getChainInfo(evm.chains, evm.chainId)
  return chain.nativeCurrency
}

export function isInjected(): boolean {
  return Boolean(window.ethereum)
}

export function isBraveWallet(): boolean {
  return window.ethereum?.isBraveWallet ?? false
}

export function isMetaMaskWallet(): boolean {
  // When using Brave browser, `isMetaMask` is set to true when using the built-in wallet
  // This function should return true only when using the MetaMask extension
  // https://wallet-docs.brave.com/ethereum/wallet-detection#compatability-with-metamask
  return (window.ethereum?.isMetaMask ?? false) && !isBraveWallet() && !isTalismanWallet()
}

export function isTalismanWallet(): boolean {
  return window.ethereum?.isTalisman ?? false
}

export function isSubWallet(): boolean {
  return window.ethereum?.isSubWallet ?? false
}

export function isCoinbaseWallet(): boolean {
  return window.ethereum?.isCoinbaseWallet ?? false
}
