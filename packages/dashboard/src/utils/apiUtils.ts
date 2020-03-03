import { routes } from '../routes'

export const STORE_USER_KEY = 'commun_dashboard_user'
export const STORE_TOKENS_KEY = 'commun_dashboard_tokens'

export async function request (method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: any, useToken = true) {
  console.log(`[${method.toUpperCase()}] /api/v1${path}`)

  const authHeader = useToken && await getAuthenticationHeader()
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

export async function getAuthenticationHeader () {
  const tokensJson = localStorage.getItem(STORE_TOKENS_KEY)
  if (tokensJson) {
    const tokens = JSON.parse(tokensJson)
    let accessToken
    if (tokens.accessTokenExpiration < new Date().getTime()) {
      const userJson = localStorage.getItem(STORE_USER_KEY)
      if (!userJson) {
        return null
      }
      accessToken = await refreshCredentials(JSON.parse(userJson).username, tokens.refreshToken)
    } else {
      accessToken = tokens.accessToken
    }
    if (accessToken) {
      return `Bearer ${accessToken}`
    }
  }
  return null
}

async function refreshCredentials (username: string, refreshToken: string): Promise<string> {
  const res = await request('POST', '/auth/token', {
    username,
    refreshToken
  }, false)
  localStorage.setItem(STORE_TOKENS_KEY, JSON.stringify({
    refreshToken,
    ...res,
  }))
  return res.accessToken
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
