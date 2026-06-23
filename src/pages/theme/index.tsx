import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Radio,
  message,
  Space,
  Typography,
  Divider,
  Tag,
  Collapse,
  Spin,
} from 'antd'
import {
  CheckOutlined,
  UndoOutlined,
  BgColorsOutlined,
} from '@ant-design/icons'
import { getTheme, updateTheme, resetTheme, type ThemeConfig } from '../../api'
import { useThemeStore } from '../../store/theme'
import './index.css'

const { Title, Text } = Typography

// 预设主题方案
const PRESETS: { name: string; colors: Partial<ThemeConfig>; preview: string }[] = [
  {
    name: '暖橙（默认）',
    preview: 'linear-gradient(135deg, #ff6b35, #f7931e)',
    colors: {
      primaryColor: '#ff6b35', primaryLight: '#ff9a5c', primaryDark: '#e55a2b',
      navBarBgColor: '#ff6b35', tabBarSelectedColor: '#ff6b35',
    },
  },
  {
    name: '深海蓝',
    preview: 'linear-gradient(135deg, #1890ff, #096dd9)',
    colors: {
      primaryColor: '#1890ff', primaryLight: '#69c0ff', primaryDark: '#096dd9',
      navBarBgColor: '#1890ff', tabBarSelectedColor: '#1890ff',
    },
  },
  {
    name: '森林绿',
    preview: 'linear-gradient(135deg, #52c41a, #389e0d)',
    colors: {
      primaryColor: '#52c41a', primaryLight: '#95de64', primaryDark: '#389e0d',
      navBarBgColor: '#52c41a', tabBarSelectedColor: '#52c41a',
    },
  },
  {
    name: '优雅紫',
    preview: 'linear-gradient(135deg, #722ed1, #531dab)',
    colors: {
      primaryColor: '#722ed1', primaryLight: '#b37feb', primaryDark: '#531dab',
      navBarBgColor: '#722ed1', tabBarSelectedColor: '#722ed1',
    },
  },
  {
    name: '深色模式',
    preview: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
    colors: {
      primaryColor: '#6366f1', primaryLight: '#818cf8', primaryDark: '#4f46e5',
      backgroundColor: '#141414', cardColor: '#1f1f1f', textColor: '#e8e8e8',
      textSecondary: '#8c8c8c', borderColor: '#303030',
      navBarBgColor: '#1a1a2e', navBarTextStyle: 'white',
      tabBarSelectedColor: '#6366f1', tabBarColor: '#666', tabBarBgColor: '#1a1a2e',
    },
  },
]

// 主题编辑项分组
const COLOR_GROUPS = [
  {
    title: '主色调',
    keys: ['primaryColor', 'primaryLight', 'primaryDark'],
    labels: { primaryColor: '主题色', primaryLight: '浅色变体', primaryDark: '深色变体' },
  },
  {
    title: '导航栏',
    keys: ['navBarBgColor', 'navBarTextStyle'],
    labels: { navBarBgColor: '导航栏背景', navBarTextStyle: '标题文字颜色' },
    isTextStyle: true,
  },
  {
    title: 'TabBar',
    keys: ['tabBarSelectedColor', 'tabBarColor', 'tabBarBgColor'],
    labels: { tabBarSelectedColor: '选中色', tabBarColor: '未选中色', tabBarBgColor: '背景色' },
  },
  {
    title: '页面背景',
    keys: ['backgroundColor', 'cardColor', 'borderColor'],
    labels: { backgroundColor: '页面底色', cardColor: '卡片/列表底色', borderColor: '分割线' },
  },
  {
    title: '文字',
    keys: ['textColor', 'textSecondary'],
    labels: { textColor: '主文字色', textSecondary: '辅助文字色' },
  },
  {
    title: '语义色',
    keys: ['successColor', 'warningColor', 'errorColor'],
    labels: { successColor: '成功/绿色', warningColor: '警告/橙色', errorColor: '错误/红色' },
  },
]

