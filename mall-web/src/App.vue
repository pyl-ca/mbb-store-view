<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'

const route = useRoute()

// 判断是否为管理员页面
const isAdminPage = computed(() => {
  return route.path.startsWith('/admin')
})

// 判断是否需要隐藏Header的页面
const shouldHideHeader = computed(() => {
  // 管理员页面隐藏Header
  if (route.path.startsWith('/admin')) {
    return true
  }

  // 订单详情页面：如果是从后台访问则隐藏Header
  if (route.path.startsWith('/order-detail')) {
    return route.query.from === 'admin'
  }

  return false
})
</script>

<template>
  <!-- 只在需要显示Header的页面显示商城Header -->
  <Header v-if="!shouldHideHeader" :logoOnly="false" />
  <div class="main-content" :class="{ 'admin-layout': isAdminPage }">
    <router-view />
  </div>
</template>


<style scoped>
.main-content {
  min-height: calc(100vh - 70px);
  margin-top: 70px;
}

.main-content.admin-layout {
  min-height: 100vh;
  margin-top: 0;
}
</style>
