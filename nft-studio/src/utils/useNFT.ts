import { useQuery } from 'react-query'
import { parseMetadataUrl } from './parseMetadataUrl'

export function useNFT(id: string) {
  const query = useQuery(['nft', id], async () => {
    return {
      id: 1,
      creator: 'HeHh404lkj1819oRmz',
      owner: 'HeHh404lkj1819oRmz',
      collection: {
        id: 1,
        name: 'Collection 1',
      },
      createdAt: '2021-10-29T11:58:56.771Z',
      metadata: await getMetaData(''),
    }
  })

  return query
}

async function getMetaData(url: string) {
  // const data = await fetch(parseMetadataUrl(url)).then(res => res.json())

  return {
    name: 'dmxmd #125',
    description: 'Digital mixed media xerox print and paper collage',
    attributes: [],
    external_url: '',
    image: parseMetadataUrl('ipfs://ipfs/QmTH4KuiCGWr1WzGZyzgZXjugnsWdN57zq8kURpzUZz9k5'),
  }
}
