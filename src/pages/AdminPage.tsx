import { useState } from 'react'
import { Tabs, Button, Space } from 'antd'
import { HomeOutlined, UserOutlined, GiftOutlined, BarChartOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import EmployeeManagement from '../components/EmployeeManagement'
import PrizeManagement from '../components/PrizeManagement'
import Statistics from '../components/Statistics'

function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('employees')

  const items = [
    {
      key: 'employees',
      label: (
        <span>
          <UserOutlined />
          員工管理
        </span>
      ),
      children: <EmployeeManagement />
    },
    {
      key: 'prizes',
      label: (
        <span>
          <GiftOutlined />
          獎項管理
        </span>
      ),
      children: <PrizeManagement />
    },
    {
      key: 'statistics',
      label: (
        <span>
          <BarChartOutlined />
          統計資訊
        </span>
      ),
      children: <Statistics />
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: 24
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <h1 style={{ margin: 0 }}>🛠️ 後台管理</h1>
          <Space>
            <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
              返回首頁
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          size="large"
        />
      </div>
    </div>
  )
}

export default AdminPage
