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

  // 钱包页面
  { path: '/wallet', name: 'Wallet', component: () => import('../pages/Wallet.vue'), meta: { requiresAuth: true } },

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
      }
    ]
  },

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
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查用户是否已登录
    const token = localStorage.getItem('access_token')
    if (!token) {
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      // 已登录，允许访问
      next()
    }
  } else {
    // 不需要认证的路由，直接放行
    next()
  }
})

export default router
