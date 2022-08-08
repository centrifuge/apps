import path from 'path'
import { pinFile, unpinFile } from './pinata/api'

const fs = require('fs')

const MAX_FILE_SIZE_IN_BYTES = 5 * 1024 ** 2 // 5 MB limit

const dataUriToReadStream = (uri) => {
  // create temp file to call the pinFile API
  const tempFilePath = path.join('/tmp', Math.floor(Math.random() * Date.now()).toString())
  const base64String = uri.replace(/.+;base64,/, '')

  const buffer = Buffer.from(base64String, 'base64')

  if (buffer.byteLength > MAX_FILE_SIZE_IN_BYTES) throw new Error('File too large')

  fs.writeFileSync(tempFilePath, buffer)

  console.log(`Temp file '${tempFilePath}' created`)

  return fs.createReadStream(tempFilePath)
}

const ipfsHashToURI = (hash) => `ipfs://ipfs/${hash}`

const handler = async (event) => {
  try {
    const { uri } = JSON.parse(event.body)
    if (event.httpMethod === 'DELETE') {
      await unpinFile(fileStream)
      return {
        statusCode: 204,
      }
    }

    // check incoming data
    if (!uri) {
      return { statusCode: 400, body: 'Bad request: uri is required' }
    }

    const fileStream = dataUriToReadStream(uri)

    // pin the image file
    const pinFileResponse = await pinFile(fileStream)
    const fileHash = pinFileResponse.data.IpfsHash
    const fileURL = ipfsHashToURI(fileHash)

    return {
      statusCode: 200,
      body: JSON.stringify({ uri: fileURL }),
    }
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.message || 'Server error' }
  }
}

export { handler }
