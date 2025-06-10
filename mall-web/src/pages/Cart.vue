<template>
  <div class="cart-page">
    <!-- 添加返回按钮 -->
    <el-button type="text" @click="goBack">返回</el-button>
    <div class="cart-main">
      <div class="cart-header">
        <el-checkbox v-model="allSelected" @change="toggleAll">全选</el-checkbox>
        <span class="cart-action" @click="batchMoveToFavorite">移入收藏</span>
        <span class="cart-action" @click="batchDelete">删除</span>
        <span class="cart-action" @click="clearCart">清空购物车</span>
        <span class="cart-count">全部商品 ({{ cartList.length }})</span>
      </div>
      <el-divider />
      <div v-for="item in cartList" :key="item.id" class="cart-item">
        <el-checkbox v-model="item.selected" @change="() => { updateSelected(item); updateAllSelected(); }" />
        <img :src="getProductImageUrl(item.productImage)" class="cart-img" />
        <div class="cart-info">
          <div class="cart-title">
            {{ item.productName }}
            <span v-if="item.description" class="cart-desc">（{{ item.description }}）</span>
          </div>
          <div class="cart-sku">{{ item.skuName }}</div>
        </div>
        <div class="cart-price">
          <div class="price-now">￥{{ item.price }}</div>
          <div class="price-old">￥{{ item.price + 200 }}</div>
        </div>
        <div class="cart-quantity">
          <el-input-number v-model="item.quantity" :min="1" :max="99" @change="changeQuantity(item)" size="small" />
        </div>
        <div class="cart-subtotal">￥{{ (item.price * item.quantity).toFixed(2) }}</div>
        <div class="cart-ops">
          <span
            class="cart-action"
            :class="{ 'favorited': favoriteStatus[item.productId] }"
            @click="moveToFavorite(item)"
          >
            {{ favoriteStatus[item.productId] ? '已收藏' : '移入收藏' }}
          </span>
          <span class="cart-action" @click="deleteItem(item)">删除</span>
        </div>
      </div>
      <div v-if="cartList.length === 0 && !loading" class="empty-tip">购物车为空</div>
    </div>
    <div class="cart-summary">
      <div class="summary-title">结算明细</div>
      <div class="summary-img">
        <div class="summary-icon">🛒</div>
      </div>
      <div class="summary-tip">选择商品查看实际支付价格</div>
      <div class="summary-total">
        合计：<span class="summary-total-price">￥{{ totalSelectedPrice.toFixed(2) }}</span>
      </div>
      <el-button type="primary" size="large" style="width:100%;" :disabled="selectedCount === 0" @click="checkout">结算</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAccessToken, handleAuthError } from '../utils/auth'
import { favoriteApi } from '../api/favorite'
import { getProductImageUrl } from '../utils/imageUtils'

const cartList = ref<any[]>([])
const loading = ref(false)
const allSelected = ref(false)
const favoriteStatus = ref<{ [productId: number]: boolean }>({})

