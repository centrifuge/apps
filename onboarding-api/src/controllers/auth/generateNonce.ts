import { Request, Response } from 'express'
import { generateNonce } from 'siwe'

export const generateNonceController = (req: Request, res: Response) => {
  return res.status(200).send({ nonce: generateNonce() })
}
