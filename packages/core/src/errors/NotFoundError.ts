import { ClientError } from './ClientError'

export class NotFoundError extends ClientError {
  constructor (message: string = 'Resource Not Found') {
    super(message, 404)
  }
}
