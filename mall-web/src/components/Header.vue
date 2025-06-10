<template>
    <div class="header">
      <el-row class="header-content">
        <el-col :span="4">
          <div class="logo">
            <router-link to="/">
              <h1>Mall商城</h1>
            </router-link>
          </div>
        </el-col>
        <template v-if="!logoOnly">
          <el-col :span="12">
            <div class="search">
              <el-input
                v-model="searchText"
                placeholder="请输入商品名称"
                class="search-input"
              >
                <template #append>
                  <el-button type="primary" @click="handleSearch">
                    搜索
                  </el-button>
                </template>
              </el-input>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="user-actions">
              <el-button type="text" @click="goToUserOrders">订单管理</el-button>
              <el-divider direction="vertical" />
              <el-button type="text" @click="goToCart">
                <el-badge :value="cartCount" class="cart-badge">
                  <el-icon><ShoppingCart /></el-icon> 购物车
                </el-badge>
              </el-button>
              <el-divider direction="vertical" />
              <el-button type="text" @click="goToUserFavorites">
                <el-badge :value="favoriteCount" class="favorite-badge">
                  <el-icon><Star /></el-icon> 收藏
                </el-badge>
              </el-button>
              <el-divider direction="vertical" />
              <el-dropdown v-if="isLoggedIn">
                <span class="user-profile">
                  {{ username }}
                  <el-icon><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="goToUserCenter">个人中心</el-dropdown-item>
                    <el-dropdown-item @click="goToUserOrders">我的订单</el-dropdown-item>
                    <el-dropdown-item @click="goToUserFavorites">收藏夹</el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <template v-else>
                <el-button type="text" @click="showLogin">登录</el-button>
                <el-button type="text" @click="showRegister">注册</el-button>
              </template>
            </div>
          </el-col>
        </template>
      </el-row>
      <nav v-if="!logoOnly">
        <ul>
          <!-- Removed order management link -->
        </ul>
      </nav>
    </div>
  </template>

  <script setup lang="ts">
    import { ref, defineProps, onMounted, onUnmounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { ShoppingCart, ArrowDown, Star } from '@element-plus/icons-vue'
    import axios from 'axios'
    import { favoriteApi } from '../api/favorite'

    const props = defineProps({
      logoOnly: {
        type: Boolean,
        default: false
      }
    })

    const router = useRouter()
    const searchText = ref('')
    const cartCount = ref(0)
    const favoriteCount = ref(0)
    const isLoggedIn = ref(false)
    const username = ref('用户名')

    // 加载收藏数量
    const loadFavoriteCount = async () => {
      if (isLoggedIn.value) {
        try {
          favoriteCount.value = await favoriteApi.getFavoritesCount()
        } catch (error) {
          console.error('加载收藏数量失败:', error)
          favoriteCount.value = 0
        }
      } else {
        favoriteCount.value = 0
      }
    }

    // 检查登录状态的函数
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const userInfo = localStorage.getItem('user_info')
      if (token && userInfo) {
        isLoggedIn.value = true
        try {
          const user = JSON.parse(userInfo)
          username.value = user.username || user.nickname || '用户'
        } catch {
          username.value = '用户'
        }
        // 登录后加载收藏数量
        await loadFavoriteCount()
      } else {
        isLoggedIn.value = false
        username.value = '用户名'
        favoriteCount.value = 0
      }
    }

    // 监听 localStorage 变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'token' || e.key === 'user_info') {
        checkLoginStatus()
      }
    }

    // 检查本地登录状态
    onMounted(() => {
      checkLoginStatus()
      // 监听 localStorage 变化
      window.addEventListener('storage', handleStorageChange)

      // 监听自定义登录事件
      window.addEventListener('userLogin', checkLoginStatus)
      window.addEventListener('userLogout', checkLoginStatus)
    })

    onUnmounted(() => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userLogin', checkLoginStatus)
      window.removeEventListener('userLogout', checkLoginStatus)
    })

    const handleSearch = async () => {
      try {
        const response = await axios.get('/product-service/api/v1/products/select', {
          params: {
            page: 1,
            size: 10,
            categoryId: null, // 可以根据需要设置
            keyword: searchText.value
          }
        });
        console.log(response.data);
        // 在此处处理搜索结果，例如导航到结果页面
        router.push({ path: '/SearchResults', query: { keyword: searchText.value } });
      } catch (error) {
        console.error('搜索请求失败', error);
      }
    };

    const goToCart = () => {
      router.push('/cart')
    }

    const showLogin = () => {
      router.push('/login');
    }

    const showRegister = () => {
      router.push('/register');
    }

    const handleLogout = () => {
      // 清除本地登录信息
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('username')
      localStorage.removeItem('user_info')

      // 更新状态
      isLoggedIn.value = false
      username.value = '用户名'

      // 触发退出事件，通知其他组件更新状态
      window.dispatchEvent(new CustomEvent('userLogout'))

      // 跳转到登录页
      router.push('/login')
    }

    // 用户中心相关导航
    const goToUserCenter = () => {
      router.push('/user/profile')
    }

    const goToUserOrders = () => {
      router.push('/user/orders')
    }

    const goToUserFavorites = () => {
      router.push('/user/favorites')
    }
  </script>

  <style scoped>
    .header {
      background: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,.1);
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 1000;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 15px;
      display: flex;
      align-items: center;
    }

    .logo h1 {
      margin: 0;
      font-size: 24px;
      color: #409EFF;
    }

    .search {
      padding: 0 20px;
    }

    .search-input {
      width: 100%;
    }

    .user-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 15px;
    }

    .cart-badge,
    .favorite-badge {
      margin-right: 10px;
    }

    .user-profile {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
  </style>
