export class HttpsError extends Error {
  readonly code: number
  readonly message: string
  constructor(code: number, message: string) {
    super()
    this.code = code
    this.message = message
  }
}
