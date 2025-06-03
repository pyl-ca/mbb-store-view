<template>
  <div class="product-management">
    <div class="page-header">
      <h2>商品管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增商品
        </el-button>
        <el-button @click="loadProducts" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button
          type="success"
          @click="handleBatchOnShelf"
          :disabled="selectedProducts.length === 0"
        >
          <el-icon><Top /></el-icon>
          批量上架
        </el-button>
        <el-button
          type="warning"
          @click="handleBatchOffShelf"
          :disabled="selectedProducts.length === 0"
        >
          <el-icon><Bottom /></el-icon>
          批量下架
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="selectedProducts.length === 0"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="商品名称">
          <el-input v-model="filterForm.keyword" placeholder="请输入商品名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select v-model="filterForm.categoryId" placeholder="请选择分类" clearable style="width: 150px">
            <el-option
              v-for="category in flatCategories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="上架" :value="true" />
            <el-option label="下架" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐状态">
          <el-select v-model="filterForm.recommend" placeholder="请选择推荐状态" clearable style="width: 120px">
            <el-option label="推荐" :value="true" />
            <el-option label="不推荐" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchProducts">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 商品列表 -->
    <div class="table-section">
      <el-table
        :data="products"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              :src="getProductImage(row.image)"
              :preview-src-list="[getProductImage(row.image)]"
              style="width: 60px; height: 60px"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" width="200" show-overflow-tooltip />
        <el-table-column prop="subTitle" label="副标题" width="150" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <div class="price-info">
              <div class="current-price">¥{{ row.price?.toFixed(2) }}</div>
              <div v-if="row.originalPrice && row.originalPrice > row.price" class="original-price">
                ¥{{ row.originalPrice?.toFixed(2) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80">
          <template #default="{ row }">
            <el-tag :type="row.stock <= (row.warningStock || 5) ? 'danger' : 'success'">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <div class="status-tags">
              <el-tag :type="row.status ? 'success' : 'danger'" size="small">
                {{ row.status ? '上架' : '下架' }}
              </el-tag>
              <el-tag v-if="row.recommend" type="warning" size="small" style="margin-top: 2px;">
                推荐
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status ? '下架' : '上架' }}
            </el-button>
            <el-button
              size="small"
              :type="row.recommend ? 'warning' : 'primary'"
              @click="toggleRecommend(row)"
            >
              {{ row.recommend ? '取消推荐' : '推荐' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadProducts"
          @current-change="loadProducts"
        />
      </div>
    </div>

    <!-- 商品表单对话框 -->
    <ProductForm
      v-model:visible="formVisible"
      :product-data="currentProduct"
      :categories="categories"
      @success="handleFormSuccess"
    />

    <!-- 商品详情对话框 -->
    <ProductDetail
      v-model:visible="detailVisible"
      :product-data="currentProduct"
      @edit="handleEditFromDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Top, Bottom, Delete } from '@element-plus/icons-vue'
import axios from 'axios'
import ProductForm from '@/components/admin/ProductForm.vue'
import ProductDetail from '@/components/admin/ProductDetail.vue'

// 数据定义
const loading = ref(false)
const products = ref<any[]>([])
const categories = ref<any[]>([])
const selectedProducts = ref<any[]>([])

// 对话框状态
const formVisible = ref(false)
const detailVisible = ref(false)
const currentProduct = ref<any>(null)

// 筛选表单
const filterForm = reactive({
  keyword: '',
  categoryId: undefined as number | undefined,
  status: undefined as boolean | undefined,
  recommend: undefined as boolean | undefined
})

// 分页
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 计算属性 - 扁平化分类列表
const flatCategories = computed(() => {
  const flatten = (items: any[], level = 0): any[] => {
    let result: any[] = []
    items.forEach(item => {
      result.push({
        id: item.id,
        name: '　'.repeat(level) + item.name
      })
      if (item.children && item.children.length > 0) {
        result = result.concat(flatten(item.children, level + 1))
      }
    })
    return result
  }
  return flatten(categories.value)
})

// 页面初始化
onMounted(() => {
  loadProducts()
  loadCategories()
})

// 加载商品列表
async function loadProducts() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.current,
      size: pagination.size
    }

    // 添加筛选条件
    if (filterForm.keyword) params.keyword = filterForm.keyword
    if (filterForm.categoryId) params.categoryId = filterForm.categoryId
    if (filterForm.status !== undefined) params.status = filterForm.status
    if (filterForm.recommend !== undefined) params.recommend = filterForm.recommend

    const response = await axios.get('http://localhost:9999/product-service/api/v1/admin/products', {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    if (response.data.code === '000000') {
      const data = response.data.data
      products.value = data.records || data || []
      pagination.total = data.total || products.value.length
    }
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 加载分类列表
async function loadCategories() {
  try {
    const response = await axios.get('http://localhost:9999/product-service/api/v1/admin/categories/tree', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    if (response.data.code === '000000') {
      categories.value = response.data.data || []
    }
  } catch (error) {
    console.error('加载分类列表失败:', error)
  }
}

// 搜索商品
function searchProducts() {
  pagination.current = 1
  loadProducts()
}

// 重置筛选
function resetFilter() {
  filterForm.keyword = ''
  filterForm.categoryId = undefined
  filterForm.status = undefined
  filterForm.recommend = undefined
  pagination.current = 1
  loadProducts()
}

// 处理选择变化
function handleSelectionChange(selection: any[]) {
  selectedProducts.value = selection
}

// 处理创建
function handleCreate() {
  currentProduct.value = null
  formVisible.value = true
}

// 处理查看
function handleView(product: any) {
  currentProduct.value = product
  detailVisible.value = true
}

// 处理编辑
function handleEdit(product: any) {
  currentProduct.value = product
  formVisible.value = true
}

// 从详情页面编辑
function handleEditFromDetail(product: any) {
  currentProduct.value = product
  formVisible.value = true
}

// 表单提交成功
function handleFormSuccess() {
  loadProducts()
}

// 批量上架
async function handleBatchOnShelf() {
  try {
    await ElMessageBox.confirm(`确定要上架选中的 ${selectedProducts.value.length} 个商品吗？`, '确认批量上架', {
      type: 'warning'
    })

    const ids = selectedProducts.value.map(item => item.id)
    await axios.put('http://localhost:9999/product-service/api/v1/admin/products/batch/on-shelf',
      { ids },
      { headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` } }
    )

    ElMessage.success('批量上架成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量上架失败:', error)
      ElMessage.error('批量上架失败')
    }
  }
}

// 批量下架
async function handleBatchOffShelf() {
  try {
    await ElMessageBox.confirm(`确定要下架选中的 ${selectedProducts.value.length} 个商品吗？`, '确认批量下架', {
      type: 'warning'
    })

    const ids = selectedProducts.value.map(item => item.id)
    await axios.put('http://localhost:9999/product-service/api/v1/admin/products/batch/off-shelf',
      { ids },
      { headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` } }
    )

    ElMessage.success('批量下架成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量下架失败:', error)
      ElMessage.error('批量下架失败')
    }
  }
}

// 批量删除
async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedProducts.value.length} 个商品吗？此操作不可恢复！`, '确认批量删除', {
      type: 'warning'
    })

    const ids = selectedProducts.value.map(item => item.id)
    await axios.delete('http://localhost:9999/product-service/api/v1/admin/products/batch', {
      data: { ids },
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success('批量删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 切换商品状态
async function toggleStatus(product: any) {
  try {
    const action = product.status ? '下架' : '上架'
    await ElMessageBox.confirm(`确定要${action}商品 "${product.name}" 吗？`, `确认${action}`, {
      type: 'warning'
    })

    const endpoint = product.status
      ? `http://localhost:9999/product-service/api/v1/admin/products/${product.id}/off-shelf`
      : `http://localhost:9999/product-service/api/v1/admin/products/${product.id}/on-shelf`

    await axios.put(endpoint, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success(`${action}成功`)
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换商品状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 切换推荐状态
async function toggleRecommend(product: any) {
  try {
    const action = product.recommend ? '取消推荐' : '推荐'
    await ElMessageBox.confirm(`确定要${action}商品 "${product.name}" 吗？`, `确认${action}`, {
      type: 'warning'
    })

    await axios.put(`http://localhost:9999/product-service/api/v1/admin/products/${product.id}/recommend`,
      { recommend: !product.recommend },
      { headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` } }
    )

    ElMessage.success(`${action}成功`)
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换推荐状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 删除商品
async function handleDelete(product: any) {
  try {
    await ElMessageBox.confirm(`确定要删除商品 "${product.name}" 吗？此操作不可恢复！`, '确认删除', {
      type: 'warning'
    })

    await axios.delete(`http://localhost:9999/product-service/api/v1/admin/products/${product.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商品失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取商品图片
function getProductImage(image: string) {
  if (!image) return '/images/placeholder.jpg'
  if (image.startsWith('http')) return image
  return `http://localhost:9999/static${image}`
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.product-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.pagination-section {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.current-price {
  font-weight: bold;
  color: #e6a23c;
}

.original-price {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

.status-tags {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-tags .el-tag {
  width: fit-content;
}
</style>
