import { useNavigate } from 'react-router-dom'
import { Card, Button, Row, Col, Typography } from 'antd'
import { GiftOutlined, DesktopOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ maxWidth: 1200, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <Title style={{ color: 'white', fontSize: 48, marginBottom: 16 }}>
            🎊 春酒抽獎系統
          </Title>
          <Paragraph style={{ color: 'white', fontSize: 20, opacity: 0.9 }}>
            請選擇您的角色進入系統
          </Paragraph>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} md={6}>
            <Card
              hoverable
              style={{
                height: '100%',
                textAlign: 'center',
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
              onClick={() => navigate('/join')}
            >
              <UserOutlined style={{ fontSize: 64, color: '#722ed1', marginBottom: 16 }} />
              <Title level={3}>員工參加</Title>
              <Paragraph style={{ color: '#666', marginBottom: 24 }}>
                輸入員工編號<br />
                等待抽獎<br />
                查看中獎結果
              </Paragraph>
              <Button type="primary" size="large" block style={{ background: '#722ed1', borderColor: '#722ed1' }}>
                我要參加抽獎
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card
              hoverable
              style={{
                height: '100%',
                textAlign: 'center',
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
              onClick={() => navigate('/draw')}
            >
              <GiftOutlined style={{ fontSize: 64, color: '#f5222d', marginBottom: 16 }} />
              <Title level={3}>主持人抽獎</Title>
              <Paragraph style={{ color: '#666', marginBottom: 24 }}>
                執行抽獎操作<br />
                單次抽獎<br />
                查看即時統計
              </Paragraph>
              <Button type="primary" size="large" block>
                進入抽獎頁面
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card
              hoverable
              style={{
                height: '100%',
                textAlign: 'center',
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
              onClick={() => navigate('/display')}
            >
              <DesktopOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
              <Title level={3}>大螢幕展示</Title>
              <Paragraph style={{ color: '#666', marginBottom: 24 }}>
                投影給全場觀眾<br />
                即時顯示中獎名單<br />
                全螢幕動畫效果
              </Paragraph>
              <Button type="primary" size="large" block>
                進入展示頁面
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card
              hoverable
              style={{
                height: '100%',
                textAlign: 'center',
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
              onClick={() => navigate('/admin')}
            >
              <SettingOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
              <Title level={3}>後台管理</Title>
              <Paragraph style={{ color: '#666', marginBottom: 24 }}>
                管理員工與獎項<br />
                查看統計資訊<br />
                系統設定
              </Paragraph>
              <Button type="primary" size="large" block>
                進入管理後台
              </Button>
            </Card>
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Paragraph style={{ color: 'white', opacity: 0.7 }}>
            💡 提示：建議在活動開始前先進入後台管理，確認員工與獎項資料已正確匯入
          </Paragraph>
        </div>
      </div>
    </div>
  )
}

export default HomePage
