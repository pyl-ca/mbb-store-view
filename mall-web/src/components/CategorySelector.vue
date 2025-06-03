<template>
  <div class="category-selector">
    <div class="selector-container">
      <div class="selector-title">选择分类</div>
      <div class="category-grid">
        <div 
          v-for="category in categories" 
          :key="category.id" 
          class="category-card"
          @click="navigateToCategory(category.id)"
        >
          <div class="category-icon">
            <i class="category-emoji">{{ getCategoryIcon(category.name) }}</i>
          </div>
          <div class="category-name">{{ category.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Category {
  id: number
  name: string
  children?: any[]
}

const router = useRouter()
const categories = ref<Category[]>([])

onMounted(async () => {
  try {
    const resp = await fetch('http://localhost:9999/product-service/api/v1/categories/tree')
    const result = await resp.json()
    if (result.code === '000000' && Array.isArray(result.data)) {
      categories.value = result.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        children: cat.children || []
      }))
    } else {
      // 如果API没有返回数据，使用备用数据
      categories.value = [
        { id: 1, name: '家用电器', children: [] },
        { id: 2, name: '手机通讯', children: [] },
        { id: 3, name: '电视影音', children: [] },
        { id: 4, name: '厨房电器', children: [] },
        { id: 5, name: '女装', children: [] },
        { id: 6, name: '鞋靴', children: [] },
        { id: 7, name: '美妆个护', children: [] },
        { id: 8, name: '护肤', children: [] },
        { id: 9, name: '男装', children: [] },
        { id: 10, name: '运动户外', children: [] },
        { id: 11, name: '数码', children: [] },
        { id: 12, name: '汽车', children: [] }
      ]
    }
  } catch (e) {
    console.error('获取分类失败', e)
    // 网络错误时也使用备用数据
    categories.value = [
      { id: 1, name: '家用电器', children: [] },
      { id: 2, name: '手机通讯', children: [] },
      { id: 3, name: '电视影音', children: [] },
      { id: 4, name: '厨房电器', children: [] },
      { id: 5, name: '女装', children: [] },
      { id: 6, name: '鞋靴', children: [] },
      { id: 7, name: '美妆个护', children: [] },
      { id: 8, name: '护肤', children: [] },
      { id: 9, name: '男装', children: [] },
      { id: 10, name: '运动户外', children: [] },
      { id: 11, name: '数码', children: [] },
      { id: 12, name: '汽车', children: [] }
    ]
  }
})

// 根据分类名称返回对应的图标
function getCategoryIcon(categoryName: string): string {
  const iconMap: { [key: string]: string } = {
    '家用电器': '🏠',
    '手机通讯': '📱',
    '电视影音': '📺',
    '厨房电器': '🍳',
    '女装': '👗',
    '鞋靴': '👠',
    '美妆个护': '💄',
    '护肤': '🧴',
    '男装': '👔',
    '运动户外': '⚽',
    '数码': '💻',
    '汽车': '🚗',
    '母婴': '👶',
    '食品': '🍎',
    '家居': '🛋️',
    '图书': '📚',
    '玩具': '🧸',
    '宠物': '🐕'
  }
  
  // 如果找到匹配的图标就返回，否则返回默认图标
  for (const key in iconMap) {
    if (categoryName.includes(key)) {
      return iconMap[key]
    }
  }
  return '📦' // 默认图标
}

// 导航到分类页面
function navigateToCategory(categoryId: number) {
  console.log('导航到分类:', categoryId)
  router.push({
    path: '/SearchResults',
    query: { categoryId: categoryId.toString() }
  })
}
</script>

<style scoped>
.category-selector {
  margin-bottom: 20px;
}

.selector-container {
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 24px;
}

.selector-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  width: 100%;
}

.category-card {
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

.category-card:hover {
  background: #f0f8ff;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  transform: translateY(-4px);
  border-color: #1890ff;
}

.category-icon {
  margin-bottom: 12px;
}

.category-emoji {
  font-size: 32px;
  display: block;
}

.category-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  text-align: center;
}

.category-card:hover .category-name {
  color: #1890ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .category-card {
    padding: 16px 12px;
  }
  
  .category-emoji {
    font-size: 28px;
  }
  
  .category-name {
    font-size: 13px;
  }
}
</style>
