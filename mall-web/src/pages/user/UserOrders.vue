<template>
  <div class="user-orders-container">
    <div class="page-header">
      <h2 class="page-title">我的订单</h2>
    </div>

    <!-- 订单状态筛选 -->
    <div class="order-tabs">
      <div
        v-for="tab in orderTabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="orders-content">
      <div v-if="loading" class="loading-container">
        <el-loading :loading="true" />
      </div>

      <div v-else-if="orderList.length === 0" class="empty-container">
        <el-empty description="暂无订单" />
      </div>

      <div v-else class="order-list">
        <div v-for="order in orderList" :key="order.id" class="order-card">
          <!-- 订单头部 -->
          <div class="order-header">
            <div class="order-info">
              <span class="order-sn">订单号：{{ order.orderSn }}</span>
              <span class="order-time">{{ formatTime(order.createTime) }}</span>
            </div>
            <div class="order-status">
              <span :class="getStatusClass(order.status)">{{ order.statusName }}</span>
            </div>
          </div>

          <!-- 订单商品 -->
          <div class="order-items">
            <div v-for="item in order.orderItems" :key="item.id" class="order-item">
              <div class="item-image">
                <img :src="getImageUrl(item.productImage)" :alt="item.productName" />
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.productName }}</div>
                <div class="item-specs">{{ item.specs }}</div>
              </div>
              <div class="item-price">
                <span class="price">¥{{ item.price }}</span>
                <span class="quantity">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>

          <!-- 订单金额和操作 -->
          <div class="order-footer">
            <div class="order-amount">
              <span class="amount-label">实付款：</span>
              <span class="amount-value">¥{{ order.payAmount }}</span>
            </div>
            <div class="order-actions">
              <el-button size="small" @click="viewOrderDetail(order.orderSn)">查看详情</el-button>
              <el-button
                v-if="order.status === 0"
                type="primary"
                size="small"
                @click="payOrder(order.orderSn)"
              >
                立即支付
              </el-button>
              <el-button
                v-if="order.status === 0"
                size="small"
                @click="cancelOrder(order.orderSn)"
              >
                取消订单
              </el-button>
              <el-button
                v-if="order.status === 2"
                type="primary"
                size="small"
                @click="confirmReceive(order.orderSn)"
              >
                确认收货
              </el-button>
              <el-button
                v-if="order.status === 3"
                size="small"
                @click="cancelOrder(order.orderSn)"
              >
                取消订单
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()

// 数据定义
interface OrderItem {
  id: number
  productId: number
  skuId: number
  productName: string
  productImage: string
  price: number
  quantity: number
  subtotal: number
  specs: string
}

interface Order {
  id: number
  orderSn: string
  userId: number
  userName: string
  userPhone: string
  totalAmount: number
  payAmount: number
  payType: string | null
  payTypeName: string | null
  status: number
  statusName: string
  addressSnapshot: string
  sourceType: number
  createTime: string
  payTime: string | null
  cancelTime: string | null
  deliveryTime: string | null
  finishTime: string | null
  orderItems: OrderItem[]
}

const loading = ref(false)
const orderList = ref<Order[]>([])
const currentTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 订单状态标签
const orderTabs = ref([
  { label: '全部', value: 'all', count: 0 },
  { label: '待支付', value: '0', count: 0 },
  { label: '待发货', value: '1', count: 0 },
  { label: '待收货', value: '2', count: 0 },
  { label: '待评论', value: '3', count: 0 },
  { label: '已取消', value: '4', count: 0 }
])

// 页面初始化
onMounted(() => {
  loadOrders()
})

