<template>
  <div class="search-results-page">
    <div class="search-header">
      <h1>{{ searchTitle }}</h1>
      <p v-if="!loading && !error" class="result-count">找到 {{ products.length }} 个商品</p>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">加载失败: {{ error }}</div>
    <div v-else-if="products.length === 0" class="no-results">
      <p>没有找到相关商品</p>
    </div>
    <div v-else>
      <div class="guess-list">
        <div class="guess-item" v-for="product in products" :key="product.id" @click="goToProductDetail(product.id)">
          <img :src="`http://localhost:9999/static${product.image}`" class="guess-img" />
          <div class="guess-info">
            <div class="guess-name">{{ product.name }}</div>
            <div class="guess-price">￥{{ product.price }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useRouter } from 'vue-router';

const route = useRoute()
const products = ref([])
const loading = ref(true)
const error = ref(null)

// 计算搜索标题
const searchTitle = computed(() => {
  const keyword = route.query.keyword
  const categoryId = route.query.categoryId

  if (keyword && categoryId) {
    return `"${keyword}" 的搜索结果 (分类筛选)`
  } else if (keyword) {
    return `"${keyword}" 的搜索结果`
  } else if (categoryId) {
    return `分类商品`
  } else {
    return `所有商品`
  }
})

onMounted(async () => {
  await loadProducts()
})

// 加载商品数据的函数
async function loadProducts() {
  const keyword = route.query.keyword
  const categoryId = route.query.categoryId

  loading.value = true
  error.value = null

  try {
    // 构建请求参数
    const params: any = {}
    if (keyword) {
      params.keyword = keyword
    }
    if (categoryId) {
      params.categoryId = categoryId
    }

    console.log('搜索参数:', params)

    const response = await axios.get(`http://localhost:9999/product-service/api/v1/products/select`, {
      params
    })
    products.value = response.data.data.records
    console.log("products值是", products.value)
  } catch (err) {
    error.value = err.message
    console.error('加载商品失败:', err)
  } finally {
    loading.value = false
  }
}

// 监听路由查询参数的变化
watch(() => route.query, async (newQuery, oldQuery) => {
  // 检查是否有查询参数发生变化
  if (newQuery.keyword !== oldQuery.keyword || newQuery.categoryId !== oldQuery.categoryId) {
    await loadProducts()
  }
}, { deep: true })

const router = useRouter();

function goToProductDetail(productId: string | number) {
  router.push({ path: `/product/${productId}` });
}
</script>

<style scoped>
.search-results-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-header {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}

.search-header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.result-count {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.loading, .error, .no-results {
  text-align: center;
  padding: 40px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.loading {
  color: #666;
}

.error {
  color: #ff4d4f;
}

.no-results {
  color: #999;
}

.guess-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.guess-item {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  transition: all 0.3s;
  cursor: pointer;
  border: 1px solid #f0f0f0;
}

.guess-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  border-color: #409EFF;
}

.guess-img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  margin-bottom: 12px;
  border-radius: 4px;
}

.guess-info {
  text-align: center;
  width: 100%;
}

.guess-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  height: 42px;
  line-height: 21px;
}

.guess-price {
  font-size: 16px;
  color: #ff6700;
  font-weight: bold;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .guess-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    padding: 15px;
  }

  .guess-img {
    width: 120px;
    height: 120px;
  }

  .search-results-page {
    padding: 10px;
  }
}
</style>
