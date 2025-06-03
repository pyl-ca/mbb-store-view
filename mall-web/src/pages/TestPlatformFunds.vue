<template>
  <div class="test-platform-funds">
    <h1>平台资金管理测试页面</h1>
    <p>这是一个测试页面，用于验证平台资金管理组件是否能正常工作。</p>
    
    <div class="component-wrapper">
      <PlatformFunds />
    </div>
  </div>
</template>

<script setup lang="ts">
import PlatformFunds from './admin/PlatformFunds.vue'
</script>

<style scoped>
.test-platform-funds {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-platform-funds h1 {
  color: #333;
  margin-bottom: 10px;
}

.test-platform-funds p {
  color: #666;
  margin-bottom: 30px;
}

.component-wrapper {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}
</style>
