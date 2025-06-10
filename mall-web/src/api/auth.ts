import axios from 'axios'
import { API_ENDPOINTS } from './config'

import { API_BASE_URL } from './config'

// 认证相关的类型定义
export interface LoginRequest {
  username: string
  password: string
  clientType: 'user' | 'admin'
}

export interface LoginResponse {
  code: string
  message?: string
  msg?: string
  data: {
    accessToken: string
    refreshToken?: string
    id?: number
    userId?: number
    username: string
    roles: string[]
    status: number
    clientType: string
    redirectUrl?: string
  }
}

export interface RegisterRequest {
  captchaId: string
  code: string
  user: {
    username: string
    password: string
    nickname: string
    mobile: string
    email: string
    gender: number
  }
}

export interface RegisterResponse {
  code: string
  message?: string
  msg?: string
  data: number // 用户ID
}

export interface AdminCreateUserRequest {
  username: string
  password: string
  nickname?: string
  mobile?: string
  email?: string
  gender?: number
  roleIds?: number[]
}

// 认证API服务
export const authApi = {
  // 统一登录接口
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/mbb-auth/auth/login`, loginData)
      return response.data
    } catch (error: any) {
      console.error('登录失败:', error)
      throw new Error(error.response?.data?.message || error.response?.data?.msg || '登录失败')
    }
  },

  // 普通用户注册
  async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/mbb-auth/auth/register/register`, registerData)
      return response.data
    } catch (error: any) {
      console.error('注册失败:', error)
      throw new Error(error.response?.data?.message || error.response?.data?.msg || '注册失败')
    }
  },

  // 管理员创建用户
  async adminCreateUser(userData: AdminCreateUserRequest): Promise<number> {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      const response = await axios.post(`${API_BASE_URL}/mbb-auth/auth/register/admin`, userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.data.code === '000000') {
        return response.data.data
      } else {
        throw new Error(response.data.message || response.data.msg || '创建用户失败')
      }
    } catch (error: any) {
      console.error('管理员创建用户失败:', error)
      throw new Error(error.response?.data?.message || error.response?.data?.msg || '创建用户失败')
    }
  },

  // 获取注册验证码
  async getRegisterCaptcha(): Promise<{ blob: Blob, captchaId: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/mbb-auth/auth/register/captcha/register`, {
        headers: {
          Accept: 'image/jpeg'
        },
        responseType: 'blob'
      })
      
      const captchaId = response.headers['captcha-id']
      return {
        blob: response.data,
        captchaId: captchaId
      }
    } catch (error: any) {
      console.error('获取注册验证码失败:', error)
      throw new Error('获取验证码失败')
    }
  },

  // 获取登录验证码
  async getLoginCaptcha(): Promise<{ blob: Blob, captchaId: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/mbb-auth/auth/captcha/login`, {
        headers: {
          Accept: 'image/jpeg'
        },
        responseType: 'blob'
      })
      
      const captchaId = response.headers['captcha-id']
      return {
        blob: response.data,
        captchaId: captchaId
      }
    } catch (error: any) {
      console.error('获取登录验证码失败:', error)
      throw new Error('获取验证码失败')
    }
  },

  // 登出
  async logout(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      await axios.post(`${API_BASE_URL}/mbb-auth/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      // 清除本地存储
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('username')
      localStorage.removeItem('userId')
      localStorage.removeItem('user_info')
      
      return true
    } catch (error: any) {
      console.error('登出失败:', error)
      // 即使登出失败也清除本地存储
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('username')
      localStorage.removeItem('userId')
      localStorage.removeItem('user_info')
      
      return false
    }
  },

  // 检查用户名是否存在
  async checkUserExists(username: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/mbb-auth/api/v1/users/exists`, {
        params: { username }
      })
      return response.data.data || false
    } catch (error: any) {
      console.error('检查用户名失败:', error)
      return false
    }
  },

  // 根据用户名获取用户信息
  async getUserByUsername(username: string): Promise<any> {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE_URL}/mbb-auth/api/v1/users/username/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      throw new Error(error.response?.data?.message || error.response?.data?.msg || '获取用户信息失败')
    }
  },

  // 获取登录页面信息
  async getLoginInfo(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/mbb-auth/auth/login/info`)
      return response.data.data
    } catch (error: any) {
      console.error('获取登录页面信息失败:', error)
      return null
    }
  }
}

// 权限检查工具函数
export const authUtils = {
  // 检查是否已登录
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')
    return !!token
  },

  // 检查是否为管理员
  isAdmin(): boolean {
    const userInfoStr = localStorage.getItem('user_info')
    if (!userInfoStr) return false

    try {
      const userInfo = JSON.parse(userInfoStr)
      const roles = userInfo.roles || []
      return roles.some((role: string) => 
        role === 'ADMIN' || role === 'MANAGER' || 
        role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER'
      )
    } catch {
      return false
    }
  },

  // 获取当前用户信息
  getCurrentUser(): any {
    const userInfoStr = localStorage.getItem('user_info')
    if (!userInfoStr) return null

    try {
      return JSON.parse(userInfoStr)
    } catch {
      return null
    }
  },

  // 获取当前用户角色
  getCurrentUserRoles(): string[] {
    const userInfo = this.getCurrentUser()
    return userInfo?.roles || []
  },

  // 检查用户是否有指定角色
  hasRole(role: string): boolean {
    const roles = this.getCurrentUserRoles()
    return roles.includes(role)
  },

  // 检查用户是否有任一指定角色
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getCurrentUserRoles()
    return roles.some(role => userRoles.includes(role))
  }
}
