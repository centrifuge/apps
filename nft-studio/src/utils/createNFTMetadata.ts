import { fetchLambda } from './fetchLambda'

type Input = {
  name: string
  description: string
  fileDataUri: any
  fileName: string
}

type Result = {
  imageIpfsHash: string
  imageURI: string
  metadataIpfsHash: string
  metadataURI: string
}

export const createNFTMetadata = async ({ name, description, fileDataUri, fileName }: Input): Promise<Result> => {
  if (!name || !description || !fileDataUri || !fileName) {
    throw new Error('createNFTMetadata: required fields not provided')
  }

  const res = await fetchLambda('pinFileWithMetadata', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      description,
      fileDataUri,
      fileName,
    }),
  })

  if (!res.ok) {
    throw new Error(`Create metadata failed: status ${res.status} - ${await res.text()}`)
  }

  return res.json()
}
