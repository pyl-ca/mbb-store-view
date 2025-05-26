// API配置文件
export const API_BASE_URL = 'http://localhost:9999'

// 各服务的API端点
export const API_ENDPOINTS = {
  // 用户服务
  USER_SERVICE: {
    BASE: `${API_BASE_URL}/user-service/api/v1`,
    PROFILE: '/profile',
    ADDRESSES: '/addresses',
    REGIONS: '/regions/tree'
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
    CONFIRM: '/orders/{orderSn}/confirm'
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
  authRegister: () => buildApiUrl('AUTH_SERVICE', API_ENDPOINTS.AUTH_SERVICE.REGISTER)
}
