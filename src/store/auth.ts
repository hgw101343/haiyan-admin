import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 用户信息接口
 * 对应后端返回的当前登录用户数据结构
 */
export interface UserInfo {
  /** 用户唯一标识（自增主键） */
  id: number
  /** 用户昵称（必填，用于显示和标识） */
  nickname: string
  /** 真实姓名（可选，个人设置中补充） */
  realName?: string | null
  /** 头像 URL 地址（可选，未设置时为 null） */
  avatar?: string | null
  /** 手机号码（可选，用于联系方式展示） */
  phone?: string | null
  /** 用户角色：ADMIN（管理员）或 USER（普通用户） */
  role: string
}

interface AuthState {
  /** JWT 认证令牌，未登录时为 null */
  token: string | null
  /** 当前登录用户信息，未登录时为 null */
  userInfo: UserInfo | null
  /**
   * 设置认证状态（登录成功后调用）
   * @param token - 后端返回的 JWT access token
   * @param user  - 用户基本信息（id、nickname、role 等）
   */
  setAuth: (token: string, user: UserInfo) => void
  /**
   * 退出登录（清除认证状态）
   * 将 token 和 userInfo 重置为 null
   * 注意：不会自动跳转页面，调用方需额外处理路由跳转
   */
  logout: () => void
}

/**
 * 认证状态管理 Store
 *
 * 使用 zustand 的 persist 中间件实现状态持久化：
 * - 将 token 和 userInfo 自动序列化到 localStorage
 * - 页面刷新后自动从 localStorage 恢复登录状态，无需重新登录
 * - persist key 为 'food-admin-auth'，可在浏览器 DevTools > Application > Local Storage 中查看
 *
 * persist 中间件工作原理：
 * 1. 每次 state 变化时，zustand 自动将最新状态序列化为 JSON 存入 localStorage
 * 2. Store 初始化时，从 localStorage 中读取 'food-admin-auth' 键的值并反序列化为初始状态
 * 3. 如果 localStorage 中无数据（首次访问或已清除），使用定义的默认值（null）
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 初始状态：未登录
      token: null,
      userInfo: null,

      /**
       * 登录成功后保存认证信息
       * 同时更新 token 和 userInfo，触发 localStorage 持久化
       */
      setAuth: (token, userInfo) => set({ token, userInfo }),

      /**
       * 退出登录：清空 token 和用户信息
       * localStorage 中对应的 'food-admin-auth' 键会被更新为 { token: null, userInfo: null }
       */
      logout: () => set({ token: null, userInfo: null }),
    }),
    {
      /**
       * localStorage 中的存储键名
       * 命名遵循 "应用名-模块" 规范，避免与其他应用/模块冲突
       */
      name: 'food-admin-auth',
    }
  )
)
