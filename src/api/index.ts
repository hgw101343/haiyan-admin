import axios from "axios";
import { message } from "antd";
import { useAuthStore } from "../store/auth";

/**
 * 创建 Axios 实例并进行基础配置
 *
 * baseURL: '/api'
 *   - 所有请求路径自动拼接 /api 前缀，例如 request.get('/dishes') 实际请求 /api/dishes
 *   - 生产环境中通常配合 Nginx 反向代理将 /api 转发到后端服务
 *
 * timeout: 15000（15 秒）
 *   - 超过 15 秒未收到响应则自动取消请求并抛出 timeout 错误
 *   - 避免因网络异常或后端处理过慢导致界面一直处于加载状态
 */
const request = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

/**
 * 请求拦截器：自动附加 JWT Bearer Token
 *
 * 每个请求发出前，从 authStore 中读取当前登录用户的 JWT token，
 * 并将其自动注入到请求头的 Authorization 字段中（格式：Bearer <token>）。
 *
 * 使用 useAuthStore.getState() 而非 hook 读写：
 *   - 拦截器是纯函数运行时注册的，不在 React 组件树中，无法使用 hook
 *   - getState() 直接从 zustand store 读取最新值，同样获取到最新 token
 *
 * 无 token 时（未登录状态）：不设置 Authorization 头，后端 authenticate 中间件会返回 401
 */
request.interceptors.request.use((config) => {
  // 从持久化的 authStore 中获取当前 token（非 hook 方式）
  const token = useAuthStore.getState().token;
  // 如果有 token，自动附加 Bearer 认证头
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * 响应拦截器：统一处理响应数据和错误
 *
 * 成功响应（2xx）：
 *   - axios 返回完整 Response 对象（含 data/status/headers）
 *   - 拦截后直接返回 res.data，调用方无需每次访问 .data 属性
 *
 * 错误响应：
 *   - 401 Unauthorized：token 过期或无效
 *     → 清除本地认证状态（logout）
 *     → 强制跳转到登录页（window.location.href 而非路由跳转，确保状态完全重置）
 *   - 其他状态码：
 *     → 提取后端返回的错误信息 message，通过 antd message.error() 弹出 Toast 提示
 *   - 无论何种错误，都返回 Promise.reject(err)，让调用方可以 .catch() 自行处理
 */
request.interceptors.response.use(
  // 成功响应：自动解包，只返回 data 字段
  (res) => res.data,
  (err) => {
    // 提取错误信息：优先使用后端返回的 message，无则使用默认文案
    const msg = err.response?.data?.message || "请求失败";
    // 401 状态码：认证失效，清除状态并跳转登录页
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      // 使用 window.location.href 而非 React Router navigate，
      // 确保全局状态和页面完全重置，避免残留的认证状态干扰
      window.location.href = "/login";
    } else {
      // 其他错误：弹出错误提示
      message.error(msg);
    }
    return Promise.reject(err);
  },
);

// ================================================================
//  以下为各业务模块的 API 函数定义
// ================================================================

// -------------------- 认证模块 --------------------
// 管理员登录

/** 管理员登录：提交用户名和密码，返回 token 和用户信息 */
export const adminLogin = (data: { username: string; password: string }) =>
  request.post("/auth/admin/login", data);

// -------------------- 仪表盘模块 --------------------
// 管理员专属的数据统计面板

/** 获取仪表盘统计数据（总订单数、总金额、用户数等汇总信息） */
export const getDashboardStats = () => request.get("/admin/stats");
/** 获取最近 N 条订单（供仪表盘首页快速预览） */
export const getRecentOrders = (limit = 10) =>
  request.get("/admin/recent-orders", { params: { limit } });
/** 获取销售额趋势图数据（默认最近 7 天） */
export const getSalesChart = (days = 7) =>
  request.get("/admin/sales-chart", { params: { days } });

// -------------------- 分类模块 --------------------
// 菜品分类的 CRUD 操作

/** 获取分类列表（支持按创建者过滤） */
export const getCategories = (params?: { createdBy?: number }) =>
  request.get("/categories", { params });
/** 创建新分类 */
export const createCategory = (data: { name: string; sort?: number }) =>
  request.post("/categories", data);
/** 更新分类信息（名称、排序、是否推荐） */
export const updateCategory = (
  id: number,
  data: { name?: string; sort?: number; isRecommended?: boolean },
) => request.put(`/categories/${id}`, data);
/** 删除单个分类 */
export const deleteCategory = (id: number) =>
  request.delete(`/categories/${id}`);
/** 批量删除分类 */
export const batchDeleteCategories = (ids: number[]) =>
  request.post("/categories/batch-delete", { ids });

// -------------------- 菜品模块 --------------------
// 菜品（Dish）的 CRUD 及状态切换

/**
 * 获取菜品列表
 * 支持分页（page/pageSize）、按分类筛选（categoryId）、关键字搜索（keyword）、
 * 推荐过滤（recommended）、按创建者过滤（createdBy）
 */
export const getDishes = (params?: {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  keyword?: string;
  recommended?: boolean;
  createdBy?: number;
  sort?: string;
}) => request.get("/dishes", { params });
/** 创建新菜品 */
export const createDish = (data: any) => request.post("/dishes", data);
/** 更新菜品信息 */
export const updateDish = (id: number, data: any) =>
  request.put(`/dishes/${id}`, data);
/** 删除单个菜品 */
export const deleteDish = (id: number) => request.delete(`/dishes/${id}`);
/** 批量删除菜品 */
export const batchDeleteDishes = (ids: number[]) =>
  request.post("/dishes/batch-delete", { ids });
/** 切换菜品上架/下架状态（isActive: true 上架, false 下架） */
export const toggleDishAvailable = (id: number, isActive: boolean) =>
  request.patch(`/dishes/${id}/available`, { isActive });

// -------------------- 订单模块 --------------------
// 订单查询、详情查看、状态变更

/**
 * 获取订单列表
 * 支持分页（page/pageSize）、按状态筛选（status）、关键字搜索（keyword）、
 * 按用户过滤（userId）
 */
export const getOrders = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
  userId?: number;
}) => request.get("/admin/orders", { params });
/** 获取单个订单详情（含订单项明细） */
export const getOrderDetail = (id: number) => request.get(`/orders/${id}`);
/** 更新订单状态（如：待处理 → 制作中 → 已完成 → 已取消） */
export const updateOrderStatus = (id: number, status: string) =>
  request.patch(`/orders/${id}/status`, { status });

