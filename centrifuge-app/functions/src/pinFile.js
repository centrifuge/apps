const path = require('path')
const { pinFile } = require('./pinata/api')

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

const handler = async (req, res) => {
  try {
    const { uri } = req.body

    // check incoming data
    if (!uri) {
      return res.status(400).send('Bad request: uri is required')
    }

    const fileStream = dataUriToReadStream(uri)

    // pin the image file
    const pinFileResponse = await pinFile(fileStream)
    const fileHash = pinFileResponse.IpfsHash
    const fileURL = ipfsHashToURI(fileHash)

    return res.status(200).send(JSON.stringify({ uri: fileURL }))
  } catch (e) {
    console.log('e', e.message)
    return res.status(500).send(e.message || 'Server error')
  }
}

module.exports = handler
