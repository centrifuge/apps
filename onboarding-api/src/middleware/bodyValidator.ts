import { NextFunction, Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { SchemaOf } from 'yup'

export const bodyValidator = async <T>(req: Request, res: Response, schema: SchemaOf<T>) => {
  try {
    await schema.validate(req.body)
    return { request: req, response: res }
  } catch (error) {
    // @ts-expect-error
    functions.logger.error(error?.message)
    throw error
  }
}

export const bodyValidatorExpress = async <T>(req: Request, res: Response, next: NextFunction, schema: SchemaOf<T>) => {
  try {
    await schema.validate(req.body)
    return next()
  } catch (error) {
    // @ts-expect-error
    functions.logger.error(error?.message)
    // @ts-expect-error
    return res.status(400).json({ error: error?.message })
  }
}
