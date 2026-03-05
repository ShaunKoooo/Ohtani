import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ========== 員工管理 ==========

export const employeeApi = {
  // 查詢單一員工資訊（不執行報到）
  getEmployee: async (employeeId: string) => {
    const response = await api.get(`/employees/${employeeId}`)
    return response.data
  },

  // 員工報到
  checkin: async (employeeId: string) => {
    const response = await api.post('/checkin', { employeeId })
    return response.data
  },

  // 取得所有員工
  getAll: async () => {
    const response = await api.get('/employees')
    return response.data
  },

  // 新增單一員工
  create: async (employee: {
    employeeId: string
    name: string
    roleType: 'A' | 'B' | 'C'
    department?: string
  }) => {
    const response = await api.post('/employees', employee)
    return response.data
  },

  // 批次匯入員工
  batchCreate: async (employees: Array<{
    employeeId: string
    name: string
    roleType: 'A' | 'B' | 'C'
    department?: string
  }>) => {
    const response = await api.post('/employees/batch', { employees })
    return response.data
  },

  // 上傳 CSV 檔案
  uploadCSV: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/employees/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // 取得尚未中獎的員工列表
  getNotDrawn: async () => {
    const response = await api.get('/employees/not-drawn')
    return response.data
  },

  // 匯出尚未中獎的員工 CSV
  exportNotDrawnCSV: async () => {
    const response = await api.get('/employees/not-drawn/export-csv', {
      responseType: 'blob'
    })
    return response.data
  }
}

// ========== 獎項管理 ==========

export const prizeApi = {
  // 取得所有獎項
  getAll: async () => {
    const response = await api.get('/prizes')
    return response.data
  },

  // 新增獎項
  create: async (prize: {
    name: string
    value: number
    quantity: number
    imageUrl?: string
  }) => {
    const response = await api.post('/prizes', prize)
    return response.data
  },

  // 更新獎項
  update: async (id: number, prize: {
    name?: string
    value?: number
    quantity?: number
    imageUrl?: string
  }) => {
    const response = await api.put(`/prizes/${id}`, prize)
    return response.data
  },

  // 刪除獎項
  delete: async (id: number) => {
    const response = await api.delete(`/prizes/${id}`)
    return response.data
  },

  // 上傳 CSV 檔案
  uploadCSV: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/prizes/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

// ========== 抽獎 ==========

export const drawApi = {
  // 批次抽獎
  batch: async (count: number, prizeId?: number) => {
    const response = await api.post('/draw/batch', { count, prizeId })
    return response.data
  },

  // 取得所有中獎記錄
  getRecords: async () => {
    const response = await api.get('/draw/records')
    return response.data
  },

  // 取得最新中獎記錄（用於大螢幕輪詢）
  getLatest: async (limit: number = 10) => {
    const response = await api.get(`/draw/latest?limit=${limit}`)
    return response.data
  }
}

// ========== 統計 ==========

export const statsApi = {
  // 取得統計資訊
  get: async () => {
    const response = await api.get('/stats')
    return response.data
  }
}

// ========== 抽獎狀態管理 ==========

export const lotteryApi = {
  // 設定當前要抽的獎項
  setCurrentPrize: async (prizeId: number) => {
    const response = await api.post('/lottery/set-current-prize', { prizeId })
    return response.data
  },

  // 取得當前獎項
  getCurrentPrize: async () => {
    const response = await api.get('/lottery/current-prize')
    return response.data
  },

  // 清除當前獎項
  clearCurrentPrize: async () => {
    const response = await api.post('/lottery/clear-current-prize')
    return response.data
  }
}

// ========== 顯示頁面控制 ==========

export const displayApi = {
  // 取得顯示狀態（供 DisplayPage polling）
  getState: async () => {
    const response = await api.get('/display/state')
    return response.data
  },

  // 清除所有裝置的顯示畫面
  clear: async () => {
    const response = await api.post('/display/clear')
    return response.data
  },

  // 標記有新的中獎結果要顯示
  show: async () => {
    const response = await api.post('/display/show')
    return response.data
  },

  // 觸發倒數計時（跨裝置）
  startCountdown: async () => {
    const response = await api.post('/display/countdown')
    return response.data
  }
}

// ========== 系統管理 ==========

export const systemApi = {
  // 部分重置（保留員工和獎項，只重置抽獎狀態）
  reset: async () => {
    const response = await api.post('/reset', { confirm: true })
    return response.data
  },

  // 完全重置（刪除所有資料）
  resetAll: async () => {
    const response = await api.post('/reset/all', { confirm: 'DELETE_ALL' })
    return response.data
  },

  // 健康檢查
  health: async () => {
    const response = await api.get('/health', {
      baseURL: import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
    })
    return response.data
  }
}

export default api