// -------------------- 用户模块 --------------------
// 管理员对用户的 CRUD 操作

/**
 * 获取用户列表
 * 支持分页（page/pageSize）、关键字搜索（keyword，按昵称/姓名模糊匹配）、
 * 按角色过滤（role: ADMIN 或 USER）
 */
export const getUsers = (params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
}) => request.get("/auth/admin/users", { params });
/** 管理员创建新用户（可指定角色、手机号、真实姓名等） */
export const createUser = (data: {
  nickname: string;
  password: string;
  role?: string;
  phone?: string;
  realName?: string;
}) => request.post("/auth/admin/register", data);
/** 管理员编辑用户信息（可修改昵称、密码、角色、手机号等） */
export const updateUser = (
  id: number,
  data: {
    nickname?: string;
    password?: string;
    role?: string;
    phone?: string;
    realName?: string;
  },
) => request.put(`/auth/admin/users/${id}`, data);

// -------------------- 上传模块 --------------------
// 图片等文件上传

/**
 * 上传图片到服务器
 * 使用 FormData 包装文件，Content-Type 自动设为 multipart/form-data
 * 返回上传后的图片 URL
 */
export const uploadImage = (file: File) => {
  const fd = new FormData();
  fd.append("image", file);
  return request.post<any, { url: string }>("/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// -------------------- 主题模块 --------------------
// 小程序端 UI 主题颜色的读取和配置

/**
 * 主题配置接口
 * 定义小程序端所有可自定义的颜色变量，实现多用户/多店铺的个性化视觉风格
 */
export interface ThemeConfig {
  /** 主色调：按钮、标签、高亮等核心 UI 元素的颜色 */
  primaryColor: string;
  /** 主色浅色变体：用于浅色背景、hover 状态等 */
  primaryLight: string;
  /** 主色深色变体：用于按下状态、深色强调等 */
  primaryDark: string;
  /** 页面背景色 */
  backgroundColor: string;
  /** 卡片背景色 */
  cardColor: string;
  /** 主要文字颜色 */
  textColor: string;
  /** 次要文字颜色（如描述、提示文字） */
  textSecondary: string;
  /** 导航栏背景色 */
  navBarBgColor: string;
  /** 导航栏文字样式：white（白色文字，深色导航栏）、black（黑色文字，浅色导航栏） */
  navBarTextStyle: "white" | "black";
  /** 底部 TabBar 选中项颜色 */
  tabBarSelectedColor: string;
  /** 底部 TabBar 未选中项颜色 */
  tabBarColor: string;
  /** 底部 TabBar 背景色 */
  tabBarBgColor: string;
  /** 边框/分割线颜色 */
  borderColor: string;
  /** 成功状态颜色（如订单已完成） */
  successColor: string;
  /** 警告状态颜色（如订单待处理） */
  warningColor: string;
  /** 错误状态颜色（如删除确认、错误提示） */
  errorColor: string;
}

/** 获取主题配置（可选按 userId 获取特定用户的主题） */
export const getTheme = (params?: { userId?: number }) =>
  request.get<any, { success: boolean; data: ThemeConfig }>("/theme", {
    params,
  });
/** 更新主题配置（支持部分更新，传入需要修改的字段即可） */
export const updateTheme = (theme: Partial<ThemeConfig>) =>
  request.put<any, { success: boolean; data: ThemeConfig }>("/theme", theme);
/** 重置主题为系统默认配置 */
export const resetTheme = () =>
  request.post<any, { success: boolean; data: ThemeConfig }>("/theme/reset");

// -------------------- 意见反馈模块 --------------------
// 管理员查看和管理用户提交的反馈意见

export interface Feedback {
  id: number;
  userId: number;
  content: string;
  images: string[]; // 图片 URL 数组
  status: "UNREAD" | "READ";
  createdAt: string;
  user: { id: number; nickname: string; realName?: string; avatar?: string };
}

/** 获取反馈列表（管理员看全部，普通用户看自己的） */
export const getFeedbackList = () =>
  request.get<any, { success: boolean; data: Feedback[] }>("/feedback");
/** 标记反馈为已读（仅管理员） */
export const markFeedbackRead = (id: number) =>
  request.put<any, { success: boolean }>(`/feedback/${id}`);

export const feedbackApi = {
  list: getFeedbackList,
  markRead: markFeedbackRead,
};
