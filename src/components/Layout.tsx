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
} from "@ant-design/icons";
import { useAuthStore } from "../store/auth";

const { Header, Sider, Content, Footer } = AntLayout;
const { Text } = Typography;

const menuItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "仪表盘" },
  { key: "/dishes", icon: <ShoppingOutlined />, label: "菜品管理" },
  { key: "/categories", icon: <AppstoreOutlined />, label: "分类管理" },
  { key: "/orders", icon: <OrderedListOutlined />, label: "订单管理" },
  { key: "/users", icon: <UserOutlined />, label: "用户管理" },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { adminInfo, logout } = useAuthStore();

  const handleMenuClick = ({ key }: { key: string }) => navigate(key);

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

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: "#1a1a2e" }}
        width={220}
      >
        <div
          className={collapsed ? "logo logo-collapsed" : "logo"}
          onClick={() => navigate("/dashboard")}
        >
          {collapsed ? "🍜" : "🍜 海艳私厨"}
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

      <AntLayout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />
          <Space>
            <Text type="secondary" style={{ fontSize: 13 }}>
              欢迎，{adminInfo?.name || adminInfo?.username || "管理员"}
            </Text>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Avatar
                style={{ background: "#ff6b35", cursor: "pointer" }}
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
            <Outlet />
          </div>
        </Content>

        <Footer
          style={{ textAlign: "center", color: "#999", padding: "12px 50px" }}
        >
          点餐系统后台 ©{new Date().getFullYear()} — Powered by React + Ant
          Design
        </Footer>
      </AntLayout>
    </AntLayout>
  );
}
