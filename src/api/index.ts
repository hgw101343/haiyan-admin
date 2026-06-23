import axios from 'axios'
import { message } from 'antd'
import { useAuthStore } from '../store/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || '请求失败'
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    } else {
      message.error(msg)
    }
    return Promise.reject(err)
  }
)

// ===== 认证 =====
export const adminLogin = (data: { username: string; password: string }) =>
  request.post('/auth/admin/login', data)

// ===== 仪表盘 =====
export const getDashboardStats = () => request.get('/admin/stats')
export const getRecentOrders = (limit = 10) =>
  request.get('/admin/recent-orders', { params: { limit } })
export const getSalesChart = (days = 7) =>
  request.get('/admin/sales-chart', { params: { days } })

// ===== 分类 =====
export const getCategories = () => request.get('/categories')
export const createCategory = (data: { name: string; sort?: number }) =>
  request.post('/categories', data)
export const updateCategory = (id: number, data: { name?: string; sort?: number; isRecommended?: boolean }) =>
  request.put(`/categories/${id}`, data)
export const deleteCategory = (id: number) => request.delete(`/categories/${id}`)
export const batchDeleteCategories = (ids: number[]) =>
  request.post('/categories/batch-delete', { ids })

// ===== 菜品 =====
export const getDishes = (params?: {
  page?: number
  pageSize?: number
  categoryId?: number
  keyword?: string
  recommended?: boolean
}) => request.get('/dishes', { params })
export const createDish = (data: any) =>
  request.post('/dishes', data)
export const updateDish = (id: number, data: any) =>
  request.put(`/dishes/${id}`, data)
export const deleteDish = (id: number) => request.delete(`/dishes/${id}`)
export const batchDeleteDishes = (ids: number[]) =>
  request.post('/dishes/batch-delete', { ids })
export const toggleDishAvailable = (id: number, isActive: boolean) =>
  request.patch(`/dishes/${id}/available`, { isActive })

// ===== 订单 =====
export const getOrders = (params?: {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
}) => request.get('/admin/orders', { params })
export const getOrderDetail = (id: number) => request.get(`/orders/${id}`)
export const updateOrderStatus = (id: number, status: string) =>
  request.patch(`/orders/${id}/status`, { status })

// ===== 用户 =====
export const getUsers = (params?: { page?: number; pageSize?: number; keyword?: string }) =>
  request.get('/admin/users', { params })

// ===== 上传 =====
export const uploadImage = (file: File) => {
  const fd = new FormData()
  fd.append('image', file)
  return request.post<any, { url: string }>('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ===== 主题 =====
export interface ThemeConfig {
  primaryColor: string
  primaryLight: string
  primaryDark: string
  backgroundColor: string
  cardColor: string
  textColor: string
  textSecondary: string
  navBarBgColor: string
  navBarTextStyle: 'white' | 'black'
  tabBarSelectedColor: string
  tabBarColor: string
  tabBarBgColor: string
  borderColor: string
  successColor: string
  warningColor: string
  errorColor: string
}

export const getTheme = () => request.get<any, { success: boolean; data: ThemeConfig }>('/theme')
export const updateTheme = (theme: Partial<ThemeConfig>) =>
  request.put<any, { success: boolean; data: ThemeConfig }>('/theme', theme)
export const resetTheme = () => request.post<any, { success: boolean; data: ThemeConfig }>('/theme/reset')
