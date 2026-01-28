import { useState } from 'react'
import { Card, Input, Button, Typography, Space, Tag, message, Result } from 'antd'
import { UserOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Title, Text, Paragraph } = Typography

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function JoinPage() {
  const [employeeId, setEmployeeId] = useState('')
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [employeeInfo, setEmployeeInfo] = useState<any>(null)

  const handleJoin = async () => {
    if (!employeeId.trim()) {
      message.warning('請輸入員工編號')
      return
    }

    setLoading(true)

    try {
      // 直接呼叫後端 API 驗證員工
      const response = await axios.get(`${API_URL}/employees`)
      const employees = response.data.employees || response.data

      const employee = employees.find((emp: any) => emp.employeeId === employeeId.toUpperCase())

      if (!employee) {
        message.error('員工編號不存在，請確認後再試')
        setLoading(false)
        return
      }

      // 檢查是否已經中獎
      if (employee.hasDrawn) {
        message.info('您已經抽過獎了')
        setEmployeeInfo({
          ...employee,
          alreadyWon: true
        })
        setJoined(true)
        setLoading(false)
        return
      }

      // 報到成功
      setEmployeeInfo(employee)
      setJoined(true)
      setLoading(false)
      message.success('報到成功！')

    } catch (error) {
      console.error('Join error:', error)
      message.error('報到失敗，請稍後再試')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <Card
        style={{
          maxWidth: 500,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        {!joined ? (
          // 未報到狀態
          <div style={{ textAlign: 'center' }}>
            <TrophyOutlined style={{ fontSize: 80, color: '#1890ff', marginBottom: 20 }} />
            <Title level={2}>春酒抽獎報到</Title>
            <Paragraph style={{ color: '#666', marginBottom: 32 }}>
              請輸入您的員工編號完成報到
            </Paragraph>

            <Input
              size="large"
              placeholder="請輸入員工編號（例如：E001）"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
              onPressEnter={handleJoin}
              prefix={<UserOutlined />}
              disabled={loading}
              style={{ marginBottom: 16 }}
            />

            <Button
              type="primary"
              size="large"
              block
              onClick={handleJoin}
              loading={loading}
              icon={<CheckCircleOutlined />}
            >
              {loading ? '驗證中...' : '確認報到'}
            </Button>

            <div style={{ marginTop: 24, padding: 16, background: '#f0f0f0', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#666' }}>
                💡 報到後請關注大螢幕，主持人抽獎時會即時顯示中獎者
              </Text>
            </div>
          </div>
        ) : (
          // 已報到狀態
          <div style={{ textAlign: 'center' }}>
            {employeeInfo?.alreadyWon ? (
              // 已經中獎
              <Result
                status="success"
                title="您已經抽過獎了"
                subTitle={
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Title level={4} style={{ margin: 0 }}>{employeeInfo.name}</Title>
                      <Space style={{ marginTop: 8 }}>
                        <Tag color="blue">{employeeInfo.employeeId}</Tag>
                        <Tag color={employeeInfo.roleType === 'A' ? 'gold' : 'green'}>
                          角色 {employeeInfo.roleType}
                        </Tag>
                        {employeeInfo.department && <Tag>{employeeInfo.department}</Tag>}
                      </Space>
                    </div>
                    <div style={{
                      background: '#fff1f0',
                      border: '2px solid #ff4d4f',
                      borderRadius: 8,
                      padding: 20,
                      marginTop: 16
                    }}>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f', display: 'block' }}>
                        {employeeInfo.prize?.name}
                      </Text>
                      <Text style={{ fontSize: 16, color: '#666' }}>
                        價值 NT$ {employeeInfo.prize?.value.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                }
                extra={
                  <Button type="primary" onClick={() => {
                    setJoined(false)
                    setEmployeeId('')
                  }}>
                    返回
                  </Button>
                }
              />
            ) : (
              // 報到成功
              <Result
                status="success"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                title="報到成功！"
                subTitle={
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Title level={3} style={{ margin: 0 }}>{employeeInfo?.name}</Title>
                      <Space style={{ marginTop: 8 }}>
                        <Tag color="blue">{employeeInfo?.employeeId}</Tag>
                        <Tag color={employeeInfo?.roleType === 'A' ? 'gold' : 'green'}>
                          角色 {employeeInfo?.roleType}
                        </Tag>
                        {employeeInfo?.department && <Tag>{employeeInfo.department}</Tag>}
                      </Space>
                    </div>
                    <div style={{
                      background: '#e6f7ff',
                      border: '1px solid #91d5ff',
                      borderRadius: 8,
                      padding: 20,
                      marginTop: 16
                    }}>
                      <Paragraph style={{ margin: 0, fontSize: 16 }}>
                        ✅ 您已完成報到<br />
                        📺 請關注大螢幕<br />
                        🎉 主持人抽獎時會顯示中獎者
                      </Paragraph>
                    </div>
                    {employeeInfo?.roleType === 'B' && (
                      <div style={{
                        marginTop: 16,
                        padding: 12,
                        background: '#fff7e6',
                        border: '1px solid #ffd591',
                        borderRadius: 8
                      }}>
                        <Text style={{ fontSize: 12, color: '#ad6800' }}>
                          💡 您的角色只能抽萬元以下的獎品
                        </Text>
                      </div>
                    )}
                  </div>
                }
                extra={[
                  <Button type="primary" key="close" onClick={() => window.close()}>
                    關閉網頁
                  </Button>,
                  <Button key="back" onClick={() => {
                    setJoined(false)
                    setEmployeeId('')
                  }}>
                    返回
                  </Button>
                ]}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default JoinPage
