import path from 'path'

const fs = require('fs')
const os = require('os')
const FormData = require('form-data')
const axios = require('axios')

const PINATA_BASE_URL = 'https://api.pinata.cloud'
const PINATA_AUTH_HEADERS = {
  pinata_api_key: process.env.PINATA_API_KEY,
  pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
}

const pinJson = async (jsonBody) => {
  const url = `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`
  return axios.post(url, jsonBody, {
    headers: PINATA_AUTH_HEADERS,
  })
}

const unpinFile = async (hashToUnpin) => {
  const url = `${PINATA_BASE_URL}/pinning/unpin/${hashToUnpin}`
  return axios.delete(url, {
    headers: PINATA_AUTH_HEADERS,
  })
}

const dataUriToReadStream = ({ tempFilePath, fileDataUri }) => {
  const base64String = fileDataUri.replace(/.+;base64,/, '')

  fs.writeFileSync(tempFilePath, base64String, { encoding: 'base64' })

  console.log(`Temp file '${tempFilePath}' created`)

  return fs.createReadStream(tempFilePath)
}

const pinFile = async (fileReadStream) => {
  const data = new FormData()
  data.append('file', fileReadStream)

  return axios.post(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, data, {
    maxBodyLength: 'Infinity', // this is needed to prevent axios from erroring out with large files
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      ...PINATA_AUTH_HEADERS,
    },
  })
}

const ipfsHashToURI = (hash) => `https://ipfs.io/ipfs/${hash}`

const handler = async (event) => {
  let tempDir = ''
  try {
    const { name, description, fileDataUri, fileName } = JSON.parse(event.body)

    // check incoming data
    if (!(name && description && fileDataUri && fileName)) {
      return { statusCode: 400, body: 'Bad request: name, description and fileDataUri are required fields' }
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

    let pinMetadataResponse
    try {
      pinMetadataResponse = await pinJson({ name, description, image: fileURL })
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
  } finally {
    // clean up the temp file/directory
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true })
      console.log(`Temp dir '${tempDir}' removed`)
    }
  }
}

export { handler }
