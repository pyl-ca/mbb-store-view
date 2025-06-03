// 收藏相关类型定义

export interface FavoriteItem {
  id: number
  userId: number
  productId: number
  productName: string
  productPrice: number
  productImage: string
  productStock: number
  productStatus: boolean
  createTime: string
}

export interface FavoriteResponse {
  code: number
  message: string
  data: FavoriteItem[] | boolean | number
}

export interface FavoriteCheckResponse {
  code: number
  message: string
  data: boolean
}

export interface FavoriteCountResponse {
  code: number
  message: string
  data: number
}
