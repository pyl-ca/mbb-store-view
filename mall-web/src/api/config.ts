// API配置文件
export const API_BASE_URL = 'http://localhost:9999'

// 各服务的API端点
export const API_ENDPOINTS = {
  // 用户服务
  USER_SERVICE: {
    BASE: `${API_BASE_URL}/user-service/api/v1`,
    PROFILE: '/profile',
    ADDRESSES: '/addresses',
    REGIONS: '/regions/tree',
    FAVORITES: '/favorites',
    // 管理员用户管理API
    ADMIN_USERS: '/admin/users',
    ADMIN_ROLES: '/admin/roles',
    ADMIN_MENUS: '/admin/menus'
  },

  // 商品服务
  PRODUCT_SERVICE: {
    BASE: `${API_BASE_URL}/product-service/api/v1`,
    PRODUCTS: '/products',
    SKU: '/sku',
    CATEGORIES: '/categories',
    BANNERS: '/banners',
    SPECS: '/specs'
  },

  // 购物车服务
  CART_SERVICE: {
    BASE: `${API_BASE_URL}/cart-service/api`,
    CART: '/cart',
    ADD: '/cart/add',
    CLEAR: '/cart/clear'
  },

  // 订单服务
  ORDER_SERVICE: {
    BASE: `${API_BASE_URL}/order-service/api/v1`,
    ORDERS: '/orders',
    PAY: '/orders/pay',
    CANCEL: '/orders/{orderSn}/cancel',
    CONFIRM: '/orders/{orderSn}/confirm',
    ADMIN_ALL: '/orders/admin/all',
    ADMIN_PENDING_DELIVERY: '/orders/admin/pending-delivery',
    EXPRESS_COMPANIES: '/delivery/express/companies'
  },

  // 支付服务
  PAYMENT_SERVICE: {
    BASE: `${API_BASE_URL}/payment-service/api/v1`,
    BALANCE: '/balance',
    UNIFIED_PAY: '/payment/unified-pay',
    BALANCE_PAY: '/payment/balance-pay', // 保留旧接口以防兼容性问题
    RECORDS: '/payment/records',
    RECHARGE: '/recharge',
    PAY_PASSWORD: '/pay-password'
  },

  // 认证服务
  AUTH_SERVICE: {
    BASE: `${API_BASE_URL}/mbb-auth`,
    TOKEN: '/oauth/token',
    REGISTER: '/auth/register/register'
  },

  // 物流服务
  DELIVERY_SERVICE: {
    BASE: `${API_BASE_URL}/order-service/api/v1`,
    CREATE: '/delivery/create',
    ORDER_DELIVERY: '/delivery/order',
    TRACKING: '/delivery/tracking',
    CONFIRM: '/delivery/confirm',
    SIMULATE: '/delivery/simulate',
    BATCH: '/delivery/batch'
  },

  // 退货服务
  REFUND_SERVICE: {
    BASE: `${API_BASE_URL}/payment-service/api/v1`,
    REFUNDS: '/refunds',
    USER_REFUNDS: '/refunds/user',
    REFUND_DETAIL: '/refunds/{refundSn}',
    REFUND_BY_ORDER: '/refunds/order/{orderSn}',
    REFUND_STATS: '/refunds/stats',
    REFUND_UPLOAD: '/refunds/upload',
    REFUND_EXECUTE: '/refunds/{refundSn}/execute',
    REFUND_APPROVE: '/refunds/{refundSn}/approve',
    REFUND_REJECT: '/refunds/{refundSn}/reject',
    REFUND_PROCESS: '/refunds/{refundSn}/process',
    PLATFORM_ACCOUNTS: '/platform/accounts',
    FUND_FLOWS: '/platform/fund-flows',
    USER_BALANCE_FLOWS: '/users/balance-flows',
    // 兼容旧接口
    APPLY: '/refund/apply',
    ORDER_REFUND: '/refund/order',
    LIST: '/refund/list',
    APPROVE: '/refund/approve',
    REJECT: '/refund/reject'
  },

  // 评论服务
  REVIEW_SERVICE: {
    BASE: `${API_BASE_URL}/review-service/api/v1`,
    REVIEWS: '/reviews',
    PRODUCT_REVIEWS: '/reviews/product/{productId}',
    USER_REVIEWS: '/reviews/user/{userId}',
    REVIEW_DETAIL: '/reviews/{reviewId}',
    REVIEW_LIKE: '/reviews/{reviewId}/like',
    REVIEW_DELETE: '/reviews/{reviewId}',
    REVIEW_AUDIT: '/reviews/audit',
    REVIEW_TOP: '/reviews/{reviewId}/top',
    PRODUCT_STATS: '/reviews/stats/product/{productId}',
    CHECK_PERMISSION: '/reviews/check-permission',
    CHECK_REVIEWED: '/reviews/check-reviewed',

    // 回复相关
    REPLIES: '/replies',
    REVIEW_REPLIES: '/replies/review/{reviewId}',
    REPLY_PAGE: '/replies/page',
    REPLY_DETAIL: '/replies/{replyId}',
    REPLY_LIKE: '/replies/{replyId}/like',
    REPLY_DELETE: '/replies/{replyId}',

    // 标签相关
    TAGS_ENABLED: '/review-tags/enabled',
    TAGS_POPULAR: '/review-tags/popular',
    REVIEW_TAGS: '/review-tags/review/{reviewId}',

    // 文件上传
    UPLOAD_IMAGES: '/upload/review-images',
    UPLOAD_IMAGE: '/upload/review-image',

    // 管理端
    ADMIN_REVIEWS: '/admin/reviews',
    ADMIN_BATCH_AUDIT: '/admin/reviews/batch-audit',
    ADMIN_REPLIES: '/admin/replies',
    ADMIN_STATISTICS: '/admin/reviews/statistics',
    ADMIN_TAGS: '/admin/tags',

    // 商家评论搜索
    MERCHANT_REVIEWS: '/reviews/merchant/reviews'
  },

  // 统计服务
  STATS_SERVICE: {
    ORDER_COUNT: `${API_BASE_URL}/order-service/api/internal/stats/orders/count`,
    USER_COUNT: `${API_BASE_URL}/user-service/api/internal/stats/users/count`,
    PRODUCT_COUNT: `${API_BASE_URL}/product-service/api/internal/stats/products/count`,
    ORDER_REVENUE: `${API_BASE_URL}/order-service/api/internal/stats/orders/revenue`
  }
}

