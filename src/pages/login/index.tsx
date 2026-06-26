import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { adminLogin } from "../../api";
import { useAuthStore } from "../../store/auth";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res: any = await adminLogin(values);
      setAuth(res.data.token, res.data.user);
      message.success("登录成功");
      navigate("/dashboard", { replace: true });
    } catch {
      // 错误已在 axios 拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcd3c 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          borderRadius: 16,
        }}
        bodyStyle={{ padding: "40px 40px 32px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/logo.jpg"
            alt="海宴私厨"
            style={{ width: 64, height: 64, borderRadius: 14, marginBottom: 8 }}
          />
          <Title level={3} style={{ margin: 0 }}>
            海宴私厨
          </Title>
          <Text type="secondary">后台管理系统</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          initialValues={{ username: "admin", password: "admin123" }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="管理员账号" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: 44, borderRadius: 8 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Text
          type="secondary"
          style={{ display: "block", textAlign: "center", fontSize: 12 }}
        >
          默认账号：admin / admin123
        </Text>
      </Card>
    </div>
  );
}
