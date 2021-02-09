import { ethers } from 'ethers'
import config from '../config'
import contractAbiPoolRegistry from './PoolRegistry.abi'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

export const loadFromIPFS = async (rpcProvider: ethers.providers.JsonRpcProvider): Promise<PoolMap> => {
  const url = await assembleIpfsUrl(rpcProvider)
  const response = await fetch(url)
  const pools = await response.json()
  return pools
}

const assembleIpfsUrl = async (rpcProvider: ethers.providers.JsonRpcProvider): Promise<string> => {
  const registry = new ethers.Contract(config.poolRegistry, contractAbiPoolRegistry, rpcProvider)
  const poolData = await registry.pools(0)
  const url = new URL(poolData[3], config.ipfsGateway)
  return url.href
}

export type PoolMap = { [key: string]: Pool }

export interface Pool {
  metadata: any
  addresses: { [key: string]: string }
  network: 'mainnet' | 'kovan'
}
