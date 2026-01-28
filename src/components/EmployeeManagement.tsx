import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Upload, Card } from 'antd'
import { PlusOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons'
import { employeeApi } from '../services/api'
import type { Employee } from '../types'

function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const data = await employeeApi.getAll()
      setEmployees(data.employees || [])
    } catch (error) {
      message.error('載入員工資料失敗')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await employeeApi.create(values)
      message.success('新增員工成功')
      setModalVisible(false)
      loadEmployees()
    } catch (error: any) {
      message.error(error.response?.data?.error || '新增員工失敗')
      console.error(error)
    }
  }

  const handleBatchUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())

        // 跳過標題行
        const dataLines = lines.slice(1)

        const employees = dataLines.map(line => {
          const [employeeId, name, roleType, department] = line.split(',').map(s => s.trim())
          return { employeeId, name, roleType: roleType as 'A' | 'B', department }
        })

        await employeeApi.batchCreate(employees)
        message.success(`成功匯入 ${employees.length} 位員工`)
        loadEmployees()
      } catch (error: any) {
        message.error(error.response?.data?.error || '匯入失敗')
        console.error(error)
      }
    }
    reader.readAsText(file)
    return false // 阻止自動上傳
  }

  const columns = [
    {
      title: '員工編號',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 120
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '角色類型',
      dataIndex: 'roleType',
      key: 'roleType',
      width: 100,
      render: (roleType: string) => (
        <span style={{
          color: roleType === 'A' ? '#fa8c16' : '#52c41a',
          fontWeight: 'bold'
        }}>
          角色 {roleType}
        </span>
      )
    },
    {
      title: '部門',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: '建立時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-TW')
    }
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增員工
        </Button>
        <Upload
          beforeUpload={handleBatchUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>
            批次匯入 CSV
          </Button>
        </Upload>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadEmployees}
        >
          重新整理
        </Button>
      </Space>

      <div style={{ marginBottom: 16, color: '#666' }}>
        共 {employees.length} 位員工
      </div>

      <Table
        columns={columns}
        dataSource={employees}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 筆`
        }}
      />

      <Modal
        title="新增員工"
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
            name="employeeId"
            label="員工編號"
            rules={[{ required: true, message: '請輸入員工編號' }]}
          >
            <Input placeholder="例如：E001" />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '請輸入姓名' }]}
          >
            <Input placeholder="例如：張三" />
          </Form.Item>

          <Form.Item
            name="roleType"
            label="角色類型"
            rules={[{ required: true, message: '請選擇角色類型' }]}
          >
            <Select placeholder="請選擇">
              <Select.Option value="A">角色 A（可抽所有獎項）</Select.Option>
              <Select.Option value="B">角色 B（僅萬元以下）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="department"
            label="部門"
          >
            <Input placeholder="例如：資訊部（選填）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* CSV 格式說明 */}
      <div style={{ marginTop: 24, padding: 16, background: '#f0f0f0', borderRadius: 8 }}>
        <h4>CSV 檔案格式說明</h4>
        <pre style={{ background: 'white', padding: 12, borderRadius: 4, overflow: 'auto' }}>
{`員工編號,姓名,角色類型,部門
E001,張三,A,資訊部
E002,李四,B,業務部
E003,王五,B,行銷部`}
        </pre>
        <p style={{ margin: '8px 0 0', color: '#666' }}>
          ⚠️ 第一行為標題行，會自動跳過。角色類型只能填 A 或 B。
        </p>
      </div>
    </Card>
  )
}

export default EmployeeManagement
