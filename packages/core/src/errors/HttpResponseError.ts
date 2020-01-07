export class HttpResponseError extends Error {
  constructor (message: string, readonly statusCode: number) {
    super(message)
  }
}
