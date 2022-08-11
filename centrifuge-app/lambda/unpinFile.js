import { unpinFile } from './pinata/api'

const handler = async (event) => {
  try {
    const { hash } = JSON.parse(event.body)
    if (event.httpMethod !== 'DELETE' || !hash) {
      return {
        statusCode: 400,
      }
    }
    await unpinFile(hash)
    return {
      statusCode: 204,
    }
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.message || 'Server error' }
  }
}

export { handler }
