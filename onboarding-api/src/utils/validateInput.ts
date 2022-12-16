import { Request } from 'express'
import { HttpsError } from 'firebase-functions/v1/https'

export const validateInput = async (req: Request<any, any, any>, schema: any) => {
  try {
    await schema.validate(req.body)
  } catch (error) {
    // @ts-expect-error error typing
    throw new HttpsError('invalid-argument', error.message)
  }
}
