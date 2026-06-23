import { useEffect, useState } from 'react'
import { Table, Input, Tag, Avatar, Typography, Row, Col } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { getUsers } from '../../api'
import dayjs from 'dayjs'

const { Title } = Typography

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')

  const fetch = async (p = page) => {
    setLoading(true)
    try {
      const res: any = await getUsers({ page: p, pageSize: 15, keyword })
      setUsers(res.data || [])
      setTotal(res.pagination?.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch(1); setPage(1) }, [keyword])

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      width: 70,
      render: (url: string) =>
        url ? (
          <Avatar src={url} />
        ) : (
          <Avatar icon={<UserOutlined />} style={{ background: '#ff6b35' }} />
        ),
    },
    { title: '昵称', dataIndex: 'nickname', render: (v: string) => v || '未设置' },
    { title: '手机号', dataIndex: 'phone', render: (v: string) => v || '-' },
    {
      title: '角色',
      dataIndex: 'role',
      width: 80,
      render: (v: string) => v === 'ADMIN' ? <Tag color="orange">管理员</Tag> : <Tag>用户</Tag>,
    },
    {
      title: '订单数',
      dataIndex: '_count',
      width: 100,
      render: (v: any) => <Tag color="blue">{v?.orders ?? 0} 单</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>用户管理</Title>
        </Col>
      </Row>

      <Row style={{ marginBottom: 16 }}>
        <Col flex="200px">
          <Input.Search placeholder="搜索昵称 / 手机号" allowClear onSearch={setKeyword} />
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
          pageSize: 15,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p) => { setPage(p); fetch(p) },
        }}
      />
    </div>
  )
}
