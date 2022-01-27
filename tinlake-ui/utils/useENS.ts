import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import config from '../config'

const getENSAvatar = async (ensName: string) => {
  const response = await fetch(`https://metadata.ens.domains/mainnet/avatar/${ensName}/meta`)
  const data = await response.json()
  return data.image ?? null
}

type ReturnType = { ensName: string | null; ensAvatar: string | null }

export const useENS = (address: string | null | undefined): ReturnType => {
  const [ensName, setENSName] = useState<string | null>(null)
  const [ensAvatar, setENSAvatar] = useState<string | null>(null)

  useEffect(() => {
    async function resolveENS() {
      if (address && ethers.utils.isAddress(address)) {
        const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
        const ensName = await provider.lookupAddress(address)
        const ensAvatar = ensName ? await getENSAvatar(ensName) : null
        if (ensName) setENSName(ensName)
        if (ensAvatar) setENSAvatar(ensAvatar)
      }
    }
    resolveENS()
  }, [address])

  return { ensName, ensAvatar }
}
