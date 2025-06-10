import axios from 'axios'
import type {
  AdminUser,
  UserFilter,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  AssignRolesRequest,
  Role,
  Menu
} from '../types/admin-user'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999'

// 获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 管理员用户管理API服务
export const adminUserApi = {
  // ========== 用户管理 ==========

  // 分页查询用户列表
  async getUserList(filter: UserFilter): Promise<UserListResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-service/api/v1/admin/users/page`, {
        params: filter,
        headers: getAuthHeaders()
      })

      return response.data.data
    } catch (error: any) {
      console.error('获取用户列表失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '获取用户列表失败')
    }
  },

  // 查询用户详情
  async getUserDetail(userId: number): Promise<AdminUser> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-service/api/v1/admin/users/${userId}`, {
        headers: getAuthHeaders()
      })

      if (response.data.code === 200) {
        return response.data.data
      } else {
        throw new Error(response.data.msg || '获取用户详情失败')
      }
    } catch (error: any) {
      console.error('获取用户详情失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '获取用户详情失败')
    }
  },

  // 创建用户
  async createUser(userData: CreateUserRequest): Promise<number> {
    try {
      const response = await axios.post(`${API_BASE_URL}/user-service/api/v1/admin/users`, userData, {
        headers: getAuthHeaders()
      })

      if (response.data.code === '000000' || response.data.success === true) {
        return response.data.data || 0
      } else {
        throw new Error(response.data.msg || '创建用户失败')
      }
    } catch (error: any) {
      console.error('创建用户失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '创建用户失败')
    }
  },

  // 更新用户信息
  async updateUser(userData: UpdateUserRequest): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/users`, userData, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('更新用户失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '更新用户失败')
    }
  },

  // 删除用户
  async deleteUser(userId: number): Promise<boolean> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/user-service/api/v1/admin/users/${userId}`, {
        headers: getAuthHeaders()
      })

      return response.data.code === 200
    } catch (error: any) {
      console.error('删除用户失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '删除用户失败')
    }
  },

  // 重置用户密码
  async resetPassword(resetData: ResetPasswordRequest): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/users/reset-password`, resetData, {
        headers: getAuthHeaders()
      })

      return response.data.code === 200
    } catch (error: any) {
      console.error('重置密码失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '重置密码失败')
    }
  },

  // 锁定用户
  async lockUser(userId: number): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/users/${userId}/lock`, {}, {
        headers: getAuthHeaders()
      })

      return response.data.code === 200
    } catch (error: any) {
      console.error('锁定用户失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '锁定用户失败')
    }
  },

  // 解锁用户
  async unlockUser(userId: number): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/users/${userId}/unlock`, {}, {
        headers: getAuthHeaders()
      })

      return response.data.code === 200
    } catch (error: any) {
      console.error('解锁用户失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '解锁用户失败')
    }
  },

  // 分配用户角色
  async assignRoles(assignData: AssignRolesRequest): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/users/assign-roles`, assignData, {
        headers: getAuthHeaders()
      })

      return response.data.code === 200
    } catch (error: any) {
      console.error('分配角色失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '分配角色失败')
    }
  },

  // 批量删除用户
  async batchDeleteUsers(userIds: number[]): Promise<boolean> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/user-service/api/v1/admin/users/batch`, {
        data: userIds,
        headers: getAuthHeaders()
      })

      return response.data.code === 200
    } catch (error: any) {
      console.error('批量删除用户失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '批量删除用户失败')
    }
  },

  // 批量锁定用户
  async batchLockUsers(userIds: number[]): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/users/batch/lock`, userIds, {
        headers: getAuthHeaders()
      })

      return response.data.code === 200
    } catch (error: any) {
      console.error('批量锁定用户失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '批量锁定用户失败')
    }
  },

  // 批量解锁用户
  async batchUnlockUsers(userIds: number[]): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/users/batch/unlock`, userIds, {
        headers: getAuthHeaders()
      })

      return response.data.code === 200
    } catch (error: any) {
      console.error('批量解锁用户失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '批量解锁用户失败')
    }
  },

  // ========== 角色管理 ==========

  // 查询角色列表
  async getRoleList(): Promise<Role[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-service/api/v1/admin/roles`, {
        headers: getAuthHeaders()
      })

      return response.data.data
    } catch (error: any) {
      console.error('获取角色列表失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '获取角色列表失败')
    }
  },

  // 查询角色详情
  async getRoleDetail(roleId: number): Promise<Role> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-service/api/v1/admin/roles/${roleId}`, {
        headers: getAuthHeaders()
      })

      if (response.data.code === '000000' || response.data.success === true) {
        return response.data.data
      } else {
        throw new Error(response.data.msg || '获取角色详情失败')
      }
    } catch (error: any) {
      console.error('获取角色详情失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '获取角色详情失败')
    }
  },

  // 创建角色
  async createRole(roleData: any): Promise<number> {
    try {
      const response = await axios.post(`${API_BASE_URL}/user-service/api/v1/admin/roles`, roleData, {
        headers: getAuthHeaders()
      })

      if (response.data.code === '000000' || response.data.success === true) {
        return response.data.data || 0
      } else {
        throw new Error(response.data.msg || '创建角色失败')
      }
    } catch (error: any) {
      console.error('创建角色失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '创建角色失败')
    }
  },

  // 更新角色
  async updateRole(roleData: any): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/roles`, roleData, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('更新角色失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '更新角色失败')
    }
  },

  // 删除角色
  async deleteRole(roleId: number): Promise<boolean> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/user-service/api/v1/admin/roles/${roleId}`, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('删除角色失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '删除角色失败')
    }
  },

  // 启用角色
  async enableRole(roleId: number): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/roles/${roleId}/enable`, {}, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('启用角色失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '启用角色失败')
    }
  },

  // 禁用角色
  async disableRole(roleId: number): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/roles/${roleId}/disable`, {}, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('禁用角色失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '禁用角色失败')
    }
  },

  // 分配角色菜单权限
  async assignRoleMenus(roleId: number, menuIds: number[]): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/roles/${roleId}/menus`, menuIds, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('分配角色菜单权限失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '分配角色菜单权限失败')
    }
  },

  // 分配角色权限
  async assignRolePermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/roles/${roleId}/permissions`, permissionIds, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('分配角色权限失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '分配角色权限失败')
    }
  },

  // 查询角色菜单
  async getRoleMenus(roleId: number): Promise<number[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-service/api/v1/admin/roles/${roleId}/menus`, {
        headers: getAuthHeaders()
      })

      if (response.data.code === '000000' || response.data.success === true) {
        return response.data.data
      } else {
        throw new Error(response.data.msg || '获取角色菜单失败')
      }
    } catch (error: any) {
      console.error('获取角色菜单失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '获取角色菜单失败')
    }
  },

  // 查询角色权限
  async getRolePermissions(roleId: number): Promise<number[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-service/api/v1/admin/roles/${roleId}/permissions`, {
        headers: getAuthHeaders()
      })

      if (response.data.code === '000000' || response.data.success === true) {
        return response.data.data
      } else {
        throw new Error(response.data.msg || '获取角色权限失败')
      }
    } catch (error: any) {
      console.error('获取角色权限失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '获取角色权限失败')
    }
  },

  // ========== 菜单管理 ==========

  // 查询菜单树
  async getMenuTree(): Promise<Menu[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-service/api/v1/admin/menus/tree`, {
        headers: getAuthHeaders()
      })

      if (response.data.code === '000000' || response.data.success === true) {
        return response.data.data
      } else {
        throw new Error(response.data.msg || '获取菜单树失败')
      }
    } catch (error: any) {
      console.error('获取菜单树失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '获取菜单树失败')
    }
  },

  // 查询菜单详情
  async getMenuDetail(menuId: number): Promise<Menu> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-service/api/v1/admin/menus/${menuId}`, {
        headers: getAuthHeaders()
      })

      if (response.data.code === '000000' || response.data.success === true) {
        return response.data.data
      } else {
        throw new Error(response.data.msg || '获取菜单详情失败')
      }
    } catch (error: any) {
      console.error('获取菜单详情失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '获取菜单详情失败')
    }
  },

  // 创建菜单
  async createMenu(menuData: any): Promise<number> {
    try {
      const response = await axios.post(`${API_BASE_URL}/user-service/api/v1/admin/menus`, menuData, {
        headers: getAuthHeaders()
      })

      if (response.data.code === '000000' || response.data.success === true) {
        return response.data.data
      } else {
        throw new Error(response.data.msg || '创建菜单失败')
      }
    } catch (error: any) {
      console.error('创建菜单失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '创建菜单失败')
    }
  },

  // 更新菜单
  async updateMenu(menuData: any): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/menus`, menuData, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('更新菜单失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '更新菜单失败')
    }
  },

  // 删除菜单
  async deleteMenu(menuId: number): Promise<boolean> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/user-service/api/v1/admin/menus/${menuId}`, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('删除菜单失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '删除菜单失败')
    }
  },

  // 启用菜单
  async enableMenu(menuId: number): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/menus/${menuId}/enable`, {}, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('启用菜单失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '启用菜单失败')
    }
  },

  // 禁用菜单
  async disableMenu(menuId: number): Promise<boolean> {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-service/api/v1/admin/menus/${menuId}/disable`, {}, {
        headers: getAuthHeaders()
      })

      return response.data.code === '000000' || response.data.success === true
    } catch (error: any) {
      console.error('禁用菜单失败:', error)
      throw new Error(error.response?.data?.msg || error.message || '禁用菜单失败')
    }
  }
}
