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
      width: '100vw',
      height: '100vh',
      background: '#8B0000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 16:9 固定容器 */}
      <div style={{
        width: '100vw',
        height: '56.25vw', // 16:9 ratio
        maxHeight: '100vh',
        maxWidth: '177.78vh', // 16:9 ratio
        background: '#8B0000',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
      {/* 垂直跑馬燈：右側單列顯示中獎者 */}
      {latestWinners.length > 0 && (
        <div className="vertical-marquee-wrapper">
          <div className="vertical-marquee-content">
            {/* 重複兩次，第二輪會在第一輪快結束時從底部進入 */}
            {[...latestWinners, ...latestWinners].map((winner, index) => (
              <div key={`marquee-${index}`}>
                <div
                  style={{
                    background: 'white',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '3px solid #FFD700',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    pointerEvents: 'auto'
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#8B0000',
                    display: 'block'
                  }}>
                    {winner.employee.id}
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#8B0000',
                    display: 'block',
                    marginTop: 4
                  }}>
                    {winner.employee.name}
                  </Text>
                </div>
                {/* 在第一輪結束後加入小間隔 */}
                {index === latestWinners.length - 1 && (
                  <div style={{ height: '80px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 當前獎項提示 */}
      {currentPrize && (
        <div style={{
          textAlign: 'center',
          padding: '12px 0',
          background: '#8B0000',
          borderBottom: '3px solid #FFD700',
          flexShrink: 0
        }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 24px',
            background: 'white',
            border: '3px solid #FFD700',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4)'
          }}>
            <Space size="middle">
              <StarOutlined style={{ color: '#FFD700', fontSize: 20 }} />
              <Text style={{ color: '#8B0000', fontSize: 18, fontWeight: 'bold' }}>
                本輪抽獎項目：
              </Text>
              <Badge count={currentPrize.remaining} style={{ backgroundColor: '#52c41a', fontSize: 12 }}>
                <Tag style={{
                  fontSize: 16,
                  padding: '4px 12px',
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
        </div>
      )}

      {/* 主要內容區 */}
      <div style={{
        flex: 1,
        padding: '20px 30px',
        paddingRight: latestWinners.length > 0 ? '220px' : '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: latestWinners.length > 0 ? 'flex-start' : 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 最新中獎者 */}
        {latestWinners.length > 0 ? (
          <div style={{
            width: '100%',
            maxWidth: latestWinners.length === 1 ? 1000 : latestWinners.length <= 3 ? 1400 : '95%',
            position: 'relative',
            zIndex: 1
          }}>
            {/* 批次抽獎標題 */}
            {latestWinners.length > 1 && (
              <Title level={2} style={{
                textAlign: 'center',
                color: '#FFD700',
                fontSize: latestWinners.length <= 3 ? 36 : 30,
                marginBottom: 16,
                marginTop: 0,
                textShadow: '0 2px 10px rgba(255, 215, 0, 0.5)'
              }}>
                🎉 本輪共抽出 {latestWinners.length} 位得獎者 🎉
              </Title>
            )}

            {/* 根據人數選擇不同的顯示模式 */}
            {latestWinners.length <= 3 ? (
              /* 1-3 人：網格佈局（卡片模式） */
              <div style={{
                display: 'grid',
                gridTemplateColumns: latestWinners.length === 1 ? '1fr' : latestWinners.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: 20,
                width: '100%'
              }}>
                {latestWinners.map((winner) => (
                  <div key={winner.id} className="winner-card" style={{
                    background: 'white',
                    borderRadius: latestWinners.length === 1 ? 24 : 16,
                    padding: latestWinners.length === 1 ? 50 : 30,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    textAlign: 'center',
                    border: '4px solid #FFD700'
                  }}>
                    <TrophyOutlined style={{
                      fontSize: latestWinners.length === 1 ? 100 : 60,
                      color: '#FFD700',
                      marginBottom: latestWinners.length === 1 ? 20 : 15
                    }} />

                    <Title level={1} style={{
                      margin: 0,
                      fontSize: latestWinners.length === 1 ? 72 : latestWinners.length <= 2 ? 48 : 36,
                      color: '#8B0000',
                      fontWeight: 900,
                      letterSpacing: 2
                    }}>
                      {winner.employee.name}
                    </Title>

                    <div style={{ margin: '15px 0' }}>
                      <Space size="middle" wrap>
                        <Tag style={{
                          fontSize: latestWinners.length === 1 ? 24 : 18,
                          padding: latestWinners.length === 1 ? '8px 20px' : '6px 12px',
                          borderRadius: 6,
                          background: '#8B0000',
                          border: 'none',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {winner.employee.id}
                        </Tag>
                        {winner.employee.department && (
                          <Tag style={{
                            fontSize: latestWinners.length === 1 ? 24 : 18,
                            padding: latestWinners.length === 1 ? '8px 20px' : '6px 12px',
                            borderRadius: 6,
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
                      borderRadius: 12,
                      padding: latestWinners.length === 1 ? 30 : 20,
                      marginTop: latestWinners.length === 1 ? 30 : 20,
                      boxShadow: '0 12px 40px rgba(255, 215, 0, 0.4)'
                    }}>
                      <Text style={{
                        color: '#8B0000',
                        fontSize: latestWinners.length === 1 ? 28 : 22,
                        display: 'block',
                        marginBottom: 10,
                        fontWeight: 'bold'
                      }}>
                        🎁 獲得
                      </Text>
                      <Title level={2} style={{
                        color: '#8B0000',
                        margin: 0,
                        fontSize: latestWinners.length === 1 ? 56 : latestWinners.length <= 2 ? 36 : 28,
                        fontWeight: 900
                      }}>
                        {winner.prize.name}
                      </Title>
                      <Text style={{
                        color: '#8B0000',
                        fontSize: latestWinners.length === 1 ? 36 : latestWinners.length <= 2 ? 28 : 22,
                        display: 'block',
                        marginTop: 10,
                        fontWeight: 'bold'
                      }}>
                        NT$ {winner.prize.value.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 4 人以上：緊湊列表模式（適合 30+ 人） */
              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: '20px 24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                border: '6px solid #FFD700'
              }}>
                {/* 中獎者列表（緊湊模式） */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                  width: '100%'
                }}>
                  {latestWinners.map((winner, index) => (
                    <div
                      key={winner.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        background: index % 2 === 0 ? '#f0f0f0' : '#fafafa',
                        borderRadius: 8,
                        border: '2px solid #e0e0e0'
                      }}
                    >
                      {/* 序號 */}
                      <div style={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#FFD700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Text style={{ color: '#8B0000', fontSize: 14, fontWeight: 'bold' }}>
                          {index + 1}
                        </Text>
                      </div>

                      {/* 員工編號 + 姓名（帶背景） */}
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: 'linear-gradient(135deg, #8B0000 0%, #a52a2a 100%)',
                        padding: '8px 14px',
                        borderRadius: 6,
                        minWidth: 0
                      }}>
                        <Text style={{
                          fontSize: 15,
                          color: 'white',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}>
                          {winner.employee.id}
                        </Text>
                        <div style={{
                          width: '2px',
                          height: '20px',
                          background: 'rgba(255,255,255,0.4)',
                          flexShrink: 0
                        }} />
                        <Text style={{
                          fontSize: 16,
                          color: 'white',
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {winner.employee.name}
                        </Text>
                      </div>

                      {/* 獎項（緊湊版） */}
                      <div style={{
                        background: '#FFD700',
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '2px solid #8B0000',
                        minWidth: 140,
                        flexShrink: 0
                      }}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: '#8B0000',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          🎁 {winner.prize.name}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 180,
              height: 180,
              margin: '0 auto 30px',
              background: 'rgba(255, 215, 0, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '5px dashed #FFD700'
            }}>
              <TrophyOutlined style={{
                fontSize: 90,
                color: '#FFD700'
              }} />
            </div>
            <Title level={2} style={{
              color: '#FFD700',
              fontSize: 36
            }}>
              等待主持人開始抽獎...
            </Title>
          </div>
        )}
      </div>
      {/* 16:9 固定容器結束 */}
      </div>
    </div>
  )
}

export default DisplayPage
