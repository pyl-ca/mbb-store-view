<template>
  <div class="order-detail-container">
    <div class="page-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">订单详情</h1>
    </div>

    <div v-if="loading" class="loading-container">
      <el-loading :loading="true" />
    </div>

    <div v-else-if="!orderDetail" class="empty-container">
      <el-empty description="订单不存在" />
    </div>

    <div v-else class="order-detail-content">
      <!-- 订单状态 -->
      <div class="status-card">
        <div class="status-icon">
          <el-icon size="40" :color="getStatusColor(orderDetail.status)">
            <component :is="getStatusIcon(orderDetail.status)" />
          </el-icon>
        </div>
        <div class="status-info">
          <h3 class="status-title">{{ orderDetail.statusName }}</h3>
          <p class="status-desc">{{ getStatusDescription(orderDetail.status) }}</p>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="info-card">
        <h3 class="card-title">订单信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">订单号：</span>
            <span class="value">{{ orderDetail.orderSn }}</span>
          </div>
          <div class="info-item">
            <span class="label">下单时间：</span>
            <span class="value">{{ formatTime(orderDetail.createTime) }}</span>
          </div>
          <div class="info-item" v-if="orderDetail.payTime">
            <span class="label">支付时间：</span>
            <span class="value">{{ formatTime(orderDetail.payTime) }}</span>
          </div>
          <div class="info-item" v-if="orderDetail.deliveryTime">
            <span class="label">发货时间：</span>
            <span class="value">{{ formatTime(orderDetail.deliveryTime) }}</span>
          </div>
          <div class="info-item" v-if="orderDetail.finishTime">
            <span class="label">完成时间：</span>
            <span class="value">{{ formatTime(orderDetail.finishTime) }}</span>
          </div>
        </div>
      </div>

      <!-- 收货地址 -->
      <div class="address-card">
        <h3 class="card-title">收货地址</h3>
        <div class="address-info" v-if="addressInfo">
          <div class="address-header">
            <span class="recipient">{{ addressInfo.name }}</span>
            <span class="phone">{{ addressInfo.phone }}</span>
          </div>
          <div class="address-detail">
            {{ addressInfo.province }} {{ addressInfo.city }} {{ addressInfo.district }} {{ addressInfo.detail }}
          </div>
        </div>
      </div>

      <!-- 商品清单 -->
      <div class="products-card">
        <h3 class="card-title">商品清单</h3>
        <div class="product-list">
          <div v-for="item in orderDetail.orderItems" :key="item.id" class="product-item">
            <div class="product-image">
              <img :src="getImageUrl(item.productImage)" :alt="item.productName" />
            </div>
            <div class="product-info">
              <div class="product-name">{{ item.productName }}</div>
              <div class="product-specs">{{ item.specs }}</div>
            </div>
            <div class="product-price">
              <div class="price">¥{{ item.price }}</div>
              <div class="quantity">x{{ item.quantity }}</div>
            </div>
            <div class="product-subtotal">
              ¥{{ item.subtotal }}
            </div>
          </div>
        </div>
      </div>

      <!-- 费用明细 -->
      <div class="amount-card">
        <h3 class="card-title">费用明细</h3>
        <div class="amount-list">
          <div class="amount-item">
            <span class="label">商品总价：</span>
            <span class="value">¥{{ orderDetail.totalAmount }}</span>
          </div>
          <div class="amount-item">
            <span class="label">运费：</span>
            <span class="value">免运费</span>
          </div>
          <div class="amount-item total">
            <span class="label">实付款：</span>
            <span class="value">¥{{ orderDetail.payAmount }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-card">
        <div class="action-buttons">
          <el-button
            v-if="orderDetail.status === 0"
            type="primary"
            size="large"
            @click="payOrder"
          >
            立即支付
          </el-button>
          <el-button
            v-if="orderDetail.status === 0"
            size="large"
            @click="cancelOrder"
          >
            取消订单
          </el-button>
          <el-button
            v-if="orderDetail.status === 2"
            type="primary"
            size="large"
            @click="confirmReceive"
          >
            确认收货
          </el-button>
          <el-button
            v-if="orderDetail.status === 3"
            size="large"
            @click="cancelOrder"
          >
            取消订单
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Clock, Check, Van, ShoppingBag, Close } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

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

interface OrderDetail {
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
const orderDetail = ref<OrderDetail | null>(null)
const addressInfo = ref<any>(null)

// 页面初始化
onMounted(() => {
  const orderSn = route.params.orderSn as string
  if (orderSn) {
    loadOrderDetail(orderSn)
  }
})

// 加载订单详情
async function loadOrderDetail(orderSn: string) {
  loading.value = true
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) {
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }

