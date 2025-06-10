<template>
  <div class="order-confirm-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <el-button
          class="back-btn"
          @click="goBack"
          :icon="ArrowLeft"
          circle
          size="large"
        />
        <h1 class="page-title">确认订单</h1>
      </div>
    </div>

    <div class="main-container">
      <!-- 左侧主要内容 -->
      <div class="left-content">
        <!-- 收货地址 -->
        <div class="address-section">
          <div class="section-header">
            <i class="address-icon">📍</i>
            <span class="section-title">收货地址</span>
            <span class="manage-address" @click="showAddressSelector = true">管理收货地址</span>
          </div>

          <div v-if="selectedAddress" class="address-card" @click="showAddressSelector = true">
            <div class="address-main">
              <div class="recipient-info">
                <span class="recipient-name">{{ selectedAddress.name }}</span>
                <span class="recipient-phone">{{ selectedAddress.phone }}</span>
                <span v-if="selectedAddress.isDefault" class="default-tag">默认</span>
              </div>
              <div class="address-detail">
                {{ selectedAddress.province }} {{ selectedAddress.city }} {{ selectedAddress.district }} {{ selectedAddress.detail }}
              </div>
            </div>
            <i class="arrow-right">></i>
          </div>

          <div v-else class="address-empty" @click="showAddressSelector = true">
            <span class="empty-text">请选择收货地址</span>
            <i class="arrow-right">></i>
          </div>
        </div>

        <!-- 商品清单 -->
        <div class="goods-section">
          <div class="section-header">
            <span class="store-name">maobobo商城</span>
            <div class="store-actions">
              <span class="contact-seller">联系卖家</span>
            </div>
          </div>

          <div class="goods-list">
            <div v-for="item in orderItems" :key="item.skuId" class="goods-item">
              <div class="goods-image-wrapper">
                <img :src="`/static${item.image}`" class="goods-image" />
              </div>
              <div class="goods-info">
                <div class="goods-title">{{ item.name }}</div>
                <div class="goods-specs">{{ item.specs }}</div>
                <div class="goods-service">
                  <span class="service-tag">7天无理由退货</span>
                  <span class="service-tag">极速退款</span>
                </div>
              </div>
              <div class="goods-price">
                <div class="current-price">¥{{ item.price.toFixed(2) }}</div>
              </div>
              <div class="goods-quantity">
                <span>{{ item.quantity }}</span>
              </div>
              <div class="goods-subtotal">
                <span class="subtotal-price">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 商品金额小计 -->
          <div class="goods-summary">
            <div class="summary-row">
              <span>商品件数：</span>
              <span>{{ totalQuantity }}件</span>
            </div>
            <div class="summary-row">
              <span>商品总价：</span>
              <span class="summary-price">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- 订单备注 -->
        <div class="remark-section">
          <div class="remark-header">
            <span class="remark-title">订单备注</span>
            <span class="remark-limit">{{ remarkCount }}/200</span>
          </div>
          <el-input
            v-model="orderRemark"
            type="textarea"
            :rows="2"
            placeholder="选填，请先和商家协商一致"
            maxlength="200"
            @input="updateRemarkCount"
            class="remark-input"
          />
        </div>

        <!-- 发票信息 -->
        <div class="invoice-section">
          <div class="invoice-header">
            <span class="invoice-title">发票信息</span>
          </div>
          <div class="invoice-option">
            <el-radio v-model="invoiceType" label="none">不开发票</el-radio>
            <el-radio v-model="invoiceType" label="personal">个人</el-radio>
            <el-radio v-model="invoiceType" label="company">公司</el-radio>
          </div>
        </div>
      </div>

      <!-- 右侧订单摘要 -->
      <div class="right-sidebar">
        <div class="order-summary">
          <div class="summary-title">订单摘要</div>

          <div class="summary-content">
            <div class="summary-item">
              <span class="item-label">商品总价</span>
              <span class="item-value">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="item-label">运费</span>
              <span class="item-value free">免运费</span>
            </div>
            <div class="summary-item">
              <span class="item-label">优惠券</span>
              <span class="item-value discount">-¥0.00</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item total">
              <span class="item-label">应付总额</span>
              <span class="item-value total-amount">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="submit-section">
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              @click="submitOrder"
              :loading="submitting"
            >
              提交订单
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 地址选择弹窗 -->
    <el-dialog v-model="showAddressSelector" title="选择收货地址" width="600px">
      <div class="address-list">
        <div
          v-for="address in addressList"
          :key="address.id"
          class="address-item"
          :class="{ active: selectedAddress?.id === address.id }"
          @click="selectAddress(address)"
        >
          <div class="address-content">
            <div class="name-phone">{{ address.name }} {{ address.phone }}</div>
            <div class="address-detail">{{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}</div>
            <div v-if="address.isDefault" class="default-tag">默认</div>
          </div>
          <i v-if="selectedAddress?.id === address.id" class="icon-check"></i>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAddressSelector = false">取消</el-button>
        <el-button type="primary" @click="confirmAddress">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import axios from 'axios'

// 类型定义
interface OrderItem {
  skuId: number
  name: string
  specs: string
  price: number
  quantity: number
  image: string
}

interface Address {
  id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

const route = useRoute()
const router = useRouter()

// 数据定义
const orderItems = ref<OrderItem[]>([])
const selectedAddress = ref<Address | null>(null)
const addressList = ref<Address[]>([])
const orderRemark = ref('')
const submitting = ref(false)
const showAddressSelector = ref(false)
const invoiceType = ref('none')
const remarkCount = ref(0)
const cartIds = ref<number[]>([]) // 存储购物车ID列表
const isFromCart = ref(false) // 标识是否来自购物车

// 计算总价
const totalAmount = computed(() => {
  return orderItems.value.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
})

// 计算总数量
const totalQuantity = computed(() => {
  return orderItems.value.reduce((total, item) => {
    return total + item.quantity
  }, 0)
})

// 页面初始化
onMounted(async () => {
  await loadOrderItems()
  await loadAddressList()
})

// 加载订单商品
async function loadOrderItems() {
  try {
    const { skuId, quantity } = route.query
    if (skuId && quantity) {
      // 从商品详情页直接购买
      isFromCart.value = false
      const response = await axios.get(`/order-service/api/v1/sku/${skuId}`)
      const sku = response.data.data
      orderItems.value = [{
        skuId: sku.id,
        name: sku.skuName,
        specs: sku.skuName, // SKU规格信息
        price: sku.price,
        quantity: parseInt(quantity as string),
        image: sku.image
      }]
    } else {
      // 从购物车购买
      const cartIdsStr = route.query.cartIds as string
      const cartIdsArray = cartIdsStr?.split(',') || []
      if (cartIdsArray.length > 0) {
        isFromCart.value = true
        cartIds.value = cartIdsArray.map(id => parseInt(id)) // 存储购物车ID列表

        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        const response = await axios.get(`/cart-service/api/cart/list`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log('购物车API响应:', response.data) // 调试信息
        const cartData = response.data.data || response.data || []
        const cartItems = cartData.filter((item: any) => cartIdsArray.includes(item.id.toString()))
        orderItems.value = cartItems.map((item: any) => ({
          skuId: item.skuId,
          name: item.productName,
          specs: item.specs,
          price: item.price,
          quantity: item.quantity,
          image: item.productImage
        }))
      }
    }
  } catch (error) {
    console.error('加载订单商品失败:', error)
    ElMessage.error('加载商品信息失败')
  }
}

// 加载地址列表
async function loadAddressList() {
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    console.log('当前token:', token)

    if (!token) {
      console.error('未找到token，用户可能未登录')
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }

    console.log('发送地址请求，Authorization:', `Bearer ${token}`)
    const response = await axios.get(`/user-service/api/v1/addresses`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    console.log('地址请求成功:', response.data)
    addressList.value = response.data.data

    // 选择默认地址
    const defaultAddress = addressList.value.find(addr => addr.isDefault)
    if (defaultAddress) {
      selectedAddress.value = defaultAddress
    }
  } catch (error: any) {
    console.error('加载地址列表失败:', error)
    console.error('错误响应:', error.response?.data)

    if (error.response?.status === 401 || error.response?.data?.code === 'A00214') {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      ElMessage.error('加载地址列表失败')
    }
  }
}

// 选择地址
function selectAddress(address: any) {
  selectedAddress.value = address
}

// 确认地址选择
function confirmAddress() {
  showAddressSelector.value = false
}

// 更新备注字数
function updateRemarkCount() {
  remarkCount.value = orderRemark.value.length
}

// 返回上一页
function goBack() {
  router.go(-1)
}

// 提交订单
async function submitOrder() {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }

  if (orderItems.value.length === 0) {
    ElMessage.warning('订单商品不能为空')
    return
  }

  submitting.value = true

  try {
    let orderData: any

    if (isFromCart.value) {
      // ✅ 从购物车结算：传递cartIds，items为null，sourceType为1
      orderData = {
        cartIds: cartIds.value,  // 选中的购物车项ID列表
        items: null,             // 购物车模式下为空
        addressId: selectedAddress.value.id,
        sourceType: 1,           // 购物车来源
        remark: orderRemark.value
      }
    } else {
      // ✅ 从商品详情页直接购买：传递items，cartIds为null，sourceType为0
      orderData = {
        cartIds: null,           // 直接购买模式下为空
        items: orderItems.value.map((item: any) => ({
          skuId: item.skuId,
          quantity: item.quantity
        })),
        addressId: selectedAddress.value.id,
        sourceType: 0,           // 直接购买来源
        remark: orderRemark.value
      }
    }

    console.log('提交订单数据:', orderData) // 调试信息

    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    const response = await axios.post(
      `/order-service/api/v1/orders`,
      orderData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const order = response.data.data
    ElMessage.success('订单创建成功')

    // 跳转到支付页面
    router.push({
      path: '/payment',
      query: { orderSn: order.orderSn }
    })
  } catch (error: any) {
    console.error('创建订单失败:', error)
    ElMessage.error(error.response?.data?.msg || '创建订单失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.order-confirm-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
  background: #fff;
  padding: 20px 0;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 20px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: #f5f5f5;
  border-color: #d9d9d9;
  color: #666;
  transition: all 0.3s;
}

.back-btn:hover {
  background: #ff6700;
  border-color: #ff6700;
  color: #fff;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 20px;
}

.left-content {
  flex: 1;
}

.right-sidebar {
  width: 300px;
}

/* 地址部分 */
.address-section {
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.address-icon {
  font-size: 16px;
  margin-right: 8px;
}

.section-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.manage-address {
  color: #ff6700;
  font-size: 12px;
  cursor: pointer;
}

.manage-address:hover {
  text-decoration: underline;
}

.address-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.address-card:hover {
  background-color: #fafafa;
}

.address-main {
  flex: 1;
}

.recipient-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.recipient-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-right: 12px;
}

.recipient-phone {
  font-size: 14px;
  color: #666;
  margin-right: 12px;
}

.default-tag {
  background: #ff6700;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 2px;
}

.address-detail {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.address-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  cursor: pointer;
}

.empty-text {
  color: #999;
  font-size: 14px;
}

.arrow-right {
  color: #ccc;
  font-size: 14px;
}

/* 商品部分 */
.goods-section {
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
}

.store-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.store-actions {
  display: flex;
  align-items: center;
}

.contact-seller {
  color: #ff6700;
  font-size: 12px;
  cursor: pointer;
}

.contact-seller:hover {
  text-decoration: underline;
}

.goods-list {
  padding: 0 20px;
}

.goods-item {
  display: flex;
  align-items: flex-start;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.goods-item:last-child {
  border-bottom: none;
}

.goods-image-wrapper {
  width: 80px;
  height: 80px;
  margin-right: 12px;
  flex-shrink: 0;
}

.goods-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.goods-info {
  flex: 1;
  margin-right: 12px;
}

.goods-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.goods-specs {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.goods-service {
  display: flex;
  gap: 8px;
}

.service-tag {
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 2px;
}

.goods-price {
  width: 100px;
  text-align: center;
  margin-right: 12px;
}

.current-price {
  font-size: 14px;
  color: #ff6700;
  font-weight: 500;
}

.goods-quantity {
  width: 60px;
  text-align: center;
  margin-right: 12px;
  font-size: 14px;
  color: #333;
}

.goods-subtotal {
  width: 100px;
  text-align: right;
}

.subtotal-price {
  font-size: 14px;
  color: #ff6700;
  font-weight: 500;
}

.goods-summary {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-price {
  color: #ff6700;
  font-weight: 500;
}

/* 备注部分 */
.remark-section {
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
  padding: 20px;
}

.remark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.remark-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.remark-limit {
  font-size: 12px;
  color: #999;
}

.remark-input {
  width: 100%;
}

/* 发票部分 */
.invoice-section {
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
  padding: 20px;
}

.invoice-header {
  margin-bottom: 16px;
}

.invoice-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.invoice-option {
  display: flex;
  gap: 24px;
}

/* 右侧订单摘要 */
.order-summary {
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  position: sticky;
  top: 20px;
}

.summary-title {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.summary-content {
  padding: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item.total {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
  font-weight: 500;
}

.item-label {
  color: #666;
}

.item-value {
  color: #333;
}

.item-value.free {
  color: #52c41a;
}

.item-value.discount {
  color: #ff6700;
}

.item-value.total-amount {
  color: #ff6700;
  font-size: 16px;
  font-weight: 600;
}

.summary-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 12px 0;
}

.submit-section {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.submit-btn {
  width: 100%;
  height: 40px;
  background: #ff6700;
  border-color: #ff6700;
  font-size: 14px;
  font-weight: 500;
}

.submit-btn:hover {
  background: #e55a00;
  border-color: #e55a00;
}

/* 地址选择弹窗 */
.address-list {
  max-height: 400px;
  overflow-y: auto;
}

.address-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.address-item:hover {
  border-color: #ff6700;
}

.address-item.active {
  border-color: #ff6700;
  background-color: #fff7e6;
}

.address-content {
  flex: 1;
  position: relative;
}

.address-content .name-phone {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.address-content .address-detail {
  color: #666;
  font-size: 14px;
}

.address-content .default-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff6700;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 2px;
}

.icon-check {
  color: #ff6700;
  font-size: 18px;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .main-container {
    flex-direction: column;
  }

  .right-sidebar {
    width: 100%;
    position: static;
  }

  .order-summary {
    position: static;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 18px;
  }

  .main-container {
    padding: 0 10px;
  }

  .goods-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .goods-image-wrapper {
    width: 60px;
    height: 60px;
    margin-bottom: 8px;
  }

  .goods-price,
  .goods-quantity,
  .goods-subtotal {
    width: auto;
    text-align: left;
    margin-right: 0;
    margin-bottom: 4px;
  }
}
</style>
