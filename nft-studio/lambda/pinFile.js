import path from 'path'
import { pinFile } from './pinata/api'

const fs = require('fs')
const os = require('os')

const dataUriToReadStream = ({ tempFilePath, fileDataUri }) => {
  const base64String = fileDataUri.replace(/.+;base64,/, '')

  fs.writeFileSync(tempFilePath, base64String, { encoding: 'base64' })

  console.log(`Temp file '${tempFilePath}' created`)

  return fs.createReadStream(tempFilePath)
}

const ipfsHashToURI = (hash) => `ipfs://ipfs/${hash}`

const handler = async (event) => {
  let tempDir = ''
  try {
    const { fileDataUri, fileName } = JSON.parse(event.body)

    // check incoming data
    if (!(fileDataUri && fileName)) {
      return { statusCode: 400, body: 'Bad request: fileName and fileDataUri are required fields' }
    }

    // create temp directory
    tempDir = path.join(fs.realpathSync(os.tmpdir()), fs.mkdtempSync('nft-studio-'))
    fs.mkdirSync(tempDir)
    console.log(`Temp dir '${tempDir}' created`)

    // create temp file to call the pinFile API
    const tempFilePath = path.join(tempDir, fileName)
    console.log(`Temp file '${tempFilePath}' created`)
    const fileStream = dataUriToReadStream({ tempFilePath, fileDataUri })

    // pin the image file
    const pinFileResponse = await pinFile(fileStream)

    const fileHash = pinFileResponse.data.IpfsHash
    const fileURL = ipfsHashToURI(fileHash)

    return {
      statusCode: 200,
      body: JSON.stringify({
        fileIpfsHash: fileHash,
        fileURI: fileURL,
      }),
    }
  } catch (e) {
    console.log(e)
    return { statusCode: 500, body: e.message || 'Server error' }
  } finally {
    // clean up the temp file/directory
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true })
      console.log(`Temp dir '${tempDir}' removed`)
    }
  }
}

export { handler }
