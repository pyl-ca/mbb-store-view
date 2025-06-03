<template>
  <div class="banner-carousel-container">
    <el-carousel height="400px" indicator-position="outside" style="width:100%;">
      <el-carousel-item
        v-for="banner in banners"
        :key="banner.id"
        style="width:100%; height:400px;"
      >
        <a :href="banner.redirect_url" target="_blank" style="display:block;width:100%;height:100%;">
          <img :src="getBannerImgUrl(banner.imageUrl) || defaultImg" :alt="banner.title" class="banner-img" />
        </a>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ banners: Array<{ id: number, title: string, imageUrl: string, redirect_url: string }> }>()
const defaultImg = 'http://localhost:9999/product-service/search1.png'
function getBannerImgUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://localhost:9999${url.startsWith('/') ? url : '/' + url}`
}
</script>

<style scoped>
.banner-carousel-container {
  padding-top: 10px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  /* height: 400px; ✅ 可选，是否加上由你决定 */
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}
</style>
