<script setup lang="ts">
import Header from './components/Header.vue'
</script>

<template>
  <Header :logoOnly="false" />
  <div class="main-content">
    <router-view />
  </div>
</template>


<style scoped>
.main-content {
  min-height: calc(100vh - 70px);
  margin-top: 70px;
}
</style>
