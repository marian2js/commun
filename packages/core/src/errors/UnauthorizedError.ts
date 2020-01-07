import { ClientError } from './ClientError'

export class UnauthorizedError extends ClientError {
  constructor (message: string = 'Unauthorized Request') {
    super(message, 401)
  }
}
