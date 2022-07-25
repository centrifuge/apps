import path from 'path'
import { pinFile, pinJson, unpinFile } from './pinata/api'

const fs = require('fs')

const MAX_FILE_SIZE_IN_BYTES = 1024 ** 2 // 1 MB limit

const dataUriToReadStream = ({ tempFilePath, fileDataUri }) => {
  const base64String = fileDataUri.replace(/.+;base64,/, '')

  const buffer = Buffer.from(base64String, 'base64')

  if (buffer.byteLength > MAX_FILE_SIZE_IN_BYTES) throw new Error('File too large')

  fs.writeFileSync(tempFilePath, buffer)

  console.log(`Temp file '${tempFilePath}' created`)

  return fs.createReadStream(tempFilePath)
}

const ipfsHashToURI = (hash) => `ipfs://ipfs/${hash}`

const handler = async (event) => {
  try {
    const { fileDataUri, fileName, ...body } = JSON.parse(event.body)

    // check incoming data
    if (!(name && description && fileDataUri && fileName)) {
      return { statusCode: 400, body: 'Bad request: name, description and fileDataUri are required fields' }
    }

    // create temp file to call the pinFile API
    const tempFilePath = path.join('/tmp', fileName)
    console.log(`Temp file '${tempFilePath}' created`)
    const fileStream = dataUriToReadStream({ tempFilePath, fileDataUri })

    // pin the image file
    const pinFileResponse = await pinFile(fileStream)

    const fileHash = pinFileResponse.data.IpfsHash
    const fileURL = ipfsHashToURI(fileHash)

    let pinMetadataResponse
    try {
      pinMetadataResponse = await pinJson({ image: fileURL, ...body })
    } catch (e) {
      // if the creation of metadata fails, unpin the image file
      await unpinFile(fileHash)
      throw e
    }

    const metadataHash = pinMetadataResponse.data.IpfsHash

    return {
      statusCode: 200,
      body: JSON.stringify({
        imageIpfsHash: fileHash,
        metadataIpfsHash: metadataHash,
        imageURI: fileURL,
        metadataURI: ipfsHashToURI(metadataHash),
      }),
    }
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.message || 'Server error' }
  }
}

export { handler }
