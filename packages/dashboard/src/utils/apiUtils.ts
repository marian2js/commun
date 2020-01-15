export async function request (method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: any) {
  console.log(`[${method.toUpperCase()}] /api/v1${path}`)

  const headers: { [key: string]: string } = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  const res = await fetch('/api/v1' + path, {
    method,
    headers,
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    // Client Error
    if (res.status >= 400 && res.status < 500) {
      const data = await res.json()
      throw new Error(data.error.message)
    }
    throw new Error('Something went wrong, please try again later')
  }

  return await res.json()
}
