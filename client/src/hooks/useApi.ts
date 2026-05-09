import { useAuth } from '../stores/AuthContext'

const API = '/api'

export function useApi() {
  const { user, logout } = useAuth()

  const headers = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
  })

  const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (res.status === 401) { logout(); throw new Error('Session expired') }
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Request failed')
    return data as T
  }

  return {
    get:    <T>(path: string) => request<T>('GET', path),
    post:   <T>(path: string, body: unknown) => request<T>('POST', path, body),
    put:    <T>(path: string, body: unknown) => request<T>('PUT', path, body),
    del:    <T>(path: string) => request<T>('DELETE', path),
  }
}
