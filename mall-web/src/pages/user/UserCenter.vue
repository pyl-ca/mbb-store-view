<template>
  <div class="user-center-container">
    <!-- 左侧导航菜单 -->
    <div class="sidebar">
      <div class="user-info">
        <div class="avatar-container">
          <img :src="userAvatar" class="avatar" alt="用户头像" />
        </div>
        <div class="username">{{ userInfo.nickname || userInfo.username }}</div>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="user-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="profile">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </el-menu-item>
        <el-menu-item index="address">
          <el-icon><Location /></el-icon>
          <span>收货地址</span>
        </el-menu-item>
        <el-menu-item index="wallet" @click="goToWallet">
          <el-icon><Wallet /></el-icon>
          <span>我的钱包</span>
        </el-menu-item>
        <el-divider />
        <el-menu-item index="cart" @click="goToCart">
          <el-icon><ShoppingCart /></el-icon>
          <span>我的购物车</span>
        </el-menu-item>
        <el-menu-item index="orders">
          <el-icon><Tickets /></el-icon>
          <span>我的订单</span>
        </el-menu-item>
        <el-menu-item index="favorites">
          <el-icon><Star /></el-icon>
          <span>宝贝收藏</span>
        </el-menu-item>
        <el-menu-item index="reviews">
          <el-icon><ChatDotRound /></el-icon>
          <span>评价管理</span>
        </el-menu-item>
        <el-menu-item index="refunds">
          <el-icon><RefreshLeft /></el-icon>
          <span>退款记录</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  User,
  Location,
  Wallet,
  ShoppingCart,
  Tickets,
  Star,
  ChatDotRound,
  RefreshLeft
} from '@element-plus/icons-vue'
import axios from 'axios'
import { API_BASE_URL } from '../../api/config'

const router = useRouter()
const route = useRoute()

// 用户信息
const userInfo = ref<any>({
  username: '',
  nickname: '',
  avatar: '',
  gender: 0,
  mobile: '',
  email: ''
})

// 计算当前激活的菜单项
const activeMenu = computed(() => {
  const path = route.path
  if (path.includes('/user/profile')) return 'profile'
  if (path.includes('/user/address')) return 'address'
  if (path.includes('/user/orders')) return 'orders'
  if (path.includes('/user/favorites')) return 'favorites'
  if (path.includes('/user/reviews')) return 'reviews'
  if (path.includes('/user/refunds')) return 'refunds'
  return 'profile'
})

// 计算用户头像
const userAvatar = computed(() => {
  if (!userInfo.value.avatar) {
    return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  }
  if (userInfo.value.avatar.startsWith('http')) {
    return userInfo.value.avatar
  }

  // 根据API文档，头像路径格式为 /uploads/1718694123456-avatar.jpg
  // 需要转换为完整的访问路径：{API_BASE_URL}/user-service/uploads/{头像文件名}
  let avatarUrl = ''
  if (userInfo.value.avatar.startsWith('/uploads/')) {
    avatarUrl = `${API_BASE_URL}/user-service${userInfo.value.avatar}`
  } else {
    // 兼容其他格式
    avatarUrl = `${API_BASE_URL}/user-service/uploads/${userInfo.value.avatar}`
  }

  console.log('用户头像URL:', avatarUrl)
  return avatarUrl
})

// 菜单选择处理
const handleMenuSelect = (index: string) => {
  if (index === 'cart') return // 购物车有特殊处理
  router.push(`/user/${index}`)
}

// 跳转到购物车页面
const goToCart = () => {
  router.push('/cart')
}

// 跳转到钱包页面
const goToWallet = () => {
  router.push('/wallet')
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await axios.get('/user-service/api/v1/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.data.code === '000000') {
      userInfo.value = response.data.data
      console.log('UserCenter - 获取到的用户数据:', userInfo.value)
      console.log('UserCenter - 头像路径:', userInfo.value.avatar)
      console.log('UserCenter - 计算后的头像URL:', userAvatar.value)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(() => {
  // 如果当前路径是 /user，重定向到 /user/profile
  if (route.path === '/user') {
    router.replace('/user/profile')
  }

  // 获取用户信息
  fetchUserInfo()
})
</script>

<style scoped>
.user-center-container {
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #f5f5f5;
  padding: 20px;
}

.sidebar {
  width: 240px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-right: 20px;
  overflow: hidden;
}

.user-info {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-container {
  margin-bottom: 10px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.user-menu {
  border-right: none;
}

.content {
  flex: 1;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  overflow: hidden;
}
</style>
