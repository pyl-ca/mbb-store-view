import axios from 'axios'
import { API_ENDPOINTS } from './config'

// 获取认证头部
function getAuthHeaders() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`
  }
}

// 统计数据接口
export interface DashboardStats {
  totalOrders: number
  totalUsers: number
  totalProducts: number
  totalRevenue: string
}

// 订单统计数据
export interface OrderStats {
  totalCount: number
  todayCount: number
  pendingCount: number
  completedCount: number
}

// 用户统计数据
export interface UserStats {
  totalCount: number
  todayCount: number
  activeCount: number
}

// 商品统计数据
export interface ProductStats {
  totalCount: number
  onlineCount: number
  offlineCount: number
  lowStockCount: number
}

// 营收统计数据
export interface RevenueStats {
  totalRevenue: number
  todayRevenue: number
  monthRevenue: number
  yearRevenue: number
}

// 统计API
export const statsApi = {
  // 获取仪表盘统计数据
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const headers = getAuthHeaders()

      // 并行请求所有统计数据
      const [ordersRes, usersRes, productsRes, revenueRes] = await Promise.all([
        axios.get(API_ENDPOINTS.STATS_SERVICE.ORDER_COUNT, { headers }).catch(() => null),
        axios.get(API_ENDPOINTS.STATS_SERVICE.USER_COUNT, { headers }).catch(() => null),
        axios.get(API_ENDPOINTS.STATS_SERVICE.PRODUCT_COUNT, { headers }).catch(() => null),
        axios.get(API_ENDPOINTS.STATS_SERVICE.ORDER_REVENUE, { headers }).catch(() => null)
      ])

      const stats: DashboardStats = {
        totalOrders: ordersRes?.data?.data || ordersRes?.data || 0,
        totalUsers: usersRes?.data?.data || usersRes?.data || 0,
        totalProducts: productsRes?.data?.data || productsRes?.data || 0,
        totalRevenue: '0.00'
      }

      // 格式化营收数据
      if (revenueRes?.data?.data || revenueRes?.data) {
        const revenue = revenueRes.data.data || revenueRes.data || 0
        stats.totalRevenue = revenue.toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      }

      return stats
    } catch (error: any) {
      console.error('获取仪表盘统计数据失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取统计数据失败')
    }
  },

  // 获取订单统计
  async getOrderCount(): Promise<number> {
    try {
      const response = await axios.get(API_ENDPOINTS.STATS_SERVICE.ORDER_COUNT, {
        headers: getAuthHeaders()
      })
      return response.data.data || response.data || 0
    } catch (error: any) {
      console.error('获取订单统计失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取订单统计失败')
    }
  },

  // 获取用户统计
  async getUserCount(): Promise<number> {
    try {
      const response = await axios.get(API_ENDPOINTS.STATS_SERVICE.USER_COUNT, {
        headers: getAuthHeaders()
      })
      return response.data.data || response.data || 0
    } catch (error: any) {
      console.error('获取用户统计失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取用户统计失败')
    }
  },

  // 获取商品统计
  async getProductCount(): Promise<number> {
    try {
      const response = await axios.get(API_ENDPOINTS.STATS_SERVICE.PRODUCT_COUNT, {
        headers: getAuthHeaders()
      })
      return response.data.data || response.data || 0
    } catch (error: any) {
      console.error('获取商品统计失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取商品统计失败')
    }
  },

  // 获取营收统计
  async getOrderRevenue(): Promise<number> {
    try {
      const response = await axios.get(API_ENDPOINTS.STATS_SERVICE.ORDER_REVENUE, {
        headers: getAuthHeaders()
      })
      return response.data.data || response.data || 0
    } catch (error: any) {
      console.error('获取营收统计失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取营收统计失败')
    }
  }
}
