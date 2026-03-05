import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Upload, Card, DatePicker } from 'antd'
import { PlusOutlined, UploadOutlined, ReloadOutlined, WarningOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { employeeApi, systemApi } from '../services/api'
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
      // 轉換日期格式
      if (values.hireDate) {
        values.hireDate = values.hireDate.format('YYYY/MM/DD')
      }
      await employeeApi.create(values)
      message.success('新增員工成功')
      setModalVisible(false)
      loadEmployees()
    } catch (error: any) {
      message.error(error.response?.data?.error || '新增員工失敗')
      console.error(error)
    }
  }

  const handleBatchUpload = async (file: File) => {
    try {
      const result = await employeeApi.uploadCSV(file)

      // 顯示詳細的匯入結果
      const { count, stats, duplicates, skipped } = result

      let messageContent = `成功匯入 ${count} 位員工\n`
      if (stats) {
        messageContent += `角色 A: ${stats.A} 人, 角色 B: ${stats.B} 人, 角色 C: ${stats.C} 人`
      }

      message.success(messageContent)

      // 如果有重複或跳過的記錄，顯示警告
      if (duplicates && duplicates.length > 0) {
        message.warning(`${duplicates.length} 位員工已存在，已跳過`)
      }
      if (skipped && skipped.length > 0) {
        message.warning(`${skipped.length} 筆記錄被跳過（不克參加或資料不完整）`)
      }

      loadEmployees()
    } catch (error: any) {
      message.error(error.response?.data?.error || '匯入失敗')
      console.error(error)
    }
    return false // 阻止自動上傳
  }

  const handleCheckinAll = () => {
    const uncheckedCount = employees.filter(e => !e.hasCheckedIn).length
    if (uncheckedCount === 0) {
      message.info('所有員工皆已報到')
      return
    }
    Modal.confirm({
      title: '一鍵全員報到',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: `確定要將 ${uncheckedCount} 位尚未報到的員工全部設為已報到嗎？`,
      okText: '確認報到',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await employeeApi.checkinAll()
          message.success(result.message || `一鍵報到完成，共報到 ${result.checkedInCount} 位員工`)
          loadEmployees()
        } catch (error: any) {
          message.error(error.response?.data?.error || '一鍵報到失敗')
          console.error(error)
        }
      }
    })
  }

  const handleReset = () => {
    Modal.confirm({
      title: '部分重置系統',
      icon: <WarningOutlined style={{ color: '#faad14' }} />,
      content: (
        <div>
          <p>這將會重置以下資料：</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>所有抽獎記錄</li>
            <li>獎品剩餘數量（重置回原始數量）</li>
            <li>員工報到狀態</li>
            <li>當前抽獎狀態</li>
          </ul>
          <p style={{ marginTop: 12, color: '#52c41a', fontWeight: 'bold' }}>✓ 保留員工資料</p>
          <p style={{ margin: 0, color: '#52c41a', fontWeight: 'bold' }}>✓ 保留獎項資料</p>
        </div>
      ),
      okText: '確認重置',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await systemApi.reset()
          message.success(`重置成功：刪除了 ${result.details.deletedRecords} 筆抽獎記錄`)
          loadEmployees()
        } catch (error: any) {
          message.error(error.response?.data?.error || '重置失敗')
          console.error(error)
        }
      }
    })
  }

  const handleResetAll = () => {
    Modal.confirm({
      title: '完全重置系統',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 16 }}>⚠️ 這是不可逆的操作！</p>
          <p>這將會刪除以下所有資料：</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>所有員工資料</li>
            <li>所有獎項資料</li>
            <li>所有抽獎記錄</li>
            <li>當前抽獎狀態</li>
          </ul>
          <p style={{ marginTop: 12, color: '#ff4d4f', fontWeight: 'bold' }}>系統將回到初始狀態，所有資料都會遺失！</p>
        </div>
      ),
      okText: '確認完全重置',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await systemApi.resetAll()
          const details = result.details
          message.success(
            `完全重置成功：刪除了 ${details.deletedEmployees} 位員工、${details.deletedPrizes} 個獎項、${details.deletedRecords} 筆抽獎記錄`
          )
          loadEmployees()
        } catch (error: any) {
          message.error(error.response?.data?.error || '重置失敗')
          console.error(error)
        }
      }
    })
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
      render: (roleType: string) => {
        const config = {
          A: { color: '#fa8c16', label: '角色 A' },
          B: { color: '#52c41a', label: '角色 B' },
          C: { color: '#d9d9d9', label: '角色 C' }
        }
        const { color, label } = config[roleType as keyof typeof config] || { color: '#666', label: roleType }
        return (
          <span style={{ color, fontWeight: 'bold' }}>
            {label}
          </span>
        )
      }
    },
    {
      title: '部門',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: '到職日期',
      dataIndex: 'hireDate',
      key: 'hireDate',
      width: 120,
      render: (date: string) => date || '-'
    },
    {
      title: '桌號',
      dataIndex: 'tableNumber',
      key: 'tableNumber',
      width: 80,
      render: (tableNumber: string | null) => tableNumber ? `${tableNumber} 桌` : '-'
    },
    {
      title: '報到狀態',
      dataIndex: 'hasCheckedIn',
      key: 'hasCheckedIn',
      width: 100,
      render: (hasCheckedIn: boolean) => {
        return hasCheckedIn ? (
          <span style={{ color: '#52c41a', fontWeight: 'bold' }}>✓ 已報到</span>
        ) : (
          <span style={{ color: '#999' }}>未報到</span>
        )
      }
    },
    {
      title: '報到時間',
      dataIndex: 'checkedInAt',
      key: 'checkedInAt',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-TW') : '-'
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
      <Space style={{ marginBottom: 16 }} wrap>
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
          accept=".csv"
        >
          <Button icon={<UploadOutlined />}>
            批次匯入 CSV（支援自動角色判定）
          </Button>
        </Upload>
        <Button
          icon={<CheckCircleOutlined />}
          onClick={handleCheckinAll}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
        >
          一鍵全員報到
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadEmployees}
        >
          重新整理
        </Button>
        <Button
          icon={<WarningOutlined />}
          onClick={handleReset}
          style={{ marginLeft: 'auto' }}
        >
          部分重置（保留員工和獎項）
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleResetAll}
        >
          完全重置（刪除所有資料）
        </Button>
      </Space>

      <div style={{ marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <span style={{ color: '#666' }}>總員工數：</span>
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>{employees.length}</span>
        </div>
        <div>
          <span style={{ color: '#666' }}>已報到：</span>
          <span style={{ fontWeight: 'bold', fontSize: 16, color: '#52c41a' }}>
            {employees.filter(e => e.hasCheckedIn).length}
          </span>
        </div>
        <div>
          <span style={{ color: '#666' }}>未報到：</span>
          <span style={{ fontWeight: 'bold', fontSize: 16, color: '#999' }}>
            {employees.filter(e => !e.hasCheckedIn).length}
          </span>
        </div>
        <div style={{ borderLeft: '1px solid #d9d9d9', paddingLeft: 24 }}>
          <span style={{ color: '#666' }}>已抽獎：</span>
          <span style={{ fontWeight: 'bold', fontSize: 16, color: '#1890ff' }}>
            {employees.filter(e => e.hasDrawn).length}
          </span>
        </div>
        <div style={{ borderLeft: '1px solid #d9d9d9', paddingLeft: 24 }}>
          <span style={{ color: '#fa8c16' }}>角色 A：</span>
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>
            {employees.filter(e => e.roleType === 'A').length}
          </span>
        </div>
        <div>
          <span style={{ color: '#52c41a' }}>角色 B：</span>
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>
            {employees.filter(e => e.roleType === 'B').length}
          </span>
        </div>
        <div>
          <span style={{ color: '#d9d9d9' }}>角色 C：</span>
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>
            {employees.filter(e => e.roleType === 'C').length}
          </span>
        </div>
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
              <Select.Option value="C">角色 C（不可抽獎）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="department"
            label="部門"
          >
            <Input placeholder="例如：資訊部（選填）" />
          </Form.Item>

          <Form.Item
            name="hireDate"
            label="到職日期"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
              placeholder="選擇到職日期（選填）"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* CSV 格式說明 */}
      <div style={{ marginTop: 24, padding: 16, background: '#f0f0f0', borderRadius: 8 }}>
        <h4>📋 CSV 檔案格式說明</h4>

        <div style={{ marginBottom: 16 }}>
          <h5 style={{ marginTop: 0 }}>標準格式（含到職日期，系統自動判定角色）</h5>
          <pre style={{ background: 'white', padding: 12, borderRadius: 4, overflow: 'auto' }}>
{`員編,姓名,扣繳單位名稱,到職日期,部門名稱,部門代碼,職位名稱,參加
E001,張三,公司A,2023/01/15,資訊部,IT,工程師,是，我會出席
E002,李四,公司B,2025/10/01,業務部,SALES,專員,是，我會出席
E003,王五,公司C,2025/12/20,行銷部,MKT,經理,是，我會出席`}
          </pre>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: 12 }}>
            ⚠️ 前 3 行為標題，會自動跳過<br/>
            📅 基準日：2026/03/06<br/>
            • 到職 ≥ 1 年 → 角色 A（可抽所有獎品）<br/>
            • 到職 ≥ 3 個月且 &lt; 1 年 → 角色 B（僅萬元以下）<br/>
            • 到職 &lt; 3 個月 → 角色 C（不可抽獎）<br/>
            • 只會匯入「參加」欄位為「是，我會出席」的員工
          </p>
        </div>

        <div>
          <h5>簡易格式（手動指定角色）</h5>
          <pre style={{ background: 'white', padding: 12, borderRadius: 4, overflow: 'auto' }}>
{`員工編號,姓名,角色類型,部門
E001,張三,A,資訊部
E002,李四,B,業務部
E003,王五,C,協力廠商`}
          </pre>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: 12 }}>
            ⚠️ 第一行為標題行，會自動跳過<br/>
            角色類型：A（可抽所有獎）、B（僅萬元以下）、C（不可抽獎）
          </p>
        </div>
      </div>
    </Card>
  )
}

export default EmployeeManagement
