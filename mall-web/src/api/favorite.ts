// 收藏功能API服务
import axios from 'axios'
import { apiUrls } from './config'
import type { FavoriteItem } from '../types/favorite'

// 获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`
  }
}

// 收藏API服务
export const favoriteApi = {
  // 添加商品到收藏
  async addFavorite(productId: string | number): Promise<boolean> {
    try {
      const response = await axios.post(
        apiUrls.favoritesAdd(String(productId)),
        {},
        { headers: getAuthHeaders() }
      )
      return response.data.code === 200
    } catch (error: any) {
      console.error('添加收藏失败:', error)
      throw new Error(error.response?.data?.message || '添加收藏失败')
    }
  },

  // 取消收藏商品
  async removeFavorite(productId: string | number): Promise<boolean> {
    try {
      const response = await axios.delete(
        apiUrls.favoritesRemove(String(productId)),
        { headers: getAuthHeaders() }
      )
      return response.data.code === 200
    } catch (error: any) {
      console.error('取消收藏失败:', error)
      throw new Error(error.response?.data?.message || '取消收藏失败')
    }
  },

  // 检查商品是否已收藏
  async checkFavorite(productId: string | number): Promise<boolean> {
    try {
      const response = await axios.get(
        apiUrls.favoritesCheck(String(productId)),
        { headers: getAuthHeaders() }
      )
      return response.data.data === true
    } catch (error: any) {
      console.error('检查收藏状态失败:', error)
      return false
    }
  },

  // 获取用户收藏列表
  async getFavoritesList(): Promise<FavoriteItem[]> {
    try {
      const response = await axios.get(
        apiUrls.favoritesList(),
        { headers: getAuthHeaders() }
      )
      const favorites = response.data.data || []

      // 处理图片URL
      return favorites.map((item: FavoriteItem) => ({
        ...item,
        productImage: item.productImage && !item.productImage.startsWith('http')
          ? `/static${item.productImage}`
          : item.productImage
      }))
    } catch (error: any) {
      console.error('获取收藏列表失败:', error)
      throw new Error(error.response?.data?.message || '获取收藏列表失败')
    }
  },

  // 获取用户收藏数量
  async getFavoritesCount(): Promise<number> {
    try {
      const response = await axios.get(
        apiUrls.favoritesCount(),
        { headers: getAuthHeaders() }
      )
      return response.data.data || 0
    } catch (error: any) {
      console.error('获取收藏数量失败:', error)
      return 0
    }
  },

  // 获取商品被收藏数量
  async getProductFavoritesCount(productId: string | number): Promise<number> {
    try {
      const response = await axios.get(
        apiUrls.favoritesProductCount(String(productId))
      )
      return response.data.data || 0
    } catch (error: any) {
      console.error('获取商品收藏数量失败:', error)
      return 0
    }
  }
}
