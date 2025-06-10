<template>
  <div class="refund-debug-container">
    <h2>退款API调试页面</h2>

    <div class="debug-section">
      <h3>1. 测试获取用户退款列表</h3>
      <el-button @click="testGetUserRefundList" type="primary">测试用户退款列表API</el-button>
      <div v-if="userRefundListResult" class="result-box">
        <h4>API响应结果：</h4>
        <pre>{{ JSON.stringify(userRefundListResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h3>2. 测试获取退款详情</h3>
      <el-input
        v-model="refundSnInput"
        placeholder="请输入退款单号"
        style="width: 300px; margin-right: 10px;"
      />
      <el-button @click="testGetRefundDetail" type="primary">测试退款详情API</el-button>
      <div v-if="refundDetailResult" class="result-box">
        <h4>API响应结果：</h4>
        <pre>{{ JSON.stringify(refundDetailResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h3>3. 测试网络请求</h3>
      <el-button @click="testDirectAPI" type="warning">直接测试API</el-button>
      <div v-if="directAPIResult" class="result-box">
        <h4>直接API调用结果：</h4>
        <pre>{{ JSON.stringify(directAPIResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h3>4. 当前用户信息</h3>
      <div class="info-box">
        <p><strong>Token:</strong> {{ currentToken ? currentToken.substring(0, 50) + '...' : '无' }}</p>
        <p><strong>用户信息:</strong> {{ currentUserInfo || '无' }}</p>
      </div>
    </div>

    <div class="debug-section">
      <h3>5. 时间格式化测试</h3>
      <el-button @click="testTimeFormatting" type="success">测试时间格式化</el-button>
      <div v-if="timeTestResult" class="result-box">
        <h4>时间格式化测试结果：</h4>
        <pre>{{ timeTestResult }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h3>6. API端点测试</h3>
      <div class="endpoint-list">
        <div class="endpoint-item">
          <strong>用户退款列表:</strong>
          <code>GET /payment-service/api/v1/refund/user/records</code>
        </div>
        <div class="endpoint-item">
          <strong>退款详情:</strong>
          <code>GET /payment-service/api/v1/refund/{refundSn}</code>
        </div>
        <div class="endpoint-item">
          <strong>管理员退款列表:</strong>
          <code>GET /payment-service/api/v1/refund/admin/records</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { refundApi } from '../api/refund'
import { formatTime } from '../utils/dateUtils'
import axios from 'axios'

const userRefundListResult = ref(null)
const refundDetailResult = ref(null)
const directAPIResult = ref(null)
const timeTestResult = ref('')
const refundSnInput = ref('RF20250126180001')
const currentToken = ref('')
const currentUserInfo = ref('')

onMounted(() => {
  // 获取当前用户信息
  currentToken.value = localStorage.getItem('token') || localStorage.getItem('access_token') || ''
  const userInfo = localStorage.getItem('user_info')
  currentUserInfo.value = userInfo ? JSON.parse(userInfo) : null
})

// 测试获取用户退款列表
async function testGetUserRefundList() {
  try {
    console.log('开始测试用户退款列表API...')
    const result = await refundApi.getUserRefundList({ page: 1, pageSize: 10 })
    console.log('用户退款列表API结果:', result)
    userRefundListResult.value = result
    ElMessage.success('用户退款列表API调用成功')
  } catch (error: any) {
    console.error('用户退款列表API调用失败:', error)
    userRefundListResult.value = { error: error.message, details: error }
    ElMessage.error('用户退款列表API调用失败: ' + error.message)
  }
}

// 测试获取退款详情
async function testGetRefundDetail() {
  if (!refundSnInput.value) {
    ElMessage.warning('请输入退款单号')
    return
  }

  try {
    console.log('开始测试退款详情API...', refundSnInput.value)
    const result = await refundApi.getRefundDetail(refundSnInput.value)
    console.log('退款详情API结果:', result)
    refundDetailResult.value = result
    ElMessage.success('退款详情API调用成功')
  } catch (error: any) {
    console.error('退款详情API调用失败:', error)
    refundDetailResult.value = { error: error.message, details: error }
    ElMessage.error('退款详情API调用失败: ' + error.message)
  }
}

// 直接测试API
async function testDirectAPI() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    console.log('直接调用API，headers:', headers)

    // 测试用户退款列表
    const response = await axios.get('/payment-service/api/v1/refund/user/records', {
      headers,
      params: { page: 1, size: 10 }
    })

    console.log('直接API调用响应:', response)
    directAPIResult.value = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    }
    ElMessage.success('直接API调用成功')
  } catch (error: any) {
    console.error('直接API调用失败:', error)
    directAPIResult.value = {
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    }
    ElMessage.error('直接API调用失败: ' + error.message)
  }
}

// 测试时间格式化
function testTimeFormatting() {
  const testTimes = [
    '2025-01-26T18:00:00',
    '2025-01-26T16:45:00',
    new Date().toISOString(),
    '2025-01-26 18:00:00',
    '1737889200000', // 时间戳（毫秒）
    '1737889200',    // 时间戳（秒）
    'Invalid Date',
    null,
    undefined,
    ''
  ]

  const results = testTimes.map(time => {
    try {
      return {
        input: time,
        output: formatTime(time),
        type: typeof time
      }
    } catch (error) {
      return {
        input: time,
        output: `错误: ${error.message}`,
        type: typeof time
      }
    }
  })

  timeTestResult.value = JSON.stringify(results, null, 2)
  ElMessage.success('时间格式化测试完成')
}
</script>

<style scoped>
.refund-debug-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.debug-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.debug-section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.result-box {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.result-box h4 {
  margin-top: 0;
  color: #495057;
}

.result-box pre {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.info-box {
  padding: 15px;
  background: #e3f2fd;
  border-radius: 4px;
  border: 1px solid #bbdefb;
}

.info-box p {
  margin: 5px 0;
  word-break: break-all;
}

.endpoint-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.endpoint-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.endpoint-item code {
  background: #fff;
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid #dee2e6;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>
