import { useEffect, useState } from 'react'
import {
  Table,
  Tag,
  Select,
  Input,
  Button,
  Modal,
  Descriptions,
  Typography,
  Row,
  Col,
  Divider,
  message,
} from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { getOrders, getOrderDetail, updateOrderStatus } from '../../api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'orange', text: '待支付' },
  PAID: { color: 'blue', text: '已支付' },
  PREPARING: { color: 'cyan', text: '制作中' },
  READY: { color: 'purple', text: '待取餐' },
  COMPLETED: { color: 'green', text: '已完成' },
  CANCELLED: { color: 'red', text: '已取消' },
  REFUNDED: { color: 'volcano', text: '已退款' },
}

const nextStatusMap: Record<string, { next: string; label: string }> = {
  PAID: { next: 'PREPARING', label: '开始制作' },
  PREPARING: { next: 'READY', label: '制作完成' },
  READY: { next: 'COMPLETED', label: '确认取餐' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [keyword, setKeyword] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const fetch = async (p = page) => {
    setLoading(true)
    try {
      const res: any = await getOrders({ page: p, pageSize: 15, status: statusFilter, keyword })
      setOrders(res.data || [])
      setTotal(res.pagination?.total || res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch(1); setPage(1) }, [statusFilter, keyword])

  const viewDetail = async (id: number) => {
    const res: any = await getOrderDetail(id)
    setDetail(res.data || res)
    setDetailVisible(true)
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    await updateOrderStatus(id, status)
    message.success('订单状态已更新')
    setDetailVisible(false)
    fetch(page)
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', width: 180, ellipsis: true },
    {
      title: '用户',
      dataIndex: ['user', 'nickname'],
      width: 120,
      render: (v: string, r: any) => v || r.user?.openid?.slice(-6) || '-',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      width: 100,
      render: (v: number) => (
        <Text strong style={{ color: '#ff6b35' }}>¥{(v / 100).toFixed(2)}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: string) => {
        const m = statusMap[s] || { color: 'default', text: s }
        return <Tag color={m.color}>{m.text}</Tag>
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, r: any) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r.id)} />
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>订单管理</Title>
        </Col>
      </Row>

      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col flex="200px">
          <Input.Search placeholder="搜索订单号" allowClear onSearch={setKeyword} />
        </Col>
        <Col flex="160px">
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: '100%' }}
            onChange={setStatusFilter}
            options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text }))}
          />
        </Col>
      </Row>

      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          current: page,
          pageSize: 15,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p) => { setPage(p); fetch(p) },
        }}
      />

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {detail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号" span={2}>{detail.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text || detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="金额">
                <Text strong style={{ color: '#ff6b35' }}>¥{(detail.totalAmount / 100).toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                {detail.user?.nickname || detail.user?.openid?.slice(-8)}
              </Descriptions.Item>
              <Descriptions.Item label="手机">
                {detail.user?.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="下单时间" span={2}>
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {detail.remark && (
                <Descriptions.Item label="备注" span={2}>{detail.remark}</Descriptions.Item>
              )}
            </Descriptions>

            <Divider>菜品明细</Divider>
            <Table
              dataSource={detail.items}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '菜品', dataIndex: ['dish', 'name'] },
                { title: '单价', dataIndex: 'price', render: (v: number) => `¥${(v / 100).toFixed(2)}` },
                { title: '数量', dataIndex: 'quantity' },
                {
                  title: '小计',
                  render: (_: any, r: any) => (
                    <Text strong>¥{((r.price * r.quantity) / 100).toFixed(2)}</Text>
                  ),
                },
              ]}
            />

            {nextStatusMap[detail.status] && (
              <>
                <Divider />
                <Row justify="center">
                  <Button
                    type="primary"
                    size="large"
                    onClick={() =>
                      handleUpdateStatus(detail.id, nextStatusMap[detail.status].next)
                    }
                  >
                    {nextStatusMap[detail.status].label}
                  </Button>
                </Row>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
