import { Network, useCentrifuge } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { lastValueFrom } from 'rxjs'

export type DAO = {
  name: string
  slug: string
  network: Network
  logo: string
  address: string
  resolutions: Resolution[]
}

export type Resolution = {
  title: string
  image: string
  timestamp: number
  excerpt: string
  link: string
}

export const useDAOConfig = () => {
  const cent = useCentrifuge()
  const query = useQuery(
    'daoData',
    async () => {
      const data = await lastValueFrom(cent.metadata.getMetadata(import.meta.env.REACT_APP_PRIME_IPFS_HASH))
      return Object.values(data) as DAO[]
    },
    {
      staleTime: Infinity,
    }
  )
  return query
}
