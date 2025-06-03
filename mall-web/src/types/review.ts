// 评论相关类型定义

// 评论标签
export interface ReviewTag {
  id: number
  name: string
  type: number
  typeName: string
  sortOrder?: number
  status?: number
}

// 回复
export interface Reply {
  id: number
  reviewId: number
  parentId?: number
  userId: number
  userNickname: string
  userAvatar: string
  replyToUserId?: number
  replyToNickname?: string
  content: string
  isMerchant: boolean
  likeCount: number
  isLiked: boolean
  status: number
  statusName: string
  createTime: string
  children?: Reply[]
}

// 评论
export interface Review {
  id: number | string  // 支持数字和字符串类型的ID
  productId: number
  productName?: string
  productImage?: string
  productSpec?: string  // 商品规格（冗余字段）
  skuId?: number
  orderId?: number
  orderSn?: string
  userId: number
  userNickname: string
  userAvatar: string
  isAnonymous: boolean
  rating: number
  ratingName: string
  content: string
  images: string[]
  specInfo?: string
  likeCount: number
  replyCount: number
  isLiked: boolean
  isTop: boolean
  status: number // 0-待审核 1-已通过 2-已拒绝 3-已删除
  statusName: string
  createTime: string
  updateTime?: string
  tags?: ReviewTag[]
  replies?: Reply[]
}

// 评论统计
export interface ReviewStats {
  productId?: number
  totalCount: number
  averageRating: number
  ratingDistribution: {
    [key: string]: number // 1-5星的数量分布
  }
  hasImageCount: number
  hasImageRate?: number
}

// 筛选条件
export interface ReviewFilter {
  productId?: number
  userId?: number
  orderSn?: string
  rating?: number
  hasImage?: boolean
  status?: number
  sortBy?: 'time' | 'like' | 'rating'
  sortOrder?: 'asc' | 'desc'
  page: number
  size: number
}

// 分页响应
export interface ReviewListResponse {
  records: Review[]
  total: number
  size: number
  current: number
  pages: number
}

// 创建评论请求
export interface CreateReviewRequest {
  productId: number
  productName: string      // 商品名称（冗余字段）
  productImage: string     // 商品主图（冗余字段）
  productSpec: string      // 商品规格（冗余字段）
  skuId?: number
  orderId?: number
  orderSn: string
  userNickname?: string    // 用户昵称
  userAvatar?: string      // 用户头像
  isAnonymous: boolean
  rating: number
  content: string
  images?: string[]
  specInfo?: string
  tagIds?: number[]
}

// 创建回复请求
export interface CreateReplyRequest {
  reviewId: number
  parentId?: number
  replyToUserId?: number
  content: string
  isMerchant?: boolean
}

// 审核请求
export interface AuditRequest {
  reviewIds: number[]
  status: number
  reason?: string
}

// 批量状态更新请求
export interface BatchStatusRequest {
  tagIds: number[]
  status: number
}

// 评论表单数据
export interface ReviewFormData {
  rating: number
  content: string
  images: string[]
  isAnonymous: boolean
  tagIds?: number[]
}

// 文件上传响应
export interface UploadResponse {
  url: string
  originalName?: string
  size?: number
}

export interface BatchUploadResponse {
  urls: string[]
}

// API响应格式
export interface ReviewApiResponse<T = any> {
  code: string
  msg: string
  data: T
}

// 管理端统计
export interface AdminStatistics {
  totalReviews: number
  pendingReviews: number
  approvedReviews: number
  rejectedReviews: number
  averageRating: number
  dailyStats: Array<{
    date: string
    reviewCount: number
    averageRating: number
  }>
}
