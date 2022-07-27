import { pinJson } from './pinata/api'

const ipfsHashToURI = (hash) => `ipfs://ipfs/${hash}`

const handler = async (event) => {
  try {
    const jsonBody = JSON.parse(event.body)

    const pinJsonResponse = await pinJson(jsonBody)
    console.log(pinJsonResponse)

    const fileHash = pinJsonResponse.data.IpfsHash
    const fileURL = ipfsHashToURI(fileHash)
    return { statusCode: 201, body: JSON.stringify({ uri: fileURL, ipfsHash: fileHash }) }
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.message || 'Server error' }
  }
}

export { handler }
