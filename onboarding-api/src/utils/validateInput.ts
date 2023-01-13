import { Request } from 'express'
import { HttpsError } from './httpsError'

export const validateInput = async (req: Request<any, any, any>, schema: any) => {
  try {
    await schema.validate(req.body)
  } catch (error) {
    // @ts-expect-error error typing
    throw new HttpsError(400, error.message)
  }
}
