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
            <div v-if="!order.orderItems || order.orderItems.length === 0" class="no-items">
              暂无商品信息
            </div>
            <div v-else v-for="item in order.orderItems" :key="item.id" class="order-item">
              <div class="item-image">
                <img
                  :src="getImageUrl(item.productImage)"
                  :alt="item.productName"
                  @error="handleImageError"
                  @load="handleImageLoad"
                />
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
                type="success"
                size="small"
                @click="viewDeliveryInfo(order.orderSn)"
              >
                查看物流
              </el-button>
              <el-button
                v-if="order.status === 2"
                type="primary"
                size="small"
                @click="confirmReceive(order.orderSn)"
              >
                确认收货
              </el-button>
              <!-- 评价相关按钮：基于评价状态而不是订单状态 -->
              <el-button
                v-if="order.status === 3 && !order.hasReviewed"
                type="warning"
                size="small"
                @click="goToReview(order.orderSn)"
              >
                去评价
              </el-button>
              <el-button
                v-if="order.status === 3 && order.hasReviewed"
                type="success"
                size="small"
                @click="viewOrderReviews(order.orderSn)"
              >
                查看评价
              </el-button>

              <!-- 退款相关按钮：只要是已完成的订单就可以申请退款 -->
              <template v-if="order.status === 3">
                <el-button
                  v-if="!order.refundRecord"
                  size="small"
                  @click="applyRefund(order.orderSn)"
                >
                  申请退货
                </el-button>
                <el-button
                  v-else-if="order.refundRecord.status === 0"
                  type="info"
                  size="small"
                  disabled
                >
                  退款审核中
                </el-button>
                <el-button
                  v-else-if="order.refundRecord.status === 1"
                  type="warning"
                  size="small"
                  disabled
                >
                  退款处理中
                </el-button>
                <el-button
                  v-else-if="order.refundRecord.status === 2"
                  type="info"
                  size="small"
                  disabled
                >
                  退款中
                </el-button>
                <el-button
                  v-else-if="order.refundRecord.status === 3"
                  type="success"
                  size="small"
                  @click="viewRefundRecord(order.orderSn)"
                >
                  退款成功
                </el-button>
                <el-button
                  v-else-if="order.refundRecord.status === 4"
                  type="danger"
                  size="small"
                  @click="viewRefundRecord(order.orderSn)"
                >
                  退款失败
                </el-button>
                <el-button
                  v-else-if="order.refundRecord.status === 5"
                  type="danger"
                  size="small"
                  @click="applyRefund(order.orderSn)"
                >
                  重新申请退款
                </el-button>
                <el-button
                  v-else-if="order.refundRecord.status === 6"
                  type="danger"
                  size="small"
                  @click="applyRefund(order.orderSn)"
                >
                  重新申请退款
                </el-button>
              </template>
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

    <!-- 物流跟踪弹窗 -->
    <el-dialog v-model="deliveryDialog.visible" title="物流跟踪" width="700px">
      <DeliveryTracking
        v-if="deliveryDialog.orderSn"
        :order-sn="deliveryDialog.orderSn"
        :order-status="deliveryDialog.orderStatus"
        :show-actions="true"
        @confirmed="handleDeliveryConfirmed"
        @refreshed="handleDeliveryRefreshed"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { reviewApi } from '../../api/review'
import DeliveryTracking from '../../components/DeliveryTracking.vue'
import { getProductImageUrl } from '../../utils/imageUtils'

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
  refundRecord?: any // 退款记录
  hasReviewed?: boolean // 是否已评价
}

const loading = ref(false)
const orderList = ref<Order[]>([])
const currentTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)


// 物流跟踪弹窗
const deliveryDialog = reactive({
  visible: false,
  orderSn: '',
  orderStatus: 0
})

// 订单状态标签
const orderTabs = ref([
  { label: '全部', value: 'all', count: 0 },
  { label: '待支付', value: '0', count: 0 },
  { label: '待发货', value: '1', count: 0 },
  { label: '待收货', value: '2', count: 0 },
  { label: '待评论', value: '3', count: 0 },
  { label: '已取消', value: '4', count: 0 },
  { label: '退货/退款', value: 'refund', count: 0 }
])

