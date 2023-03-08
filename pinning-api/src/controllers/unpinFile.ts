import { Request, Response } from 'express'
import { unpinFile } from '../utils/api'

function sanitizeString(str: string) {
  // Remove non-alphanumeric characters
  str = str.replace(/[^a-z0-9]/gi, '')
  // Escape HTML entities
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  return str
}

export default async (req: Request, res: Response) => {
  try {
    const { hash } = req.body
    if (req.method !== 'DELETE' || !hash || typeof hash !== 'string') {
      return res.status(400).send('Bad request: hash is required')
    }
    const sanatizedHash = sanitizeString(hash)
    await unpinFile(sanatizedHash)
    return res.status(201)
  } catch (e) {
    console.log(e)
    // @ts-expect-error
    return res.status(500).send(e.message || 'Server error')
  }
}
