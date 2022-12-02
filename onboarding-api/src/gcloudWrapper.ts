import { Request, Response } from 'express'
import * as functions from 'firebase-functions'

type Handler = (req: Request, resp: Response<any>) => any

export class GcloudWrapper {
  request: Request | null = null
  response: Response | null = null
  middleware: any[] = []

  async applyMiddleware(req: Request, res: Response) {
    for (let mw of this.middleware) {
      const { request, response } = await mw(req, res)
      this.request = request
      this.response = response
    }
  }

  async use(middleware: (req: Request, res: Response) => void) {
    this.middleware = [...this.middleware, middleware]
  }

  post(handler: Handler) {
    return functions.https.onRequest(async (req, res) => {
      if (req.method !== 'POST') {
        return res.status(405).send()
      }
      try {
        await this.applyMiddleware(req, res)
        return handler(this.request ?? req, this.response ?? res)
      } catch (error) {
        // @ts-expect-error
        return res.status(400).json({ error: error?.message })
      }
    })
  }

  get(handler: Handler) {
    return functions.https.onRequest(async (req, res) => {
      if (req.method !== 'GET') {
        return res.status(405).send()
      }
      try {
        await this.applyMiddleware(req, res)
        return handler(this.request ?? req, this.response ?? res)
      } catch (error) {
        // @ts-expect-error
        return res.status(400).json({ error: error?.message })
      }
    })
  }
}
