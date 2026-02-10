// 員工型別
export interface Employee {
  id: number
  employeeId: string
  name: string
  roleType: 'A' | 'B' | 'C'
  department?: string
  hireDate?: string
  tableNumber?: string | null
  hasCheckedIn?: boolean
  checkedInAt?: string
  hasDrawn?: boolean
  position?: string
  prize?: {
    name: string
    value: number
  }
  createdAt: string
}

// 報到回應型別
export interface CheckinResponse {
  success: boolean
  message?: string
  error?: string
  employee?: {
    name: string
    employeeId: string
    hireDate: string
    department: string
    position: string
    roleType: 'A' | 'B' | 'C'
    hasDrawn: boolean
    prize?: {
      name: string
      value: number
    }
  }
}

// 獎項型別
export interface Prize {
  id: number
  name: string
  value: number
  quantity: number
  remaining: number
  imageUrl?: string
  createdAt: string
}

// 抽獎記錄型別
export interface DrawRecord {
  id: number
  employee: {
    id: string
    name: string
    roleType: 'A' | 'B' | 'C'
    department?: string
  }
  prize: {
    id: number
    name: string
    value: number
    imageUrl?: string
  }
  drawnAt: string
}

// 抽獎結果型別
export interface DrawResult {
  success: boolean
  employee?: {
    id: string
    name: string
    roleType: 'A' | 'B' | 'C'
    department?: string
  }
  prize?: {
    id: number
    name: string
    value: number
    imageUrl?: string
  }
  message?: string
  reason?: 'no_available_prizes' | 'all_drawn'
}

// 批次抽獎結果型別
export interface BatchDrawResult {
  success: boolean
  results: DrawResult[]
  summary: {
    total: number
    succeeded: number
    failed: number
  }
}

// 統計資訊型別
export interface Stats {
  employees: {
    total: number
    drawn: number
    undrawn: number
    roleA: number
    roleB: number
    roleC: number
  }
  prizes: {
    total: number
    remaining: number
    totalValue: number
    distributedValue: number
  }
  draws: {
    total: number
    avgValue: number
    maxValue: number
    minValue: number
  }
}

// API 回應型別
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
