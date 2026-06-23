import { useEffect, useState, useRef } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Upload,
  Image,
  Tag,
  Typography,
  message,
  Card,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  getDishes,
  createDish,
  updateDish,
  deleteDish,
  batchDeleteDishes,
  toggleDishAvailable,
  getCategories,
  uploadImage,
} from "../../api";
import type { UploadFile } from "antd";

const { Title } = Typography;
const { TextArea } = Input;

export default function DishesPage() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [catFilter, setCatFilter] = useState<number | undefined>();
  const [recFilter, setRecFilter] = useState<boolean | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const fetchDishes = async (p = page) => {
    setLoading(true);
    try {
      const res: any = await getDishes({
        page: p,
        pageSize: 20,
        keyword,
        categoryId: catFilter,
        recommended: recFilter,
      });
      setDishes(res.data || []);
      setTotal(res.pagination?.total || res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res: any = await getCategories();
    setCategories(res.data || res);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDishes(1);
    setPage(1);
  }, [keyword, catFilter, recFilter]);

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    setFileList([]);
    setModalOpen(true);
  };

  const openEdit = (record: any) => {
    setEditRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      price: record.price,
      categoryId: record.categoryId,
      isActive: record.isActive,
      isRecommended: record.isRecommended,
      sort: record.sort,
    });
    setFileList(
      record.image
        ? [{ uid: "-1", name: "image", status: "done", url: record.image }]
        : [],
    );
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      // 先上传图片（如果有新文件）
      let imageUrl = editRecord?.image || "";
      const newFile = fileList.find((f) => f.originFileObj);
      if (newFile?.originFileObj) {
        const uploadRes: any = await uploadImage(newFile.originFileObj as File);
        imageUrl = uploadRes.data?.url || uploadRes.url || "";
      }

      // 发送 JSON 数据
      const dishData: any = {
        name: values.name,
        price: Number(values.price),
        description: values.description || "",
        categoryId: values.categoryId,
        isActive: values.isActive ?? true,
        isRecommended: values.isRecommended ?? false,
        sort: values.sort ?? 0,
        image: imageUrl,
      };

      if (editRecord) {
        await updateDish(editRecord.id, dishData);
        message.success("菜品更新成功");
      } else {
        await createDish(dishData);
        message.success("菜品添加成功");
      }
      setModalOpen(false);
      fetchDishes(editRecord ? page : 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteDish(id);
    message.success("删除成功");
    fetchDishes(page);
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    await toggleDishAvailable(id, isActive);
    setDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive } : d)),
    );
  };

  const handleBatchDelete = () => {
    Modal.confirm({
      title: "确认批量删除？",
      content: `将下架选中的 ${selectedRowKeys.length} 个菜品，确认继续？`,
      okText: "确认删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        await batchDeleteDishes(selectedRowKeys as number[]);
        message.success(`成功批量删除 ${selectedRowKeys.length} 个菜品`);
        setSelectedRowKeys([]);
        fetchDishes(page);
      },
    });
  };

  const columns = [
    {
      title: "图片",
      dataIndex: "image",
      width: 80,
      render: (url: string) =>
        url ? (
          <Image
            src={url}
            width={56}
            height={56}
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              background: "#f5f5f5",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🍽️
          </div>
        ),
    },
    { title: "菜品名称", dataIndex: "name", width: 150 },
    {
      title: "分类",
      dataIndex: ["category", "name"],
      width: 100,
      render: (v: string) => (v ? <Tag color="orange">{v}</Tag> : "-"),
    },
    {
      title: "价格",
      dataIndex: "price",
      width: 100,
      render: (v: number) => (
        <span style={{ color: "#ff6b35", fontWeight: 600 }}>
          ¥{Number(v).toFixed(2)}
        </span>
      ),
    },
    { title: "描述", dataIndex: "description", ellipsis: true },
    {
      title: "上架",
      dataIndex: "isActive",
      width: 80,
      render: (v: boolean, r: any) => (
        <Switch checked={v} onChange={(val) => handleToggle(r.id, val)} />
      ),
    },
    {
      title: "推荐",
      dataIndex: "isRecommended",
      width: 80,
      render: (v: boolean) =>
        v ? <Tag color="gold">⭐推荐</Tag> : <Tag>普通</Tag>,
    },
    {
      title: "操作",
      width: 120,
      render: (_: any, r: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(r)}
          />
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            菜品管理
          </Title>
        </Col>
        <Col>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确认下架选中的 ${selectedRowKeys.length} 个菜品？`}
                onConfirm={handleBatchDelete}
                okText="确认删除"
                cancelText="取消"
              >
                <Button danger>
                  <DeleteOutlined /> 批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              添加菜品
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col flex="200px">
          <Input.Search
            placeholder="搜索菜品名称"
            allowClear
            onSearch={setKeyword}
          />
        </Col>
        <Col flex="160px">
          <Select
            placeholder="筛选分类"
            allowClear
            style={{ width: "100%" }}
            onChange={setCatFilter}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Col>
        <Col flex="120px">
          <Select
            placeholder="是否推荐"
            allowClear
            style={{ width: "100%" }}
            onChange={(v) =>
              setRecFilter(v === undefined ? undefined : v === "true")
            }
            options={[
              { value: "true", label: "⭐ 推荐" },
              { value: "false", label: "普通" },
            ]}
          />
        </Col>
      </Row>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        dataSource={dishes}
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
            fetchDishes(p);
          },
        }}
      />

      <Modal
        title={editRecord ? "编辑菜品" : "添加菜品"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={{ isActive: true }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="菜品名称"
                rules={[{ required: true, message: "请输入菜品名称" }]}
              >
                <Input placeholder="例如：红烧肉" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="price"
                label="价格（元）"
                rules={[{ required: true, message: "请输入价格" }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: "100%" }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="分类">
                <Select
                  placeholder="选择分类"
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sort" label="排序">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="isActive"
                label="立即上架"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="isRecommended"
                label="设为推荐"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="菜品描述（可选）" />
          </Form.Item>

          <Form.Item label="菜品图片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl)}
              maxCount={1}
              accept="image/*"
            >
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>选择图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
