import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL_KEY = 'aquafarm.api.baseUrl'
const AUTH_TOKEN_KEY = 'aquafarm.auth.token'

const defaultBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000'

export async function getBaseUrl(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(BASE_URL_KEY)
    return stored || defaultBaseUrl
  } catch {
    return defaultBaseUrl
  }
}

export async function setBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(BASE_URL_KEY, url)
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (token === null) {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
  } else {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token)
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = await getBaseUrl()
  const token = await getAuthToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    ;(headers as any)['Authorization'] = `Bearer ${token}`
  }
  const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const res = await fetch(url, { ...options, headers })
  return res
}