export default function ThemePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<ThemeConfig | null>(null)
  const { setTheme: setStoreTheme, theme: storeTheme } = useThemeStore()

  useEffect(() => {
    fetchTheme()
  }, [])

  const fetchTheme = async () => {
    setLoading(true)
    try {
      const res = await getTheme()
      setTheme(res.data)
    } catch {
      message.warning('获取主题配置失败，使用本地缓存')
      setTheme(storeTheme)
    } finally {
      setLoading(false)
    }
  }

  const handleColorChange = (key: string, value: string) => {
    if (!theme) return
    setTheme({ ...theme, [key]: value })
  }

  const handleSave = async () => {
    if (!theme) return
    setSaving(true)
    try {
      await updateTheme(theme)
      setStoreTheme(theme)
      message.success('主题已保存，小程序端刷新后生效')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      const res = await resetTheme()
      setTheme(res.data)
      setStoreTheme(res.data)
      message.success('已重置为默认主题')
    } catch {
      message.error('重置失败')
    }
  }

  const handlePreset = (preset: (typeof PRESETS)[0]) => {
    if (!theme) return
    setTheme({ ...theme, ...preset.colors } as ThemeConfig)
  }

  if (loading || !theme) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="theme-page">
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <BgColorsOutlined style={{ marginRight: 8 }} />
            主题设置
          </Title>
          <Text type="secondary" style={{ marginLeft: 32 }}>
            修改后保存，小程序端刷新即可看到新主题
          </Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<UndoOutlined />} onClick={handleReset}>
              重置默认
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存主题
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 预设方案 */}
      <Card title="预设方案" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {PRESETS.map((preset) => (
            <Col key={preset.name} xs={12} sm={8} md={6} lg={4}>
              <div
                className={`preset-card ${theme.primaryColor === preset.colors.primaryColor ? 'active' : ''}`}
                onClick={() => handlePreset(preset)}
              >
                <div
                  className="preset-preview"
                  style={{ background: preset.preview }}
                />
                <div className="preset-name">{preset.name}</div>
                {theme.primaryColor === preset.colors.primaryColor && (
                  <Tag color="blue" className="preset-tag">当前</Tag>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 手机预览 + 颜色编辑 */}
      <Row gutter={24}>
        {/* 左侧：手机预览 */}
        <Col xs={24} md={8}>
          <Card title="小程序预览" style={{ position: 'sticky', top: 24 }}>
            <div className="phone-preview">
              {/* 导航栏 */}
              <div
                className="phone-navbar"
                style={{
                  background: theme.navBarBgColor,
                  color: theme.navBarTextStyle === 'white' ? '#fff' : '#333',
                }}
              >
                <div className="phone-navbar-title">海艳私厨</div>
              </div>

              {/* 页面内容 */}
              <div className="phone-body" style={{ background: theme.backgroundColor }}>
                {/* 搜索栏 */}
                <div
                  className="phone-search"
                  style={{ background: theme.cardColor, borderColor: theme.borderColor }}
                >
                  <div
                    className="phone-search-bar"
                    style={{
                      background: theme.cardColor,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <span style={{ color: theme.textSecondary }}>搜索菜品...</span>
                  </div>
                </div>

                {/* 菜品卡片 */}
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="phone-dish-card"
                    style={{ background: theme.cardColor, borderColor: theme.borderColor }}
                  >
                    <div
                      className="phone-dish-img"
                      style={{ background: theme.primaryLight }}
                    />
                    <div className="phone-dish-info">
                      <div className="phone-dish-name" style={{ color: theme.textColor }}>
                        菜品名称
                      </div>
                      <div className="phone-dish-desc" style={{ color: theme.textSecondary }}>
                        菜品描述文字
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="phone-dish-price" style={{ color: theme.primaryColor }}>
                          ¥28.00
                        </span>
                        <div
                          className="phone-add-btn"
                          style={{ background: theme.primaryColor }}
                        >
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* TabBar */}
              <div
                className="phone-tabbar"
                style={{ background: theme.tabBarBgColor, borderColor: theme.borderColor }}
              >
                {['首页', '菜单', '购物车', '订单', '我的'].map((label, i) => (
                  <div
                    key={label}
                    className="phone-tab-item"
                    style={{
                      color: i === 0 ? theme.tabBarSelectedColor : theme.tabBarColor,
                    }}
                  >
                    <div
                      className="phone-tab-icon"
                      style={{ background: i === 0 ? theme.tabBarSelectedColor : theme.tabBarColor }}
                    />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        {/* 右侧：颜色编辑 */}
        <Col xs={24} md={16}>
          <Collapse
            defaultActiveKey={COLOR_GROUPS.map((_, i) => String(i))}
            items={COLOR_GROUPS.map((group, gi) => ({
              key: String(gi),
              label: group.title,
              children: (
                <Row gutter={[16, 16]}>
                  {group.keys.map((key) => {
                    const value = (theme as any)[key] || ''
                    const label = group.labels[key as keyof typeof group.labels]
                    const isTextStyle = group.isTextStyle && key === 'navBarTextStyle'

                    return (
                      <Col key={key} xs={24} sm={12} md={8}>
                        <div className="color-item">
                          <div className="color-item-label">
                            <span>{label}</span>
                            {!isTextStyle && (
                              <div
                                className="color-swatch"
                                style={{ background: value }}
                              />
                            )}
                          </div>
                          {isTextStyle ? (
                            <Radio.Group
                              value={value}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              size="small"
                            >
                              <Radio.Button value="white">白色</Radio.Button>
                              <Radio.Button value="black">黑色</Radio.Button>
                            </Radio.Group>
                          ) : (
                            <Input
                              value={value}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              prefix={
                                <input
                                  type="color"
                                  value={value}
                                  onChange={(e) => handleColorChange(key, e.target.value)}
                                  className="native-color-picker"
                                />
                              }
                              style={{ fontFamily: 'monospace' }}
                            />
                          )}
                        </div>
                      </Col>
                    )
                  })}
                </Row>
              ),
            }))}
          />
        </Col>
      </Row>
    </div>
  )
}
