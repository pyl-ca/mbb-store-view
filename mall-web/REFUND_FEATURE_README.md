# 退款系统功能文档

## 📋 功能概述

本项目实现了完整的退款系统，包括退款申请、审核处理、资金管理、进度跟踪等核心功能，严格按照电商平台的退款流程设计。

## 🔄 退款流程设计

### 支付成功时
- ✅ 用户支付成功
- ✅ 资金流入平台主账户
- ✅ 记录平台收入流水

### 退款处理时
- ✅ 用户/订单服务发起退款申请
- ✅ 支付服务处理退款：
  - 检查平台账户余额
  - 从平台账户扣除退款金额
  - 退款到用户余额（或原支付方式）
  - 记录退款流水和退款记录

### 状态流转
```
0 (待审核) → 1 (已同意) → 3 (退款中) → 4 (退款成功)
            ↓
            2 (已拒绝)

3 (退款中) → 5 (退款失败)
```

## 功能特性

### 1. 退款申请管理
- ✅ 用户退款申请提交
- ✅ 退款原因选择和问题描述
- ✅ 退款图片上传
- ✅ 退款金额设置
- ✅ 退款类型选择（仅退款/退货退款）

### 2. 退款审核处理
- ✅ 管理员退款审核
- ✅ 同意/拒绝退款申请
- ✅ 审核备注记录
- ✅ 批量退款处理

### 3. 退款进度跟踪
- ✅ 退款状态实时更新
- ✅ 退款进度时间线展示
- ✅ 退款流水记录
- ✅ 用户通知机制

### 4. 资金管理
- ✅ 平台主账户管理
- ✅ 资金流水记录
- ✅ 用户余额流水
- ✅ 退款统计分析

## 文件结构

```
src/
├── types/
│   └── refund.ts                 # 退款相关类型定义
├── api/
│   ├── config.ts                 # API配置（已更新）
│   └── refund.ts                 # 退款API接口
├── components/
│   └── RefundProgress.vue        # 退款进度跟踪组件
├── pages/
│   ├── RefundApply.vue           # 退款申请页面（已存在）
│   ├── RefundDemo.vue            # 退款功能演示页面
│   ├── user/
│   │   ├── UserCenter.vue        # 用户中心（已更新）
│   │   └── UserRefunds.vue       # 用户退款记录页面
│   └── admin/
│       ├── RefundManagement.vue  # 退款管理页面（已存在）
│       └── PlatformFunds.vue     # 平台资金管理页面
└── router/
    └── index.ts                  # 路由配置（已更新）
```

## 🔧 API 接口设计

### 退款管理接口 (payment-service)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/payment-service/api/v1/refunds` | 获取退款列表 |
| POST | `/payment-service/api/v1/refunds` | 创建退款申请 |
| GET | `/payment-service/api/v1/refunds/{refundSn}` | 获取退款详情 |
| GET | `/payment-service/api/v1/refunds/user` | 获取用户退款列表 |
| GET | `/payment-service/api/v1/refunds/order/{orderSn}` | 根据订单号获取退款信息 |
| POST | `/payment-service/api/v1/refunds/{refundSn}/approve` | 同意退款申请 |
| POST | `/payment-service/api/v1/refunds/{refundSn}/reject` | 拒绝退款申请 |
| POST | `/payment-service/api/v1/refunds/{refundSn}/execute` | 执行退款 |
| GET | `/payment-service/api/v1/refunds/stats` | 获取退款统计 |
| POST | `/payment-service/api/v1/refunds/upload` | 上传退款图片 |

### 资金管理接口 (payment-service)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/payment-service/api/v1/platform/accounts` | 获取平台账户信息 |
| GET | `/payment-service/api/v1/platform/fund-flows` | 获取资金流水 |
| GET | `/payment-service/api/v1/users/balance-flows` | 获取用户余额流水 |

## 数据模型

