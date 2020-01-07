import { ClientError } from './ClientError'

export class BadRequestError extends ClientError {
  constructor (message: string = 'Bad Request') {
    super(message, 400)
  }
}