// 构建完整的API URL
export function buildApiUrl(service: string, endpoint: string, params?: Record<string, string>): string {
  const serviceConfig = API_ENDPOINTS[service as keyof typeof API_ENDPOINTS] as any
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${service}`)
  }

  let url = serviceConfig.BASE + endpoint

  // 替换URL中的参数占位符
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value)
    })
  }

  return url
}

// 常用的API URL构建函数
export const apiUrls = {
  // 用户相关
  userProfile: () => buildApiUrl('USER_SERVICE', API_ENDPOINTS.USER_SERVICE.PROFILE),
  userAddresses: () => buildApiUrl('USER_SERVICE', API_ENDPOINTS.USER_SERVICE.ADDRESSES),
  userRegions: () => buildApiUrl('USER_SERVICE', API_ENDPOINTS.USER_SERVICE.REGIONS),

  // 收藏相关
  favoritesList: () => buildApiUrl('USER_SERVICE', API_ENDPOINTS.USER_SERVICE.FAVORITES),
  favoritesAdd: (productId: string) => buildApiUrl('USER_SERVICE', `${API_ENDPOINTS.USER_SERVICE.FAVORITES}/${productId}`),
  favoritesRemove: (productId: string) => buildApiUrl('USER_SERVICE', `${API_ENDPOINTS.USER_SERVICE.FAVORITES}/${productId}`),
  favoritesCheck: (productId: string) => buildApiUrl('USER_SERVICE', `${API_ENDPOINTS.USER_SERVICE.FAVORITES}/check/${productId}`),
  favoritesCount: () => buildApiUrl('USER_SERVICE', `${API_ENDPOINTS.USER_SERVICE.FAVORITES}/count`),
  favoritesProductCount: (productId: string) => buildApiUrl('USER_SERVICE', `${API_ENDPOINTS.USER_SERVICE.FAVORITES}/product/${productId}/count`),

  // 商品相关
  productDetail: (id: string) => buildApiUrl('PRODUCT_SERVICE', `${API_ENDPOINTS.PRODUCT_SERVICE.PRODUCTS}/${id}`),
  productSku: (skuId: string) => buildApiUrl('PRODUCT_SERVICE', `${API_ENDPOINTS.PRODUCT_SERVICE.SKU}/${skuId}`),
  productCategories: () => buildApiUrl('PRODUCT_SERVICE', `${API_ENDPOINTS.PRODUCT_SERVICE.CATEGORIES}/tree`),
  productBanners: () => buildApiUrl('PRODUCT_SERVICE', `${API_ENDPOINTS.PRODUCT_SERVICE.BANNERS}/list`),
  productRecommend: () => buildApiUrl('PRODUCT_SERVICE', `${API_ENDPOINTS.PRODUCT_SERVICE.PRODUCTS}/recommend`),
  productSearch: () => buildApiUrl('PRODUCT_SERVICE', `${API_ENDPOINTS.PRODUCT_SERVICE.PRODUCTS}/select`),

  // 购物车相关
  cartList: () => buildApiUrl('CART_SERVICE', API_ENDPOINTS.CART_SERVICE.CART),
  cartAdd: () => buildApiUrl('CART_SERVICE', API_ENDPOINTS.CART_SERVICE.ADD),
  cartItem: (id: string) => buildApiUrl('CART_SERVICE', `${API_ENDPOINTS.CART_SERVICE.CART}/${id}`),
  cartQuantity: (id: string) => buildApiUrl('CART_SERVICE', `${API_ENDPOINTS.CART_SERVICE.CART}/${id}/quantity`),
  cartSelected: (id: string) => buildApiUrl('CART_SERVICE', `${API_ENDPOINTS.CART_SERVICE.CART}/${id}/selected`),
  cartClear: () => buildApiUrl('CART_SERVICE', API_ENDPOINTS.CART_SERVICE.CLEAR),

  // 订单相关
  orderCreate: () => buildApiUrl('ORDER_SERVICE', API_ENDPOINTS.ORDER_SERVICE.ORDERS),
  orderDetail: (orderSn: string) => buildApiUrl('ORDER_SERVICE', `${API_ENDPOINTS.ORDER_SERVICE.ORDERS}/${orderSn}`),
  orderList: () => buildApiUrl('ORDER_SERVICE', API_ENDPOINTS.ORDER_SERVICE.ORDERS),

  // 支付相关
  paymentBalance: () => buildApiUrl('PAYMENT_SERVICE', API_ENDPOINTS.PAYMENT_SERVICE.BALANCE),
  paymentUnifiedPay: () => buildApiUrl('PAYMENT_SERVICE', API_ENDPOINTS.PAYMENT_SERVICE.UNIFIED_PAY),
  paymentBalancePay: () => buildApiUrl('PAYMENT_SERVICE', API_ENDPOINTS.PAYMENT_SERVICE.BALANCE_PAY),
  paymentRecords: () => buildApiUrl('PAYMENT_SERVICE', API_ENDPOINTS.PAYMENT_SERVICE.RECORDS),
  paymentRecharge: () => buildApiUrl('PAYMENT_SERVICE', API_ENDPOINTS.PAYMENT_SERVICE.RECHARGE),
  payPasswordCheck: () => buildApiUrl('PAYMENT_SERVICE', `${API_ENDPOINTS.PAYMENT_SERVICE.PAY_PASSWORD}/check`),
  payPasswordSet: () => buildApiUrl('PAYMENT_SERVICE', `${API_ENDPOINTS.PAYMENT_SERVICE.PAY_PASSWORD}/set`),

  // 认证相关
  authToken: () => buildApiUrl('AUTH_SERVICE', API_ENDPOINTS.AUTH_SERVICE.TOKEN),
  authRegister: () => buildApiUrl('AUTH_SERVICE', API_ENDPOINTS.AUTH_SERVICE.REGISTER),

  // 物流相关
  deliveryCreate: () => buildApiUrl('DELIVERY_SERVICE', API_ENDPOINTS.DELIVERY_SERVICE.CREATE),
  deliveryByOrder: (orderSn: string) => buildApiUrl('DELIVERY_SERVICE', `${API_ENDPOINTS.DELIVERY_SERVICE.ORDER_DELIVERY}/${orderSn}`),
  deliveryTracking: (trackingNumber: string) => buildApiUrl('DELIVERY_SERVICE', `${API_ENDPOINTS.DELIVERY_SERVICE.TRACKING}/${trackingNumber}`),
  deliveryConfirm: (orderSn: string) => buildApiUrl('DELIVERY_SERVICE', `${API_ENDPOINTS.DELIVERY_SERVICE.CONFIRM}/${orderSn}`),
  expressCompanies: () => buildApiUrl('DELIVERY_SERVICE', API_ENDPOINTS.DELIVERY_SERVICE.EXPRESS_COMPANIES),
  deliverySimulate: (trackingNumber: string) => buildApiUrl('DELIVERY_SERVICE', `${API_ENDPOINTS.DELIVERY_SERVICE.SIMULATE}/${trackingNumber}`),
  deliveryBatch: () => buildApiUrl('DELIVERY_SERVICE', API_ENDPOINTS.DELIVERY_SERVICE.BATCH),

  // 退货相关
  refunds: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUNDS),
  userRefunds: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.USER_REFUNDS),
  refundDetail: (refundSn: string) => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUND_DETAIL.replace('{refundSn}', refundSn)),
  refundByOrder: (orderSn: string) => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUND_BY_ORDER.replace('{orderSn}', orderSn)),
  refundStats: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUND_STATS),
  refundUpload: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUND_UPLOAD),
  refundExecute: (refundSn: string) => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUND_EXECUTE.replace('{refundSn}', refundSn)),
  refundApprove: (refundSn: string) => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUND_APPROVE.replace('{refundSn}', refundSn)),
  refundReject: (refundSn: string) => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUND_REJECT.replace('{refundSn}', refundSn)),
  refundProcess: (refundSn: string) => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.REFUND_PROCESS.replace('{refundSn}', refundSn)),
  platformAccounts: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.PLATFORM_ACCOUNTS),
  fundFlows: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.FUND_FLOWS),
  userBalanceFlows: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.USER_BALANCE_FLOWS),
  // 兼容旧接口
  refundApply: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.APPLY),
  refundList: () => buildApiUrl('REFUND_SERVICE', API_ENDPOINTS.REFUND_SERVICE.LIST),

  // 评论相关
  reviews: () => buildApiUrl('REVIEW_SERVICE', API_ENDPOINTS.REVIEW_SERVICE.REVIEWS),
  userReviews: () => buildApiUrl('REVIEW_SERVICE', API_ENDPOINTS.REVIEW_SERVICE.USER_REVIEWS),
  reviewStats: (productId: string) => buildApiUrl('REVIEW_SERVICE', `${API_ENDPOINTS.REVIEW_SERVICE.STATS}/${productId}`),
  reviewUpload: () => buildApiUrl('REVIEW_SERVICE', API_ENDPOINTS.REVIEW_SERVICE.UPLOAD),
  reviewCheck: () => buildApiUrl('REVIEW_SERVICE', API_ENDPOINTS.REVIEW_SERVICE.CHECK),
  reviewLike: (reviewId: string) => buildApiUrl('REVIEW_SERVICE', API_ENDPOINTS.REVIEW_SERVICE.LIKE.replace('{reviewId}', reviewId)),
  reviewReply: (reviewId: string) => buildApiUrl('REVIEW_SERVICE', API_ENDPOINTS.REVIEW_SERVICE.REPLY.replace('{reviewId}', reviewId)),
  reviewDetail: (reviewId: string) => buildApiUrl('REVIEW_SERVICE', `${API_ENDPOINTS.REVIEW_SERVICE.REVIEWS}/${reviewId}`),
  orderReviewStatus: (orderSn: string) => buildApiUrl('REVIEW_SERVICE', `${API_ENDPOINTS.REVIEW_SERVICE.REVIEWS}/order/${orderSn}/status`)
}
