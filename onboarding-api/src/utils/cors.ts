import { Request, Response } from 'firebase-functions/v1'

export const cors = (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Max-Age', '3600')
    return res.status(204).send('')
  }
  const origin = req.get('origin')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  return
}
