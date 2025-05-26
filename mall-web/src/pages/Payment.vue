<template>
  <div class="payment-page">
    <div class="container">
      <!-- 订单信息 -->
      <div class="order-info-section">
        <div class="section-title">
          <i class="icon-order"></i>
          订单信息
        </div>
        <div v-if="orderInfo" class="order-card">
          <div class="order-header">
            <span class="order-sn">订单号：{{ orderInfo.orderSn }}</span>
            <span class="order-status">{{ orderInfo.statusName }}</span>
          </div>
          <div class="order-amount">
            <span class="label">应付金额：</span>
            <span class="amount">¥{{ orderInfo.payAmount.toFixed(2) }}</span>
          </div>
          <div class="countdown" v-if="countdown > 0">
            <span>请在 {{ formatTime(countdown) }} 内完成支付，否则订单将被取消</span>
          </div>
        </div>
      </div>

      <!-- 支付方式 -->
      <div class="payment-method-section">
        <div class="section-title">
          <i class="icon-payment"></i>
          选择支付方式
        </div>
        <div class="payment-methods">
          <div
            class="payment-method"
            :class="{ active: selectedPayMethod === 'balance' }"
            @click="selectPayMethod('balance')"
          >
            <div class="method-info">
              <i class="icon-wallet"></i>
              <div class="method-details">
                <div class="method-name">余额支付</div>
                <div class="method-desc">可用余额：¥{{ userBalance.toFixed(2) }}</div>
              </div>
            </div>
            <i class="icon-radio" :class="{ checked: selectedPayMethod === 'balance' }"></i>
          </div>

          <div
            class="payment-method"
            :class="{ active: selectedPayMethod === 'alipay' }"
            @click="selectPayMethod('alipay')"
          >
            <div class="method-info">
              <i class="icon-alipay"></i>
              <div class="method-details">
                <div class="method-name">支付宝</div>
                <div class="method-desc">推荐有支付宝账户的用户使用</div>
              </div>
            </div>
            <i class="icon-radio" :class="{ checked: selectedPayMethod === 'alipay' }"></i>
          </div>

          <div
            class="payment-method"
            :class="{ active: selectedPayMethod === 'wechat' }"
            @click="selectPayMethod('wechat')"
          >
            <div class="method-info">
              <i class="icon-wechat"></i>
              <div class="method-details">
                <div class="method-name">微信支付</div>
                <div class="method-desc">推荐有微信账户的用户使用</div>
              </div>
            </div>
            <i class="icon-radio" :class="{ checked: selectedPayMethod === 'wechat' }"></i>
          </div>
        </div>
      </div>

      <!-- 余额不足提示 -->
      <div v-if="selectedPayMethod === 'balance' && userBalance < orderInfo?.payAmount" class="insufficient-balance">
        <div class="warning-text">
          <i class="icon-warning"></i>
          余额不足，请充值后再试或选择其他支付方式
        </div>
        <el-button type="primary" size="small" @click="goToWallet">去充值</el-button>
      </div>
    </div>

    <!-- 底部支付栏 -->
    <div class="payment-bar">
      <div class="payment-info">
        <span class="payment-text">应付：</span>
        <span class="payment-amount">¥{{ orderInfo?.payAmount.toFixed(2) }}</span>
      </div>
      <el-button
        type="primary"
        size="large"
        @click="handlePayment"
        :loading="paying"
        :disabled="!selectedPayMethod || (selectedPayMethod === 'balance' && userBalance < orderInfo?.payAmount)"
      >
        {{ getPayButtonText() }}
      </el-button>
    </div>

    <!-- 支付密码弹窗 -->
    <el-dialog v-model="showPayPasswordDialog" title="输入支付密码" width="400px" :close-on-click-modal="false">
      <div class="pay-password-dialog">
        <div class="amount-info">
          <span>支付金额：</span>
          <span class="amount">¥{{ orderInfo?.payAmount.toFixed(2) }}</span>
        </div>
        <div class="password-input">
          <el-input
            v-model="payPassword"
            type="password"
            placeholder="请输入6位支付密码"
            maxlength="6"
            show-password
            @keyup.enter="confirmPayment"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showPayPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPayment" :loading="paying">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// 数据定义