// 加载订单列表
async function loadOrders() {
  loading.value = true
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) {
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }

    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }

    if (currentTab.value !== 'all') {
      params.status = currentTab.value
    }

    const response = await axios.get(`http://localhost:9999/order-service/api/v1/orders`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = response.data.data
    orderList.value = data.records || []
    total.value = data.total || 0

    // 更新标签计数（这里简化处理，实际可能需要单独接口）
    updateTabCounts()
  } catch (error: any) {
    console.error('加载订单列表失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      ElMessage.error('加载订单列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 更新标签计数
function updateTabCounts() {
  const counts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 }
  orderList.value.forEach(order => {
    const statusKey = order.status.toString() as keyof typeof counts
    if (statusKey in counts) {
      counts[statusKey]++
    }
  })

  orderTabs.value.forEach(tab => {
    if (tab.value === 'all') {
      tab.count = orderList.value.length
    } else {
      tab.count = counts[tab.value as keyof typeof counts] || 0
    }
  })
}

// 切换标签
function switchTab(tabValue: string) {
  currentTab.value = tabValue
  currentPage.value = 1
  loadOrders()
}

// 分页处理
function handleSizeChange(newSize: number) {
  pageSize.value = newSize
  currentPage.value = 1
  loadOrders()
}

function handleCurrentChange(newPage: number) {
  currentPage.value = newPage
  loadOrders()
}

// 获取状态样式类
function getStatusClass(status: number) {
  const statusClasses = {
    0: 'status-pending',
    1: 'status-paid',
    2: 'status-shipped',
    3: 'status-completed',
    4: 'status-cancelled'
  }
  return statusClasses[status as keyof typeof statusClasses] || ''
}

// 获取图片URL
function getImageUrl(imagePath: string) {
  if (!imagePath) return '/placeholder.jpg'
  if (imagePath.startsWith('http')) return imagePath
  return `http://localhost:9999${imagePath}`
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 查看订单详情
function viewOrderDetail(orderSn: string) {
  router.push(`/order-detail/${orderSn}`)
}

// 支付订单
function payOrder(orderSn: string) {
  router.push({
    path: '/payment',
    query: { orderSn }
  })
}

// 取消订单
async function cancelOrder(orderSn: string) {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    await axios.put(`http://localhost:9999/order-service/api/v1/orders/${orderSn}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('订单已取消')
    loadOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      ElMessage.error('取消订单失败')
    }
  }
}

// 确认收货
async function confirmReceive(orderSn: string) {
  try {
    await ElMessageBox.confirm('确定已收到货物吗？', '确认收货', {
      confirmButtonText: '确认收货',
      cancelButtonText: '取消',
      type: 'info'
    })

    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    await axios.put(`http://localhost:9999/order-service/api/v1/orders/${orderSn}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('确认收货成功')
    loadOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('确认收货失败:', error)
      ElMessage.error('确认收货失败')
    }
  }
}
</script>

<style scoped>
.user-orders-container {
  width: 100%;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: #fff;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.page-title {
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

/* 订单状态标签 */
.order-tabs {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 0;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}

.tab-item {
  flex: 1;
  padding: 16px 20px;
  text-align: center;
  cursor: pointer;
  position: relative;
  color: #666;
  font-size: 14px;
  transition: all 0.3s;
  border-right: 1px solid #f0f0f0;
}

.tab-item:last-child {
  border-right: none;
}

.tab-item:hover {
  color: #ff6700;
  background: #fff7f0;
}

.tab-item.active {
  color: #ff6700;
  background: #fff7f0;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #ff6700;
}

.tab-count {
  display: inline-block;
  background: #ff6700;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  min-width: 16px;
  text-align: center;
}

/* 订单内容 */
.orders-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}

.loading-container,
.empty-container {
  padding: 60px 20px;
  text-align: center;
}

/* 订单列表 */
.order-list {
  padding: 0;
}

.order-card {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px;
  transition: background-color 0.3s;
}

.order-card:last-child {
  border-bottom: none;
}

.order-card:hover {
  background: #fafafa;
}

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.order-sn {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.order-time {
  font-size: 12px;
  color: #999;
}

.order-status {
  font-size: 14px;
  font-weight: 500;
}

.status-pending {
  color: #ff6700;
}

.status-paid {
  color: #52c41a;
}

.status-shipped {
  color: #1890ff;
}

.status-completed {
  color: #52c41a;
}

.status-cancelled {
  color: #999;
}

/* 订单商品 */
.order-items {
  margin-bottom: 16px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f8f8f8;
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-specs {
  font-size: 12px;
  color: #999;
}

.item-price {
  text-align: right;
  min-width: 80px;
}

.price {
  display: block;
  font-size: 14px;
  color: #ff6700;
  font-weight: 500;
  margin-bottom: 2px;
}

.quantity {
  font-size: 12px;
  color: #999;
}

/* 订单底部 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-amount {
  font-size: 14px;
}

.amount-label {
  color: #666;
  margin-right: 8px;
}

.amount-value {
  color: #ff6700;
  font-size: 16px;
  font-weight: 600;
}

.order-actions {
  display: flex;
  gap: 8px;
}

/* 分页 */
.pagination-container {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-tabs {
    flex-wrap: wrap;
  }

  .tab-item {
    flex: 1 1 50%;
    min-width: 50%;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .order-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .order-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .item-name {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
    line-height: 1.4;
  }
}
</style>
