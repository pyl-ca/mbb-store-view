<template>
  <div class="api-test-container">
    <h2>退款API直接测试</h2>
    
    <div class="test-section">
      <h3>测试退款详情API</h3>
      <el-input 
        v-model="testRefundSn" 
        placeholder="输入退款单号" 
        style="width: 300px; margin-right: 10px;"
      />
      <el-button @click="testRefundDetailAPI" type="primary">直接调用API</el-button>
      
      <div v-if="apiResult" class="result-section">
        <h4>API原始响应：</h4>
        <pre class="json-display">{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
      
      <div v-if="processedResult" class="result-section">
        <h4>处理后的数据：</h4>
        <pre class="json-display">{{ JSON.stringify(processedResult, null, 2) }}</pre>
      </div>
      
      <div v-if="timeTestResult" class="result-section">
        <h4>时间字段测试：</h4>
        <pre class="json-display">{{ timeTestResult }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h3>当前环境信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>Token:</strong> {{ currentToken ? '已设置' : '未设置' }}
        </div>
        <div class="info-item">
          <strong>API Base URL:</strong> http://localhost:9999
        </div>
        <div class="info-item">
          <strong>测试端点:</strong> /payment-service/api/v1/refund/{refundSn}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { formatTime } from '../utils/dateUtils'
import axios from 'axios'

const testRefundSn = ref('RF20250527183946718')
const apiResult = ref(null)
const processedResult = ref(null)
const timeTestResult = ref('')
const currentToken = ref('')

onMounted(() => {
  currentToken.value = localStorage.getItem('token') || localStorage.getItem('access_token') || ''
})

// 直接测试退款详情API
async function testRefundDetailAPI() {
  if (!testRefundSn.value) {
    ElMessage.warning('请输入退款单号')
    return
  }

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    
    console.log('调用API:', `http://localhost:9999/payment-service/api/v1/refund/${testRefundSn.value}`)
    console.log('请求头:', headers)
    
    const response = await axios.get(
      `http://localhost:9999/payment-service/api/v1/refund/${testRefundSn.value}`,
      { headers }
    )
    
    console.log('API响应:', response)
    apiResult.value = response.data
    
    // 处理数据
    if (response.data.code === '000000' && response.data.data) {
      const rawData = response.data.data
      
      // 处理字段映射
      const processed = {
        ...rawData,
        createTime: rawData.createTime || rawData.create_time || rawData.createdAt,
        updateTime: rawData.updateTime || rawData.update_time || rawData.updatedAt,
        applyTime: rawData.applyTime || rawData.apply_time || rawData.createTime || rawData.create_time,
        processTime: rawData.processTime || rawData.process_time || rawData.auditTime || rawData.audit_time,
        refundTime: rawData.refundTime || rawData.refund_time || rawData.completeTime || rawData.complete_time,
        auditTime: rawData.auditTime || rawData.audit_time
      }
      
      processedResult.value = processed
      
      // 测试时间格式化
      const timeTests = []
      const timeFields = ['createTime', 'updateTime', 'applyTime', 'processTime', 'refundTime', 'auditTime']
      
      timeFields.forEach(field => {
        const value = processed[field]
        if (value) {
          timeTests.push({
            field,
            originalValue: value,
            formattedValue: formatTime(value),
            type: typeof value
          })
        } else {
          timeTests.push({
            field,
            originalValue: '无数据',
            formattedValue: '无数据',
            type: 'undefined'
          })
        }
      })
      
      timeTestResult.value = JSON.stringify(timeTests, null, 2)
    }
    
    ElMessage.success('API调用成功')
  } catch (error: any) {
    console.error('API调用失败:', error)
    apiResult.value = {
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    }
    ElMessage.error('API调用失败: ' + error.message)
  }
}
</script>

<style scoped>
.api-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.test-section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.result-section {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.result-section h4 {
  margin-top: 0;
  color: #495057;
}

.json-display {
  background: #fff;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
  max-height: 400px;
  overflow-y: auto;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.info-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.info-item strong {
  color: #495057;
}
</style>
