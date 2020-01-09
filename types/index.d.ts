// extend Express Request with the auth interface
declare namespace Express {
  export interface RequestAuth {
    _id: string
  }

  export interface Request {
    auth?: RequestAuth
  }
}
