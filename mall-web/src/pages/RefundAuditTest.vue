<template>
  <div class="refund-audit-test">
    <h2>退款审核API测试</h2>
    
    <el-card class="test-card">
      <template #header>
        <span>业务审核测试</span>
      </template>
      
      <el-form :model="businessForm" label-width="120px">
        <el-form-item label="退款单号">
          <el-input v-model="businessForm.refundSn" placeholder="请输入退款单号" />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-select v-model="businessForm.auditResult">
            <el-option label="通过" value="APPROVED" />
            <el-option label="拒绝" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="businessForm.auditRemark" type="textarea" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="testBusinessAudit" :loading="loading">
            测试业务审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <span>财务审核测试</span>
      </template>
      
      <el-form :model="financeForm" label-width="120px">
        <el-form-item label="退款单号">
          <el-input v-model="financeForm.refundSn" placeholder="请输入退款单号" />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-select v-model="financeForm.auditResult">
            <el-option label="通过" value="APPROVED" />
            <el-option label="拒绝" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="financeForm.auditRemark" type="textarea" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="testFinanceAudit" :loading="loading">
            测试财务审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <span>请求日志</span>
      </template>
      
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <div class="log-time">{{ log.time }}</div>
          <div class="log-type" :class="log.type">{{ log.type.toUpperCase() }}</div>
          <div class="log-content">{{ log.content }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { refundApi } from '../api/refund'

const loading = ref(false)
const logs = ref<Array<{time: string, type: string, content: string}>>([])

const businessForm = ref({
  refundSn: '',
  auditResult: 'APPROVED' as 'APPROVED' | 'REJECTED',
  auditRemark: ''
})

const financeForm = ref({
  refundSn: '',
  auditResult: 'APPROVED' as 'APPROVED' | 'REJECTED',
  auditRemark: ''
})

// 添加日志
function addLog(type: string, content: string) {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    type,
    content
  })
}

// 测试业务审核
async function testBusinessAudit() {
  if (!businessForm.value.refundSn) {
    ElMessage.error('请输入退款单号')
    return
  }

  loading.value = true
  
  const requestData = {
    refundSns: [businessForm.value.refundSn],  // 使用 refundSns 字段
    auditResult: businessForm.value.auditResult,
    auditRemark: businessForm.value.auditRemark,
    auditBy: 'admin'
  }

  addLog('request', `业务审核请求: ${JSON.stringify(requestData, null, 2)}`)

  try {
    const result = await refundApi.businessAudit(requestData)
    addLog('success', `业务审核成功: ${JSON.stringify(result)}`)
    ElMessage.success('业务审核成功')
  } catch (error: any) {
    addLog('error', `业务审核失败: ${error.message}`)
    ElMessage.error(error.message || '业务审核失败')
  } finally {
    loading.value = false
  }
}

// 测试财务审核
async function testFinanceAudit() {
  if (!financeForm.value.refundSn) {
    ElMessage.error('请输入退款单号')
    return
  }

  loading.value = true
  
  const requestData = {
    refundSns: [financeForm.value.refundSn],  // 使用 refundSns 字段
    auditResult: financeForm.value.auditResult,
    auditRemark: financeForm.value.auditRemark,
    auditBy: 'admin'
  }

  addLog('request', `财务审核请求: ${JSON.stringify(requestData, null, 2)}`)

  try {
    const result = await refundApi.financeAudit(requestData)
    addLog('success', `财务审核成功: ${JSON.stringify(result)}`)
    ElMessage.success('财务审核成功')
  } catch (error: any) {
    addLog('error', `财务审核失败: ${error.message}`)
    ElMessage.error(error.message || '财务审核失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.refund-audit-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  background: #f5f5f5;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.log-time {
  color: #666;
  min-width: 80px;
}

.log-type {
  min-width: 60px;
  font-weight: bold;
  text-transform: uppercase;
}

.log-type.request {
  color: #409eff;
}

.log-type.success {
  color: #67c23a;
}

.log-type.error {
  color: #f56c6c;
}

.log-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
