<template>
  <div class="product-detail-container">
    <!-- 添加返回按钮 -->
    <el-button type="text" @click="goBack">返回</el-button>
    <!-- 左侧图片区 -->
    <div class="image-section">
      <img :src="mainImage" class="main-img" alt="商品主图" />
      <div class="thumb-list" v-if="detailImages.length">
        <img
          v-for="(img, idx) in detailImages"
          :key="idx"
          :src="img"
          class="thumb-img"
          :class="{ active: mainImage === img }"
          @click="mainImage = img"
        />
      </div>
    </div>
    <!-- 右侧信息区 -->
    <div class="info-section" v-if="productDetail">
      <h2 class="product-title">{{ productDetail.name }}</h2>
      <div class="product-subtitle">{{ productDetail.subTitle }}</div>
      <div class="product-meta">
        <span>卖点：{{ productDetail.categoryName }}</span>
        <span style="margin-left: 16px;">{{ productDetail.description }}</span>
      </div>
      <div class="price-box">
        劲爆价：<span class="price">￥{{ productDetail.price }}</span>
        <span class="origin-price">￥{{ productDetail.originalPrice }}</span>
      </div>
      <div class="tips">*退货补运费 *7天无理由退货 *24小时快速退款</div>
      <!-- 动态规格选择 -->
      <div v-for="spec in specs" :key="spec.id" class="sku-row">
        <span>{{ spec.name }}：</span>
        <template v-for="value in spec.values" :key="value.id">
          <el-button
            :type="selectedSpecs[spec.id] === value.id ? 'primary' : 'default'"
            size="small"
            style="margin-right: 8px; margin-bottom: 8px"
            :disabled="!isSpecValueAvailable(spec.id, value.id)"
            @click="() => selectSpecValue(spec.id, value.id, value.image)"
          >
            <template v-if="value.image">
              <img :src="value.image.startsWith('http') ? value.image : 'http://localhost:9999/static' + value.image" style="width:24px;height:24px;vertical-align:middle;margin-right:4px;" />
            </template>
            {{ value.value }}
          </el-button>
        </template>
      </div>
      <div class="sku-row">
        <span>数量：</span>
        <el-input-number v-model="buyCount" :min="1" :max="productDetail.stock" size="small" />
        <span class="stock">剩余库存：<span style="color:#e4393c;">{{ productDetail.stock }}</span></span>
      </div>
      <div class="sku-row">
        <span>销量：</span>
        <span>{{ productDetail.sales }}</span>
      </div>
      <div class="delivery">maobobo商城发货并提供售后服务，今日下单，明日送达</div>
      <div class="actions">
        <el-button type="primary" size="large" @click="buyNow">立即购买</el-button>
        <el-button size="large" icon="el-icon-shopping-cart-full" @click="addToCart">加入购物车</el-button>
        <FavoriteButton
          :product-id="productDetail.id"
          :show-count="true"
          size="large"
          @favorite-changed="onFavoriteChanged"
        />
      </div>
    </div>

    <!-- 商品评论区域 -->
    <div v-if="productDetail && !error" class="product-reviews-section">
      <el-divider />
      <h3 class="section-title">商品评价</h3>
      <ProductReviews :product-id="productDetail.id" ref="reviewsRef" />
    </div>

    <div v-if="error" class="error">加载失败: {{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router' // 确保导入 useRouter
import FavoriteButton from '../components/FavoriteButton.vue'
import ProductReviews from '../components/ProductReviews.vue'

const route = useRoute()
const router = useRouter() // 初始化 router

const productDetail = ref<any>(null)
const error = ref<string | null>(null)
const mainImage = ref('')
const detailImages = ref<string[]>([])
const buyCount = ref(1)

// 新增：规格和SKU相关
const specs = ref<any[]>([])
const skuList = ref<any[]>([])
const selectedSpecs = ref<{ [specId: number]: number }>({})
const currentSku = ref<any>(null)

const fetchSpecsAndSkus = async (productId: string) => {
  // 获取规格
  const specsRes = await axios.get(`http://localhost:9999/product-service/api/specs/product/${productId}`)
  specs.value = specsRes.data

  // 获取SKU列表
  const skuRes = await axios.get(`http://localhost:9999/product-service/api/specs/product/${productId}/sku-list`)
  skuList.value = skuRes.data

  // 默认选中第一个SKU的所有规格
  if (skuList.value.length > 0) {
    skuList.value[0].specs.forEach((s: any) => {
      selectedSpecs.value[s.specId] = s.specValueId
    })
    updateCurrentSku()
  }
}

const updateCurrentSku = () => {
  // 找到与当前选中规格完全匹配的SKU
  currentSku.value = skuList.value.find((sku: any) => {
    return sku.specs.every((s: any) => selectedSpecs.value[s.specId] === s.specValueId)
  })
  if (currentSku.value) {
    mainImage.value = currentSku.value.image.startsWith('http')
      ? currentSku.value.image
      : `http://localhost:9999/static${currentSku.value.image}`
    productDetail.value.price = currentSku.value.price
    productDetail.value.stock = currentSku.value.stock
  }
}

// 监听规格选择变化
watch(selectedSpecs, updateCurrentSku, { deep: true })

onMounted(async () => {
  const productId = route.params.id as string
  try {
    const response = await axios.get(`http://localhost:9999/product-service/api/v1/products/${productId}`)
    const data = response.data.data
    // 拼接主图和轮播图URL
    if (data.image && !data.image.startsWith('http')) {
      data.image = `http://localhost:9999/static${data.image}`
    }
    if (data.detailImages && Array.isArray(data.detailImages)) {
      data.detailImages = data.detailImages.map((img: string) =>
        img.startsWith('http') ? img : `http://localhost:9999/static${img}`
      )
    }
    productDetail.value = data
    mainImage.value = data.image
    detailImages.value = data.detailImages || []
    // 新增：加载规格和SKU
    await fetchSpecsAndSkus(productId)
  } catch (err: any) {
    error.value = err.message
  }
})

// 新增：选择规格值
function selectSpecValue(specId: number, valueId: number, image?: string) {
  selectedSpecs.value[specId] = valueId
  // 如果是颜色规格，切换主图
  const spec = specs.value.find(s => s.id === specId)
  if (spec && spec.name.includes('颜色') && image) {
    mainImage.value = image.startsWith('http') ? image : `http://localhost:9999/static${image}`
  }
}

// 判断某个规格值是否可选（可根据实际业务扩展，比如禁用无库存组合）
function isSpecValueAvailable(specId: number, valueId: number) {
  // 简单实现：所有组合都可选
  return true
}

// 新增：添加到购物车方法
async function addToCart() {
  if (!currentSku.value) {
    // 可以弹窗提示“请选择完整规格”
    alert('请选择完整的商品规格');
    return;
  }
  try {
    const token = localStorage.getItem('access_token');
    await axios.post(
      'http://localhost:9999/cart-service/api/cart/add',
      null, // 因为后端用@RequestParam，数据放在url参数
      {
        params: {
          skuId: currentSku.value.id,
          quantity: buyCount.value
        },
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }
    );
    // 可根据实际情况弹窗提示
    alert('添加到购物车成功');
  } catch (error) {
    alert('添加到购物车失败');
    console.error('添加到购物车失败:', error);
  }
}

// 立即购买方法
function buyNow() {
  if (!currentSku.value) {
    alert('请选择完整的商品规格');
    return;
  }

  // 跳转到订单确认页面，传递商品信息
  router.push({
    path: '/order-confirm',
    query: {
      skuId: currentSku.value.id,
      quantity: buyCount.value
    }
  });
}

// 收藏状态变化处理
function onFavoriteChanged(isFavorited: boolean) {
  console.log('收藏状态变化:', isFavorited)
  // 可以在这里添加其他逻辑，比如更新商品的收藏数量等
}

// 返回上一级页面的方法
const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.product-detail-container {
  display: flex;
  gap: 48px;
  margin: 40px 60px;
  align-items: flex-start;
  background: #fafbfc;
  border-radius: 12px;
  padding: 40px 32px;
}
.image-section {
  width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.main-img {
  width: 380px;
  height: 280px;
  object-fit: contain;
  border: 1px solid #eee;
  background: #fff;
  margin-bottom: 18px;
  border-radius: 8px;
}
.thumb-list {
  display: flex;
  gap: 10px;
}
.thumb-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border: 2px solid #eee;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: border 0.2s;
}
.thumb-img.active,
.thumb-img:hover {
  border: 2px solid #409eff;
}
.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.product-title {
  font-size: 26px;
  font-weight: bold;
  color: #222;
  margin-bottom: 4px;
}
.product-subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}
.product-meta {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}
.price-box {
  font-size: 22px;
  color: #409eff;
  font-weight: bold;
  margin: 12px 0 8px 0;
  background: #f5f7fa;
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 18px;
}
.price {
  color: #e4393c;
  font-size: 28px;
  font-weight: bold;
  margin-right: 16px;
}
.origin-price {
  color: #aaa;
  font-size: 16px;
  text-decoration: line-through;
}
.tips {
  color: #409eff;
  font-size: 14px;
  margin-bottom: 8px;
}
.sku-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 15px;
}
.stock {
  color: #e4393c;
  font-size: 15px;
}
.delivery {
  color: #888;
  font-size: 14px;
  margin-bottom: 12px;
}
.actions {
  display: flex;
  gap: 18px;
  margin: 18px 0 12px 0;
}
.desc {
  margin-top: 24px;
  color: #444;
  font-size: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 18px 24px;
}
.error {
  color: red;
  margin-top: 20px;
}

.product-reviews-section {
  margin-top: 40px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}
</style>
