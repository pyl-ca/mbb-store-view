<template>
  <div class="category-nav">
    <!-- 左侧分类列表 -->
    <div class="main-categories" @mouseleave="hidePanelDelayed">
      <template v-for="category in categories" :key="category.id">
        <!-- 一级分类 -->
        <div
          class="main-category-item level-1"
          :class="{ active: hoveredCategory?.id === category.id }"
          @mouseenter="showSubCategories(category)"
          @click="navigateToCategory(category.id, $event)"
        >
          <span class="category-name">{{ category.name }}</span>
          <i class="arrow-icon" v-if="category.children && category.children.length">▶</i>
        </div>

        <!-- 二级分类 -->
        <template v-if="category.children && category.children.length">
          <div
            v-for="subCategory in category.children"
            :key="subCategory.id"
            class="main-category-item level-2"
            @click="navigateToCategory(subCategory.id, $event)"
          >
            <span class="category-name">{{ subCategory.name }}</span>
            <i class="arrow-icon" v-if="subCategory.children && subCategory.children.length">▶</i>
          </div>
        </template>
      </template>
    </div>

    <!-- 右侧二级三级分类弹出层 -->
    <div
      v-if="hoveredCategory && hoveredCategory.children && hoveredCategory.children.length"
      class="sub-categories-panel"
      @mouseenter="keepPanelOpen"
      @mouseleave="hidePanelDelayed"
    >
      <div class="sub-categories-content">
        <div
          v-for="subCategory in hoveredCategory.children"
          :key="subCategory.id"
          class="sub-category-group"
        >
          <div
            class="sub-category-title"
            @click="navigateToCategory(subCategory.id, $event)"
          >
            {{ subCategory.name }}
          </div>
          <div
            v-if="subCategory.children && subCategory.children.length"
            class="third-categories"
          >
            <span
              v-for="thirdCategory in subCategory.children"
              :key="thirdCategory.id"
              class="third-category-item"
              @click="navigateToCategory(thirdCategory.id, $event)"
            >
              {{ thirdCategory.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface ThirdCategory {
  id: number
  name: string
}

interface SubCategory {
  id: number
  name: string
  children?: ThirdCategory[]
}

interface Category {
  id: number
  name: string
  children?: SubCategory[]
}

const router = useRouter()
const categories = ref<Category[]>([])
const hoveredCategory = ref<Category | null>(null)
let hideTimer: number | null = null

onMounted(async () => {
  try {
    const resp = await fetch('http://localhost:9999/product-service/api/v1/categories/tree')
    const result = await resp.json()
    console.log('分类数据:', result)
    if (result.code === '000000' && Array.isArray(result.data)) {
      categories.value = result.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        children: (cat.children || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          children: (sub.children || []).map((third: any) => ({
            id: third.id,
            name: third.name
          }))
        }))
      }))
      console.log('处理后的分类:', categories.value)
    } else {
      // 如果API没有返回数据，使用备用数据
      categories.value = [
        {
          id: 1,
          name: '家用电器',
          children: [
            { id: 101, name: '大家电', children: [{ id: 1001, name: '冰箱' }, { id: 1002, name: '洗衣机' }, { id: 1003, name: '空调' }] },
            { id: 102, name: '小家电', children: [{ id: 1004, name: '电饭煲' }, { id: 1005, name: '微波炉' }, { id: 1006, name: '豆浆机' }] }
          ]
        },
        {
          id: 2,
          name: '手机通讯',
          children: [
            { id: 201, name: '手机', children: [{ id: 2001, name: '苹果' }, { id: 2002, name: '华为' }, { id: 2003, name: '小米' }] },
            { id: 202, name: '配件', children: [{ id: 2004, name: '手机壳' }, { id: 2005, name: '充电器' }, { id: 2006, name: '耳机' }] }
          ]
        },
        {
          id: 3,
          name: '服饰鞋包',
          children: [
            { id: 301, name: '女装', children: [{ id: 3001, name: '连衣裙' }, { id: 3002, name: '上衣' }, { id: 3003, name: '裤装' }] },
            { id: 302, name: '男装', children: [{ id: 3004, name: 'T恤' }, { id: 3005, name: '衬衫' }, { id: 3006, name: '裤子' }] }
          ]
        },
        {
          id: 4,
          name: '美妆个护',
          children: [
            { id: 401, name: '护肤', children: [{ id: 4001, name: '洁面' }, { id: 4002, name: '爽肤水' }, { id: 4003, name: '面霜' }] },
            { id: 402, name: '彩妆', children: [{ id: 4004, name: '口红' }, { id: 4005, name: '粉底' }, { id: 4006, name: '眼影' }] }
          ]
        }
      ]
    }
  } catch (e) {
    console.error('获取分类失败', e)
    // 网络错误时也使用备用数据
    categories.value = [
      {
        id: 1,
        name: '家用电器',
        children: [
          { id: 101, name: '大家电', children: [{ id: 1001, name: '冰箱' }, { id: 1002, name: '洗衣机' }, { id: 1003, name: '空调' }] },
          { id: 102, name: '小家电', children: [{ id: 1004, name: '电饭煲' }, { id: 1005, name: '微波炉' }, { id: 1006, name: '豆浆机' }] }
        ]
      },
      {
        id: 2,
        name: '手机通讯',
        children: [
          { id: 201, name: '手机', children: [{ id: 2001, name: '苹果' }, { id: 2002, name: '华为' }, { id: 2003, name: '小米' }] },
          { id: 202, name: '配件', children: [{ id: 2004, name: '手机壳' }, { id: 2005, name: '充电器' }, { id: 2006, name: '耳机' }] }
        ]
      },
      {
        id: 3,
        name: '服饰鞋包',
        children: [
          { id: 301, name: '女装', children: [{ id: 3001, name: '连衣裙' }, { id: 3002, name: '上衣' }, { id: 3003, name: '裤装' }] },
          { id: 302, name: '男装', children: [{ id: 3004, name: 'T恤' }, { id: 3005, name: '衬衫' }, { id: 3006, name: '裤子' }] }
        ]
      },
      {
        id: 4,
        name: '美妆个护',
        children: [
          { id: 401, name: '护肤', children: [{ id: 4001, name: '洁面' }, { id: 4002, name: '爽肤水' }, { id: 4003, name: '面霜' }] },
          { id: 402, name: '彩妆', children: [{ id: 4004, name: '口红' }, { id: 4005, name: '粉底' }, { id: 4006, name: '眼影' }] }
        ]
      }
    ]
  }
})

