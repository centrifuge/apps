import { fetchLambda } from './fetchLambda'

export const createCollectionMetadata = async (name: string, description: string, logo: string) => {
  if (!name || !description) {
    throw new Error('Fields name and description are needed to create collection metadata')
  }

  const res = await fetchLambda('pinCollectionMetadata', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, description, logo }),
  })

  if (!res.ok) {
    throw new Error(`Create metadata failed: status ${res.status} - ${await res.text()}`)
  }

  return res.json()
}
