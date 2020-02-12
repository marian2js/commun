import { routes } from '../routes'

export const STORE_USER_KEY = 'commun_dashboard_user'
export const STORE_TOKENS_KEY = 'commun_dashboard_tokens'

export async function request (method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: any) {
  console.log(`[${method.toUpperCase()}] /api/v1${path}`)

  const authHeader = getAuthenticationHeader()
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(authHeader && { Authorization: authHeader }),
  }

  const res = await fetch('/api/v1' + path, {
    method,
    headers,
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = process.env.PUBLIC_URL + routes.Login.path
    }

    // Client Error
    if (res.status >= 400 && res.status < 500) {
      const data = await res.json()
      throw new Error(data.error.message)
    }
    throw new Error('Something went wrong, please try again later')
  }

  return await res.json()
}

export function getAuthenticationHeader () {
  const tokens = localStorage.getItem(STORE_TOKENS_KEY)
  if (tokens) {
    const accessToken = JSON.parse(tokens).accessToken
    if (accessToken) {
      return `Bearer ${accessToken}`
    }
  }
  return null
}

export async function requestUntilSuccess (
  { waitBetweenRetries, maxRetries }: {
    waitBetweenRetries: number,
    maxRetries: number,
  },
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: any
): Promise<any> {
  try {
    return await request(method, path, data)
  } catch (e) {
    return new Promise(resolve => {
      setTimeout(async () => {
        resolve(await requestUntilSuccess({ waitBetweenRetries, maxRetries: maxRetries - 1 }, method, path, data))
      }, waitBetweenRetries)
    })
  }
}