// 显示子分类
function showSubCategories(category: Category) {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  hoveredCategory.value = category
}

// 保持面板打开
function keepPanelOpen() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

// 延迟隐藏面板
function hidePanelDelayed() {
  hideTimer = setTimeout(() => {
    hoveredCategory.value = null
  }, 300) as unknown as number
}

// 导航到分类页面
function navigateToCategory(categoryId: number, e?: MouseEvent) {
  if (e) {
    e.stopPropagation()
  }

  console.log('导航到分类:', categoryId)

  router.push({
    path: '/SearchResults',
    query: { categoryId: categoryId.toString() }
  })
}
</script>

<style scoped>
.category-nav {
  position: relative;
  width: 100px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: visible;
  height: 400px;
}

/* 左侧主分类 */
.main-categories {
  background: #fff;
  border-radius: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.main-categories::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.main-category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

/* 一级分类样式 */
.main-category-item.level-1 {
  background: #fff;
  font-weight: 600;
}

.main-category-item.level-1:hover,
.main-category-item.level-1.active {
  background-color: #ff6b35;
  color: #fff;
}

/* 二级分类样式 */
.main-category-item.level-2 {
  padding-left: 20px;
  background: #f8f9fa;
  font-size: 13px;
  font-weight: 400;
  color: #666;
}

.main-category-item.level-2:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}

.main-category-item:last-child {
  border-bottom: none;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
}

.arrow-icon {
  font-size: 12px;
  opacity: 0.7;
}

/* 右侧子分类弹出层 */
.sub-categories-panel {
  position: absolute;
  left: 100px;
  top: 0;
  width: 600px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.sub-categories-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.sub-category-group {
  margin-bottom: 20px;
}

.sub-category-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  cursor: pointer;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: color 0.2s;
}

.sub-category-title:hover {
  color: #ff6b35;
}

.third-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.third-category-item {
  display: inline-block;
  padding: 6px 12px;
  font-size: 13px;
  color: #666;
  background: #f8f8f8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.third-category-item:hover {
  background: #ff6b35;
  color: #fff;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .sub-categories-panel {
    width: 500px;
  }

  .sub-categories-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .category-nav {
    width: 100%;
  }

  .sub-categories-panel {
    left: 0;
    width: 100%;
    position: fixed;
    top: 60px;
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
