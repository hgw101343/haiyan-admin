import { useEffect, useState } from "react";
import {
  Table, Input, Tag, Avatar, Typography,
  Row, Col, Button, Modal, Form, Input as AntInput, Select, message, Space,
} from "antd";
import { UserOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import { getUsers, createUser, updateUser } from "../../api";
import dayjs from "dayjs";

const { Title } = Typography;

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // 创建/编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const res: any = await getUsers({
        page: p,
        pageSize: 20,
        keyword,
        role: roleFilter || undefined,
      });
      setUsers(res.data || []);
      setTotal(res.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(1);
    setPage(1);
  }, [keyword, roleFilter]);

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    form.setFieldsValue({
      nickname: user.nickname,
      realName: user.realName || "",
      role: user.role,
      phone: user.phone || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        // 编辑：只提交有值的字段，密码为空时不修改
        const data: any = {};
        if (values.nickname !== undefined) data.nickname = values.nickname;
        if (values.realName !== undefined) data.realName = values.realName || null;
        if (values.password) data.password = values.password;
        if (values.role !== undefined) data.role = values.role;
        if (values.phone !== undefined) data.phone = values.phone || null;
        await updateUser(editingUser.id, data);
        message.success("用户更新成功");
      } else {
        // 创建
        await createUser(values);
        message.success("用户创建成功");
      }
      setModalOpen(false);
      fetch(1);
    } catch (err: any) {
      // 表单验证失败不提示，API 错误已由拦截器处理
    }
  };

  const columns = [
    {
      title: "头像",
      dataIndex: "avatar",
      width: 70,
      render: (url: string) =>
        url ? (
          <Avatar src={url} />
        ) : (
          <Avatar icon={<UserOutlined />} style={{ background: "#ff6b35" }} />
        ),
    },
    {
      title: "昵称/登录名",
      dataIndex: "nickname",
      render: (v: string) => v || "未设置",
    },
    {
      title: "中文名",
      dataIndex: "realName",
      width: 120,
      render: (v: string) => v || "-",
    },
    { title: "手机号", dataIndex: "phone", width: 120, render: (v: string) => v || "-" },
    {
      title: "角色",
      dataIndex: "role",
      width: 100,
      render: (v: string) =>
        v === "ADMIN" ? <Tag color="orange">管理员</Tag> : <Tag>用户</Tag>,
    },
    {
      title: "订单数",
      dataIndex: "_count",
      width: 100,
      render: (v: any) => <Tag color="blue">{v?.orders ?? 0} 单</Tag>,
    },
    {
      title: "注册时间",
      dataIndex: "createdAt",
      width: 160,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      width: 80,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => openEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            用户管理
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            创建用户
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="200px">
          <Input.Search
            placeholder="搜索昵称 / 手机号"
            allowClear
            onSearch={setKeyword}
            onChange={(e) => !e.target.value && setKeyword("")}
          />
        </Col>
        <Col>
          <Select
            placeholder="角色筛选"
            allowClear
            style={{ width: 120 }}
            value={roleFilter || undefined}
            onChange={(v) => setRoleFilter(v || "")}
          >
            <Select.Option value="ADMIN">管理员</Select.Option>
            <Select.Option value="USER">普通用户</Select.Option>
          </Select>
        </Col>
      </Row>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          current: page,
          pageSize: 20,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p) => {
            setPage(p);
            fetch(p);
          },
        }}
      />

      <Modal
        title={editingUser ? "编辑用户" : "创建用户"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: "USER" }}
        >
          <Form.Item
            name="nickname"
            label="登录账号"
            rules={[{ required: !editingUser, message: "请输入登录账号" }]}
          >
            <AntInput placeholder="请输入登录账号" />
          </Form.Item>

          <Form.Item
            name="realName"
            label="中文名"
          >
            <AntInput placeholder="请输入中文名（可选）" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? "新密码（留空不修改）" : "密码"}
            rules={[
              { required: !editingUser, message: "请输入密码" },
              { min: 6, message: "密码长度至少6位" },
            ]}
          >
            <AntInput.Password placeholder={editingUser ? "留空则不修改密码" : "请输入密码（至少6位）"} />
          </Form.Item>

          <Form.Item name="role" label="角色">
            <Select>
              <Select.Option value="USER">普通用户</Select.Option>
              <Select.Option value="ADMIN">管理员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="phone" label="手机号">
            <AntInput placeholder="请输入手机号（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