### 退款记录 (RefundRecord)
```typescript
interface RefundRecord {
  id: number
  refundSn: string           // 退款单号
  orderSn: string            // 订单号
  userId: number             // 用户ID
  refundType: number         // 退款类型：1-仅退款 2-退货退款
  refundReason: string       // 退款原因
  refundAmount: number       // 退款金额
  status: number             // 状态：0-待审核 1-已同意 2-已拒绝 3-退款中 4-退款成功 5-退款失败
  refundMethod: string       // 退款方式：BALANCE-余额 ORIGINAL-原路退回
  applyTime: string          // 申请时间
  processTime?: string       // 处理时间
  refundTime?: string        // 退款时间
  // ... 其他字段
}
```

### 平台账户 (PlatformAccount)
```typescript
interface PlatformAccount {
  id: number
  accountType: string        // 账户类型：MAIN-主账户 REFUND-退款账户
  balance: number            // 可用余额
  frozenAmount: number       // 冻结金额
  totalIncome: number        // 总收入
  totalRefund: number        // 总退款
  updateTime: string         // 更新时间
}
```

### 资金流水 (FundFlow)
```typescript
interface FundFlow {
  id: number
  flowSn: string             // 流水号
  flowType: string           // 流水类型：INCOME-收入 REFUND-退款
  amount: number             // 金额
  beforeBalance: number      // 操作前余额
  afterBalance: number       // 操作后余额
  relatedOrderSn?: string    // 关联订单号
  relatedRefundSn?: string   // 关联退款号
  createTime: string         // 创建时间
}
```

## 页面功能

### 1. 用户退款记录页面 (`/user/refunds`)
- 退款记录列表展示
- 退款状态筛选
- 退款进度跟踪
- 退款详情查看
- 撤销退款申请

### 2. 平台资金管理页面 (`/admin/platform-funds`)
- 平台账户概览
- 退款统计信息
- 资金流水查询
- 批量退款处理

### 3. 退款进度跟踪组件
- 退款状态时间线
- 退款流水展示
- 联系客服功能
- 实时进度更新

### 4. 退款功能演示页面 (`/refund-demo`)
- 完整功能演示
- 模拟数据展示
- API接口说明
- 流程步骤演示

## 状态管理

### 退款状态流转
```
0 (待审核) → 1 (已同意) → 3 (退款中) → 4 (退款成功)
            ↓
            2 (已拒绝)
            
3 (退款中) → 5 (退款失败)
```

### 资金流转
```
用户支付 → 平台主账户 (记录收入流水)
退款申请 → 审核通过 → 执行退款 → 用户余额 (记录退款流水)
```

## 安全机制

1. **权限控制**：退款操作需要管理员权限
2. **金额校验**：退款金额不能超过订单支付金额
3. **余额检查**：执行退款前检查平台账户余额
4. **状态控制**：严格控制退款状态流转
5. **操作记录**：所有操作都有详细的日志记录

## 开发状态

### ✅ 已完成
- 完整的类型定义
- API接口封装（模拟数据）
- 用户退款记录页面
- 平台资金管理页面
- 退款进度跟踪组件
- 退款功能演示页面
- 路由配置和导航集成

### 🚧 待实现
- 后端API接口开发
- 真实的资金处理逻辑
- 退款通知机制
- 退款报表功能
- 自动退款处理

### 📋 后续优化
- 退款风控机制
- 退款数据分析
- 退款效率优化
- 退款异常处理
- 退款审计功能

## 访问演示

启动项目后，访问以下页面查看退款功能：

1. **退款功能演示页面**：`/refund-demo`
2. **用户退款记录**：`/user/refunds` （需要登录）
3. **平台资金管理**：`/admin/platform-funds` （需要管理员权限）
4. **退款申请页面**：`/refund/apply?orderSn=xxx`
5. **退款管理页面**：`/admin/refund-management` （需要管理员权限）

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **UI组件库**：Element Plus
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **HTTP客户端**：Axios
- **构建工具**：Vite

## 注意事项

1. **数据一致性**：确保退款操作的原子性
2. **并发控制**：防止重复退款操作
3. **异常处理**：完善的错误处理和回滚机制
4. **性能优化**：大量退款数据的分页和缓存
5. **监控告警**：关键操作的监控和告警

## 联系方式

如有问题或建议，请联系开发团队。
