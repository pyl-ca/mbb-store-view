<template>
  <div class="user-favorites-container">
    <div class="header">
      <h2 class="page-title">我的收藏</h2>
      <div class="header-actions">
        <el-button @click="loadFavorites" :loading="loading" size="small">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button
          v-if="selectedItems.length > 0"
          type="danger"
          @click="batchRemoveFavorites"
          size="small"
        >
          批量删除 ({{ selectedItems.length }})
        </el-button>
      </div>
    </div>
    <el-divider />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 空状态 -->
    <div v-else-if="favorites.length === 0" class="empty-container">
      <el-empty description="暂无收藏商品">
        <el-button type="primary" @click="$router.push('/')">
          去逛逛
        </el-button>
      </el-empty>
    </div>

    <!-- 收藏列表 -->
    <div v-else class="favorites-content">
      <div class="batch-actions">
        <el-checkbox
          v-model="selectAll"
          @change="handleSelectAll"
          :indeterminate="isIndeterminate"
        >
          全选
        </el-checkbox>
        <span class="total-count">共 {{ favorites.length }} 件商品</span>
      </div>

      <div class="favorites-grid">
        <div
          v-for="item in favorites"
          :key="item.id"
          class="favorite-item"
          :class="{ 'unavailable': !item.productStatus || item.productStock <= 0 }"
        >
          <el-checkbox
            v-model="selectedItems"
            :value="item.id"
            class="item-checkbox"
          />

          <div class="product-image" @click="goToProduct(item.productId)">
            <el-image
              :src="getProductImageUrl(item.productImage)"
              :alt="item.productName"
              fit="cover"
              class="image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-if="!item.productStatus" class="status-overlay">
              已下架
            </div>
            <div v-else-if="item.productStock <= 0" class="status-overlay">
              缺货
            </div>
          </div>

          <div class="product-info">
            <h3 class="product-name" @click="goToProduct(item.productId)">
              {{ item.productName }}
            </h3>
            <div class="product-price">
              ¥{{ item.productPrice.toFixed(2) }}
            </div>
            <div class="product-meta">
              <span class="stock-info">
                库存: {{ item.productStock }}
              </span>
              <span class="favorite-time">
                {{ formatTime(item.createTime) }}
              </span>
            </div>
          </div>

          <div class="item-actions">
            <el-button
              type="primary"
              size="small"
              @click="addToCart(item)"
              :disabled="!item.productStatus || item.productStock <= 0"
            >
              加入购物车
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="removeFavorite(item)"
            >
              取消收藏
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Picture } from '@element-plus/icons-vue'
import axios from 'axios'
import { favoriteApi } from '../../api/favorite'
import type { FavoriteItem } from '../../types/favorite'
import { getProductImageUrl } from '../../utils/imageUtils'

const router = useRouter()

// 响应式数据
const favorites = ref<FavoriteItem[]>([])
const loading = ref(false)
const selectedItems = ref<number[]>([])

// 计算属性
const selectAll = computed({
  get: () => selectedItems.value.length === favorites.value.length && favorites.value.length > 0,
  set: (value: boolean) => {
    selectedItems.value = value ? favorites.value.map(item => item.id) : []
  }
})

const isIndeterminate = computed(() => {
  const selected = selectedItems.value.length
  return selected > 0 && selected < favorites.value.length
})

