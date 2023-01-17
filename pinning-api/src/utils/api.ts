import FormData from 'form-data'
import fetch from 'node-fetch'
require('dotenv').config()

const PINATA_BASE_URL = 'https://api.pinata.cloud'
const PINATA_AUTH_HEADERS = {
  pinata_api_key: process.env.PINATA_API_KEY || '',
  pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY || '',
}

export const pinJson = async (jsonBody: any) => {
  const url = `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(jsonBody),
    headers: { ...PINATA_AUTH_HEADERS, 'content-type': 'application/json' },
  })
  return res.json() as Promise<{ IpfsHash: string }>
}

export const unpinFile = async (hashToUnpin: string) => {
  const url = `${PINATA_BASE_URL}/pinning/unpin/${hashToUnpin}`
  const res = await fetch(url, { method: 'DELETE', headers: PINATA_AUTH_HEADERS })
  return res.json() as Promise<{ IpfsHash: string }>
}

export const pinFile = async (fileReadStream: any) => {
  const data = new FormData()
  data.append('file', fileReadStream)

  const res = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}`,
      ...PINATA_AUTH_HEADERS,
    },
    body: data,
  })
  return res.json() as Promise<{ IpfsHash: string }>
}

export const ipfsHashToURI = (hash: string) => `ipfs://ipfs/${hash}`
