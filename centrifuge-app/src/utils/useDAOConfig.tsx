import { Network } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { isTestEnv } from '../config'

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
  const query = useQuery(
    'daoData',
    async () => {
      const res = await fetch(
        `https://api.github.com/repos/centrifuge/prime-data/contents/data${isTestEnv ? '-dev' : ''}.json`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )

      if (!res.ok) {
        throw new Error('Network response was not ok')
      }

      const json = await res.json()
      const content = atob(json.content)

      const data = JSON.parse(content)
      return Object.values(data) as DAO[]
    },
    {
      staleTime: Infinity,
    }
  )
  return query
}
