import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin } from 'antd'
import {
  ShoppingOutlined,
  OrderedListOutlined,
  UserOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { getDashboardStats, getRecentOrders } from '../../api'
import dayjs from 'dayjs'

const { Title } = Typography

const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'orange', text: '待支付' },
  PAID: { color: 'blue', text: '已支付' },
  PREPARING: { color: 'cyan', text: '制作中' },
  READY: { color: 'purple', text: '待取餐' },
  COMPLETED: { color: 'green', text: '已完成' },
  CANCELLED: { color: 'red', text: '已取消' },
  REFUNDED: { color: 'volcano', text: '已退款' },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getRecentOrders(8)])
      .then(([s, o]: any) => {
        setStats(s.data || s)
        setOrders(o.data || o)
      })
      .finally(() => setLoading(false))
  }, [])

  const orderColumns = [
    { title: '订单号', dataIndex: 'orderNo', width: 160 },
    {
      title: '用户',
      dataIndex: ['user', 'nickname'],
      render: (v: string, r: any) => v || r.user?.openid?.slice(-8) || '-',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      render: (v: number) => <span style={{ color: '#ff6b35', fontWeight: 600 }}>¥{(v / 100).toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const m = statusMap[s] || { color: 'default', text: s }
        return <Tag color={m.color}>{m.text}</Tag>
      },
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
  ]

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>数据概览</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg,#ff6b35,#f7931e)', color: '#fff', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,.85)' }}>今日订单</span>}
              value={stats?.todayOrders ?? 0}
              prefix={<OrderedListOutlined />}
              valueStyle={{ color: '#fff', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg,#36cfc9,#13c2c2)', color: '#fff', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,.85)' }}>今日营收</span>}
              value={((stats?.todayRevenue ?? 0) / 100).toFixed(2)}
              prefix={<span style={{ color: '#fff' }}>¥</span>}
              valueStyle={{ color: '#fff', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,.85)' }}>菜品总数</span>}
              value={stats?.totalDishes ?? 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#fff', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,.85)' }}>用户总数</span>}
              value={stats?.totalUsers ?? 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fff', fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="最近订单" bordered={false} style={{ borderRadius: 12 }}>
            <Table
              dataSource={orders}
              columns={orderColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="今日概况" bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Row gutter={[0, 16]}>
              <Col span={24}>
                <Statistic title="本月订单" value={stats?.monthOrders ?? 0} suffix="单" />
              </Col>
              <Col span={24}>
                <Statistic
                  title="本月营收"
                  value={((stats?.monthRevenue ?? 0) / 100).toFixed(2)}
                  prefix="¥"
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="总订单数"
                  value={stats?.totalOrders ?? 0}
                  suffix="单"
                  prefix={<RiseOutlined />}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="总营收"
                  value={((stats?.totalRevenue ?? 0) / 100).toFixed(2)}
                  prefix="¥"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
