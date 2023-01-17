const FormData = require('form-data')
const fetch = require('node-fetch')
require('dotenv').config()

const PINATA_BASE_URL = 'https://api.pinata.cloud'
const PINATA_AUTH_HEADERS = {
  pinata_api_key: process.env.PINATA_API_KEY,
  pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
}

const pinJson = async (jsonBody) => {
  const url = `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(jsonBody),
    headers: { ...PINATA_AUTH_HEADERS, 'content-type': 'application/json' },
  })
  return res.json()
}

const unpinFile = async (hashToUnpin) => {
  const url = `${PINATA_BASE_URL}/pinning/unpin/${hashToUnpin}`
  const res = await fetch(url, { method: 'DELETE', headers: PINATA_AUTH_HEADERS })
  return res.json()
}

const pinFile = async (fileReadStream) => {
  const data = new FormData()
  data.append('file', fileReadStream)

  const res = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    maxBodyLength: 'Infinity', // this is needed to prevent axios from erroring out with large files
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      ...PINATA_AUTH_HEADERS,
    },
    body: data,
  })
  return res.json()
}

const ipfsHashToURI = (hash) => `ipfs://ipfs/${hash}`

module.exports = {
  pinFile,
  unpinFile,
  ipfsHashToURI,
  pinJson,
}
