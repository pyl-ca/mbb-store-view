# 评论系统功能文档

## 📋 功能概述

本项目实现了完整的商品评论系统，参考主流电商平台的评论系统设计，包括评论展示、发布、管理、审核等核心功能。

## 功能特性

### 1. 评论展示
- ✅ 商品详情页评论列表展示
- ✅ 评论统计信息（平均评分、评分分布、总数量）
- ✅ 评论筛选（按评分、时间、是否有图）
- ✅ 评论排序（最新、最早、评分高低、点赞数）
- ✅ 分页加载
- ✅ 用户头像和昵称脱敏显示
- ✅ 匿名评论支持

### 2. 评论发布
- ✅ 星级评分（1-5星）
- ✅ 文字评论（支持字数限制）
- ✅ 图片上传（最多6张）
- ✅ 匿名评价选项
- ✅ 表单验证

### 3. 评论管理
- ✅ 用户评论管理页面
- ✅ 编辑评论（7天内）
- ✅ 删除评论
- ✅ 评论状态管理（待审核、已通过、已拒绝）

### 4. 后台管理
- ✅ 管理员评论审核
- ✅ 批量审核操作
- ✅ 评论置顶功能
- ✅ 评论统计分析
- ✅ 标签管理系统

### 5. 互动功能
- ✅ 评论点赞/取消点赞
- ✅ 商家回复评论
- ✅ 评论图片预览
- ✅ 多级回复支持

## 文件结构

```
src/
├── types/
│   └── review.ts                 # 评论相关类型定义
├── api/
│   ├── config.ts                 # API配置（已更新）
│   └── review.ts                 # 评论API接口
├── components/
│   ├── ProductReviews.vue        # 商品评论展示组件
│   └── ReviewForm.vue            # 评论发布表单组件
├── pages/
│   ├── ProductDetail.vue         # 商品详情页（已更新）
│   ├── OrderDetail.vue           # 订单详情页（已更新）
│   ├── ReviewDemo.vue            # 评论功能演示页面
│   ├── user/
│   │   └── UserReviews.vue       # 用户评论管理页面
│   └── admin/
│       ├── ReviewManagement.vue  # 后台评论管理
│       └── TagManagement.vue     # 标签管理页面
└── router/
    └── index.ts                  # 路由配置（已更新）
```

## 🔧 API 接口设计

### 基础接口 (review-service)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/review-service/api/v1/reviews` | 获取商品评论列表 |
| POST | `/review-service/api/v1/reviews` | 发布评论 |
| PUT | `/review-service/api/v1/reviews/{id}` | 更新评论 |
| DELETE | `/review-service/api/v1/reviews/{id}` | 删除评论 |
| GET | `/review-service/api/v1/reviews/stats/{productId}` | 获取评论统计 |
| GET | `/review-service/api/v1/reviews/user` | 获取用户评论列表 |
| POST | `/review-service/api/v1/reviews/{id}/like` | 点赞/取消点赞 |
| POST | `/review-service/api/v1/reviews/{id}/reply` | 商家回复 |
| POST | `/review-service/api/v1/reviews/upload` | 上传评论图片 |

### 管理端接口 (review-service)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/review-service/api/v1/admin/reviews` | 管理员获取评论列表 |
| POST | `/review-service/api/v1/admin/reviews/batch-audit` | 批量审核评论 |
| POST | `/review-service/api/v1/reviews/{id}/top` | 置顶/取消置顶 |
| GET | `/review-service/api/v1/admin/tags` | 获取标签列表 |
| POST | `/review-service/api/v1/admin/tags` | 创建标签 |
| PUT | `/review-service/api/v1/admin/tags/{id}` | 更新标签 |
| DELETE | `/review-service/api/v1/admin/tags/{id}` | 删除标签 |

### 请求参数示例

#### 获取评论列表
```typescript
interface ReviewFilter {
  productId?: number
  rating?: number        // 筛选特定星级
  hasImage?: boolean     // 是否有图
  sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'most_liked'
  page: number
  pageSize: number
}
```

#### 发布评论
```typescript
interface CreateReviewRequest {
  productId: number
  orderSn: string
  rating: number         // 1-5星
  content: string
  images?: string[]      // 图片URL数组
  isAnonymous?: boolean  // 是否匿名
}
```

## 组件使用说明

### ProductReviews 组件

在商品详情页中使用：

```vue
<template>
  <ProductReviews :product-id="productId" ref="reviewsRef" />
</template>

<script setup>
import ProductReviews from '@/components/ProductReviews.vue'

const productId = ref(1)
const reviewsRef = ref()

// 刷新评论列表
const refreshReviews = () => {
  reviewsRef.value?.refresh()
}
</script>
```

### ReviewForm 组件

评论发布表单：

```vue
<template>
  <ReviewForm
    v-model="dialogVisible"
    :product-info="productInfo"
    :order-sn="orderSn"
    @success="handleSuccess"
  />
</template>

<script setup>
import ReviewForm from '@/components/ReviewForm.vue'

const dialogVisible = ref(false)
const productInfo = ref({
  id: 1,
  name: '商品名称',
  image: '商品图片URL',
  specs: '规格信息'
})
const orderSn = ref('ORDER123456')

const handleSuccess = () => {
  // 评论发布成功回调
}
</script>
```

## 样式设计

评论组件采用响应式设计，支持：
- 桌面端和移动端适配
- 深色/浅色主题支持
- Element Plus 组件库风格统一
- 图片懒加载和预览功能

## 数据流设计

1. **评论展示流程**：
   - 组件加载 → 调用API获取评论列表 → 渲染评论卡片
   - 支持筛选、排序、分页等交互

2. **评论发布流程**：
   - 用户填写表单 → 上传图片 → 提交评论 → 刷新列表

3. **评论管理流程**：
   - 用户中心查看评论 → 编辑/删除操作 → 状态更新

## 开发状态

### ✅ 已完成
- 完整的类型定义
- API接口封装
- 评论展示组件
- 评论发布组件
- 用户评论管理页面
- 商品详情页集成
- 订单详情页评价入口
- 演示页面

### 🚧 待实现
- 后端API接口开发
- 图片上传服务配置
- 评论审核管理后台
- 商家回复功能完善
- 评论举报功能
- 评论数据统计分析

### 📋 后续优化
- 评论内容敏感词过滤
- 评论质量评分算法
- 评论推荐排序优化
- 评论数据缓存策略
- 评论搜索功能

## 访问演示

启动项目后，访问以下页面查看评论功能：

1. **评论功能演示页面**：`/review-demo`
2. **商品详情页**：`/product/{id}` （评论区域）
3. **用户评论管理**：`/user/reviews` （需要登录）
4. **订单详情页**：`/order-detail/{orderSn}` （评价按钮）

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **UI组件库**：Element Plus
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **HTTP客户端**：Axios
- **构建工具**：Vite

## 注意事项

1. **权限控制**：评论发布需要用户登录，编辑删除需要验证用户身份
2. **数据验证**：前端表单验证 + 后端数据校验双重保障
3. **图片处理**：支持图片压缩、格式转换、安全检查
4. **性能优化**：评论列表虚拟滚动、图片懒加载
5. **SEO友好**：评论内容支持搜索引擎抓取

## 联系方式

如有问题或建议，请联系开发团队。
