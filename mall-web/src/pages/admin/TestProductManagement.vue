<template>
  <div class="test-product-management">
    <h2>商品管理测试页面</h2>
    
    <div class="test-section">
      <h3>1. 测试商品列表加载</h3>
      <el-button @click="testLoadProducts" type="primary">加载商品列表</el-button>
      <div v-if="products.length > 0" class="test-result">
        <p>成功加载 {{ products.length }} 个商品</p>
        <ul>
          <li v-for="product in products.slice(0, 3)" :key="product.id">
            {{ product.name }} - ¥{{ product.price }}
          </li>
        </ul>
      </div>
    </div>

    <div class="test-section">
      <h3>2. 测试分类列表加载</h3>
      <el-button @click="testLoadCategories" type="success">加载分类列表</el-button>
      <div v-if="categories.length > 0" class="test-result">
        <p>成功加载 {{ categories.length }} 个分类</p>
        <ul>
          <li v-for="category in categories.slice(0, 3)" :key="category.id">
            {{ category.name }}
          </li>
        </ul>
      </div>
    </div>

    <div class="test-section">
      <h3>3. 测试商品表单组件</h3>
      <el-button @click="showProductForm" type="warning">打开商品表单</el-button>
    </div>

    <div class="test-section">
      <h3>4. 测试商品详情组件</h3>
      <el-button @click="showProductDetail" type="info" :disabled="products.length === 0">
        查看商品详情
      </el-button>
    </div>

    <!-- 商品表单对话框 -->
    <el-dialog
      v-model="formVisible"
      title="测试商品表单"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="form-test">
        <p>这里应该显示商品表单组件</p>
        <p>包含：基本信息、价格信息、库存信息、图片上传、SKU管理等</p>
      </div>
      <template #footer>
        <el-button @click="formVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 商品详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="测试商品详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="detail-test" v-if="currentProduct">
        <p><strong>商品名称：</strong>{{ currentProduct.name }}</p>
        <p><strong>商品价格：</strong>¥{{ currentProduct.price }}</p>
        <p><strong>商品状态：</strong>{{ currentProduct.status ? '上架' : '下架' }}</p>
        <p><strong>库存数量：</strong>{{ currentProduct.stock }}</p>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 数据定义
const products = ref<any[]>([])
const categories = ref<any[]>([])
const formVisible = ref(false)
const detailVisible = ref(false)
const currentProduct = ref<any>(null)

// 测试加载商品列表
async function testLoadProducts() {
  try {
    const response = await axios.get('http://localhost:9999/product-service/api/v1/admin/products', {
      params: { page: 1, size: 10 },
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    if (response.data.code === '000000') {
      const data = response.data.data
      products.value = data.records || data || []
      ElMessage.success(`成功加载 ${products.value.length} 个商品`)
    } else {
      ElMessage.error('加载商品失败：' + response.data.message)
    }
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error('加载商品列表失败')
  }
}

// 测试加载分类列表
async function testLoadCategories() {
  try {
    const response = await axios.get('http://localhost:9999/product-service/api/v1/admin/categories/tree', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    
    if (response.data.code === '000000') {
      categories.value = response.data.data || []
      ElMessage.success(`成功加载 ${categories.value.length} 个分类`)
    } else {
      ElMessage.error('加载分类失败：' + response.data.message)
    }
  } catch (error) {
    console.error('加载分类列表失败:', error)
    ElMessage.error('加载分类列表失败')
  }
}

// 显示商品表单
function showProductForm() {
  formVisible.value = true
}

// 显示商品详情
function showProductDetail() {
  if (products.value.length > 0) {
    currentProduct.value = products.value[0]
    detailVisible.value = true
  } else {
    ElMessage.warning('请先加载商品列表')
  }
}
</script>

<style scoped>
.test-product-management {
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
  color: #303133;
}

.test-result {
  margin-top: 15px;
  padding: 15px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
}

.test-result p {
  margin: 0 0 10px 0;
  font-weight: bold;
  color: #409eff;
}

.test-result ul {
  margin: 0;
  padding-left: 20px;
}

.test-result li {
  margin-bottom: 5px;
  color: #606266;
}

.form-test,
.detail-test {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 6px;
}

.detail-test p {
  margin-bottom: 10px;
  line-height: 1.6;
}
</style>