// 页面初始化
onMounted(() => {
  loadOrders()

  // 监听页面可见性变化，当页面重新可见时刷新数据
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// 页面卸载时移除监听器
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// 监听页面可见性变化
function handleVisibilityChange() {
  if (!document.hidden) {
    console.log('页面重新可见，刷新订单列表')
    // 延迟一下再刷新，确保从其他页面返回的数据已经更新
    setTimeout(() => {
      loadOrders()
    }, 500)
  }
}

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
      size: pageSize.value,
      includeItems: true  // 尝试请求包含订单商品信息
    }

    // 根据标签页设置筛选条件
    if (currentTab.value !== 'all' && currentTab.value !== 'refund' && currentTab.value !== '3') {
      params.status = currentTab.value
    } else if (currentTab.value === '3') {
      // 待评论：只获取已完成的订单，后续会筛选出未评价的
      params.status = 3
    }

    const response = await axios.get(`/order-service/api/v1/orders`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = response.data.data
    let orders = data.records || []

    // 调试：检查订单数据
    console.log(`加载了 ${orders.length} 个订单`)

    // 为缺少商品信息的订单加载详细信息
    await loadMissingOrderItems(orders)

    // 为所有订单检查退款状态和评价状态
    await checkRefundStatusForOrders(orders)
    await checkReviewStatusForOrders(orders)

    // 如果选择了退货/退款标签，只显示有退款记录的订单
    if (currentTab.value === 'refund') {
      orders = orders.filter((order: Order) => order.refundRecord)
      console.log(`退货/退款标签页过滤后的订单数量: ${orders.length}`)
    }

    // 如果选择了待评论标签，只显示已完成且未评价的订单
    if (currentTab.value === '3') {
      orders = orders.filter((order: Order) => order.status === 3 && !order.hasReviewed)
      console.log(`待评论标签页过滤后的订单数量: ${orders.length}`)
    }

    orderList.value = orders
    total.value = currentTab.value === 'refund' ? orders.length : (data.total || 0)

    // 最终结果统计
    console.log(`最终显示 ${orders.length} 个订单`)

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

// 为缺少商品信息的订单加载详细信息
async function loadMissingOrderItems(orders: Order[]) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  if (!token) return

  // 找出没有商品信息的订单
  const ordersWithoutItems = orders.filter(order => !order.orderItems || order.orderItems.length === 0)

  if (ordersWithoutItems.length === 0) {
    return
  }

  console.log(`补充加载 ${ordersWithoutItems.length} 个订单的商品信息`)

  // 为每个缺少商品信息的订单单独调用详情API
  for (const order of ordersWithoutItems) {
    try {
      const response = await axios.get(`/order-service/api/v1/orders/${order.orderSn}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const orderDetail = response.data.data
      if (orderDetail && orderDetail.orderItems) {
        // 更新订单的商品信息
        order.orderItems = orderDetail.orderItems
      }
    } catch (error: any) {
      console.error(`加载订单 ${order.orderSn} 详细信息失败:`, error)
    }
  }
}

// 检查订单的退款状态
async function checkRefundStatusForOrders(orders?: Order[]) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  if (!token) return

  const ordersToCheck = orders || orderList.value
  // 只检查已完成的订单（状态3）
  const eligibleOrders = ordersToCheck.filter(order => order.status === 3)

  console.log(`检查 ${eligibleOrders.length} 个订单的退款状态`)

  for (const order of eligibleOrders) {
    try {
      const response = await axios.get(`/payment-service/api/v1/refund/order/${order.orderSn}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.code === '000000' && response.data.data) {
        order.refundRecord = response.data.data
        console.log(`订单 ${order.orderSn} 找到退款记录:`, order.refundRecord)
      } else {
        order.refundRecord = null
      }
    } catch (error: any) {
      // 如果是404错误，说明没有退款记录，这是正常的
      if (error.response?.status === 404) {
        order.refundRecord = null
      } else {
        console.error(`检查订单 ${order.orderSn} 退款状态失败:`, error)
        order.refundRecord = null
      }
    }
  }
}

// 检查订单的评价状态
async function checkReviewStatusForOrders(orders?: Order[]) {
  const ordersToCheck = orders || orderList.value
  // 只检查已完成的订单（状态3）
  const completedOrders = ordersToCheck.filter(order => order.status === 3)

  console.log(`检查 ${completedOrders.length} 个已完成订单的评价状态`)

  for (const order of completedOrders) {
    try {
      // 如果订单有商品信息，检查第一个商品的评价状态
      // 这样可以避免不传productId导致的数据异常
      if (order.orderItems && order.orderItems.length > 0) {
        const firstProduct = order.orderItems[0]
        console.log(`检查订单 ${order.orderSn} 第一个商品 ${firstProduct.productId} 的评价状态`)
        const hasReviewed = await reviewApi.checkOrderReviewed(order.orderSn, firstProduct.productId)
        order.hasReviewed = hasReviewed
        console.log(`订单 ${order.orderSn} 商品 ${firstProduct.productId} 评价状态检查结果: hasReviewed = ${hasReviewed}`)
      } else {
        // 如果没有商品信息，跳过评价状态检查，避免调用可能有问题的API
        console.warn(`订单 ${order.orderSn} 没有商品信息，跳过评价状态检查`)
        order.hasReviewed = false
      }

      // 不改变订单状态，保持原有的订单状态逻辑
      // 评价状态通过 hasReviewed 字段来标识
    } catch (error: any) {
      console.error(`检查订单 ${order.orderSn} 评价状态失败:`, error)
      order.hasReviewed = false
    }
  }
}

// 更新标签计数
function updateTabCounts() {
  const counts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, 'refund': 0 }

  orderList.value.forEach(order => {
    const statusKey = order.status.toString() as keyof typeof counts
    if (statusKey in counts) {
      counts[statusKey]++
    }
    // 统计有退款记录的订单
    if (order.refundRecord) {
      counts.refund++
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
    4: 'status-cancelled',
    5: 'status-reviewed'  // 新增已评价状态样式
  }
  return statusClasses[status as keyof typeof statusClasses] || ''
}

// 获取图片URL
function getImageUrl(imagePath: string) {
  return getProductImageUrl(imagePath)
}

// 图片加载成功
function handleImageLoad(event: Event) {
  // 图片加载成功处理
}

// 图片加载失败
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  // 设置默认图片
  img.src = '/images/placeholder/product.png'
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
    await axios.put(`/order-service/api/v1/orders/${orderSn}/cancel`, {}, {
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
    await axios.put(`/order-service/api/v1/orders/${orderSn}/confirm`, {}, {
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

// 查看物流信息
function viewDeliveryInfo(orderSn: string) {
  const order = orderList.value.find(o => o.orderSn === orderSn)
  if (order) {
    deliveryDialog.orderSn = orderSn
    deliveryDialog.orderStatus = order.status
    deliveryDialog.visible = true
  }
}

// 去评价
function goToReview(orderSn: string) {
  // 跳转到创建评价页面
  router.push(`/create-review?orderSn=${orderSn}`)
}

// 查看订单评价
function viewOrderReviews(orderSn: string) {
  // 跳转到用户评价管理页面，并筛选该订单的评价
  router.push(`/user/reviews?orderSn=${orderSn}`)
}

// 申请退货
function applyRefund(orderSn: string) {
  router.push({
    path: '/refund/apply',
    query: { orderSn }
  })
}

// 查看退款记录
function viewRefundRecord(orderSn: string) {
  router.push('/user/refunds')
}

// 物流确认收货回调
function handleDeliveryConfirmed() {
  deliveryDialog.visible = false
  loadOrders()
  ElMessage.success('确认收货成功，订单已完成')
}

// 物流信息刷新回调
function handleDeliveryRefreshed() {
  // 可以在这里做一些额外的处理
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.debug-info {
  margin-top: 4px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 11px;
  color: #666;
}

.no-items {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
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

.status-reviewed {
  color: #52c41a;
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
