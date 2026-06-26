import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  theme,
  Button,
  Space,
  Typography,
} from "antd";
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  BgColorsOutlined,
  MessageOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../store/theme";

const { Header, Sider, Content, Footer } = AntLayout;
const { Text } = Typography;

/**
 * 全部菜单项定义（含权限标记）
 *
 * 每个菜单项包含：
 * - key: 路由路径，与 React Router 的 path 对应
 * - icon: antd 图标组件
 * - label: 中文菜单名称
 * - adminOnly: 权限标记
 *   → true: 仅管理员可见（仪表盘、用户管理）
 *   → false: 所有登录用户可见（菜品、分类、订单、主题、个人中心）
 *
 * 非管理员用户登录后，adminOnly 为 true 的菜单项将被过滤掉，
 * 菜单中只显示其有权访问的页面入口。
 */
const allMenuItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "仪表盘",
    adminOnly: true,
  },
  {
    key: "/dishes",
    icon: <ShoppingOutlined />,
    label: "菜品管理",
    adminOnly: false,
  },
  {
    key: "/categories",
    icon: <AppstoreOutlined />,
    label: "分类管理",
    adminOnly: false,
  },
  {
    key: "/orders",
    icon: <OrderedListOutlined />,
    label: "订单管理",
    adminOnly: false,
  },
  { key: "/users", icon: <UserOutlined />, label: "用户管理", adminOnly: true },
  {
    key: "/theme",
    icon: <BgColorsOutlined />,
    label: "主题设置",
    adminOnly: false,
  },
  {
    key: "/feedback",
    icon: <MessageOutlined />,
    label: "意见反馈",
    adminOnly: true,
  },
  {
    key: "/profile",
    icon: <SettingOutlined />,
    label: "个人中心",
    adminOnly: false,
  },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { userInfo, logout } = useAuthStore();
  const { theme: appTheme } = useThemeStore();

  /**
   * 按用户角色动态过滤菜单项
   *
   * 过滤逻辑：
   * - 管理员（role === "ADMIN"）：保留所有菜单项（包括 adminOnly 为 true 的项）
   * - 普通用户（role !== "ADMIN"）：只保留 adminOnly 为 false 的菜单项
   *
   * filter 后的 map 步骤：使用解构剔除 adminOnly 属性（重命名为 _a 并丢弃），
   * 因为 antd Menu 的 items 不需要该字段，避免控制台出现未知属性警告。
   */
  const menuItems = allMenuItems
    .filter((item) => userInfo?.role === "ADMIN" || !item.adminOnly)
    .map(({ adminOnly: _a, ...item }) => item);

  /**
   * 用户显示名称：优先使用真实姓名，其次昵称，最后回退到默认值 "用户"
   *
   * 回退链：
   * 1. userInfo?.realName — 用户在个人设置中填写的真实姓名
   * 2. userInfo?.nickname — 注册时设置的昵称（必填）
   * 3. "用户" — 兜底默认值（理论上不会走到这里，因为 nickname 为必填）
   */
  const displayName = userInfo?.realName || userInfo?.nickname || "用户";

  const handleMenuClick = ({ key }: { key: string }) => navigate(key);

  /**
   * 用户头像下拉菜单配置
   *
   * 菜单项：
   * 1. "个人设置" → 跳转到 /profile 个人中心页面（通过 navigate 路由跳转）
   * 2. 分割线（type: "divider"）→ 视觉分隔
   * 3. "退出登录" → 调用 logout() 清除认证状态，并导航到 /login 登录页
   *
   * danger: true 使退出登录选项显示为红色警告样式。
   * placement: "bottomRight" 使下拉菜单在头像右下方展开。
   */
  const userMenu = {
    items: [
      { key: "profile", icon: <SettingOutlined />, label: "个人设置" },
      { type: "divider" as const },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "退出登录",
        danger: true,
      },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === "logout") {
        logout();
        navigate("/login");
      }
    },
  };

  /**
   * 侧边栏宽度动态计算
   *
   * collapsed === true 时宽度为 80px（只显示图标），
   * collapsed === false 时宽度为 220px（显示图标 + 文字）。
   *
   * 该值同时用于：
   * 1. Sider 组件本身的实际渲染宽度（通过 collapsed 属性 + width 属性控制）
   * 2. 右侧内容区域的 marginLeft（见下方 AntLayout style），确保内容区不被固定侧边栏遮挡
   */
  const siderWidth = collapsed ? 80 : 220;

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      {/* 固定左侧菜单栏 */}
      {/**
       * 侧边栏（Sider）固定定位方案
       *
       * position: "fixed" + left: 0 + top: 0 + bottom: 0
       *   - 将侧边栏从文档流中脱离，固定在视口左侧
       *   - 高度撑满整个视口（100vh）
       *   - 即使右侧内容区域滚动，侧边栏始终可见
       *
       * zIndex: 10
       *   - 确保侧边栏在普通内容之上
       *   - 低于 Header 的 zIndex: 9？注意：Sider 在左侧独立层级，Header 在右侧区域
       *   - 实际上 Sider(10) 高于 Header(9)，防止折叠按钮被遮挡
       *
       * overflow: "auto"
       *   - 当菜单项过多超出视口高度时，侧边栏内部出现滚动条
       *
       * background: "#1a1a2e"
       *   - 自定义深色背景，与 antd dark 主题配合使用
       */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
          background: "#1a1a2e",
        }}
        width={220}
      >
        <div
          className={collapsed ? "logo logo-collapsed" : "logo"}
          onClick={() => navigate("/dashboard")}
        >
          {collapsed ? (
            <img
              src="/logo.jpg"
              alt="logo"
              style={{ width: 32, height: 32, borderRadius: 8 }}
            />
          ) : (
            <>
              <img
                src="/logo.jpg"
                alt="海宴私厨"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  verticalAlign: "middle",
                  marginRight: 8,
                }}
              />
              海宴私厨
            </>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: "#1a1a2e", borderRight: 0 }}
        />
      </Sider>

      {/* 右侧主体区域，根据侧边栏宽度偏移 */}
      <AntLayout style={{ marginLeft: siderWidth }}>
        {/* 固定顶部导航栏 */}
        {/**
         * 顶部导航栏（Header）粘性定位方案
         *
         * position: "sticky"
         *   - 正常情况下随文档流排列在侧边栏右侧
         *   - 当页面滚动时，粘附在视口顶部（top: 0），始终可见
         *   - 相比 fixed 定位，sticky 不会脱离文档流，内容区 margin 仍正常生效
         *
         * zIndex: 9
         *   - 确保 Header 在内容区域之上
         *   - 低于 Sider 的 zIndex: 10
         *
         * boxShadow: "0 1px 4px rgba(0,21,41,.08)"
         *   - 底部轻微阴影，与内容区形成视觉分隔
         *
         * width: "100%"
         *   - 宽度自动适应父容器（右侧 AntLayout），由 marginLeft: siderWidth 控制位置
         */}
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
            position: "sticky",
            top: 0,
            zIndex: 9,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{ fontSize: 16, width: 40, height: 40 }}
              title="刷新当前页"
            />
          </div>
          <Space>
            <Text type="secondary" style={{ fontSize: 13 }}>
              欢迎，{displayName}
            </Text>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Avatar
                style={{ background: appTheme.primaryColor, cursor: "pointer" }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: 8,
            }}
          >
            <Outlet key={refreshKey} />
          </div>
        </Content>

        <Footer
          style={{ textAlign: "center", color: "#999", padding: "12px 50px" }}
        >
          海晏私厨后台 ©{new Date().getFullYear()} — Powered by React + Ant
          Design
        </Footer>
      </AntLayout>
    </AntLayout>
  );
}
