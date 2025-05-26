<template>
  <div>
    <div class="home-container">
      <CategoryNav class="category-nav" />
      <div class="banner-recommend-wrapper">
        <BannerCarousel :banners="banners" />
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
  </div>
  <!-- 猜你喜欢区域 -->
  <div class="guess-you-like-section">
    <div class="guess-title">猜你喜欢</div>
    <div class="guess-list">
      <div class="guess-item" v-for="item in guessList" :key="item.id" @click="goToProductDetail(item.id)">
        <img :src="`http://localhost:9999/static${item.image}`" class="guess-img" />
        <div class="guess-info">
          <div class="guess-name">{{ item.name }}</div>
          <div class="guess-price">￥{{ item.price }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CategoryNav from '../components/CategoryNav.vue'
import BannerCarousel from '../components/BannerCarousel.vue'
import axios from 'axios'

const banners = ref<any[]>([])
const recommendList = ref([
  { title: '美妆个护', icon: 'https://img.alicdn.com/imgextra/i4/O1CN01n2wQwF1Qy8nQw1v6A_!!6000000002005-2-tps-80-80.png' },
  { title: '家用电器', icon: 'https://img.alicdn.com/imgextra/i2/O1CN01vQvQwF1Qy8nQw1v6B_!!6000000002005-2-tps-80-80.png' },
  { title: '潮流服装', icon: 'https://img.alicdn.com/imgextra/i1/O1CN01vQvQwF1Qy8nQw1v6C_!!6000000002005-2-tps-80-80.png' },
  { title: '手机数码', icon: 'https://img.alicdn.com/imgextra/i2/O1CN01vQvQwF1Qy8nQw1v6E_!!6000000002005-2-tps-80-80.png' }
])

const guessList = ref<any[]>([])

onMounted(() => {
  axios.get('http://localhost:9999/product-service/api/v1/banners/list').then(res => {
    banners.value = res.data.data || []
  })
  axios.get('http://localhost:9999/product-service/api/v1/products/recommend').then(res => {
    guessList.value = res.data.data || []
  })
})
const router = useRouter()
const goToProductDetail = (productId: string) => {
  router.push({ path: `/product/${productId}` })
}
</script>

<style scoped>
.home-container {
  display: flex;
  align-items: stretch;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.category-nav {
  width: 250px; /* 减小宽度，与CategoryNav.vue中保持一致 */
  min-width: 250px;
  font-size: 14px;
  line-height: 1.7;
  background: #fff;
  border-radius: 8px 0 0 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
}
.banner-recommend-wrapper {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: calc(100vw - 250px); /* 调整宽度，与导航栏宽度对应 */
  height: 400px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.banner-carousel-container {
  width: 68%;
  min-width: 480px;
  display: flex;
  align-items: stretch;
  height: 400px;
}
.recommend-panel {
  width: 400px;
  min-width: 380px;
  background: #fff;
  margin: 0;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
}
.recommend-title {
  margin-top: 10px;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}
.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}
.recommend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 0;
  border-radius: 4px;
  transition: background 0.2s;
}
.recommend-item:hover {
  background: #f5f7fa;
}
.recommend-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.recommend-label {
  font-size: 16px;
  color: #444;
}
.guess-you-like-section {
  width: 100%;
  background: #fff;
  margin-top: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 24px 0 32px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}
.guess-title {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 18px;
  margin-left: 40px;
  align-self: flex-start;
}
.guess-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
  width: 90vw;
  max-width: 1200px;
}
.guess-item {
  background: #fafbfc;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  transition: box-shadow 0.2s;
  cursor: pointer;
}
.guess-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
}
.guess-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 10px;
}
.guess-info {
  text-align: center;
}
.guess-name {
  font-size: 15px;
  color: #222;
  margin-bottom: 4px;
}
.guess-price {
  font-size: 16px;
  color: #e4393c;
  font-weight: bold;
}
</style>
