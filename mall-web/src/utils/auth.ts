// 认证相关工具函数

/**
 * 获取存储的访问令牌
 * @returns {string | null} 访问令牌或null
 */
export function getAccessToken(): string | null {
  // 优先获取 access_token，如果没有则尝试获取 token
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

/**
 * 设置访问令牌
 * @param {string} token 访问令牌
 */
export function setAccessToken(token: string): void {
  localStorage.setItem('access_token', token)
}

/**
 * 移除访问令牌
 */
export function removeAccessToken(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('token')
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn(): boolean {
  const token = getAccessToken()
  return !!token
}

/**
 * 获取带有认证头的请求配置
 * @returns {object} 包含Authorization头的配置对象
 */
export function getAuthHeaders(): { Authorization: string } | {} {
  const token = getAccessToken()
  if (!token) {
    return {}
  }
  return {
    Authorization: `Bearer ${token}`
  }
}

/**
 * 获取完整的axios请求配置（包含认证头）
 * @param {object} config 额外的配置选项
 * @returns {object} 完整的请求配置
 */
export function getAuthConfig(config: any = {}): any {
  const authHeaders = getAuthHeaders()
  return {
    ...config,
    headers: {
      ...config.headers,
      ...authHeaders
    }
  }
}

/**
 * 处理认证错误
 * @param {any} error 错误对象
 * @param {function} router 路由器实例
 * @returns {boolean} 是否为认证错误
 */
export function handleAuthError(error: any, router: any): boolean {
  if (error.response?.status === 401 || error.response?.data?.code === 'A00214') {
    removeAccessToken()
    router.push('/login')
    return true
  }
  return false
}

/**
 * 用户信息相关
 */
export interface UserInfo {
  id: number
  username: string
  nickname?: string
  avatar?: string
  phone?: string
  email?: string
}

/**
 * 获取用户信息
 * @returns {UserInfo | null} 用户信息或null
 */
export function getUserInfo(): UserInfo | null {
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) return null
  
  try {
    return JSON.parse(userInfoStr)
  } catch (error) {
    console.error('解析用户信息失败:', error)
    return null
  }
}

/**
 * 设置用户信息
 * @param {UserInfo} userInfo 用户信息
 */
export function setUserInfo(userInfo: UserInfo): void {
  localStorage.setItem('userInfo', JSON.stringify(userInfo))
}

/**
 * 移除用户信息
 */
export function removeUserInfo(): void {
  localStorage.removeItem('userInfo')
}

/**
 * 完整的登出操作
 */
export function logout(): void {
  removeAccessToken()
  removeUserInfo()
}
