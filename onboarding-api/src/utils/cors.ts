import { Request, Response } from 'firebase-functions/v1'

export const cors = (req: Request, res: Response) => {
  //   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888')
  //   res.setHeader('Access-Control-Allow-Methods', 'POST, GET')
  //   res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }
}
