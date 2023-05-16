export class HttpError extends Error {
  readonly code: number
  readonly message: string
  constructor(code: number, message: string) {
    super()
    this.code = code
    this.message = message
    this.name = 'HttpError'
  }
}

export const reportHttpError = (error: unknown) => {
  if (error instanceof HttpError) {
    console.log(`${error.name} ${JSON.stringify(error)}`)
    return error
  }
  // @ts-expect-error
  console.log(`Unhandled error: ${JSON.stringify(error?.message || error)}`)
  return new HttpError(500, 'An unexpected error occured')
}
