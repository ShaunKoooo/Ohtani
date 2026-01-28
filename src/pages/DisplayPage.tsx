import { useEffect, useState } from 'react'
import { Typography, Tag, Space, Badge } from 'antd'
import { TrophyOutlined, StarOutlined } from '@ant-design/icons'
import { drawApi, lotteryApi } from '../services/api'
import './DisplayPage.css'

const { Title, Text } = Typography

interface Winner {
  id: number
  employee: {
    id: string
    name: string
    roleType: string
    department?: string
  }
  prize: {
    id: number
    name: string
    value: number
  }
  drawnAt: string
}

function DisplayPage() {
  const [latestWinner, setLatestWinner] = useState<Winner | null>(null)
  const [currentPrize, setCurrentPrize] = useState<any>(null)
  const [lastWinnerId, setLastWinnerId] = useState<number | null>(null)

  useEffect(() => {
    // 輪詢當前獎項
    const fetchCurrentPrize = async () => {
      try {
        const response = await lotteryApi.getCurrentPrize()
        setCurrentPrize(response.currentPrize)
      } catch (error) {
        console.error('Failed to fetch current prize:', error)
      }
    }

    fetchCurrentPrize()
    const prizeInterval = setInterval(fetchCurrentPrize, 3000)

    return () => clearInterval(prizeInterval)
  }, [])

  useEffect(() => {
    // 輪詢最新中獎者
    const fetchLatestWinner = async () => {
      try {
        const response = await drawApi.getLatest(1) // 只取最新 1 筆
        const records = response.records || []

        if (records.length > 0) {
          const latest = records[0]

          // 如果是新的中獎者，更新顯示
          if (latest.id !== lastWinnerId) {
            setLatestWinner(latest)
            setLastWinnerId(latest.id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest winner:', error)
      }
    }

    fetchLatestWinner()
    const winnerInterval = setInterval(fetchLatestWinner, 2000)

    return () => clearInterval(winnerInterval)
  }, [lastWinnerId])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 標題 */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Title style={{ color: 'white', fontSize: 80, margin: 0, textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
          🎊 春酒抽獎
        </Title>

        {/* 當前獎項提示 */}
        {currentPrize && (
          <div style={{
            marginTop: 30,
            padding: '20px 40px',
            background: 'rgba(255, 215, 0, 0.3)',
            border: '3px solid #ffd700',
            borderRadius: 16,
            display: 'inline-block',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <Space size="large">
              <StarOutlined style={{ color: '#ffd700', fontSize: 32 }} />
              <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
                本輪抽獎項目：
              </Text>
              <Badge count={currentPrize.remaining} style={{ backgroundColor: '#52c41a', fontSize: 18 }}>
                <Tag color="gold" style={{ fontSize: 24, padding: '10px 24px', margin: 0 }}>
                  {currentPrize.name} (NT$ {currentPrize.value.toLocaleString()})
                </Tag>
              </Badge>
            </Space>
          </div>
        )}
      </div>

      {/* 最新中獎者 */}
      {latestWinner ? (
        <div className="winner-card" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 24,
          padding: 60,
          maxWidth: 900,
          width: '100%',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          textAlign: 'center'
        }}>
          <TrophyOutlined style={{ fontSize: 120, color: '#ffd700', marginBottom: 30 }} />

          <Title level={1} style={{ margin: 0, fontSize: 80, color: '#1890ff' }}>
            {latestWinner.employee.name}
          </Title>

          <div style={{ margin: '30px 0' }}>
            <Space size="large" wrap>
              <Tag color="blue" style={{ fontSize: 28, padding: '10px 24px' }}>
                {latestWinner.employee.id}
              </Tag>
              <Tag
                color={latestWinner.employee.roleType === 'A' ? 'gold' : 'green'}
                style={{ fontSize: 28, padding: '10px 24px' }}
              >
                角色 {latestWinner.employee.roleType}
              </Tag>
              {latestWinner.employee.department && (
                <Tag style={{ fontSize: 28, padding: '10px 24px' }}>
                  {latestWinner.employee.department}
                </Tag>
              )}
            </Space>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4d4f 100%)',
            borderRadius: 16,
            padding: 40,
            marginTop: 40,
            boxShadow: '0 8px 24px rgba(255, 77, 79, 0.3)'
          }}>
            <Text style={{ color: 'white', fontSize: 32, display: 'block', marginBottom: 16, opacity: 0.9 }}>
              獲得
            </Text>
            <Title level={2} style={{ color: 'white', margin: 0, fontSize: 64 }}>
              {latestWinner.prize.name}
            </Title>
            <Text style={{ color: 'white', fontSize: 40, display: 'block', marginTop: 20, fontWeight: 'bold' }}>
              NT$ {latestWinner.prize.value.toLocaleString()}
            </Text>
          </div>

          <div style={{ marginTop: 30, color: '#999', fontSize: 16 }}>
            {new Date(latestWinner.drawnAt).toLocaleString('zh-TW')}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 200,
            height: 200,
            margin: '0 auto 40px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px dashed rgba(255, 255, 255, 0.3)'
          }}>
            <TrophyOutlined style={{ fontSize: 100, color: 'rgba(255, 255, 255, 0.4)' }} />
          </div>
          <Title level={2} style={{ color: 'white', opacity: 0.8 }}>
            等待主持人開始抽獎...
          </Title>
        </div>
      )}
    </div>
  )
}

export default DisplayPage
