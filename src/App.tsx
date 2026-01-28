import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import HomePage from './pages/HomePage'
import JoinPage from './pages/JoinPage'
import DrawPage from './pages/DrawPage'
import DisplayPage from './pages/DisplayPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <ConfigProvider locale={zhTW}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/draw" element={<DrawPage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
