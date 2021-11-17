const axios = require('axios')
const FormData = require('form-data')

const PINATA_BASE_URL = 'https://api.pinata.cloud'
const PINATA_AUTH_HEADERS = {
  pinata_api_key: process.env.PINATA_API_KEY,
  pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
}

export const pinJson = async (jsonBody) => {
  const url = `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`
  return axios.post(url, jsonBody, {
    headers: PINATA_AUTH_HEADERS,
  })
}

export const unpinFile = async (hashToUnpin) => {
  const url = `${PINATA_BASE_URL}/pinning/unpin/${hashToUnpin}`
  return axios.delete(url, {
    headers: PINATA_AUTH_HEADERS,
  })
}

export const pinFile = async (fileReadStream) => {
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

export const ipfsHashToURI = (hash) => `ipfs://ipfs/${hash}`
