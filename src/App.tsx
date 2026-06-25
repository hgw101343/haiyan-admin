import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/login/index";
import DashboardPage from "./pages/dashboard/index";
import DishesPage from "./pages/dishes/index";
import CategoriesPage from "./pages/categories/index";
import OrdersPage from "./pages/orders/index";
import UsersPage from "./pages/users/index";
import ThemePage from "./pages/theme/index";
import ProfilePage from "./pages/profile/index";
import FeedbackPage from "./pages/feedback/index";
import { useAuthStore } from "./store/auth";

/**
 * 路由守卫组件：要求用户已登录（RequireAuth）
 *
 * 从持久化 authStore 中读取 token：
 * - 有 token：正常渲染子组件（已登录）
 * - 无 token：重定向到 /login 登录页（未登录或 token 已过期被清除）
 *
 * 使用 replace 导航模式：替换当前历史记录条目，
 * 避免用户按"返回"按钮又回到受保护页面。
 *
 * 所有需要登录才能访问的页面都应包裹在 <RequireAuth> 内部。
 */
function RequireAuth({ children }: { children: JSX.Element }) {
  // 从持久化的 zustand store 中获取 token
  const token = useAuthStore((s) => s.token);
  // 未登录：重定向到登录页
  if (!token) return <Navigate to="/login" replace />;
  // 已登录：渲染受保护的子页面
  return children;
}

/**
 * 路由守卫组件：要求用户为管理员角色（RequireAdmin）
 *
 * 从 authStore 中读取当前用户的 role 字段：
 * - role === "ADMIN"：渲染子组件（管理员）
 * - role !== "ADMIN"：重定向到 /profile 个人中心（普通用户无权访问管理页面）
 *
 * 此组件必须在 RequireAuth 之后使用（因为需要 userInfo 已加载），
 * 用于保护仪表盘、用户管理等仅管理员可访问的页面。
 */
function RequireAdmin({ children }: { children: JSX.Element }) {
  // 从 authStore 获取当前用户的角色
  const role = useAuthStore((s) => s.userInfo?.role);
  // 非管理员：重定向到个人中心
  if (role !== "ADMIN") return <Navigate to="/profile" replace />;
  return children;
}

/**
 * 应用根组件 — 路由配置
 *
 * 路由结构说明：
 *
 * 公开路由（无需登录）：
 *   /login → 登录页面
 *
 * 受保护路由（需要登录，由 <RequireAuth> 包裹）：
 *   /          → 根布局（Layout，含侧边栏 + 顶栏 + 内容区）
 *     ├─ /profile     → 个人中心（所有用户可访问）
 *     ├─ /dashboard   → 仪表盘（仅管理员，RequireAdmin 二次守卫）
 *     ├─ /dishes      → 菜品管理（所有用户可访问）
 *     ├─ /categories  → 分类管理（所有用户可访问）
 *     ├─ /orders      → 订单管理（所有用户可访问）
 *     ├─ /users       → 用户管理（仅管理员，RequireAdmin 二次守卫）
 *     ├─ /theme       → 主题设置（所有用户可访问）
 *     └─ / (index)    → 根路径自动重定向到 /profile 个人中心
 *                          普通用户登录后直接进入个人中心，
 *                          管理员可通过侧边栏导航到仪表盘等页面
 *
 * 通配符路由：
 *   * → 任意未匹配路径重定向到 /（再由根路由重定向到 /profile）
 */
export default function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* 公开路由：登录页，无需认证 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 受保护路由：所有子路由都需要登录后才能访问 */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          {/* 个人中心：所有角色可访问 */}
          <Route path="profile" element={<ProfilePage />} />

          {/* 仪表盘：仅管理员可访问 */}
          <Route path="dashboard" element={<RequireAdmin><DashboardPage /></RequireAdmin>} />

          {/* 菜品管理：所有角色可访问 */}
          <Route path="dishes" element={<DishesPage />} />

          {/* 分类管理：所有角色可访问 */}
          <Route path="categories" element={<CategoriesPage />} />

          {/* 订单管理：所有角色可访问 */}
          <Route path="orders" element={<OrdersPage />} />

          {/* 用户管理：仅管理员可访问 */}
          <Route path="users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />

          {/* 主题设置：所有角色可访问 */}
          <Route path="theme" element={<ThemePage />} />

          {/* 意见反馈：仅管理员可访问 */}
          <Route path="feedback" element={<RequireAdmin><FeedbackPage /></RequireAdmin>} />

          {/* 根路径（/）：重定向到个人中心
              普通用户登录后直接看到个人中心，而非管理员专属的仪表盘 */}
          <Route index element={<Navigate to="/profile" replace />} />
        </Route>

        {/* 通配符路由：匹配所有未定义路径，兜底重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