    const response = await axios.get(`http://localhost:9999/order-service/api/v1/orders/${orderSn}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    orderDetail.value = response.data.data

    // 解析地址信息
    if (orderDetail.value?.addressSnapshot) {
      try {
        addressInfo.value = JSON.parse(orderDetail.value.addressSnapshot)
      } catch (error) {
        console.error('解析地址信息失败:', error)
      }
    }
  } catch (error: any) {
    console.error('加载订单详情失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      router.push('/login')
    } else if (error.response?.status === 404) {
      ElMessage.error('订单不存在')
    } else {
      ElMessage.error('加载订单详情失败')
    }
  } finally {
    loading.value = false
  }
}

// 获取状态图标
function getStatusIcon(status: number) {
  const icons = {
    0: Clock,        // 待支付
    1: Check,        // 已支付
    2: Van,          // 已发货
    3: ShoppingBag,  // 已完成
    4: Close         // 已取消
  }
  return icons[status as keyof typeof icons] || Clock
}

// 获取状态颜色
function getStatusColor(status: number) {
  const colors = {
    0: '#ff6700',  // 待支付
    1: '#52c41a',  // 已支付
    2: '#1890ff',  // 已发货
    3: '#52c41a',  // 已完成
    4: '#999'      // 已取消
  }
  return colors[status as keyof typeof colors] || '#999'
}

// 获取状态描述
function getStatusDescription(status: number) {
  const descriptions = {
    0: '等待买家付款',
    1: '买家已付款，等待卖家发货',
    2: '卖家已发货，等待买家确认收货',
    3: '交易完成，等待买家评论',
    4: '交易已取消'
  }
  return descriptions[status as keyof typeof descriptions] || ''
}

// 获取图片URL
function getImageUrl(imagePath: string) {
  if (!imagePath) return '/placeholder.jpg'
  if (imagePath.startsWith('http')) return imagePath
  return `http://localhost:9999/static${imagePath}`
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 支付订单
function payOrder() {
  if (!orderDetail.value) return
  router.push({
    path: '/payment',
    query: { orderSn: orderDetail.value.orderSn }
  })
}

// 取消订单
async function cancelOrder() {
  if (!orderDetail.value) return

  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    await axios.put(`http://localhost:9999/order-service/api/v1/orders/${orderDetail.value.orderSn}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('订单已取消')
    loadOrderDetail(orderDetail.value.orderSn)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      ElMessage.error('取消订单失败')
    }
  }
}

// 确认收货
async function confirmReceive() {
  if (!orderDetail.value) return

  try {
    await ElMessageBox.confirm('确定已收到货物吗？', '确认收货', {
      confirmButtonText: '确认收货',
      cancelButtonText: '取消',
      type: 'info'
    })

    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    await axios.put(`http://localhost:9999/order-service/api/v1/orders/${orderDetail.value.orderSn}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('确认收货成功')
    loadOrderDetail(orderDetail.value.orderSn)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('确认收货失败:', error)
      ElMessage.error('确认收货失败')
    }
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.order-detail-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.page-title {
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-container,
.empty-container {
  background: #fff;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.order-detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 状态卡片 */
.status-card {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.status-icon {
  flex-shrink: 0;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.status-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 通用卡片样式 */
.info-card,
.address-card,
.products-card,
.amount-card,
.action-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  color: #666;
  margin-right: 8px;
  min-width: 80px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

/* 地址信息 */
.address-info {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 4px solid #ff6700;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.recipient {
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.phone {
  font-size: 14px;
  color: #666;
}

.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 商品列表 */
.product-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.product-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.product-specs {
  font-size: 12px;
  color: #999;
}

.product-price {
  text-align: center;
  min-width: 80px;
}

.product-price .price {
  display: block;
  font-size: 14px;
  color: #ff6700;
  font-weight: 500;
  margin-bottom: 2px;
}

.product-price .quantity {
  font-size: 12px;
  color: #999;
}

.product-subtotal {
  text-align: right;
  min-width: 80px;
  font-size: 16px;
  color: #ff6700;
  font-weight: 600;
}

/* 费用明细 */
.amount-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.amount-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.amount-item.total {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  margin-top: 8px;
}

.amount-item .label {
  color: #666;
  font-size: 14px;
}

.amount-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.amount-item.total .label {
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.amount-item.total .value {
  color: #ff6700;
  font-size: 18px;
  font-weight: 600;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-detail-container {
    padding: 10px;
  }

  .page-header {
    padding: 16px;
  }

  .status-card {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .product-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .product-price,
  .product-subtotal {
    align-self: flex-end;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>