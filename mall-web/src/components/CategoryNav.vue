<template>
  <div class="category-nav">
    <ul class="category-list">
      <li v-for="category in categories" :key="category.id" class="main-category-block">
        <div class="main-category-title" @click="navigateToCategory(category.id, $event)">
          {{ category.name }}
        </div>
        <ul class="sub-category-list">
          <li v-for="subCategory in category.children" :key="subCategory.id"
              class="second-category-item"
              @mouseenter="showThirdLevel(subCategory, $event)"
              @mouseleave="leaveSecondCategory"
              @click="navigateToCategory(subCategory.id, $event)">
            <div class="second-category-content">
              <span>{{ subCategory.name }}</span>
              <i class="el-icon-arrow-right" v-if="subCategory.children && subCategory.children.length"></i>
            </div>
            <!-- 三级分类菜单 -->
            <div
              v-if="hoveredSubCategory && hoveredSubCategory.id === subCategory.id && subCategory.children && subCategory.children.length"
              class="third-level-popover"
              @mouseenter="mouseEnterThirdLevel"
              @mouseleave="mouseLeaveThirdLevel"
            >
              <!-- 添加一个连接区域，确保鼠标可以顺畅地从二级分类移动到三级菜单 -->
              <div class="menu-connector"></div>

              <!-- 三级分类列表 -->
              <ul class="third-level-list">
                <li v-for="third in subCategory.children" :key="third.id" @click.stop="navigateToCategory(third.id, $event)">
                  {{ third.name }}
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </li>
    </ul>
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
  children: SubCategory[]
}

const router = useRouter()
const hoveredSubCategory = ref<SubCategory | null>(null)
const categories = ref<Category[]>([])

onMounted(async () => {
  try {
    const resp = await fetch('http://localhost:9999/product-service/api/v1/categories/tree')
    const result = await resp.json()
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
    }
  } catch (e) {
    // 可以根据需要添加错误处理
    console.error('获取分类失败', e)
  }
})

// 当前激活的二级分类
const activeSubCategory = ref<SubCategory | null>(null)
// 鼠标是否在三级菜单上
const isMouseOverThirdLevel = ref(false)
// 定时器ID，用于清除定时器
let hideTimer: number | null = null
let showTimer: number | null = null
// 上一次显示的二级分类ID
let lastSubCategoryId: number | null = null

// 显示三级分类
function showThirdLevel(subCategory: SubCategory, _event: MouseEvent) {
  // 清除之前的隐藏定时器，防止菜单在用户移动到三级菜单之前就隐藏
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  // 如果是同一个二级分类，立即显示
  if (lastSubCategoryId === subCategory.id) {
    hoveredSubCategory.value = subCategory
    activeSubCategory.value = subCategory
    return
  }

  // 清除之前的显示定时器
  if (showTimer) {
    clearTimeout(showTimer)
  }

  // 立即显示三级菜单，不再使用延迟
  // 这样可以确保用户移动到二级分类时立即看到三级菜单
  hoveredSubCategory.value = subCategory
  activeSubCategory.value = subCategory
  lastSubCategoryId = subCategory.id

  // 设置鼠标不在三级菜单上的标志
  isMouseOverThirdLevel.value = false
}

// 鼠标进入三级菜单
function mouseEnterThirdLevel() {
  isMouseOverThirdLevel.value = true

  // 清除所有定时器
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }

  // 确保当前悬停的二级分类保持激活状态
  if (activeSubCategory.value) {
    hoveredSubCategory.value = activeSubCategory.value
  }
}

// 鼠标离开三级菜单
function mouseLeaveThirdLevel() {
  isMouseOverThirdLevel.value = false
  // 延迟一段时间后再隐藏，给用户足够的时间点击
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  hideTimer = setTimeout(() => {
    if (!isMouseOverThirdLevel.value) {
      hoveredSubCategory.value = null
      lastSubCategoryId = null
    }
  }, 800) as unknown as number // 增加延迟时间到800ms，给用户更多时间操作
}

// 鼠标离开二级分类
function leaveSecondCategory() {
  // 延迟隐藏，给用户更多时间移动到三级菜单
  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  // 增加延迟时间到1000ms (1秒)，给用户足够的时间移动到三级菜单
  hideTimer = setTimeout(() => {
    // 只有当鼠标不在三级菜单上时，才隐藏三级菜单
    if (!isMouseOverThirdLevel.value) {
      hoveredSubCategory.value = null
      lastSubCategoryId = null
    }
  }, 1000) as unknown as number
}

// 导航到分类页面
function navigateToCategory(categoryId: number, e?: MouseEvent) {
  // 阻止事件冒泡，防止触发父元素的点击事件
  if (e) {
    e.stopPropagation()
  }

  console.log('导航到分类:', categoryId)

  // 导航到搜索结果页面，并传递分类ID
  router.push({
    path: '/SearchResults',
    query: { categoryId: categoryId.toString() }
  })
}
</script>