const orderInfo = ref(null)
const userBalance = ref(0)
const selectedPayMethod = ref('')
const paying = ref(false)
const showPayPasswordDialog = ref(false)
const payPassword = ref('')
const countdown = ref(0)
let countdownTimer = null

// 页面初始化
onMounted(async () => {
  await loadOrderInfo()
  await loadUserBalance()
  startCountdown()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

// 加载订单信息
async function loadOrderInfo() {
  try {
    const orderSn = route.query.orderSn
    if (!orderSn) {
      ElMessage.error('订单号不能为空')
      router.push('/user/orders')
      return
    }

    const response = await axios.get(`http://localhost:9999/order-service/api/v1/orders/${orderSn}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    orderInfo.value = response.data.data

    // 如果订单已支付，跳转到订单详情
    if (orderInfo.value.status !== 0) {
      ElMessage.info('订单状态已变更')
      router.push(`/orders/${orderSn}`)
    }
  } catch (error) {
    console.error('加载订单信息失败:', error)
    ElMessage.error('加载订单信息失败')
    router.push('/user/orders')
  }
}

// 加载用户余额
async function loadUserBalance() {
  try {
    const response = await axios.get(`http://localhost:9999/payment-service/api/v1/balance`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    userBalance.value = response.data.data.availableBalance
  } catch (error) {
    console.error('加载用户余额失败:', error)
  }
}

// 选择支付方式
function selectPayMethod(method: string) {
  selectedPayMethod.value = method
}

// 获取支付按钮文本
function getPayButtonText() {
  if (!selectedPayMethod.value) return '请选择支付方式'
  if (selectedPayMethod.value === 'balance' && userBalance.value < orderInfo.value?.payAmount) {
    return '余额不足'
  }
  return `确认支付 ¥${orderInfo.value?.payAmount.toFixed(2)}`
}

// 处理支付
async function handlePayment() {
  if (!selectedPayMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }

  if (selectedPayMethod.value === 'balance') {
    // 余额支付需要输入支付密码
    showPayPasswordDialog.value = true
  } else {
    // 第三方支付
    await processThirdPartyPayment()
  }
}

// 确认支付（余额支付）
async function confirmPayment() {
  if (!payPassword.value) {
    ElMessage.warning('请输入支付密码')
    return
  }

  if (payPassword.value.length !== 6) {
    ElMessage.warning('支付密码必须是6位数字')
    return
  }

  paying.value = true

  try {
    const response = await axios.post(
      `http://localhost:9999/payment-service/api/v1/payment/unified-pay`,
      {
        orderSn: orderInfo.value.orderSn,
        payAmount: orderInfo.value.payAmount,
        payType: 'balance',
        payPassword: payPassword.value
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
      }
    )

    ElMessage.success('支付成功')
    showPayPasswordDialog.value = false

    // 跳转到支付成功页面
    router.push({
      path: '/payment-success',
      query: { orderSn: orderInfo.value.orderSn }
    })
  } catch (error: any) {
    console.error('支付失败:', error)
    ElMessage.error(error.response?.data?.msg || '支付失败')
  } finally {
    paying.value = false
  }
}

// 处理第三方支付
async function processThirdPartyPayment() {
  paying.value = true

  try {
    const response = await axios.post(
      `http://localhost:9999/payment-service/api/v1/payment/unified-pay`,
      {
        orderSn: orderInfo.value.orderSn,
        payAmount: orderInfo.value.payAmount,
        payType: selectedPayMethod.value
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
      }
    )

    const paymentResult = response.data.data

    // 根据支付类型处理不同的支付流程
    if (selectedPayMethod.value === 'alipay') {
      // 支付宝支付 - 跳转到支付宝页面
      if (paymentResult.payUrl) {
        window.open(paymentResult.payUrl, '_blank')
        ElMessage.info('请在新窗口中完成支付')
      }
    } else if (selectedPayMethod.value === 'wechat') {
      // 微信支付 - 显示二维码
      if (paymentResult.qrCode) {
        ElMessage.info('请使用微信扫码支付')
        // 这里可以显示二维码弹窗
      }
    }

    // 开始轮询支付状态
    startPaymentStatusPolling()

  } catch (error: any) {
    console.error('发起支付失败:', error)
    ElMessage.error(error.response?.data?.msg || '发起支付失败')
  } finally {
    paying.value = false
  }
}

// 轮询支付状态
function startPaymentStatusPolling() {
  const pollInterval = setInterval(async () => {
    try {
      const response = await axios.get(
        `http://localhost:9999/order-service/api/v1/orders/${orderInfo.value.orderSn}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
        }
      )

      const order = response.data.data
      if (order.status === 1) { // 已支付
        clearInterval(pollInterval)
        ElMessage.success('支付成功')
        router.push({
          path: '/payment-success',
          query: { orderSn: orderInfo.value.orderSn }
        })
      }
    } catch (error) {
      console.error('查询支付状态失败:', error)
    }
  }, 3000) // 每3秒查询一次

  // 5分钟后停止轮询
  setTimeout(() => {
    clearInterval(pollInterval)
  }, 5 * 60 * 1000)
}

// 跳转到钱包页面
function goToWallet() {
  router.push('/wallet')
}

// 开始倒计时
function startCountdown() {
  if (!orderInfo.value) return

  // 设置30分钟倒计时
  countdown.value = 30 * 60

  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      ElMessageBox.alert('订单支付超时，订单已被取消', '提示', {
        confirmButtonText: '确定',
        callback: () => {
          router.push('/user/orders')
        }
      })
    }
  }, 1000)
}

// 格式化时间
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.payment-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 80px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.section-title i {
  margin-right: 8px;
  color: #409EFF;
}

/* 订单信息部分 */
.order-info-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.order-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.order-sn {
  font-size: 14px;
  color: #666;
}

.order-status {
  color: #ff6700;
  font-weight: bold;
}

.order-amount {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.order-amount .label {
  color: #666;
  margin-right: 10px;
}

.order-amount .amount {
  color: #ff6700;
  font-size: 24px;
  font-weight: bold;
}

.countdown {
  color: #ff4d4f;
  font-size: 14px;
}

/* 支付方式部分 */
.payment-method-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.payment-method {
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

.payment-method:hover {
  border-color: #409EFF;
}

.payment-method.active {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.method-info {
  display: flex;
  align-items: center;
}

.method-info i {
  font-size: 24px;
  margin-right: 15px;
  color: #409EFF;
}

.method-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.method-desc {
  font-size: 14px;
  color: #666;
}

.icon-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  position: relative;
}

.icon-radio.checked {
  border-color: #409EFF;
}

.icon-radio.checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background-color: #409EFF;
  border-radius: 50%;
}

/* 余额不足提示 */
.insufficient-balance {
  background: #fff2e8;
  border: 1px solid #ffb366;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.warning-text {
  display: flex;
  align-items: center;
  color: #ff6700;
}

.warning-text i {
  margin-right: 8px;
}

/* 底部支付栏 */
.payment-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 15px 20px;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-info {
  display: flex;
  align-items: center;
}

.payment-text {
  color: #666;
  margin-right: 5px;
}

.payment-amount {
  color: #ff6700;
  font-size: 20px;
  font-weight: bold;
}

/* 支付密码弹窗 */
.pay-password-dialog {
  text-align: center;
}

.amount-info {
  margin-bottom: 20px;
  font-size: 16px;
}

.amount-info .amount {
  color: #ff6700;
  font-weight: bold;
  font-size: 18px;
}

.password-input {
  margin-bottom: 20px;
}
</style>
