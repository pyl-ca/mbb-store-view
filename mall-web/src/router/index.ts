import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../pages/Home.vue') },
  { path: '/product/:id', name: 'ProductDetail', component: () => import('../pages/ProductDetail.vue') },
  { path: '/cart', name: 'Cart', component: () => import('../pages/Cart.vue') },
  { path: '/login', name: 'Login', component: () => import('../pages/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../pages/Register.vue') },

  { path: '/SearchResults', name: 'SearchResults', component: () => import('../pages/SearchResults.vue') },

  // 订单相关路由
  { path: '/order-confirm', name: 'OrderConfirm', component: () => import('../pages/OrderConfirm.vue'), meta: { requiresAuth: true } },
  { path: '/order-detail/:orderSn', name: 'OrderDetail', component: () => import('../pages/OrderDetail.vue'), meta: { requiresAuth: true } },
  { path: '/payment', name: 'Payment', component: () => import('../pages/Payment.vue'), meta: { requiresAuth: true } },
  { path: '/payment-success', name: 'PaymentSuccess', component: () => import('../pages/PaymentSuccess.vue'), meta: { requiresAuth: true } },

  // 退货相关路由
  { path: '/refund/apply', name: 'RefundApply', component: () => import('../pages/RefundApply.vue'), meta: { requiresAuth: true } },
  { path: '/refund/detail/:refundSn', name: 'RefundDetail', component: () => import('../pages/RefundDetail.vue'), meta: { requiresAuth: true } },

  // 钱包页面
  { path: '/wallet', name: 'Wallet', component: () => import('../pages/Wallet.vue'), meta: { requiresAuth: true } },

  // 评论功能演示页面
  { path: '/review-demo', name: 'ReviewDemo', component: () => import('../pages/ReviewDemo.vue') },

  // 创建评论页面
  { path: '/create-review', name: 'CreateReview', component: () => import('../pages/CreateReview.vue'), meta: { requiresAuth: true } },

  // 退款调试页面
  { path: '/refund-debug', name: 'RefundDebug', component: () => import('../pages/RefundDebug.vue') },

  // 测试页面
  { path: '/test-platform-funds', name: 'TestPlatformFunds', component: () => import('../pages/TestPlatformFunds.vue') },
  { path: '/image-url-test', name: 'ImageUrlTest', component: () => import('../pages/ImageUrlTest.vue') },

  // 用户中心相关路由
  {
    path: '/user',
    name: 'UserCenter',
    component: () => import('../pages/user/UserCenter.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../pages/user/UserProfile.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'address',
        name: 'UserAddress',
        component: () => import('../pages/user/UserAddress.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'UserOrders',
        component: () => import('../pages/user/UserOrders.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'favorites',
        name: 'UserFavorites',
        component: () => import('../pages/user/UserFavorites.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'reviews',
        name: 'UserReviews',
        component: () => import('../pages/user/UserReviews.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'refunds',
        name: 'UserRefunds',
        component: () => import('../pages/user/UserRefunds.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // 管理员后台路由
  { path: '/admin/dashboard', name: 'AdminDashboard', component: () => import('../pages/admin/Dashboard.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/platform-funds', name: 'PlatformFunds', component: () => import('../pages/admin/PlatformFunds.vue'), meta: { requiresAuth: true, requiresAdmin: true } },

  // 商品管理路由
  { path: '/admin/product-management', name: 'ProductManagement', component: () => import('../pages/admin/ProductManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/category-management', name: 'CategoryManagement', component: () => import('../pages/admin/CategoryManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },

  // 订单管理路由
  { path: '/admin/order-management', name: 'OrderManagement', component: () => import('../pages/admin/OrderManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/delivery-management', name: 'DeliveryManagement', component: () => import('../pages/admin/DeliveryManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },

  // 退款管理路由
  { path: '/admin/refund-management', name: 'RefundManagement', component: () => import('../pages/admin/RefundManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/refund-audit', name: 'RefundAudit', component: () => import('../pages/admin/RefundAudit.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/refund-stats', name: 'RefundStats', component: () => import('../pages/admin/RefundStats.vue'), meta: { requiresAuth: true, requiresAdmin: true } },

  // 用户管理路由
  { path: '/admin/user-management', name: 'UserManagement', component: () => import('../pages/admin/UserManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/role-management', name: 'RoleManagement', component: () => import('../pages/admin/RoleManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/menu-management', name: 'MenuManagement', component: () => import('../pages/admin/MenuManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },

  // 评论管理路由
  { path: '/admin/review-management', name: 'ReviewManagement', component: () => import('../pages/admin/ReviewManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/review-tag-management', name: 'ReviewTagManagement', component: () => import('../pages/admin/ReviewTagManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由导航守卫
router.beforeEach((to, _from, next) => {
  // 检查路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查用户是否已登录
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) {
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 检查是否需要管理员权限
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      const userInfoStr = localStorage.getItem('user_info')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        const roles = userInfo.roles || []
        // 支持多种角色格式
        const isAdmin = roles.some((role: string) =>
          role === 'ADMIN' || role === 'MANAGER' ||
          role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER'
        )

        console.log('权限检查 - 用户角色:', roles, '是否管理员:', isAdmin)

        if (!isAdmin) {
          // 不是管理员，重定向到商城首页
          console.log('用户无管理员权限，重定向到首页')
          next('/')
          return
        }
      } else {
        // 没有用户信息，重定向到登录页
        console.log('无用户信息，重定向到登录页')
        next('/login')
        return
      }
    }

    // 已登录且权限检查通过，允许访问
    next()
  } else {
    // 不需要认证的路由，直接放行
    next()
  }
})

export default router
