import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, message, Space, Card, Tag, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import { prizeApi } from '../services/api'
import type { Prize } from '../types'

function PrizeManagement() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPrizes()
  }, [])

  const loadPrizes = async () => {
    setLoading(true)
    try {
      const data = await prizeApi.getAll()
      setPrizes(data.prizes || [])
    } catch (error) {
      message.error('載入獎項資料失敗')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = async (file: File) => {
    try {
      const result = await prizeApi.uploadCSV(file)
      message.success(result.message || `成功匯入 ${result.count} 種獎品`)
      if (result.skipped && result.skipped.length > 0) {
        message.warning(`${result.skipped.length} 筆資料已跳過`)
      }
      loadPrizes()
    } catch (error: any) {
      message.error(error.response?.data?.error || 'CSV 匯入失敗')
      console.error(error)
    }
    return false
  }

  const handleAdd = () => {
    setEditingPrize(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (prize: Prize) => {
    setEditingPrize(prize)
    form.setFieldsValue(prize)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingPrize) {
        await prizeApi.update(editingPrize.id, values)
        message.success('更新獎項成功')
      } else {
        await prizeApi.create(values)
        message.success('新增獎項成功')
      }

      setModalVisible(false)
      loadPrizes()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失敗')
      console.error(error)
    }
  }

  const handleDelete = (prize: Prize) => {
    Modal.confirm({
      title: '確認刪除？',
      content: `確定要刪除獎項「${prize.name}」嗎？`,
      okText: '確認',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await prizeApi.delete(prize.id)
          message.success('刪除成功')
          loadPrizes()
        } catch (error: any) {
          message.error(error.response?.data?.error || '刪除失敗')
          console.error(error)
        }
      }
    })
  }

  const columns = [
    {
      title: '獎品名稱',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '價值',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (value: number) => (
        <span style={{ fontWeight: 'bold' }}>
          NT$ {value.toLocaleString()}
        </span>
      ),
      sorter: (a: Prize, b: Prize) => a.value - b.value
    },
    {
      title: '總數量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100
    },
    {
      title: '剩餘數量',
      dataIndex: 'remaining',
      key: 'remaining',
      width: 100,
      render: (remaining: number, record: Prize) => {
        const percentage = (remaining / record.quantity) * 100
        let color = 'green'
        if (percentage < 30) color = 'red'
        else if (percentage < 60) color = 'orange'

        return <Tag color={color}>{remaining}</Tag>
      }
    },
    {
      title: '角色限制',
      key: 'roleLimit',
      width: 120,
      render: (_: any, record: Prize) => {
        if (record.value > 10000) {
          return <Tag color="gold">僅角色 A</Tag>
        }
        return <Tag color="green">A / B 皆可</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: Prize) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            刪除
          </Button>
        </Space>
      )
    }
  ]

  const totalValue = prizes.reduce((sum, prize) => sum + (prize.value * prize.quantity), 0)
  const remainingValue = prizes.reduce((sum, prize) => sum + (prize.value * prize.remaining), 0)

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增獎項
        </Button>
        <Upload
          beforeUpload={handleCSVUpload}
          showUploadList={false}
          accept=".csv"
        >
          <Button icon={<UploadOutlined />}>
            批次匯入 CSV
          </Button>
        </Upload>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadPrizes}
        >
          重新整理
        </Button>
      </Space>

      <div style={{ marginBottom: 16, display: 'flex', gap: 24 }}>
        <div>
          <span style={{ color: '#666' }}>總獎品數：</span>
          <span style={{ fontWeight: 'bold' }}>
            {prizes.reduce((sum, p) => sum + p.quantity, 0)} 個
          </span>
        </div>
        <div>
          <span style={{ color: '#666' }}>剩餘：</span>
          <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
            {prizes.reduce((sum, p) => sum + p.remaining, 0)} 個
          </span>
        </div>
        <div>
          <span style={{ color: '#666' }}>總價值：</span>
          <span style={{ fontWeight: 'bold' }}>
            NT$ {totalValue.toLocaleString()}
          </span>
        </div>
        <div>
          <span style={{ color: '#666' }}>剩餘價值：</span>
          <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
            NT$ {remainingValue.toLocaleString()}
          </span>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={prizes}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingPrize ? '編輯獎項' : '新增獎項'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="確認"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="獎品名稱"
            rules={[{ required: true, message: '請輸入獎品名稱' }]}
          >
            <Input placeholder="例如：iPhone 15 Pro" />
          </Form.Item>

          <Form.Item
            name="value"
            label="獎品價值（元）"
            rules={[{ required: true, message: '請輸入獎品價值' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="例如：35000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="數量"
            rules={[{ required: true, message: '請輸入數量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="例如：3"
            />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="圖片網址（選填）"
          >
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <div style={{ padding: 12, background: '#f0f0f0', borderRadius: 4, marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              💡 提示：
              <br />
              • 價值 &gt; 10000 元的獎品，只有角色 A 可以抽
              <br />
              • 價值 ≤ 10000 元的獎品，角色 A 和 B 都可以抽
            </p>
          </div>
        </Form>
      </Modal>
    </Card>
  )
}

export default PrizeManagement
