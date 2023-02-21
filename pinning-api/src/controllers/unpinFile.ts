import { Request, Response } from 'express'
import { unpinFile } from '../utils/api'

export default async (req: Request, res: Response) => {
  try {
    const { hash } = req.body
    if (req.method !== 'DELETE' || !hash) {
      return res.status(400).send('Bad request: hash is required')
    }
    await unpinFile(hash)
    return res.status(201)
  } catch (e) {
    console.log(e)
    // @ts-expect-error
    return res.status(500).send(e.message || 'Server error')
  }
}
