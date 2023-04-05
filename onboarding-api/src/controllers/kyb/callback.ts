import { Request, Response } from 'express'

export const KYBCallbackController = async (req: Request<any, any>, res: Response) => {
  console.log('KYBCallbackController request', req)

  return res.send({})
}
