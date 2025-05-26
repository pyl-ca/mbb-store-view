<template>
  <div class="user-favorites-container">
    <h2 class="page-title">我的收藏</h2>
    <el-divider />
    
    <div class="placeholder-content">
      <el-empty description="收藏功能正在开发中，敬请期待" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 收藏功能待实现
</script>

<style scoped>
.user-favorites-container {
  width: 100%;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.placeholder-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>