async function fetchCartList() {
  loading.value = true
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    console.log('Token from localStorage:', token) // 调试信息
    console.log('Authorization header will be:', 'Bearer ' + token) // 调试信息

    if (!token) {
      console.error('未找到token，用户可能未登录')
      router.push('/login')
      loading.value = false
      return
    }

    const requestConfig = {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }
    console.log('Request config:', requestConfig) // 调试信息

    const response = await axios.get('/cart-service/api/cart/list', requestConfig)
    const list = (response.data || []).map((item: any) => ({
      ...item,
      selected: !!item.selected, // 使用双感叹号将数字转换为布尔值
      description: ''
    }))
    cartList.value = list
    updateAllSelected() // 在这里调用 updateAllSelected 方法

    await Promise.all(
      cartList.value.map(async (item) => {
        try {
          const res = await axios.get(`/product-service/api/v1/products/${item.productId}`)
          item.description = res.data.data.description || ''
        } catch (e) {
          item.description = ''
        }
      })
    )

    // 加载收藏状态
    await loadFavoriteStatus()
  } catch (error: any) {
    cartList.value = []
    console.error('获取购物车失败:', error)

    // 处理token失效
    if (error.response?.data?.code === 'A00214') {
      console.error('Token失效，跳转到登录页')
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

// 加载收藏状态
async function loadFavoriteStatus() {
  try {
    const promises = cartList.value.map(async (item) => {
      try {
        const isFavorited = await favoriteApi.checkFavorite(item.productId)
        favoriteStatus.value[item.productId] = isFavorited
      } catch (error) {
        favoriteStatus.value[item.productId] = false
      }
    })
    await Promise.all(promises)
  } catch (error) {
    console.error('加载收藏状态失败:', error)
  }
}

onMounted(() => {
  fetchCartList()
})

const selectedCount = computed(() => cartList.value.filter(i => i.selected).length)
const totalSelectedPrice = computed(() =>
  cartList.value.filter(i => i.selected).reduce((sum, item) => sum + item.price * item.quantity, 0)
)

function toggleAll(val: boolean) {
  cartList.value.forEach(item => {
    item.selected = val
    updateSelected(item)
  })
}
function updateAllSelected() {
  allSelected.value = cartList.value.every(item => item.selected)
}
function batchDelete() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  if (!token) {
    console.error('未找到token，用户可能未登录')
    return
  }

  const ids = cartList.value.filter(item => item.selected).map(item => item.id)
  Promise.all(ids.map(id =>
    axios.delete(`/cart-service/api/cart/${id}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
  )).then(() => {
    cartList.value = cartList.value.filter(item => !item.selected)
    updateAllSelected()
  })
}
async function deleteItem(item: any) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  if (!token) {
    console.error('未找到token，用户可能未登录')
    return
  }

  try {
    await axios.delete(`/cart-service/api/cart/${item.id}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    cartList.value = cartList.value.filter(i => i.id !== item.id)
    updateAllSelected()
  } catch (error) {
    console.error('删除商品失败:', error)
    throw error
  }
}

function changeQuantity(item: any) {
  // 调用后端接口更新数量
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  if (!token) {
    console.error('未找到token，用户可能未登录')
    return
  }

  axios.put(`/cart-service/api/cart/${item.id}/quantity`, null, {
    params: { quantity: item.quantity },
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }).catch(() => {
    // 失败时可回滚或提示
    fetchCartList()
  })
}

function updateSelected(item: any) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  if (!token) {
    console.error('未找到token，用户可能未登录')
    return
  }

  axios.put(`/cart-service/api/cart/${item.id}/selected`, null, {
    params: { selected: item.selected },
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
}

function clearCart() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  if (!token) {
    console.error('未找到token，用户可能未登录')
    return
  }

  axios.delete('/cart-service/api/cart/clear', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }).then(() => {
    cartList.value = []
    allSelected.value = false
  })
}
// 批量移入收藏
async function batchMoveToFavorite() {
  const selectedItems = cartList.value.filter(item => item.selected)
  if (selectedItems.length === 0) {
    ElMessage.warning('请选择要移入收藏的商品')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedItems.length} 件商品移入收藏吗？`,
      '批量移入收藏',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    const promises = selectedItems.map(item => moveToFavorite(item, false))
    await Promise.all(promises)

    ElMessage.success(`成功移入收藏 ${selectedItems.length} 件商品`)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量移入收藏失败')
    }
  }
}

// 单个移入收藏
async function moveToFavorite(item: any, showConfirm: boolean = true) {
  try {
    // 检查是否已收藏
    if (favoriteStatus.value[item.productId]) {
      ElMessage.info('该商品已在收藏列表中')
      return
    }

    if (showConfirm) {
      await ElMessageBox.confirm(
        `确定要将"${item.productName}"移入收藏吗？`,
        '移入收藏',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      )
    }

    // 添加到收藏
    await favoriteApi.addFavorite(item.productId)

    // 更新收藏状态
    favoriteStatus.value[item.productId] = true

    // 从购物车中删除
    await deleteItem(item)

    if (showConfirm) {
      ElMessage.success('移入收藏成功')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('移入收藏失败:', error)
      if (showConfirm) {
        ElMessage.error(error.message || '移入收藏失败')
      }
    }
  }
}

function checkout() {
  // 获取选中的商品ID
  const selectedItems = cartList.value.filter(item => item.selected)
  if (selectedItems.length === 0) {
    alert('请选择要结算的商品')
    return
  }

  // 获取选中商品的购物车ID
  const cartIds = selectedItems.map(item => item.id)

  // 跳转到订单确认页面
  router.push({
    path: '/order-confirm',
    query: {
      cartIds: cartIds.join(',')
    }
  })
}

const router = useRouter()

// 返回上一页，如果没有上一页则返回首页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1) // 返回上一页
  } else {
    router.push('/') // 如果没有上一页，则返回首页
  }
}
</script>

<style scoped>
.cart-page {
  display: flex;
  gap: 32px;
  margin: 32px 0;
  min-height: 600px;
}
.cart-main {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 24px 32px;
}
.cart-header {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 16px;
  margin-bottom: 12px;
}
.cart-action {
  color: #409eff;
  cursor: pointer;
  margin-right: 16px;
  transition: all 0.3s ease;
}

.cart-action.favorited {
  color: #f56c6c;
  font-weight: bold;
}

.cart-action.favorited:hover {
  color: #f78989;
}
.cart-count {
  margin-left: auto;
  color: #888;
}
.cart-item {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid #f0f0f0;
}
.cart-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eee;
}
.cart-info {
  flex: 1;
  min-width: 180px;
}
.cart-title {
  font-size: 16px;
  font-weight: bold;
  color: #222;
}
.cart-sku {
  color: #888;
  font-size: 13px;
  margin-top: 6px;
}
.cart-price {
  min-width: 120px;
  text-align: center;
}
.price-now {
  color: #e4393c;
  font-size: 18px;
  font-weight: bold;
}
.price-old {
  color: #aaa;
  font-size: 13px;
  text-decoration: line-through;
}
.cart-quantity {
  min-width: 120px;
  text-align: center;
}
.cart-subtotal {
  min-width: 100px;
  color: #e4393c;
  font-size: 16px;
  text-align: center;
}
.cart-ops {
  min-width: 100px;
  text-align: center;
}
.empty-tip {
  text-align: center;
  color: #aaa;
  margin-top: 40px;
}
.cart-summary {
  width: 320px;
  background: #fff;
  border-radius: 8px;
  padding: 32px 24px;
  height: fit-content;
  box-shadow: 0 2px 8px #f0f1f2;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.summary-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 18px;
}
.summary-img {
  margin-bottom: 12px;
}
.summary-icon {
  font-size: 48px;
  text-align: center;
}
.summary-tip {
  color: #888;
  font-size: 14px;
  margin-bottom: 18px;
}
.summary-total {
  font-size: 18px;
  margin-bottom: 18px;
}
.summary-total-price {
  color: #e4393c;
  font-size: 22px;
  font-weight: bold;
}
.cart-desc {
  color: #ff9800;
  font-size: 13px;
  margin-left: 8px;
}
</style>