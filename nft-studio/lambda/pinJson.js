import { pinJson } from './pinata/api'

const handler = async (event) => {
  try {
    const jsonBody = JSON.parse(event.body)

    const pinJsonResponse = await pinJson(jsonBody)
    console.log(pinJsonResponse)

    return { statusCode: 201, body: JSON.stringify({ ipfsHash: pinJsonResponse.data.IpfsHash }) }
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.message || 'Server error' }
  }
}

export { handler }
