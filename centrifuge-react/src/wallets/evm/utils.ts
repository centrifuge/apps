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
  return (window.ethereum?.isMetaMask ?? false) && !isBraveWallet()
}

export function isCoinbaseWallet(): boolean {
  return window.ethereum?.isCoinbaseWallet ?? false
}
