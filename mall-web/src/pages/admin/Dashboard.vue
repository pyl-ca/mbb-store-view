<template>
  <div class="admin-dashboard">
    <!-- 顶部导航栏 -->
    <div class="admin-header">
      <div class="header-left">
        <h1 class="admin-title">Mall商城管理后台</h1>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" :src="userInfo?.avatar">
              {{ userInfo?.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <span class="username">{{ userInfo?.username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人资料</el-dropdown-item>
              <el-dropdown-item command="settings">系统设置</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="admin-main">
      <!-- 侧边栏 -->
      <div class="admin-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表板</span>
          </el-menu-item>

          <el-sub-menu index="products">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>商品管理</span>
            </template>
            <el-menu-item index="products/list">商品列表</el-menu-item>
            <el-menu-item index="products/categories">商品分类</el-menu-item>
            <el-menu-item index="products/brands">品牌管理</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="orders">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>订单管理</span>
            </template>
            <el-menu-item index="orders/list">订单列表</el-menu-item>
            <el-menu-item index="orders/delivery">发货管理</el-menu-item>
            <el-menu-item index="orders/refunds">退款管理</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="finance">
            <template #title>
              <el-icon><Money /></el-icon>
              <span>财务管理</span>
            </template>
            <el-menu-item index="finance/platform-funds">平台资金</el-menu-item>
            <el-menu-item index="finance/refund-audit">退款审核</el-menu-item>
            <el-menu-item index="finance/transactions">交易流水</el-menu-item>
            <el-menu-item index="finance/reports">财务报表</el-menu-item>
          </el-sub-menu>

          <el-menu-item index="users/management">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
          </el-menu-item>

          <el-sub-menu index="reviews">
            <template #title>
              <el-icon><ChatDotRound /></el-icon>
              <span>评论管理</span>
            </template>
            <el-menu-item index="reviews/list">评论列表</el-menu-item>
            <el-menu-item index="reviews/tags">标签管理</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="marketing">
            <template #title>
              <el-icon><Present /></el-icon>
              <span>营销管理</span>
            </template>
            <el-menu-item index="marketing/coupons">优惠券管理</el-menu-item>
            <el-menu-item index="marketing/promotions">促销活动</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="system/roles">角色管理</el-menu-item>
            <el-menu-item index="system/menus">菜单管理</el-menu-item>
            <el-menu-item index="system/settings">系统设置</el-menu-item>
            <el-menu-item index="system/logs">操作日志</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>

      <!-- 内容区域 -->
      <div class="admin-content">
        <div v-if="activeMenu === 'dashboard'" class="dashboard-content">
          <!-- 数据统计卡片 -->
          <div class="stats-cards" v-loading="loading" element-loading-text="加载统计数据中...">
            <div class="stat-card">
              <div class="stat-icon orders">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalOrders.toLocaleString() }}</div>
                <div class="stat-label">总订单数</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon users">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalUsers.toLocaleString() }}</div>
                <div class="stat-label">总用户数</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon products">
                <el-icon><Goods /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalProducts.toLocaleString() }}</div>
                <div class="stat-label">商品总数</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon revenue">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ stats.totalRevenue }}</div>
                <div class="stat-label">总营收</div>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <h3>快捷操作</h3>
            <div class="action-buttons">
              <el-button type="primary" @click="handleMenuSelect('products/list')">
                <el-icon><Plus /></el-icon>
                添加商品
              </el-button>
              <el-button type="success" @click="handleMenuSelect('orders/list')">
                <el-icon><Document /></el-icon>
                查看订单
              </el-button>
              <el-button type="warning" @click="handleMenuSelect('users/management')">
                <el-icon><User /></el-icon>
                用户管理
              </el-button>
              <el-button type="info" @click="handleMenuSelect('finance/platform-funds')">
                <el-icon><Money /></el-icon>
                平台资金
              </el-button>
              <el-button type="warning" @click="handleMenuSelect('finance/refund-audit')">
                <el-icon><Document /></el-icon>
                退款审核
              </el-button>
              <el-button @click="handleMenuSelect('system/settings')">
                <el-icon><Setting /></el-icon>
                系统设置
              </el-button>
            </div>
          </div>
        </div>

        <!-- 发货管理页面 -->
        <div v-else-if="activeMenu === 'orders/delivery'" class="page-content">
          <DeliveryManagement />
        </div>

        <!-- 订单管理页面 -->
        <div v-else-if="activeMenu === 'orders/list'" class="page-content">
          <OrderManagement />
        </div>

        <!-- 退货管理页面 -->
        <div v-else-if="activeMenu === 'orders/refunds'" class="page-content">
          <RefundManagement />
        </div>

        <!-- 平台资金管理页面 -->
        <div v-else-if="activeMenu === 'finance/platform-funds'" class="page-content">
          <PlatformFunds />
        </div>

        <!-- 退款审核页面 -->
        <div v-else-if="activeMenu === 'finance/refund-audit'" class="page-content">
          <RefundAudit />
        </div>

        <!-- 调试页面 -->
        <div v-else-if="activeMenu === 'debug/orders'" class="page-content">
          <DebugOrders />
        </div>

        <!-- 用户管理页面 -->
        <div v-else-if="activeMenu === 'users/management'" class="page-content">
          <UserManagement />
        </div>

        <!-- 商品管理页面 -->
        <div v-else-if="activeMenu === 'products/list'" class="page-content">
          <ProductManagement />
        </div>

        <!-- 商品分类管理页面 -->
        <div v-else-if="activeMenu === 'products/categories'" class="page-content">
          <CategoryManagement />
        </div>

        <!-- 优惠券管理页面 -->
        <div v-else-if="activeMenu === 'marketing/coupons'" class="page-content">
          <CouponManagement />
        </div>

        <!-- 角色管理页面 -->
        <div v-else-if="activeMenu === 'system/roles'" class="page-content">
          <RoleManagement />
        </div>

        <!-- 菜单管理页面 -->
        <div v-else-if="activeMenu === 'system/menus'" class="page-content">
          <MenuManagement />
        </div>

        <!-- 评论管理页面 -->
        <div v-else-if="activeMenu === 'reviews/list'" class="page-content">
          <ReviewManagement />
        </div>

        <!-- 评论标签管理页面 -->
        <div v-else-if="activeMenu === 'reviews/tags'" class="page-content">
          <ReviewTagManagement />
        </div>

        <!-- 其他页面内容占位 -->
        <div v-else class="page-content">
          <div class="page-placeholder">
            <el-icon size="64"><Document /></el-icon>
            <h3>{{ getPageTitle() }}</h3>
            <p>该功能正在开发中...</p>
            <el-button type="primary" @click="activeMenu = 'dashboard'">返回仪表板</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  Odometer,
  Goods,
  Document,
  User,
  Present,
  Setting,
  Plus,
  Money,
  ChatDotRound
} from '@element-plus/icons-vue'
import { statsApi } from '../../api/stats'
// 动态导入组件
const DeliveryManagement = defineAsyncComponent(() => import('./DeliveryManagement.vue'))
const RefundManagement = defineAsyncComponent(() => import('./RefundManagement.vue'))
const RefundAudit = defineAsyncComponent(() => import('./RefundAudit.vue'))
const OrderManagement = defineAsyncComponent(() => import('./OrderManagement.vue'))
const DebugOrders = defineAsyncComponent(() => import('./DebugOrders.vue'))
const PlatformFunds = defineAsyncComponent(() => import('./PlatformFunds.vue'))
const UserManagement = defineAsyncComponent(() => import('./UserManagement.vue'))
const ProductManagement = defineAsyncComponent(() => import('./ProductManagement.vue'))
const CategoryManagement = defineAsyncComponent(() => import('./CategoryManagement.vue'))
const CouponManagement = defineAsyncComponent(() => import('./CouponManagement.vue'))
const RoleManagement = defineAsyncComponent(() => import('./RoleManagement.vue'))
const MenuManagement = defineAsyncComponent(() => import('./MenuManagement.vue'))
const ReviewManagement = defineAsyncComponent(() => import('./ReviewManagement.vue'))
const ReviewTagManagement = defineAsyncComponent(() => import('./ReviewTagManagement.vue'))

