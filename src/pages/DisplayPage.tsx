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
  const [latestWinners, setLatestWinners] = useState<Winner[]>([])
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
    // 輪詢最新中獎者（批次抽獎時顯示多筆）
    const fetchLatestWinner = async () => {
      try {
        const response = await drawApi.getLatest(10) // 取最新 10 筆，以支援批次抽獎
        const records = response.records || []

        if (records.length > 0) {
          const latest = records[0]

          // 如果是新的中獎者，更新顯示
          if (latest.id !== lastWinnerId) {
            // 找出所有同一次抽獎的中獎者（時間差在2秒內視為同一批次）
            const latestTime = new Date(latest.drawnAt).getTime()
            const batchWinners = records.filter((record: Winner) => {
              const recordTime = new Date(record.drawnAt).getTime()
              return Math.abs(latestTime - recordTime) < 2000 // 2秒內視為同批次
            })

            setLatestWinners(batchWinners)
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
      {latestWinners.length > 0 ? (
        <div style={{
          width: '100%',
          maxWidth: latestWinners.length === 1 ? 1000 : 1400,
          position: 'relative',
          zIndex: 1
        }}>
          {/* 批次抽獎標題 */}
          {latestWinners.length > 1 && (
            <Title level={2} style={{
              textAlign: 'center',
              color: '#FFD700',
              fontSize: 48,
              marginBottom: 40,
              textShadow: '0 2px 10px rgba(255, 215, 0, 0.5)'
            }}>
              🎉 本輪共抽出 {latestWinners.length} 位得獎者 🎉
            </Title>
          )}

          {/* 網格佈局顯示所有中獎者 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: latestWinners.length === 1 ? '1fr' : latestWinners.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 30,
            width: '100%'
          }}>
            {latestWinners.map((winner) => (
              <div key={winner.id} className="winner-card" style={{
                background: 'white',
                borderRadius: latestWinners.length === 1 ? 32 : 24,
                padding: latestWinners.length === 1 ? 80 : 40,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                textAlign: 'center',
                border: '6px solid #FFD700'
              }}>
                <TrophyOutlined style={{
                  fontSize: latestWinners.length === 1 ? 140 : 80,
                  color: '#FFD700',
                  marginBottom: latestWinners.length === 1 ? 30 : 20
                }} />

                <Title level={1} style={{
                  margin: 0,
                  fontSize: latestWinners.length === 1 ? 100 : latestWinners.length <= 2 ? 60 : 48,
                  color: '#8B0000',
                  fontWeight: 900,
                  letterSpacing: 2
                }}>
                  {winner.employee.name}
                </Title>

                <div style={{ margin: '20px 0' }}>
                  <Space size="middle" wrap>
                    <Tag style={{
                      fontSize: latestWinners.length === 1 ? 32 : 24,
                      padding: latestWinners.length === 1 ? '12px 28px' : '8px 16px',
                      borderRadius: 8,
                      background: '#8B0000',
                      border: 'none',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {winner.employee.id}
                    </Tag>
                    {winner.employee.department && (
                      <Tag style={{
                        fontSize: latestWinners.length === 1 ? 32 : 24,
                        padding: latestWinners.length === 1 ? '12px 28px' : '8px 16px',
                        borderRadius: 8,
                        background: '#1890ff',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {winner.employee.department}
                      </Tag>
                    )}
                  </Space>
                </div>

                <div style={{
                  background: '#FFD700',
                  borderRadius: 16,
                  padding: latestWinners.length === 1 ? 50 : 30,
                  marginTop: latestWinners.length === 1 ? 50 : 30,
                  boxShadow: '0 12px 40px rgba(255, 215, 0, 0.4)'
                }}>
                  <Text style={{
                    color: '#8B0000',
                    fontSize: latestWinners.length === 1 ? 36 : 28,
                    display: 'block',
                    marginBottom: 15,
                    fontWeight: 'bold'
                  }}>
                    🎁 獲得
                  </Text>
                  <Title level={2} style={{
                    color: '#8B0000',
                    margin: 0,
                    fontSize: latestWinners.length === 1 ? 72 : latestWinners.length <= 2 ? 48 : 36,
                    fontWeight: 900
                  }}>
                    {winner.prize.name}
                  </Title>
                  <Text style={{
                    color: '#8B0000',
                    fontSize: latestWinners.length === 1 ? 48 : latestWinners.length <= 2 ? 36 : 28,
                    display: 'block',
                    marginTop: 15,
                    fontWeight: 'bold'
                  }}>
                    NT$ {winner.prize.value.toLocaleString()}
                  </Text>
                </div>
              </div>
            ))}
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
