import { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Button, Modal, message, Table, Tag } from 'antd'
import { ReloadOutlined, DeleteOutlined, DownloadOutlined, UserOutlined, GiftOutlined, TrophyOutlined, DollarOutlined } from '@ant-design/icons'
import { statsApi, systemApi, drawApi } from '../services/api'

function Statistics() {
  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsResponse, recordsResponse] = await Promise.all([
        statsApi.get(),
        drawApi.getRecords()
      ])
      setStats(statsResponse.stats)
      setRecords(recordsResponse.records)
    } catch (error) {
      message.error('載入資料失敗')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    Modal.confirm({
      title: '⚠️ 確認重置？',
      content: (
        <div>
          <p>這將會：</p>
          <ul>
            <li>刪除所有抽獎記錄</li>
            <li>重置所有獎品的剩餘數量</li>
          </ul>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            此操作無法復原！
          </p>
        </div>
      ),
      okText: '確認重置',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await systemApi.reset()
          message.success('系統已重置')
          loadData()
        } catch (error: any) {
          message.error(error.response?.data?.error || '重置失敗')
          console.error(error)
        }
      }
    })
  }

  const handleExport = () => {
    if (records.length === 0) {
      message.warning('目前沒有中獎記錄')
      return
    }

    // 轉換為 CSV
    const csv = [
      ['員工編號', '姓名', '角色類型', '部門', '獎品名稱', '獎品價值', '抽獎時間'].join(','),
      ...records.map(record =>
        [
          record.employee.id,
          record.employee.name,
          record.employee.roleType,
          record.employee.department || '',
          record.prize.name,
          record.prize.value,
          new Date(record.drawnAt).toLocaleString('zh-TW')
        ].join(',')
      )
    ].join('\n')

    // 下載
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `中獎名單_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    message.success('匯出成功')
  }

  const columns = [
    {
      title: '員工',
      key: 'employee',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.employee.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.employee.id}
            {record.employee.department && ` · ${record.employee.department}`}
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: ['employee', 'roleType'],
      key: 'roleType',
      width: 80,
      render: (roleType: string) => (
        <Tag color={roleType === 'A' ? 'gold' : 'green'}>
          角色 {roleType}
        </Tag>
      )
    },
    {
      title: '獎品',
      key: 'prize',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.prize.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            NT$ {record.prize.value.toLocaleString()}
          </div>
        </div>
      )
    },
    {
      title: '抽獎時間',
      dataIndex: 'drawnAt',
      key: 'drawnAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-TW')
    }
  ]

  if (!stats) {
    return <Card loading={loading}>載入中...</Card>
  }

  return (
    <div>
      {/* 統計卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="總員工數"
              value={stats.employees.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已抽獎人數"
              value={stats.employees.drawn}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${stats.employees.total}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="剩餘獎品"
              value={stats.prizes.remaining}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix={`/ ${stats.prizes.total}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已分配價值"
              value={stats.prizes.distributedValue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#eb2f96' }}
              formatter={(value) => `NT$ ${value.toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      {/* 詳細統計 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="員工角色分布">
            <Row>
              <Col span={12}>
                <Statistic
                  title="角色 A"
                  value={stats.employees.roleA}
                  suffix={`人 (${((stats.employees.roleA / stats.employees.total) * 100).toFixed(1)}%)`}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="角色 B"
                  value={stats.employees.roleB}
                  suffix={`人 (${((stats.employees.roleB / stats.employees.total) * 100).toFixed(1)}%)`}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="抽獎統計">
            <Row>
              <Col span={8}>
                <Statistic
                  title="平均價值"
                  value={stats.draws.avgValue}
                  prefix="NT$"
                  formatter={(value) => value.toLocaleString()}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="最高價值"
                  value={stats.draws.maxValue}
                  prefix="NT$"
                  formatter={(value) => value.toLocaleString()}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="最低價值"
                  value={stats.draws.minValue}
                  prefix="NT$"
                  formatter={(value) => value.toLocaleString()}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 中獎記錄 */}
      <Card
        title={`中獎記錄（共 ${records.length} 筆）`}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              匯出 CSV
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
            >
              重新整理
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleReset}
            >
              重置系統
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 筆記錄`
          }}
        />
      </Card>
    </div>
  )
}

export default Statistics
