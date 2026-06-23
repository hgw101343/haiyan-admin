import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  message,
  Row,
  Col,
  Switch,
  Tooltip,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getCategories, createCategory, updateCategory, deleteCategory, batchDeleteCategories } from '../../api'

const { Title } = Typography

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()

  const fetch = async () => {
    setLoading(true)
    try {
      const res: any = await getCategories()
      setCategories(res.data || res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (r: any) => {
    setEditRecord(r)
    form.setFieldsValue({ name: r.name, sort: r.sort, isRecommended: r.isRecommended })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editRecord) {
        await updateCategory(editRecord.id, values)
        message.success('分类更新成功')
      } else {
        await createCategory(values)
        message.success('分类添加成功')
      }
      setModalOpen(false)
      fetch()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteCategory(id)
    message.success('删除成功')
    fetch()
  }

  const handleRecommendToggle = async (id: number, checked: boolean) => {
    await updateCategory(id, { isRecommended: checked })
    message.success(checked ? '已设为推荐分类' : '已取消推荐')
    fetch()
  }

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除？',
      content: `将删除选中的 ${selectedRowKeys.length} 个分类（有菜品的分类无法删除），确认继续？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await batchDeleteCategories(selectedRowKeys as number[])
        message.success(`成功批量删除 ${selectedRowKeys.length} 个分类`)
        setSelectedRowKeys([])
        fetch()
      },
    })
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '分类名称', dataIndex: 'name' },
    { title: '排序', dataIndex: 'sort', width: 100 },
    {
      title: '推荐',
      dataIndex: 'isRecommended',
      width: 80,
      render: (v: boolean, r: any) => (
        <Tooltip title={v ? '已设为推荐' : '设为推荐'}>
          <Switch
            checked={v}
            checkedChildren="推"
            unCheckedChildren="—"
            onChange={(checked) => handleRecommendToggle(r.id, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: '菜品数',
      dataIndex: '_count',
      width: 100,
      render: (v: any) => v?.dishes ?? '-',
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="确认删除？删除后该分类下菜品分类将清空" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>分类管理</Title>
        </Col>
        <Col>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确认删除选中的 ${selectedRowKeys.length} 个分类？（有菜品的分类无法删除）`}
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
              添加分类
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        dataSource={categories}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editRecord ? '编辑分类' : '添加分类'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="例如：主食、饮料、小吃" />
          </Form.Item>
          <Form.Item name="sort" label="排序（数字越小越靠前）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isRecommended" label="设为推荐分类" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
