<template>
  <div class="page-wrapper">
    <!-- 导航栏、轮播图和分类推荐区域 -->
    <div class="main-section">
      <div class="main-container">
        <CategoryNav class="category-nav" />
        <div class="banner-carousel-container">
          <BannerCarousel :banners="banners" />
        </div>
        <div class="recommend-panel">
          <div class="recommend-title">分类推荐</div>
          <div class="recommend-list">
            <div class="recommend-item" v-for="item in recommendList" :key="item.title">
              <img :src="item.icon" class="recommend-icon" />
              <span class="recommend-label">{{ item.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 猜你喜欢区域 -->
    <div class="guess-you-like-section">
      <div class="guess-container">
        <div class="guess-title">猜你喜欢</div>
        <div class="guess-list">
          <div class="guess-item" v-for="item in guessList" :key="item.id" @click="goToProductDetail(item.id)">
            <img :src="getProductImageUrl(item.image)" class="guess-img" />
            <div class="guess-info">
              <div class="guess-name">{{ item.name }}</div>
              <div class="guess-price">￥{{ item.price }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类选择区域 -->
    <CategorySelector />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CategoryNav from '../components/CategoryNav.vue'
import BannerCarousel from '../components/BannerCarousel.vue'
import CategorySelector from '../components/CategorySelector.vue'
import axios from 'axios'
import { getProductImageUrl } from '@/utils/imageUtils'

const banners = ref<any[]>([])
const recommendList = ref([
  { title: '美妆个护', icon: 'https://img.alicdn.com/imgextra/i4/O1CN01n2wQwF1Qy8nQw1v6A_!!6000000002005-2-tps-80-80.png' },
  { title: '家用电器', icon: 'https://img.alicdn.com/imgextra/i2/O1CN01vQvQwF1Qy8nQw1v6B_!!6000000002005-2-tps-80-80.png' },
  { title: '潮流服装', icon: 'https://img.alicdn.com/imgextra/i1/O1CN01vQvQwF1Qy8nQw1v6C_!!6000000002005-2-tps-80-80.png' },
  { title: '手机数码', icon: 'https://img.alicdn.com/imgextra/i2/O1CN01vQvQwF1Qy8nQw1v6E_!!6000000002005-2-tps-80-80.png' }
])

const guessList = ref<any[]>([])

onMounted(async () => {
  try {
    // 获取轮播图数据
    console.log('开始获取轮播图数据...')
    const bannersResponse = await axios.get('/product-service/api/v1/banners/list')
    console.log('轮播图API响应:', bannersResponse.data)
    banners.value = bannersResponse.data.data || []
    console.log('轮播图数据:', banners.value)

    // 获取推荐商品数据
    console.log('开始获取推荐商品数据...')
    const recommendResponse = await axios.get('/product-service/api/v1/products/recommend')
    console.log('推荐商品API响应:', recommendResponse.data)
    guessList.value = recommendResponse.data.data || []
    console.log('推荐商品数据:', guessList.value)
  } catch (error) {
    console.error('加载首页数据失败:', error)
  }
})
const router = useRouter()
const goToProductDetail = (productId: string) => {
  router.push({ path: `/product/${productId}` })
}
</script>

<style scoped>
.page-wrapper {
  background: #fff;
  min-height: calc(100vh - 80px);
  padding: 10px 20px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 主要区域 */
.main-section {
  margin-bottom: 12px;
}

.main-container {
  display: flex;
  align-items: stretch;
  margin: 0 auto;
  max-width: 1200px;
  gap: 12px;
}

.category-nav {
  width: 240px;
  min-width: 240px;
  font-size: 14px;
  line-height: 1.7;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
}

.banner-carousel-container {
  flex: 1;
  display: flex;
  align-items: stretch;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.recommend-panel {
  width: 240px;
  min-width: 240px;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  height: 400px;
  box-sizing: border-box;
}

.recommend-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.recommend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  background: #fff;
}

.recommend-item:hover {
  background: #f0f8ff;
  border-color: #1890ff;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.recommend-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.recommend-label {
  font-size: 14px;
  color: #444;
  font-weight: 500;
}

/* 猜你喜欢区域 */
.guess-you-like-section {
  margin-bottom: 20px;
}

.guess-container {
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 24px;
}

.guess-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.guess-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  width: 100%;
}

.guess-item {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0;
}

.guess-item:hover {
  background: #f0f8ff;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  transform: translateY(-4px);
  border-color: #1890ff;
}

.guess-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 12px;
  border-radius: 8px;
}

.guess-info {
  text-align: center;
  width: 100%;
}

.guess-name {
  font-size: 15px;
  color: #222;
  margin-bottom: 6px;
  font-weight: 500;
  line-height: 1.4;
}

.guess-price {
  font-size: 18px;
  color: #ff4d4f;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .page-wrapper {
    padding: 8px 15px;
  }

  .main-container {
    flex-direction: column;
    gap: 12px;
  }

  .category-nav {
    width: 100%;
    height: auto;
  }

  .banner-carousel-container {
    height: 300px;
  }

  .recommend-panel {
    width: 100%;
    height: auto;
    padding: 16px;
  }

  .recommend-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }

  .recommend-item {
    flex: 1;
    min-width: 120px;
    justify-content: center;
    padding: 8px 12px;
  }

  .guess-list {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 8px 10px;
  }

  .main-container {
    gap: 8px;
  }

  .recommend-panel,
  .guess-container {
    padding: 16px;
  }

  .recommend-item {
    min-width: 100px;
    padding: 6px 8px;
  }

  .recommend-icon {
    width: 28px;
    height: 28px;
  }

  .recommend-label {
    font-size: 12px;
  }

  .guess-list {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .guess-item {
    padding: 16px 12px;
  }

  .guess-img {
    width: 100px;
    height: 100px;
  }
}
</style>