// 加载收藏列表
async function loadFavorites() {
  loading.value = true
  try {
    favorites.value = await favoriteApi.getFavoritesList()

    // 添加调试信息
    console.log('收藏列表数据:', favorites.value)
    favorites.value.forEach((item, index) => {
      console.log(`商品${index + 1}:`, {
        name: item.productName,
        status: item.productStatus,
        stock: item.productStock,
        image: item.productImage,
        statusType: typeof item.productStatus,
        stockType: typeof item.productStock,
        imageType: typeof item.productImage
      })
    })
  } catch (error: any) {
    ElMessage.error(error.message || '加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

// 全选/取消全选
function handleSelectAll(value: boolean) {
  selectedItems.value = value ? favorites.value.map(item => item.id) : []
}

// 跳转到商品详情
function goToProduct(productId: number) {
  router.push(`/product/${productId}`)
}

// 格式化时间
function formatTime(timeStr: string) {
  const date = new Date(timeStr)
  return date.toLocaleDateString()
}

// 判断商品是否可用
function isProductAvailable(item: FavoriteItem) {
  // 处理不同的数据类型
  const status: any = item.productStatus
  const stock = item.productStock

  // 检查商品状态
  let isStatusOk = false
  if (typeof status === 'boolean') {
    isStatusOk = status
  } else if (typeof status === 'string') {
    isStatusOk = status.toLowerCase() === 'true' || status === '1'
  } else if (typeof status === 'number') {
    isStatusOk = status === 1
  }

  // 检查库存
  const hasStock = stock > 0

  return isStatusOk && hasStock
}

// 获取商品状态文本
function getProductStatusText(item: FavoriteItem) {
  const status: any = item.productStatus
  const stock = item.productStock

  // 先检查商品状态
  let isStatusOk = false
  if (typeof status === 'boolean') {
    isStatusOk = status
  } else if (typeof status === 'string') {
    isStatusOk = status.toLowerCase() === 'true' || status === '1'
  } else if (typeof status === 'number') {
    isStatusOk = status === 1
  }

  if (!isStatusOk) {
    return '已下架'
  }

  if (stock <= 0) {
    return '缺货'
  }

  return '正常'
}

// 取消收藏
async function removeFavorite(item: FavoriteItem) {
  try {
    await ElMessageBox.confirm(
      `确定要取消收藏"${item.productName}"吗？`,
      '确认取消收藏',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await favoriteApi.removeFavorite(item.productId)
    ElMessage.success('取消收藏成功')

    // 从列表中移除
    favorites.value = favorites.value.filter(fav => fav.id !== item.id)
    // 从选中列表中移除
    selectedItems.value = selectedItems.value.filter(id => id !== item.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '取消收藏失败')
    }
  }
}

// 批量取消收藏
async function batchRemoveFavorites() {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要删除的商品')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要取消收藏选中的 ${selectedItems.value.length} 件商品吗？`,
      '批量取消收藏',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 获取选中的商品
    const selectedFavorites = favorites.value.filter(item => selectedItems.value.includes(item.id))

    // 批量删除
    const promises = selectedFavorites.map(item => favoriteApi.removeFavorite(item.productId))
    await Promise.all(promises)

    ElMessage.success(`成功取消收藏 ${selectedItems.value.length} 件商品`)

    // 重新加载列表
    await loadFavorites()
    selectedItems.value = []
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量取消收藏失败')
    }
  }
}

// 加入购物车
async function addToCart(item: FavoriteItem) {
  try {
    // 检查登录状态
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }

    // 检查商品状态
    if (!isProductAvailable(item)) {
      ElMessage.warning('商品已下架或缺货，无法加入购物车')
      return
    }

    // 获取商品的默认SKU（这里简化处理，实际可能需要让用户选择规格）
    const skuResponse = await axios.get(
      `/product-service/api/specs/product/${item.productId}/sku-list`
    )

    const skuList = skuResponse.data
    if (!skuList || skuList.length === 0) {
      ElMessage.error('商品规格信息不完整')
      return
    }

    // 使用第一个SKU作为默认选择
    const defaultSku = skuList[0]

    // 调用加入购物车API
    await axios.post(
      '/cart-service/api/cart/add',
      null,
      {
        params: {
          skuId: defaultSku.id,
          quantity: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    ElMessage.success('加入购物车成功')
  } catch (error: any) {
    console.error('加入购物车失败:', error)
    ElMessage.error(error.response?.data?.message || '加入购物车失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.user-favorites-container {
  width: 100%;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.loading-container,
.empty-container {
  padding: 40px 0;
}

.favorites-content {
  width: 100%;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.total-count {
  color: #666;
  font-size: 14px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.favorite-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: white;
  transition: all 0.3s ease;
  position: relative;
}

.favorite-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.favorite-item.unavailable {
  opacity: 0.6;
  background-color: #f5f5f5;
}

.item-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: 12px;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  color: #ccc;
  font-size: 24px;
}

.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.product-info {
  margin-bottom: 16px;
}

.product-name {
  font-size: 16px;
  color: #333;
  margin: 0 0 8px 0;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.product-name:hover {
  color: #409eff;
}

.product-price {
  font-size: 18px;
  color: #e6a23c;
  font-weight: bold;
  margin-bottom: 8px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.stock-info {
  color: #67c23a;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-actions .el-button {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-favorites-container {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }

  .batch-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
