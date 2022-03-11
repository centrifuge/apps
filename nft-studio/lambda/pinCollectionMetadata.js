import { ipfsHashToURI, pinJson } from './pinata/api'

const handler = async (event) => {
  try {
    const { name, description, logo } = JSON.parse(event.body)

    // check incoming data
    if (!(name && description)) {
      return { statusCode: 400, body: 'Bad request: name, description are required fields' }
    }

    const pinMetadataResponse = await pinJson({ name, description, logo })

    const metadataHash = pinMetadataResponse.data.IpfsHash

    return {
      statusCode: 200,
      body: JSON.stringify({
        metadataIpfsHash: metadataHash,
        metadataURI: ipfsHashToURI(metadataHash),
      }),
    }
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.message || 'Server error' }
  }
}

export { handler }
