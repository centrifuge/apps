import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import config from '../config'

type ReturnType = { ensName: string | null }

export const useENS = (address: string | null | undefined): ReturnType => {
  const [ensName, setENSName] = useState<string | null>(null)
  const [ensAvatar, setENSAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function resolveENS() {
      if (address && ethers.utils.isAddress(address)) {
        const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
        const ensName = await provider.lookupAddress(address)
        const ensAvatar = ensName ? await provider.getAvatar(ensName) : null;
        if (ensName) setENSName(ensName)
        if (ensAvatar) setENSAvatar(ensAvatar);
      }
    }
    resolveENS()
  }, [address])

  return { ensName }
}
