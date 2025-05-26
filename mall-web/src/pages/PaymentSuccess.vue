<template>
  <div class="payment-success-page">
    <div class="container">
      <div class="success-card">
        <div class="success-icon">
          <i class="icon-success"></i>
        </div>
        <div class="success-info">
          <h2 class="success-title">支付成功</h2>
          <p class="success-desc">您的订单已支付成功，我们将尽快为您发货</p>
        </div>
        <div v-if="orderInfo" class="order-summary">
          <div class="summary-item">
            <span class="label">订单号：</span>
            <span class="value">{{ orderInfo.orderSn }}</span>
          </div>
          <div class="summary-item">
            <span class="label">支付金额：</span>
            <span class="value amount">¥{{ (orderInfo.payAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">支付时间：</span>
            <span class="value">{{ formatTime(orderInfo.payTime) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">支付方式：</span>
            <span class="value">{{ orderInfo.payTypeName || '余额支付' }}</span>
          </div>
        </div>
        <div class="action-buttons">
          <el-button size="large" @click="goToOrders">查看订单</el-button>
          <el-button type="primary" size="large" @click="goToHome">继续购物</el-button>
        </div>
      </div>
      <div class="tips-card">
        <div class="tips-title">
          <i class="icon-tips"></i>
          温馨提示
        </div>
        <div class="tips-content">
          <p>• 您可以在"我的订单"中查看订单详情和物流信息</p>
          <p>• 商品将在1-3个工作日内发货，请耐心等待</p>
          <p>• 如有任何问题，请联系客服：400-123-4567</p>
          <p>• 收到商品后，别忘了给我们一个好评哦~</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const orderInfo = ref(null)

onMounted(async () => {
  await loadOrderInfo()
})

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
  } catch (error) {
    console.error('加载订单信息失败:', error)
    ElMessage.error('加载订单信息失败')
  }
}

function goToOrders() {
  router.push('/user/orders')
}

function goToHome() {
  router.push('/')
}

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.payment-success-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  max-width: 600px;
  width: 100%;
}

.success-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.success-icon {
  margin-bottom: 20px;
}

.icon-success {
  display: inline-block;
  width: 80px;
  height: 80px;
  background: #52c41a;
  border-radius: 50%;
  position: relative;
}

.icon-success::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 40px;
  font-weight: bold;
}

.success-info {
  margin-bottom: 30px;
}

.success-title {
  font-size: 28px;
  color: #333;
  margin: 0 0 10px 0;
  font-weight: bold;
}

.success-desc {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.order-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: left;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  color: #666;
  font-size: 14px;
}

.summary-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.summary-item .value.amount {
  color: #ff6700;
  font-size: 18px;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-buttons .el-button {
  min-width: 120px;
}

.tips-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.tips-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.tips-title i {
  margin-right: 8px;
  color: #409EFF;
}

.tips-content {
  color: #666;
  line-height: 1.6;
}

.tips-content p {
  margin: 8px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .success-card {
    padding: 30px 20px;
  }

  .success-title {
    font-size: 24px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>