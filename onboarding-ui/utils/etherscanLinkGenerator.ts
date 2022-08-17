import BN from 'bn.js'
import config from '../config'

const { etherscanUrl } = config
export const getAddressLink = (address: string) => {
  return `${etherscanUrl}/address/${address}`
}

export const getTransactionLink = (hash: string) => {
  return `${etherscanUrl}/tx/${hash}`
}

export const getNFTLink = (tokenId: string, registyAddress: string) => {
  return `${etherscanUrl}/token/${registyAddress}?a=${tokenId}`
}

export const hexToInt = (hex: string) => {
  return new BN(hex.replace(/^0x/, ''), 16).toString()
}
