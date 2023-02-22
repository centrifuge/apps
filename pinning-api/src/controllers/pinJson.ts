import { Request, Response } from 'express'
import { pinJson } from '../utils/api'

const ipfsHashToURI = (hash: string) => `ipfs://ipfs/${hash}`

export default async (req: Request, res: Response) => {
  try {
    const { json } = req.body
    if (!json) {
      return res.status(400).send('Bad request: json is required')
    }

    const pinJsonResponse = await pinJson(json)
    const jsonHash = pinJsonResponse.IpfsHash
    const jsonURL = ipfsHashToURI(jsonHash)

    return res.status(200).send(JSON.stringify({ uri: jsonURL }))
  } catch (e) {
    // @ts-expect-error
    return res.status(500).send(e.message || 'Server error')
  }
}
