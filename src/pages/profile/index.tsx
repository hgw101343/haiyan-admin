import { Card, Descriptions, Tag, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../store/auth'

const { Title } = Typography

export default function ProfilePage() {
  const { userInfo } = useAuthStore()

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <UserOutlined style={{ marginRight: 8 }} />
        个人中心
      </Title>
      <Card>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="用户名">
            {userInfo?.nickname || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="中文名">
            {userInfo?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="手机号">
            {userInfo?.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="角色">
            {userInfo?.role === 'ADMIN' ? (
              <Tag color="orange">管理员</Tag>
            ) : (
              <Tag>普通用户</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
