<template>
  <div class="user-reviews-container">
    <h2 class="page-title">评价管理</h2>
    <el-divider />
    
    <div class="placeholder-content">
      <el-empty description="评价功能正在开发中，敬请期待" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 评价功能待实现
</script>

<style scoped>
.user-reviews-container {
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
