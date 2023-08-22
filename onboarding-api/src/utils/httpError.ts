export class HttpError extends Error {
  readonly code: number
  readonly message: string
  readonly error: unknown
  constructor(code: number, message: string, error?: unknown) {
    super()
    this.code = code
    this.message = message
    this.error = error
    this.name = 'HttpError'
  }
}

export const reportHttpError = (error: unknown) => {
  if (error instanceof HttpError) {
    console.log(`${JSON.stringify(error)}`)
    return error
  }
  console.log(`Unhandled error: ${JSON.stringify(error)}`)
  return new HttpError(500, 'An unexpected error occured')
}
