<template>
  <div class="order-detail-container">
    <div class="page-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        {{ isFromAdmin ? '关闭窗口' : '返回' }}
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

      <!-- 物流信息 -->
      <div class="logistics-card" v-if="orderDetail.status >= 2">
        <h3 class="card-title">物流信息</h3>
        <DeliveryTracking
          :order-sn="orderDetail.orderSn"
          :order-status="orderDetail.status"
          :show-actions="true"
          @confirmed="handleDeliveryConfirmed"
          @refreshed="handleDeliveryRefreshed"
        />
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

      <!-- 操作按钮 - 只在前台用户访问时显示 -->
      <div class="action-card" v-if="!isFromAdmin">
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
            @click="goToReview"
          >
            去评价
          </el-button>
          <el-button
            v-if="orderDetail.status === 5"
            type="success"
            size="large"
            @click="viewOrderReviews"
          >
            查看评价
          </el-button>
          <!-- 退款相关按钮 -->
          <template v-if="orderDetail.status === 3 || orderDetail.status === 5">
            <el-button
              v-if="!refundRecord"
              size="large"
              @click="applyRefund"
              :loading="checkingRefund"
            >
              申请退货
            </el-button>
            <el-button
              v-else-if="refundRecord.status === 0"
              size="large"
              type="info"
              disabled
            >
              退款审核中
            </el-button>
            <el-button
              v-else-if="refundRecord.status === 1"
              size="large"
              type="warning"
              disabled
            >
              退款处理中
            </el-button>
            <el-button
              v-else-if="refundRecord.status === 2"
              size="large"
              type="info"
              disabled
            >
              退款中
            </el-button>
            <el-button
              v-else-if="refundRecord.status === 3"
              size="large"
              type="success"
              @click="viewRefundProgress"
            >
              退款成功
            </el-button>
            <el-button
              v-else-if="refundRecord.status === 4"
              size="large"
              type="danger"
              @click="viewRefundProgress"
            >
              退款失败
            </el-button>
            <el-button
              v-else-if="refundRecord.status === 5"
              size="large"
              type="danger"
              @click="applyRefund"
            >
              重新申请退款
            </el-button>
            <el-button
              v-else-if="refundRecord.status === 6"
              size="large"
              type="danger"
              @click="applyRefund"
            >
              重新申请退款
            </el-button>
          </template>
        </div>
      </div>

      <!-- 后台管理员操作区域 -->
      <div class="admin-actions" v-if="isFromAdmin">
        <div class="admin-notice">
          <el-alert
            title="管理员视图"
            description="您正在以管理员身份查看此订单详情"
            type="info"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 管理员快捷操作 -->
        <div class="admin-buttons">
          <h3 class="section-title">快捷操作</h3>
          <div class="button-group">
            <el-button
              v-if="orderDetail.status === 1"
              type="primary"
              @click="goToDeliveryManagement"
            >
              前往发货管理
            </el-button>
            <el-button
              v-if="orderDetail.status >= 1 && orderDetail.status <= 3"
              type="warning"
              @click="goToRefundManagement"
            >
              前往退款管理
            </el-button>
            <el-button
              type="info"
              @click="openRemarkDialog"
            >
              添加备注
            </el-button>
            <el-button
              type="default"
              @click="refreshOrderDetail"
            >
              刷新订单
            </el-button>
          </div>
        </div>

        <!-- 订单备注显示 -->
        <div class="admin-remarks">
          <div class="remark-header">
            <h3 class="section-title">管理员备注</h3>
            <el-button size="small" type="text" @click="openRemarkDialog">
              {{ orderDetail.adminRemark ? '编辑备注' : '添加备注' }}
            </el-button>
          </div>
          <div class="remark-content" v-if="orderDetail.adminRemark">
            {{ orderDetail.adminRemark }}
          </div>
          <div class="remark-empty" v-else>
            <el-text type="info">暂无管理员备注</el-text>
          </div>
        </div>
      </div>
    </div>

    <!-- 评价对话框 -->
    <!-- TODO: 实现评价对话框组件 -->
    <div v-if="reviewDialog.visible" style="display: none;">
      评价功能待实现
    </div>

    <!-- 退款进度跟踪 -->
    <RefundProgress
      v-model="refundProgressDialog.visible"
      :refund-sn="refundProgressDialog.refundSn"
      @contact-service="handleContactService"
      @view-order="handleViewOrder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Clock, Check, Van, ShoppingBag, Close } from '@element-plus/icons-vue'
import axios from 'axios'
import { reviewApi } from '../api/review'
import DeliveryTracking from '../components/DeliveryTracking.vue'
import RefundProgress from '../components/RefundProgress.vue'
import { getProductImageUrl } from '../utils/imageUtils'

const router = useRouter()
const route = useRoute()

