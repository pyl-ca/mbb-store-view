<template>
  <div class="debug-orders">
    <h2>订单查询调试页面</h2>
    
    <!-- 测试表单 -->
    <div class="test-form">
      <el-form :model="testForm" inline>
        <el-form-item label="订单状态">
          <el-select v-model="testForm.status" placeholder="请选择状态" clearable>
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户搜索">
          <el-input v-model="testForm.userKeyword" placeholder="请输入用户名或手机号" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="testForm.orderSn" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="testQuery">测试查询</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 当前表单值 -->
    <div class="form-values">
      <h3>当前表单值：</h3>
      <pre>{{ JSON.stringify(testForm, null, 2) }}</pre>
    </div>

    <!-- 查询参数 -->
    <div class="query-params" v-if="lastParams">
      <h3>最后发送的查询参数：</h3>
      <pre>{{ JSON.stringify(lastParams, null, 2) }}</pre>
    </div>

    <!-- API响应 -->
    <div class="api-response" v-if="lastResponse">
      <h3>API响应：</h3>
      <pre>{{ JSON.stringify(lastResponse, null, 2) }}</pre>
    </div>

    <!-- 订单列表 -->
    <div class="orders-list" v-if="orders.length > 0">
      <h3>订单列表（{{ orders.length }} 条）：</h3>
      <el-table :data="orders" stripe>
        <el-table-column prop="orderSn" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户名" width="120" />
        <el-table-column prop="userPhone" label="手机号" width="130" />
        <el-table-column prop="status" label="状态码" width="80" />
        <el-table-column prop="statusName" label="状态名称" width="100" />
        <el-table-column prop="totalAmount" label="金额" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 测试表单
const testForm = reactive({
  status: null as number | null,
  userKeyword: '',
  orderSn: ''
})

const orders = ref([])
const lastParams = ref(null)
const lastResponse = ref(null)

// 测试查询
async function testQuery() {
  try {
    const params: any = {
      page: 1,
      size: 10
    }

    // 添加筛选条件
    if (testForm.status !== null && testForm.status !== undefined) {
      params.status = testForm.status
    }
    if (testForm.orderSn && testForm.orderSn.trim()) {
      params.orderSn = testForm.orderSn.trim()
    }
    if (testForm.userKeyword && testForm.userKeyword.trim()) {
      params.userKeyword = testForm.userKeyword.trim()
    }

    lastParams.value = { ...params }
    console.log('发送查询参数:', params)

    const response = await axios.get('http://localhost:9999/order-service/api/v1/orders/admin/all', {
      params,
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` 
      }
    })

    lastResponse.value = response.data
    orders.value = response.data.data?.records || []
    
    console.log('API响应:', response.data)
    ElMessage.success(`查询成功，返回 ${orders.value.length} 条记录`)
  } catch (error: any) {
    console.error('查询失败:', error)
    ElMessage.error(`查询失败: ${error.response?.data?.msg || error.message}`)
    lastResponse.value = error.response?.data || { error: error.message }
  }
}

// 重置表单
function resetForm() {
  testForm.status = null
  testForm.userKeyword = ''
  testForm.orderSn = ''
  orders.value = []
  lastParams.value = null
  lastResponse.value = null
}
</script>

<style scoped>
.debug-orders {
  padding: 20px;
}

.test-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.form-values,
.query-params,
.api-response,
.orders-list {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.form-values h3,
.query-params h3,
.api-response h3,
.orders-list h3 {
  margin-top: 0;
  color: #303133;
}

pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}
</style>