const router = useRouter()
const activeMenu = ref('dashboard')
const userInfo = ref<any>(null)

// 统计数据
const stats = ref({
  totalOrders: 0,
  totalUsers: 0,
  totalProducts: 0,
  totalRevenue: '0.00'
})

// 加载状态
const loading = ref(false)

onMounted(() => {
  // 获取用户信息
  const userInfoStr = localStorage.getItem('user_info')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }

  // 加载统计数据
  loadStats()
})

// 加载统计数据
async function loadStats() {
  loading.value = true
  try {
    const dashboardStats = await statsApi.getDashboardStats()
    stats.value = dashboardStats
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

// 处理菜单选择
function handleMenuSelect(index: string) {
  activeMenu.value = index
}

// 测试平台资金管理
function testPlatformFunds() {
  router.push('/test-platform-funds')
}

// 获取页面标题
function getPageTitle() {
  const titles: Record<string, string> = {
    'products/list': '商品列表',
    'products/categories': '商品分类',
    'products/brands': '品牌管理',
    'orders/list': '订单列表',
    'orders/delivery': '发货管理',
    'orders/refunds': '退款管理',
    'finance/platform-funds': '平台资金管理',
    'finance/refund-audit': '退款审核',
    'finance/transactions': '交易流水',
    'finance/reports': '财务报表',
    'users/management': '用户管理',
    'reviews/list': '评论管理',
    'reviews/tags': '评论标签管理',
    'marketing/coupons': '优惠券管理',
    'marketing/promotions': '促销活动',
    'system/roles': '角色管理',
    'system/menus': '菜单管理',
    'system/settings': '系统设置',
    'system/logs': '操作日志'
  }
  return titles[activeMenu.value] || '页面'
}

// 处理用户下拉菜单
async function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料功能开发中')
      break
    case 'settings':
      ElMessage.info('系统设置功能开发中')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        // 清除本地存储
        localStorage.removeItem('access_token')
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('username')

        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}
</script>

<style scoped>
.admin-dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.admin-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.admin-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.admin-sidebar {
  width: 240px;
  background: #ffffff;
  overflow-y: auto;
  box-shadow: 2px 0 6px rgba(0,21,41,.15);
  border-right: 1px solid #e4e7ed;
}

.sidebar-menu {
  border: none;
  background: #ffffff;
}

.sidebar-menu .el-menu-item,
.sidebar-menu .el-sub-menu__title {
  color: #303133;
  border-bottom: none;
  font-weight: 500;
  margin: 2px 8px;
  border-radius: 6px;
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-sub-menu__title:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: #fff;
  font-weight: 600;
}

.sidebar-menu .el-sub-menu .el-menu-item {
  background-color: transparent;
  color: #606266;
  margin: 2px 16px;
  padding-left: 40px;
}

.sidebar-menu .el-sub-menu .el-menu-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.sidebar-menu .el-sub-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: #fff;
}

.sidebar-menu .el-sub-menu__title .el-icon {
  color: #909399;
}

.sidebar-menu .el-menu-item .el-icon {
  color: #909399;
}

.sidebar-menu .el-menu-item:hover .el-icon,
.sidebar-menu .el-sub-menu__title:hover .el-icon {
  color: #409eff;
}

.sidebar-menu .el-menu-item.is-active .el-icon {
  color: #fff;
}

.admin-content {
  flex: 1;
  background: #f0f2f5;
  overflow-y: auto;
  padding: 20px;
}

.dashboard-content {
  max-width: 1200px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.orders { background: #409eff; }
.stat-icon.users { background: #67c23a; }
.stat-icon.products { background: #e6a23c; }
.stat-icon.revenue { background: #f56c6c; }

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.quick-actions {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.quick-actions h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.page-content {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.page-placeholder {
  color: #909399;
}

.page-placeholder h3 {
  margin: 16px 0;
  color: #606266;
}

.page-placeholder p {
  margin-bottom: 24px;
}

.loading-placeholder {
  padding: 40px;
  text-align: center;
}
</style>