// 判断是否从后台访问
const isFromAdmin = computed(() => {
  return route.query.from === 'admin'
})

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
  adminRemark?: string  // 管理员备注
}

const loading = ref(false)
const orderDetail = ref<OrderDetail | null>(null)
const addressInfo = ref<any>(null)
const refundRecord = ref<any>(null)
const checkingRefund = ref(false)
const hasReviewed = ref(false)

// 页面初始化
onMounted(() => {
  const orderSn = route.params.orderSn as string
  if (orderSn) {
    loadOrderDetail(orderSn)
  }

  // 监听页面可见性变化，当页面重新可见时检查退款记录
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && orderDetail.value) {
      console.log('页面重新可见，检查退款记录')
      checkRefundRecord(orderDetail.value.orderSn)
    }
  })
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

    // 检查是否有退款记录
    await checkRefundRecord(orderSn)

    // 检查是否已评价
    await checkReviewStatus(orderSn)
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

// 检查退款记录
async function checkRefundRecord(orderSn: string) {
  checkingRefund.value = true
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    console.log('检查退款记录，订单号:', orderSn)

    // 先尝试真实API
    try {
      const response = await axios.get(`http://localhost:9999/payment-service/api/v1/refund/order/${orderSn}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('退款记录响应:', response.data)
      refundRecord.value = response.data.data
      console.log('设置退款记录:', refundRecord.value)
    } catch (apiError: any) {
      console.log('API调用失败，使用模拟数据测试:', apiError.response?.status)

      // 如果API失败，使用模拟数据进行测试
      if (orderSn === 'MBB20250126183040001') {
        // 模拟有退款记录的情况
        refundRecord.value = {
          id: 1001,
          refundSn: 'RF20250126180001',
          orderSn: orderSn,
          status: 0, // 待审核
          statusName: '待审核',
          refundAmount: 99.00,
          reason: '商品质量问题',
          createTime: new Date().toISOString()
        }
        console.log('使用模拟退款记录:', refundRecord.value)
      } else {
        refundRecord.value = null
      }
    }
  } catch (error: any) {
    console.error('检查退款记录失败:', error)
    refundRecord.value = null
  } finally {
    checkingRefund.value = false
  }
}

// 获取状态图标
function getStatusIcon(status: number) {
  const icons = {
    0: Clock,        // 待支付
    1: Check,        // 已支付
    2: Van,          // 已发货
    3: ShoppingBag,  // 已完成
    4: Close,        // 已取消
    5: Check         // 已评价
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
    4: '#999',     // 已取消
    5: '#52c41a'   // 已评价
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
    4: '交易已取消',
    5: '交易完成，买家已评价'
  }
  return descriptions[status as keyof typeof descriptions] || ''
}

// 获取图片URL
function getImageUrl(imagePath: string) {
  return getProductImageUrl(imagePath)
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

// 物流确认收货回调
function handleDeliveryConfirmed() {
  if (orderDetail.value) {
    loadOrderDetail(orderDetail.value.orderSn)
    ElMessage.success('确认收货成功，订单已完成')
  }
}

// 物流信息刷新回调
function handleDeliveryRefreshed() {
  // 可以在这里做一些额外的处理
}

// 检查评价状态
async function checkReviewStatus(orderSn: string) {
  try {
    // 如果订单有商品信息，检查第一个商品的评价状态
    // 这样可以避免不传productId导致的数据异常
    if (orderDetail.value && orderDetail.value.orderItems && orderDetail.value.orderItems.length > 0) {
      const firstProduct = orderDetail.value.orderItems[0]
      console.log(`检查订单 ${orderSn} 第一个商品 ${firstProduct.productId} 的评价状态`)
      const hasReviewedResult = await reviewApi.checkOrderReviewed(orderSn, firstProduct.productId)
      hasReviewed.value = hasReviewedResult
      console.log(`订单 ${orderSn} 商品 ${firstProduct.productId} 评价状态检查结果: hasReviewed = ${hasReviewedResult}`)
    } else {
      // 如果没有商品信息，跳过评价状态检查
      console.warn(`订单 ${orderSn} 没有商品信息，跳过评价状态检查`)
      hasReviewed.value = false
    }

    // 不改变订单状态，保持原有的订单状态逻辑
    // 评价状态通过 hasReviewed 字段来标识
  } catch (error: any) {
    console.error('检查评价状态失败:', error)
    hasReviewed.value = false
  }
}

// 去评价
function goToReview() {
  if (!orderDetail.value) return
  // 跳转到创建评价页面
  router.push(`/create-review?orderSn=${orderDetail.value.orderSn}`)
}

// 查看订单评价
function viewOrderReviews() {
  if (!orderDetail.value) return
  // 跳转到用户评价管理页面，并筛选该订单的评价
  router.push(`/user/reviews?orderSn=${orderDetail.value.orderSn}`)
}

// 评价对话框相关
const reviewDialog = reactive({
  visible: false,
  productInfo: null as any,
  orderSn: ''
})

// 显示评价对话框
function showReviewDialog() {
  if (!orderDetail.value || !orderDetail.value.orderItems.length) return

  // 暂时只支持评价第一个商品，实际应该支持选择评价哪个商品
  const firstItem = orderDetail.value.orderItems[0]
  reviewDialog.productInfo = {
    id: firstItem.productId,
    name: firstItem.productName,
    image: firstItem.productImage,
    specs: firstItem.specs
  }
  reviewDialog.orderSn = orderDetail.value.orderSn
  reviewDialog.visible = true
}

// 评价成功回调
function handleReviewSuccess() {
  ElMessage.success('评价发布成功')
  // 可以刷新订单状态或做其他处理
}

// 退款进度对话框
const refundProgressDialog = reactive({
  visible: false,
  refundSn: ''
})

// 查看退款进度
function viewRefundProgress() {
  if (!orderDetail.value) return

  // 这里应该根据订单号获取退款单号
  // 暂时使用模拟数据
  refundProgressDialog.refundSn = 'RF202412010001'
  refundProgressDialog.visible = true
}

// 联系客服
function handleContactService(refundSn: string) {
  ElMessage.info(`联系客服处理退款单：${refundSn}`)
  // TODO: 实现联系客服功能
}

// 查看订单
function handleViewOrder(orderSn: string) {
  // 当前就在订单详情页，不需要跳转
  ElMessage.info(`当前订单：${orderSn}`)
}



// 申请退货
function applyRefund() {
  if (!orderDetail.value) return
  router.push({
    path: '/refund/apply',
    query: { orderSn: orderDetail.value.orderSn }
  })
}

// 管理员操作函数
function goToDeliveryManagement() {
  // 跳转到发货管理页面，并预填订单号
  const deliveryUrl = `/admin/delivery-management?orderSn=${orderDetail.value?.orderSn}`
  window.open(deliveryUrl, '_blank')
}

function goToRefundManagement() {
  // 跳转到退款管理页面，并预填订单号
  ElMessage.info('退款管理页面开发中，请在退款管理模块中处理')
  // TODO: 实现退款管理页面后启用
  // const refundUrl = `/admin/refund-management?orderSn=${orderDetail.value?.orderSn}`
  // window.open(refundUrl, '_blank')
}

function refreshOrderDetail() {
  if (orderDetail.value) {
    loadOrderDetail(orderDetail.value.orderSn)
    ElMessage.success('订单信息已刷新')
  }
}

async function openRemarkDialog() {
  try {
    const { value } = await ElMessageBox.prompt('请输入管理员备注', '添加备注', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputValue: orderDetail.value?.adminRemark || '', // 显示现有备注
      inputPlaceholder: '请输入管理员备注...'
    })

    if (!value || !value.trim()) {
      ElMessage.warning('备注内容不能为空')
      return
    }

    // 调用保存备注API
    await saveAdminRemark(value.trim())
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存备注失败:', error)
    }
  }
}

// 保存管理员备注
async function saveAdminRemark(remark: string) {
  if (!orderDetail.value) return

  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    const url = `http://localhost:9999/order-service/api/v1/orders/${orderDetail.value.orderSn}/admin-remark`
    const requestData = { adminRemark: remark }

    console.log('保存备注请求:')
    console.log('URL:', url)
    console.log('请求数据:', requestData)
    console.log('Token:', token)

    const response = await axios.put(url, requestData, {
      headers: { Authorization: `Bearer ${token}` }
    })

    console.log('保存备注响应:', response.data)

    if (response.data.code === '000000') {
      // 更新本地数据
      orderDetail.value.adminRemark = remark
      ElMessage.success('备注保存成功')
    } else {
      ElMessage.error(response.data.msg || '保存备注失败')
    }
  } catch (error: any) {
    console.error('保存备注失败:', error)
    console.log('错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    ElMessage.error(error.response?.data?.msg || '保存备注失败')
  }
}

// 返回上一页
const goBack = () => {
  // 如果是从后台管理访问，直接关闭窗口
  if (isFromAdmin.value) {
    window.close()
  } else {
    // 前台用户正常返回上一页
    router.go(-1)
  }
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

/* 管理员操作区域样式 */
.admin-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-notice {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.admin-buttons {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.admin-remarks {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.remark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.remark-header .section-title {
  margin: 0;
}

.remark-content {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 12px;
  color: #666;
  line-height: 1.5;
  border-left: 4px solid #409eff;
}

.remark-empty {
  padding: 20px;
  text-align: center;
  background: #fafafa;
  border-radius: 4px;
  border: 1px dashed #ddd;
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