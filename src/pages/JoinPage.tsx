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
      background: '#8B0000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 裝飾圓圈 */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 215, 0, 0.1)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 215, 0, 0.05)',
        pointerEvents: 'none'
      }} />

      <Card
        style={{
          maxWidth: 500,
          width: '100%',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '4px solid #FFD700',
          position: 'relative',
          zIndex: 1
        }}
      >
        {!joined ? (
          // 未報到狀態
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 120,
              height: 120,
              margin: '0 auto 30px',
              background: '#FFD700',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)'
            }}>
              <TrophyOutlined style={{ fontSize: 60, color: '#8B0000' }} />
            </div>

            <Title level={2} style={{ color: '#8B0000', marginBottom: 8 }}>春酒抽獎報到</Title>
            <Paragraph style={{ color: '#666', marginBottom: 32, fontSize: 16 }}>
              請輸入您的員工編號完成報到
            </Paragraph>

            <Input
              size="large"
              placeholder="員工編號(C0104)"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
              onPressEnter={handleJoin}
              prefix={<UserOutlined />}
              disabled={loading}
              style={{ marginBottom: 16, fontSize: 18 }}
            />

            <Button
              size="large"
              block
              onClick={handleJoin}
              loading={loading}
              icon={<CheckCircleOutlined />}
              style={{
                background: '#8B0000',
                borderColor: '#8B0000',
                color: 'white',
                height: 50,
                fontSize: 18,
                fontWeight: 'bold'
              }}
            >
              {loading ? '驗證中...' : '✓ 確認報到'}
            </Button>

            <div style={{ marginTop: 24, padding: 16, background: '#fff7e6', borderRadius: 8, border: '1px solid #FFD700' }}>
              <Text style={{ fontSize: 13, color: '#8B0000' }}>
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
                icon={<TrophyOutlined style={{ color: '#FFD700', fontSize: 80 }} />}
                title={<Title level={2} style={{ color: '#8B0000', margin: 0 }}>您已經抽過獎了</Title>}
                subTitle={
                  <div>
                    <div style={{ marginBottom: 20, marginTop: 16 }}>
                      <Title level={3} style={{ margin: 0, color: '#8B0000' }}>{employeeInfo.name}</Title>
                      <Space style={{ marginTop: 12 }} size="middle">
                        <Tag style={{
                          fontSize: 16,
                          padding: '6px 16px',
                          background: '#8B0000',
                          color: 'white',
                          border: 'none'
                        }}>
                          {employeeInfo.employeeId}
                        </Tag>
                        <Tag style={{
                          fontSize: 16,
                          padding: '6px 16px',
                          background: employeeInfo.roleType === 'A' ? '#FFD700' : '#52c41a',
                          color: employeeInfo.roleType === 'A' ? '#8B0000' : 'white',
                          border: 'none',
                          fontWeight: 'bold'
                        }}>
                          角色 {employeeInfo.roleType}
                        </Tag>
                        {employeeInfo.department && (
                          <Tag style={{
                            fontSize: 16,
                            padding: '6px 16px',
                            background: '#1890ff',
                            color: 'white',
                            border: 'none'
                          }}>
                            {employeeInfo.department}
                          </Tag>
                        )}
                      </Space>
                    </div>
                    <div style={{
                      background: '#FFD700',
                      border: '3px solid #8B0000',
                      borderRadius: 12,
                      padding: 24,
                      marginTop: 20
                    }}>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8B0000', display: 'block' }}>
                        {employeeInfo.prize?.name}
                      </Text>
                      <Text style={{ fontSize: 18, color: '#8B0000', fontWeight: 'bold' }}>
                        價值 NT$ {employeeInfo.prize?.value.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                }
                extra={
                  <Button
                    size="large"
                    onClick={() => {
                      setJoined(false)
                      setEmployeeId('')
                    }}
                    style={{
                      background: '#8B0000',
                      borderColor: '#8B0000',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    返回
                  </Button>
                }
              />
            ) : (
              // 報到成功
              <Result
                status="success"
                icon={<CheckCircleOutlined style={{ color: '#FFD700', fontSize: 80 }} />}
                title={<Title level={2} style={{ color: '#8B0000', margin: 0 }}>報到成功！</Title>}
                subTitle={
                  <div>
                    <div style={{ marginBottom: 20, marginTop: 16 }}>
                      <Title level={3} style={{ margin: 0, color: '#8B0000' }}>{employeeInfo?.name}</Title>
                      <Space style={{ marginTop: 12 }} size="middle">
                        <Tag style={{
                          fontSize: 16,
                          padding: '6px 16px',
                          background: '#8B0000',
                          color: 'white',
                          border: 'none'
                        }}>
                          {employeeInfo?.employeeId}
                        </Tag>
                        <Tag style={{
                          fontSize: 16,
                          padding: '6px 16px',
                          background: employeeInfo?.roleType === 'A' ? '#FFD700' : '#52c41a',
                          color: employeeInfo?.roleType === 'A' ? '#8B0000' : 'white',
                          border: 'none',
                          fontWeight: 'bold'
                        }}>
                          角色 {employeeInfo?.roleType}
                        </Tag>
                        {employeeInfo?.department && (
                          <Tag style={{
                            fontSize: 16,
                            padding: '6px 16px',
                            background: '#1890ff',
                            color: 'white',
                            border: 'none'
                          }}>
                            {employeeInfo.department}
                          </Tag>
                        )}
                      </Space>
                    </div>
                    <div style={{
                      background: '#fff7e6',
                      border: '2px solid #FFD700',
                      borderRadius: 12,
                      padding: 24,
                      marginTop: 20
                    }}>
                      <Paragraph style={{ margin: 0, fontSize: 16, color: '#8B0000', lineHeight: 1.8 }}>
                        ✅ 您已完成報到<br />
                        📺 請關注大螢幕<br />
                        🎉 主持人抽獎時會顯示中獎者
                      </Paragraph>
                    </div>
                    {employeeInfo?.roleType === 'B' && (
                      <div style={{
                        marginTop: 16,
                        padding: 14,
                        background: '#ffe7ba',
                        border: '2px solid #faad14',
                        borderRadius: 8
                      }}>
                        <Text style={{ fontSize: 13, color: '#ad6800', fontWeight: 'bold' }}>
                          💡 您的角色只能抽萬元以下的獎品
                        </Text>
                      </div>
                    )}
                  </div>
                }
                extra={[
                  <Button
                    key="close"
                    size="large"
                    onClick={() => window.close()}
                    style={{
                      background: '#8B0000',
                      borderColor: '#8B0000',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    關閉網頁
                  </Button>,
                  <Button
                    key="back"
                    size="large"
                    onClick={() => {
                      setJoined(false)
                      setEmployeeId('')
                    }}
                  >
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
