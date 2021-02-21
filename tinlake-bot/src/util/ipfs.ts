import { ethers } from 'ethers'
import config from '../config'
import contractAbiPoolRegistry from './PoolRegistry.abi'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

export const loadFromIPFS = async (rpcProvider: ethers.providers.JsonRpcProvider): Promise<PoolMap> => {
  const url = await assembleIpfsUrl(rpcProvider)
  const response = await fetch(url)
  const pools = await response.json()

  let poolsWithProfiles = {}
  await Promise.all(
    Object.values(pools).map(async (pool: Pool) => {
      if (!pool.addresses) return

      const profile = await getPoolProfile(pool.addresses.ROOT_CONTRACT)
      if (profile) poolsWithProfiles[pool.addresses.ROOT_CONTRACT] = { ...pool, profile }
    })
  )

  return poolsWithProfiles
}

const getPoolProfile = async (poolId: string): Promise<Profile | undefined> => {
  const profileUrl = `${config.profileRoot}${poolId}.json`
  const profileResponse = await fetch(profileUrl)
  if (!profileResponse.ok) return undefined
  const profile = await profileResponse.json()
  return profile
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
  profile?: Profile
}

export interface Profile {
  issuer: {
    name: string
    email: string
  }
  bot?: {
    channelId?: string
  }
}
