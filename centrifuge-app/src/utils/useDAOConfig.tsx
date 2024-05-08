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

const TEMP_DATA = {
  aave: {
    name: 'Aave DAO',
    slug: 'aave',
    network: 'centrifuge',
    logo: 'https://europe1.discourse-cdn.com/business20/uploads/aave/optimized/1X/2ada312765106aec8e237bb1f628fd38e403069c_2_180x180.jpeg',
    address: '0x30d3bbae8623d0e9c0db5c27b82dcda39de40997000000000000000145564d00',
    resolutions: [],
  },
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

      const data = TEMP_DATA
      return Object.values(data) as DAO[]
    },
    {
      staleTime: Infinity,
    }
  )
  return query
}
