import { fetchLambda } from './fetchLambda'

type Input = {
  name: string
  description: string
  fileDataUri?: any
  fileName?: string
}

type Result = {
  imageIpfsHash: string
  imageURI: string
  metadataIpfsHash: string
  metadataURI: string
}

export const createCollectionMetadata = async ({
  name,
  description,
  fileDataUri,
  fileName,
}: Input): Promise<Result> => {
  if (!name || !description) {
    throw new Error('Fields name and description are needed to create collection metadata')
  }
  const res = await fetchLambda('pinCollectionMetadata', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, description, fileName, fileDataUri }),
  })

  if (!res.ok) {
    throw new Error(`Create metadata failed: status ${res.status} - ${await res.text()}`)
  }

  return res.json()
}
