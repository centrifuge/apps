/// <reference types="vite/client" />

declare module '@makerdao/multicall'

interface ImportMetaEnv {
  REACT_APP_IPFS_GATEWAY: string
  REACT_APP_COLLATOR_WSS_URL: string
  REACT_APP_RELAY_WSS_URL: string
  REACT_APP_SUBSCAN_URL: string
  REACT_APP_WHITELISTED_ACCOUNTS: string
  REACT_APP_NETWORK: 'altair' | 'centrifuge'
  REACT_APP_POOL_CREATION_TYPE: 'immediate' | 'propose' | 'notePreimage'
  REACT_APP_DEFAULT_NODE_URL: string
  REACT_APP_FAUCET_URL: string
  REACT_APP_ONBOARDING_API_URL: string
  REACT_APP_TINLAKE_NETWORK: 'goerli' | 'mainnet'
  REACT_APP_INFURA_KEY: string
  REACT_APP_WALLETCONNECT_ID: string
}
