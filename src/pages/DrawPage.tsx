import { useEffect, useState } from 'react'
import { Button, Card, Statistic, Row, Col, message, Modal, Typography, Space, InputNumber, Spin, Tag, Select, Alert } from 'antd'
import { GiftOutlined, TrophyOutlined, UserOutlined, HomeOutlined, StarOutlined, ClearOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { statsApi, drawApi, prizeApi, lotteryApi, displayApi } from '../services/api'

const { Title, Text } = Typography

function DrawPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [batchCount, setBatchCount] = useState(1)
  const [prizes, setPrizes] = useState<any[]>([])
  const [currentPrize, setCurrentPrize] = useState<any>(null)
  const [selectedPrizeId, setSelectedPrizeId] = useState<number | null>(null)

  useEffect(() => {
    loadStats()
    loadPrizes()
    loadCurrentPrize()
  }, [])

  const loadStats = async () => {
    try {
      const response = await statsApi.get()
      setStats(response.stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadPrizes = async () => {
    try {
      const response = await prizeApi.getAll()
      setPrizes(response.prizes || [])
    } catch (error) {
      console.error('Failed to load prizes:', error)
    }
  }

  const loadCurrentPrize = async () => {
    try {
      const response = await lotteryApi.getCurrentPrize()
      if (response.currentPrize) {
        setCurrentPrize(response.currentPrize)
        setSelectedPrizeId(response.currentPrize.id)
      }
    } catch (error) {
      console.error('Failed to load current prize:', error)
    }
  }

  const handleSetPrize = async () => {
    if (!selectedPrizeId) {
      message.warning('請先選擇獎項')
      return
    }

    try {
      const response = await lotteryApi.setCurrentPrize(selectedPrizeId)
      setCurrentPrize(response.currentPrize)
      message.success(response.message)
    } catch (error: any) {
      message.error(error.response?.data?.error || '設定失敗')
    }
  }

  const handleClearPrize = async () => {
    try {
      await lotteryApi.clearCurrentPrize()
      setCurrentPrize(null)
      setSelectedPrizeId(null)
      message.success('已清除當前獎項')
    } catch (error: any) {
      message.error('清除失敗')
    }
  }

  const handleClearDisplay = async () => {
    try {
      await displayApi.clear()
      message.success('已清除展示畫面')
    } catch {
      message.error('清除失敗')
    }
  }

  const handleDraw = async () => {
    if (stats?.employees.undrawn === 0) {
      message.warning('所有員工都已抽過獎了')
      return
    }

    if (stats?.prizes.remaining === 0) {
      Modal.warning({
        title: '🎤 請大喊老闆加碼！',
        content: '所有獎品都抽完了'
      })
      return
    }

    setLoading(true)

    try {
      displayApi.startCountdown()
      const response = await drawApi.batch(1)

      if (response.success && response.results.length > 0) {
        const result = response.results[0]

        if (result.success) {
          // 中獎
          Modal.success({
            title: '🎉 恭喜中獎',
            width: 600,
            content: (
              <div style={{ padding: '20px 0' }}>
                <div style={{ marginBottom: 20 }}>
                  <Title level={3} style={{ marginBottom: 8 }}>
                    {result.employee.name}
                  </Title>
                  <Space wrap>
                    <Tag color="blue">{result.employee.id}</Tag>
                    <Tag color={result.employee.roleType === 'A' ? 'gold' : 'green'}>
                      角色 {result.employee.roleType}
                    </Tag>
                    {result.employee.department && (
                      <Tag>{result.employee.department}</Tag>
                    )}
                  </Space>
                </div>
                <div style={{
                  background: '#fff1f0',
                  border: '2px solid #ff4d4f',
                  borderRadius: 8,
                  padding: 20,
                  textAlign: 'center'
                }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {result.prize.name}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 18, color: '#666' }}>
                      價值 NT$ {result.prize.value.toLocaleString()}
                    </Text>
                  </div>
                </div>
              </div>
            ),
            onOk: () => {
              loadStats()
            }
          })
        } else {
          // 老闆加碼彩蛋
          Modal.warning({
            title: '🎤 請大喊老闆加碼！',
            width: 500,
            content: (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text style={{ fontSize: 18 }}>
                  員工 <strong>{result.employee?.name}</strong> 沒有適合的獎品可以抽
                </Text>
                <div style={{ marginTop: 20, padding: 16, background: '#fff7e6', borderRadius: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {result.message}
                  </Text>
                </div>
              </div>
            ),
            onOk: () => {
              loadStats()
            }
          })
        }
      }

    } catch (error: any) {
      console.error('Draw error:', error)
      message.error(error.response?.data?.error || '抽獎失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchDraw = async () => {
    if (batchCount <= 0 || batchCount > 100) {
      message.warning('批次數量必須介於 1-100 之間')
      return
    }

    if (stats?.employees.undrawn === 0) {
      message.warning('所有員工都已抽過獎了')
      return
    }

    Modal.confirm({
      title: `確認批次抽獎？`,
      content: `將一次抽出 ${batchCount} 位中獎者`,
      okText: '確認',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true)

        try {
          displayApi.startCountdown()
          const response = await drawApi.batch(batchCount)

          if (response.success) {
            // 顯示批次結果
            const successResults = response.results.filter((r: any) => r.success)
            const failedResults = response.results.filter((r: any) => !r.success)

            Modal.info({
              title: '批次抽獎完成',
              width: 800,
              content: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Text>成功：{response.summary.succeeded} 人，失敗：{response.summary.failed} 人</Text>
                  </div>

                  {successResults.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Title level={5}>中獎名單：</Title>
                      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {successResults.map((result: any, index: number) => (
                          <div key={index} style={{ padding: 8, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }}>
                            <Text strong>{result.employee.name}</Text> - {result.prize.name} (NT$ {result.prize.value.toLocaleString()})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {failedResults.length > 0 && (
                    <div>
                      <Title level={5}>未中獎（老闆加碼）：</Title>
                      {failedResults.map((result: any, index: number) => (
                        <div key={index} style={{ padding: 8, background: '#fff7e6', borderRadius: 4, marginBottom: 8 }}>
                          <Text>{result.employee?.name} - {result.message}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
              onOk: () => {
                loadStats()
              }
            })
          }

        } catch (error: any) {
          console.error('Batch draw error:', error)
          message.error(error.response?.data?.error || '批次抽獎失敗')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: 24
    }}>
      {/* 頂部導航 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <GiftOutlined /> 主持人抽獎
        </Title>
        <Space>
          <Button icon={<ClearOutlined />} onClick={handleClearDisplay}>
            清除展示畫面
          </Button>
          <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
            返回首頁
          </Button>
        </Space>
      </div>

      {/* 當前獎項提示 */}
      {currentPrize && (
        <Alert
          message={
            <Space>
              <StarOutlined />
              <Text strong>當前抽獎項目：</Text>
              <Tag color="red" style={{ fontSize: 16, padding: '4px 12px' }}>
                {currentPrize.name} (NT$ {currentPrize.value.toLocaleString()})
              </Tag>
              <Text type="secondary">剩餘 {currentPrize.remaining} 個</Text>
            </Space>
          }
          type="info"
          closable
          onClose={handleClearPrize}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 統計資訊 */}
      {stats ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="總員工數"
                value={stats.employees.total}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="已抽獎"
                value={stats.employees.drawn}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="未抽獎"
                value={stats.employees.undrawn}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="剩餘獎品"
                value={stats.prizes.remaining}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
        </Row>
      ) : (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      )}

      {/* 選擇獎項區 */}
      <Card title="選擇要抽的獎項" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text style={{ display: 'block', marginBottom: 8 }}>選擇獎項：</Text>
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="選擇獎項（不選則隨機抽）"
              value={selectedPrizeId}
              onChange={setSelectedPrizeId}
              allowClear
            >
              {prizes.filter(p => p.remaining > 0).map(prize => (
                <Select.Option key={prize.id} value={prize.id}>
                  {prize.name} - NT$ {prize.value.toLocaleString()} (剩餘 {prize.remaining} 個)
                </Select.Option>
              ))}
            </Select>
          </div>
          <Space>
            <Button
              type="primary"
              onClick={handleSetPrize}
              disabled={!selectedPrizeId}
            >
              設定為當前獎項
            </Button>
            {currentPrize && (
              <Button onClick={handleClearPrize}>
                清除當前獎項
              </Button>
            )}
          </Space>
          <div style={{ padding: 12, background: '#f0f0f0', borderRadius: 4 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              💡 設定當前獎項後，抽獎時會優先使用此獎項。適用於：「現在要抽 3 個 iPhone」
            </Text>
          </div>
        </Space>
      </Card>

      {/* 抽獎控制區 */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card
            title="單次抽獎"
            style={{ marginBottom: 16 }}
          >
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Button
                type="primary"
                size="large"
                icon={<GiftOutlined />}
                loading={loading}
                onClick={handleDraw}
                disabled={stats?.employees.undrawn === 0}
                style={{
                  height: 120,
                  fontSize: 32,
                  width: '100%',
                  maxWidth: 400
                }}
              >
                {loading ? '抽獎中...' : '🎉 開始抽獎'}
              </Button>
              <div style={{ marginTop: 20, color: '#666' }}>
                <Text>隨機抽出一位還沒中獎的員工</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="批次抽獎"
            style={{ marginBottom: 16 }}
          >
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: 20 }}>
                <Text style={{ display: 'block', marginBottom: 8 }}>一次抽幾個人：</Text>
                <InputNumber
                  min={1}
                  max={100}
                  value={batchCount}
                  onChange={(value) => setBatchCount(value || 1)}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                onClick={handleBatchDraw}
                disabled={stats?.employees.undrawn === 0}
                icon={<GiftOutlined />}
              >
                {loading ? '批次抽獎中...' : `開始批次抽獎（${batchCount} 人）`}
              </Button>

              <div style={{ marginTop: 16, padding: 12, background: '#f0f0f0', borderRadius: 4 }}>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  💡 適用情境：老闆說「10 萬元抽 5 個人」時使用
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 統計詳情 */}
      {stats && (
        <Card title="統計詳情" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="角色 A 人數"
                value={stats.employees.roleA}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="角色 B 人數"
                value={stats.employees.roleB}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="已分配獎品總價值"
                value={stats.prizes.distributedValue}
                prefix="NT$"
                formatter={(value: any) => value.toLocaleString()}
              />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  )
}

export default DrawPage
