import { getToken } from './token'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api/v1'

export interface ApiResult<T = any> {
  code: number
  message: string
  data: T | null
}

export async function request<T = any>(opts: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
}): Promise<T> {
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) header['Authorization'] = 'Bearer ' + token
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: BASE_URL + opts.url,
      method: opts.method || 'GET',
      data: opts.data,
      header,
      success: (res) => {
        const body = res.data as ApiResult
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.code === 0) {
          resolve(body.data as T)
        } else {
          const msg = (body && body.message) || ('请求失败(' + res.statusCode + ')')
          uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail: (err) => {
        const msg = '网络错误: ' + (err.errMsg || '')
        uni.showToast({ title: msg, icon: 'none' })
        reject(new Error(msg))
      },
    })
  })
}