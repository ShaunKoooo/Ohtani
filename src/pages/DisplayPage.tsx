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
      background: '#8B0000',
      padding: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 標題 */}
      <div style={{ textAlign: 'center', marginBottom: 60, position: 'relative', zIndex: 1 }}>
        <Title style={{
          color: '#FFD700',
          fontSize: 80,
          margin: 0,
          textShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
          fontWeight: 900,
          letterSpacing: 6
        }}>
          🎊 春酒抽獎 🎊
        </Title>

        {/* 當前獎項提示 */}
        {currentPrize && (
          <div style={{
            marginTop: 30,
            padding: '20px 40px',
            background: 'white',
            border: '3px solid #FFD700',
            borderRadius: 16,
            display: 'inline-block',
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)'
          }}>
            <Space size="large">
              <StarOutlined style={{ color: '#FFD700', fontSize: 32 }} />
              <Text style={{ color: '#8B0000', fontSize: 28, fontWeight: 'bold' }}>
                本輪抽獎項目：
              </Text>
              <Badge count={currentPrize.remaining} style={{ backgroundColor: '#52c41a', fontSize: 18 }}>
                <Tag style={{
                  fontSize: 24,
                  padding: '10px 24px',
                  margin: 0,
                  background: '#FFD700',
                  border: 'none',
                  color: '#8B0000',
                  fontWeight: 'bold'
                }}>
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
          background: 'white',
          borderRadius: 32,
          padding: 80,
          maxWidth: 1000,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          border: '8px solid #FFD700'
        }}>
          <TrophyOutlined style={{
            fontSize: 140,
            color: '#FFD700',
            marginBottom: 30
          }} />

          <Title level={1} style={{
            margin: 0,
            fontSize: 100,
            color: '#8B0000',
            fontWeight: 900,
            letterSpacing: 2
          }}>
            {latestWinner.employee.name}
          </Title>

          <div style={{ margin: '30px 0' }}>
            <Space size="large" wrap>
              <Tag style={{
                fontSize: 32,
                padding: '12px 28px',
                borderRadius: 8,
                background: '#8B0000',
                border: 'none',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {latestWinner.employee.id}
              </Tag>
              {/* <Tag style={{
                fontSize: 32,
                padding: '12px 28px',
                borderRadius: 8,
                background: latestWinner.employee.roleType === 'A' ? '#FFD700' : '#52c41a',
                border: 'none',
                color: latestWinner.employee.roleType === 'A' ? '#8B0000' : 'white',
                fontWeight: 'bold'
              }}>
                角色 {latestWinner.employee.roleType}
              </Tag> */}
              {latestWinner.employee.department && (
                <Tag style={{
                  fontSize: 32,
                  padding: '12px 28px',
                  borderRadius: 8,
                  background: '#1890ff',
                  border: 'none',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {latestWinner.employee.department}
                </Tag>
              )}
            </Space>
          </div>

          <div style={{
            background: '#FFD700',
            borderRadius: 20,
            padding: 50,
            marginTop: 50,
            boxShadow: '0 12px 40px rgba(255, 215, 0, 0.4)'
          }}>
            <Text style={{ color: '#8B0000', fontSize: 36, display: 'block', marginBottom: 20, fontWeight: 'bold' }}>
              🎁 獲得
            </Text>
            <Title level={2} style={{ color: '#8B0000', margin: 0, fontSize: 72, fontWeight: 900 }}>
              {latestWinner.prize.name}
            </Title>
            <Text style={{ color: '#8B0000', fontSize: 48, display: 'block', marginTop: 24, fontWeight: 'bold' }}>
              NT$ {latestWinner.prize.value.toLocaleString()}
            </Text>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 240,
            height: 240,
            margin: '0 auto 40px',
            background: 'rgba(255, 215, 0, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '6px dashed #FFD700'
          }}>
            <TrophyOutlined style={{
              fontSize: 120,
              color: '#FFD700'
            }} />
          </div>
          <Title level={2} style={{
            color: '#FFD700',
            fontSize: 48
          }}>
            等待主持人開始抽獎...
          </Title>
        </div>
      )}
    </div>
  )
}

export default DisplayPage
