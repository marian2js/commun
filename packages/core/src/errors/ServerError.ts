import { ClientError } from './ClientError'

export class ServerError extends ClientError {
  constructor (message: string = 'Internal Server Error', statusCode: number = 500) {
    super(message, 500)
  }
}
