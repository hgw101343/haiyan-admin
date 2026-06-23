import { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useThemeStore } from '../store/theme'
import { getTheme } from '../api'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore()

  // 启动时从后端拉取主题
  useEffect(() => {
    getTheme()
      .then((res) => {
        if (res?.data?.primaryColor) {
          setTheme(res.data)
        }
      })
      .catch(() => {
        // 获取失败则使用本地缓存或默认主题
      })
  }, [])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: theme.primaryColor,
          colorSuccess: theme.successColor,
          colorWarning: theme.warningColor,
          colorError: theme.errorColor,
          colorTextBase: theme.textColor,
          colorTextSecondary: theme.textSecondary,
          colorBorder: theme.borderColor,
          borderRadius: 8,
        },
        components: {
          Menu: {
            darkItemBg: '#1a1a2e',
            darkSubMenuItemBg: '#1a1a2e',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
