import axios from 'axios'
import { API_ENDPOINTS } from './config'
import type {
  Review,
  Reply,
  ReviewTag,
  ReviewFilter,
  ReviewListResponse,
  ReviewStats,
  CreateReviewRequest,
  CreateReplyRequest,
  AuditRequest,
  BatchStatusRequest,
  UploadResponse,
  BatchUploadResponse,
  ReviewApiResponse,
  AdminStatistics
} from '../types/review'

// 获取认证头部
function getAuthHeaders() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  const userId = localStorage.getItem('userId')
  return {
    Authorization: `Bearer ${token}`,
    'X-User-Id': userId || ''
  }
}

// 评论API服务
export const reviewApi = {
  // 1. 评论管理接口

  // 创建评论
  async createReview(reviewData: CreateReviewRequest): Promise<Review> {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REVIEWS}`,
        reviewData,
        { headers: getAuthHeaders() }
      )
      return response.data.data
    } catch (error: any) {
      console.error('创建评论失败:', error)
      throw new Error(error.response?.data?.msg || '发布评论失败')
    }
  },

  // 查询评论列表
  async getReviews(filter: ReviewFilter): Promise<ReviewListResponse> {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REVIEWS}`,
        {
          params: filter,
          headers: getAuthHeaders()
        }
      )
      return response.data.data
    } catch (error: any) {
      console.error('获取评论列表失败:', error)
      throw new Error(error.response?.data?.msg || '获取评论列表失败')
    }
  },

  // 查询商品评论列表
  async getProductReviews(productId: number, filter: Omit<ReviewFilter, 'productId'>): Promise<ReviewListResponse> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.PRODUCT_REVIEWS.replace('{productId}', productId.toString())}`
      const response = await axios.get(url, {
        params: filter,
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取商品评论失败:', error)
      throw new Error(error.response?.data?.msg || '获取商品评论失败')
    }
  },

  // 查询用户评论列表
  async getUserReviews(userId: number, filter: Omit<ReviewFilter, 'userId'>): Promise<ReviewListResponse> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.USER_REVIEWS.replace('{userId}', userId.toString())}`
      const response = await axios.get(url, {
        params: filter,
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取用户评论失败:', error)
      throw new Error(error.response?.data?.msg || '获取用户评论失败')
    }
  },

  // 商家评论搜索
  async getMerchantReviews(filter: {
    keyword?: string
    rating?: number
    sortBy?: string
    page: number
    size: number
  }): Promise<ReviewListResponse> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.MERCHANT_REVIEWS}`
      const response = await axios.get(url, {
        params: filter,
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('搜索商家评论失败:', error)
      throw new Error(error.response?.data?.msg || '搜索商家评论失败')
    }
  },

  // 获取评论详情
  async getReviewDetail(reviewId: number | string): Promise<Review> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REVIEW_DETAIL.replace('{reviewId}', String(reviewId))}`
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取评论详情失败:', error)
      throw new Error(error.response?.data?.msg || '获取评论详情失败')
    }
  },

  // 点赞/取消点赞评论
  async toggleReviewLike(reviewId: number | string): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REVIEW_LIKE.replace('{reviewId}', String(reviewId))}`
      const response = await axios.post(url, {}, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('点赞操作失败:', error)
      throw new Error(error.response?.data?.msg || '操作失败')
    }
  },

  // 检查用户对订单商品是否已评论
  async checkReviewed(orderSn: string, productId?: number, skuId?: number): Promise<Review | null> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.CHECK_REVIEWED}`
      const params: any = { orderSn }
      if (productId) params.productId = productId
      if (skuId) params.skuId = skuId

      const response = await axios.get(url, {
        params,
        headers: getAuthHeaders()
      })
      return response.data.data || null
    } catch (error: any) {
      console.error('检查评价状态失败:', error)
      return null
    }
  },

  // 检查订单是否已评论（简化版本，返回布尔值）
  async checkOrderReviewed(orderSn: string, productId?: number): Promise<boolean> {
    try {
      console.log(`检查订单 ${orderSn} 的评价状态`, productId ? `商品ID: ${productId}` : '(不指定商品)')

      // 如果指定了商品ID，检查特定商品的评价状态
      if (productId) {
        const result = await this.checkReviewed(orderSn, productId)
        console.log(`订单 ${orderSn} 商品 ${productId} 评价检查结果:`, result)

        if (result && result.status !== undefined) {
          const hasReviewed = result.status === 0 || result.status === 1
          console.log(`订单 ${orderSn} 商品 ${productId} 评价状态: status=${result.status}, hasReviewed=${hasReviewed}`)
          return hasReviewed
        }
        return false
      }

      // 如果没有指定商品ID，只传订单号（保持原有逻辑，但添加警告）
      console.warn(`检查订单 ${orderSn} 评价状态时未指定商品ID，这可能导致数据异常`)
      const result = await this.checkReviewed(orderSn)
      console.log(`订单 ${orderSn} 评价检查结果:`, result)

      // 根据文档：status IN (0, 1) 表示不能重复评论（待审核和已通过）
      // status IN (2, 3) 表示可以重新评论（已拒绝和已删除）
      if (result && result.status !== undefined) {
        const hasReviewed = result.status === 0 || result.status === 1
        console.log(`订单 ${orderSn} 评价状态: status=${result.status}, hasReviewed=${hasReviewed}`)
        return hasReviewed
      }
      console.log(`订单 ${orderSn} 没有评价记录`)
      return false
    } catch (error: any) {
      console.error('检查订单评价状态失败:', error)
      return false
    }
  },

  // 删除评论
  async deleteReview(reviewId: number | string): Promise<boolean> {
    try {
      // 确保ID作为字符串传递
      const idStr = String(reviewId)
      console.log('删除评论ID:', idStr)

      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REVIEW_DELETE.replace('{reviewId}', idStr)}`
      console.log('删除评论URL:', url)

      const response = await axios.delete(url, {
        headers: getAuthHeaders()
      })
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('删除评论失败:', error)
      console.error('错误详情:', error.response?.data)
      throw new Error(error.response?.data?.msg || '删除评论失败')
    }
  },

  // 获取商品评论统计
  async getProductReviewStats(productId: number): Promise<ReviewStats> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.PRODUCT_STATS.replace('{productId}', productId.toString())}`
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取评论统计失败:', error)
      throw new Error(error.response?.data?.msg || '获取评论统计失败')
    }
  },

  // 检查用户评论权限
  async checkReviewPermission(orderId: number, productId: number): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.CHECK_PERMISSION}`
      const response = await axios.get(url, {
        params: { orderId, productId },
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('检查评论权限失败:', error)
      return false
    }
  },

  // 2. 回复管理接口

  // 创建回复
  async createReply(replyData: CreateReplyRequest): Promise<Reply> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REPLIES}`
      const response = await axios.post(url, replyData, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('创建回复失败:', error)
      throw new Error(error.response?.data?.msg || '回复失败')
    }
  },

  // 查询评论的回复列表
  async getReviewReplies(reviewId: number): Promise<Reply[]> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REVIEW_REPLIES.replace('{reviewId}', reviewId.toString())}`
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取回复列表失败:', error)
      throw new Error(error.response?.data?.msg || '获取回复列表失败')
    }
  },

  // 分页查询回复列表
  async getRepliesPage(filter: { reviewId: number; parentId?: number; page: number; size: number }): Promise<ReviewListResponse> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REPLY_PAGE}`
      const response = await axios.get(url, {
        params: filter,
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取回复分页失败:', error)
      throw new Error(error.response?.data?.msg || '获取回复分页失败')
    }
  },

  // 点赞/取消点赞回复
  async toggleReplyLike(replyId: number): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REPLY_LIKE.replace('{replyId}', replyId.toString())}`
      const response = await axios.post(url, {}, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('回复点赞操作失败:', error)
      throw new Error(error.response?.data?.msg || '操作失败')
    }
  },

  // 删除回复
  async deleteReply(replyId: number): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REPLY_DELETE.replace('{replyId}', replyId.toString())}`
      const response = await axios.delete(url, {
        headers: getAuthHeaders()
      })
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('删除回复失败:', error)
      throw new Error(error.response?.data?.msg || '删除回复失败')
    }
  },



  // 4. 文件上传接口

  // 批量上传评论图片
  async uploadReviewImages(files: File[]): Promise<BatchUploadResponse> {
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.UPLOAD_IMAGES}`
      const response = await axios.post(url, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data.data
    } catch (error: any) {
      console.error('批量上传图片失败:', error)
      throw new Error(error.response?.data?.msg || '上传图片失败')
    }
  },

  // 单张图片上传
  async uploadReviewImage(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.UPLOAD_IMAGE}`
      const response = await axios.post(url, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data.data
    } catch (error: any) {
      console.error('上传图片失败:', error)
      throw new Error(error.response?.data?.msg || '上传图片失败')
    }
  },

  // 5. 管理端接口

  // 管理端评论列表
  async getAdminReviews(filter: {
    productId?: number
    userId?: number
    status?: number
    rating?: number
    hasImage?: boolean
    keyword?: string
    startTime?: string
    endTime?: string
    page: number
    size: number
  }): Promise<ReviewListResponse> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_REVIEWS}`
      const response = await axios.get(url, {
        params: filter,
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取管理端评论列表失败:', error)
      throw new Error(error.response?.data?.msg || '获取管理端评论列表失败')
    }
  },

  // 批量审核评论
  async batchAuditReviews(auditData: AuditRequest): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_BATCH_AUDIT}`
      const response = await axios.post(url, auditData, {
        headers: getAuthHeaders()
      })
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('批量审核评论失败:', error)
      throw new Error(error.response?.data?.msg || '批量审核评论失败')
    }
  },

  // 审核单个评论
  async auditReview(reviewId: number, status: number, reason?: string): Promise<boolean> {
    try {
      const auditData: AuditRequest = {
        reviewIds: [reviewId],
        status,
        reason
      }
      return await this.batchAuditReviews(auditData)
    } catch (error: any) {
      console.error('审核评论失败:', error)
      throw new Error(error.response?.data?.msg || '审核评论失败')
    }
  },

  // 置顶/取消置顶评论
  async toggleReviewTop(reviewId: number): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REVIEW_TOP.replace('{reviewId}', reviewId.toString())}`
      const response = await axios.post(url, {}, {
        headers: getAuthHeaders()
      })
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('置顶操作失败:', error)
      throw new Error(error.response?.data?.msg || '置顶操作失败')
    }
  },

  // 管理端回复列表
  async getAdminReplies(filter: {
    reviewId?: number
    userId?: number
    status?: number
    isMerchant?: boolean
    keyword?: string
    page: number
    size: number
  }): Promise<ReviewListResponse> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_REPLIES}`
      const response = await axios.get(url, {
        params: filter,
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取管理端回复列表失败:', error)
      throw new Error(error.response?.data?.msg || '获取管理端回复列表失败')
    }
  },

  // 批量审核回复
  async batchAuditReplies(auditData: AuditRequest): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}/admin/replies/batch-audit`
      const response = await axios.post(url, auditData, {
        headers: getAuthHeaders()
      })
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('批量审核回复失败:', error)
      throw new Error(error.response?.data?.msg || '批量审核回复失败')
    }
  },

  // 评论统计报表
  async getReviewStatistics(filter: {
    startDate?: string
    endDate?: string
    groupBy?: 'day' | 'week' | 'month'
  }): Promise<AdminStatistics> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_STATISTICS}`
      const response = await axios.get(url, {
        params: filter,
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取评论统计失败:', error)
      throw new Error(error.response?.data?.msg || '获取评论统计失败')
    }
  },

  // 6. 标签相关接口

  // 获取启用的标签列表（用户创建评论时选择）
  async getEnabledTags(): Promise<ReviewTag[]> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.TAGS_ENABLED}`
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      })
      return response.data.data || []
    } catch (error: any) {
      console.error('获取启用标签失败:', error)
      throw new Error(error.response?.data?.msg || '获取启用标签失败')
    }
  },

  // 获取热门标签
  async getPopularTags(limit?: number): Promise<ReviewTag[]> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.TAGS_POPULAR}`
      const response = await axios.get(url, {
        params: limit ? { limit } : {},
        headers: getAuthHeaders()
      })
      return response.data.data || []
    } catch (error: any) {
      console.error('获取热门标签失败:', error)
      throw new Error(error.response?.data?.msg || '获取热门标签失败')
    }
  },

  // 获取评论的标签列表
  async getReviewTags(reviewId: number): Promise<ReviewTag[]> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.REVIEW_TAGS.replace('{reviewId}', reviewId.toString())}`
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      })
      return response.data.data || []
    } catch (error: any) {
      console.error('获取评论标签失败:', error)
      throw new Error(error.response?.data?.msg || '获取评论标签失败')
    }
  },

  // 7. 标签管理接口（管理端）

  // 获取所有标签
  async getAllTags(): Promise<ReviewTag[]> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_TAGS}`
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取所有标签失败:', error)
      throw new Error(error.response?.data?.msg || '获取所有标签失败')
    }
  },

  // 创建标签
  async createTag(tagData: {
    name: string
    type: number
    sortOrder?: number
    status?: number
  }): Promise<ReviewTag> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_TAGS}`
      const response = await axios.post(url, tagData, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('创建标签失败:', error)
      throw new Error(error.response?.data?.msg || '创建标签失败')
    }
  },

  // 更新标签
  async updateTag(tagId: number, tagData: {
    name?: string
    type?: number
    sortOrder?: number
    status?: number
  }): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_TAGS}/${tagId}`
      const response = await axios.put(url, tagData, {
        headers: getAuthHeaders()
      })
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('更新标签失败:', error)
      throw new Error(error.response?.data?.msg || '更新标签失败')
    }
  },

  // 删除标签
  async deleteTag(tagId: number): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_TAGS}/${tagId}`
      const response = await axios.delete(url, {
        headers: getAuthHeaders()
      })
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('删除标签失败:', error)
      throw new Error(error.response?.data?.msg || '删除标签失败')
    }
  },

  // 批量更新标签状态
  async batchUpdateTagStatus(statusData: BatchStatusRequest): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.ADMIN_TAGS}/batch-status`
      const response = await axios.post(url, statusData, {
        headers: getAuthHeaders()
      })
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('批量更新标签状态失败:', error)
      throw new Error(error.response?.data?.msg || '批量更新标签状态失败')
    }
  }
}