<style scoped>
.category-nav {
  width: 250px; /* 减小宽度，让轮播图占比更大 */
  min-width: 250px;
  font-size: 14px;
  line-height: 1.5;
  background: #fff;
  border-radius: 8px 0 0 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 8px 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
  height: 400px;
  position: relative;
  z-index: 100; /* 提高z-index确保不被轮播图遮挡 */
  overflow-y: auto; /* 允许垂直滚动 */
  overflow-x: hidden; /* 防止水平溢出 */
}
.main-category-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  padding: 6px 0 6px 24px;
  cursor: pointer;
  transition: color 0.2s;
}

.main-category-title:hover {
  color: #409EFF;
}
.category-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.main-category-block {
  margin-bottom: 8px;
}
.sub-category-list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 24px;
  /* 确保二级分类列表有足够的空间 */
  width: 100%;
  box-sizing: border-box;
  position: relative; /* 为三级菜单的定位提供参考 */
}
.second-category-item {
  font-size: 14px;
  color: #444;
  padding: 8px 12px 8px 0; /* 增加内边距，扩大点击区域 */
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.25s ease; /* 平滑过渡效果 */
  position: relative; /* 重要：作为三级菜单的定位参考 */
  /* 确保二级分类项有足够的空间显示三级菜单 */
  min-height: 24px;
  width: 100%; /* 确保宽度占满父元素 */
  margin-bottom: 2px; /* 增加项目间距 */
}

/* 添加一个伪元素，在二级分类项下方创建一个连接区域，使鼠标移动更容易 */
.second-category-item::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -10px; /* 向下延伸10px */
  width: 100%;
  height: 10px;
  background: transparent; /* 透明背景 */
  z-index: 10;
}

.second-category-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 4px; /* 左侧增加内边距 */
}

.second-category-item:hover {
  background: #e6f7ff; /* 更明显的背景色 */
  color: #1890ff; /* 更鲜明的文字颜色 */
  font-weight: 500; /* 稍微加粗 */
  padding-left: 4px; /* 悬停时增加左侧内边距，产生移动效果 */
}
.third-level-popover {
  position: absolute; /* 使用绝对定位，相对于父元素 */
  left: 0; /* 从左侧开始 */
  top: 100%; /* 显示在二级分类的下方 */
  width: 100%; /* 宽度占满整个导航栏 */
  background: #f0f5ff; /* 更改为浅蓝色背景，增加对比度 */
  border-radius: 6px; /* 增加圆角 */
  box-shadow: 0 4px 16px rgba(0,0,0,.15); /* 增强阴影效果 */
  z-index: 1000; /* 确保在最上层 */
  padding: 10px; /* 增加内边距 */
  /* 确保三级菜单不会被轮播图遮挡 */
  max-height: 220px; /* 增加高度 */
  overflow-y: auto;
  margin-top: 0; /* 减少与二级分类的距离，使其更容易移动到 */
  box-sizing: border-box;
  transition: all 0.3s ease; /* 增强过渡效果 */
  border: 1px solid #e0e9ff; /* 添加边框 */
  /* 添加一个透明的连接区域，使鼠标移动更容易 */
  clip-path: polygon(
    0% -20px,  /* 左上角向上延伸20px */
    100% -20px, /* 右上角向上延伸20px */
    100% 100%, /* 右下角 */
    0% 100%    /* 左下角 */
  );
}

/* 移除三级分类标题样式 */

.third-level-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 每行显示3个项目 */
  gap: 6px; /* 增加间距，便于区分 */
  justify-content: center; /* 居中对齐 */
  align-items: center; /* 垂直居中 */
  width: 100%; /* 占满容器宽度 */
}

.third-level-popover li {
  padding: 8px 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  /* 增加点击区域 */
  display: inline-block;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #eee;
  font-size: 13px; /* 稍微增加字体大小，提高可读性 */
  margin: 4px; /* 增加间距，便于点击 */
  min-width: 70px; /* 增加最小宽度，扩大点击区域 */
  text-align: center; /* 文本居中 */
  user-select: none; /* 防止文本被选中 */
}

.third-level-popover li:hover {
  background: #e6f7ff;
  color: #409EFF;
  border-color: #409EFF;
  transform: scale(1.05); /* 轻微放大，提供更好的视觉反馈 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* 添加阴影效果 */
}



/* 连接区域样式 */
.menu-connector {
  position: absolute;
  top: -15px; /* 向上延伸15px */
  left: 0;
  width: 100%;
  height: 15px;
  background: transparent; /* 透明背景 */
  z-index: 999; /* 确保在最上层 */
}
</style>
