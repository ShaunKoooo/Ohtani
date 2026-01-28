import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private url: string

  constructor() {
    this.url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(this.url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id)
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // ========== 參加者事件 ==========

  // 參加者加入抽獎
  join(employeeId: string) {
    this.socket?.emit('join', { employeeId })
  }

  // 請求統計資料
  getStatistics() {
    this.socket?.emit('getStatistics')
  }

  // 請求抽獎記錄
  getDrawRecords() {
    this.socket?.emit('getDrawRecords')
  }

  // 請求獎品列表
  getPrizes() {
    this.socket?.emit('getPrizes')
  }

  // ========== 主持人事件 ==========

  // 主持人執行抽獎
  hostDraw(data?: { hostKey?: string; prizeId?: number }) {
    this.socket?.emit('hostDraw', data)
  }

  // 開始抽獎活動
  startLottery() {
    this.socket?.emit('startLottery')
  }

  // 結束抽獎活動
  endLottery() {
    this.socket?.emit('endLottery')
  }

  // 主持人廣播訊息
  adminBroadcast(message: string, type?: string) {
    this.socket?.emit('adminBroadcast', { message, type })
  }

  // ========== 監聽事件（給所有人） ==========

  // 監聽抽獎結果
  onDrawResult(callback: (data: any) => void) {
    this.socket?.on('drawResult', callback)
  }

  // 監聽統計資料更新
  onStatisticsUpdate(callback: (data: any) => void) {
    this.socket?.on('statisticsUpdate', callback)
  }

  // 監聽參與人數更新
  onParticipantsUpdate(callback: (data: { count: number }) => void) {
    this.socket?.on('participantsUpdate', callback)
  }

  // 監聽公告訊息
  onAnnouncement(callback: (data: any) => void) {
    this.socket?.on('announcement', callback)
  }

  // 監聽抽獎活動開始
  onLotteryStarted(callback: (data: any) => void) {
    this.socket?.on('lotteryStarted', callback)
  }

  // 監聽抽獎活動結束
  onLotteryEnded(callback: (data: any) => void) {
    this.socket?.on('lotteryEnded', callback)
  }

  // 監聽系統重置
  onReset(callback: (data: any) => void) {
    this.socket?.on('reset', callback)
  }

  // ========== 監聽事件（給個別參加者） ==========

  // 監聽加入成功
  onJoinSuccess(callback: (data: any) => void) {
    this.socket?.on('joinSuccess', callback)
  }

  // 監聽「恭喜中獎」
  onYouWon(callback: (data: any) => void) {
    this.socket?.on('youWon', callback)
  }

  // 監聽「繼續等候」
  onKeepWaiting(callback: (data: any) => void) {
    this.socket?.on('keepWaiting', callback)
  }

  // 監聽「已經抽過獎」
  onAlreadyWon(callback: (data: any) => void) {
    this.socket?.on('alreadyWon', callback)
  }

  // 監聽錯誤
  onError(callback: (data: { message: string }) => void) {
    this.socket?.on('error', callback)
  }

  // 監聽抽獎記錄更新
  onDrawRecordsUpdate(callback: (data: any[]) => void) {
    this.socket?.on('drawRecordsUpdate', callback)
  }

  // 監聽獎品列表更新
  onPrizesUpdate(callback: (data: any[]) => void) {
    this.socket?.on('prizesUpdate', callback)
  }

  // ========== 工具方法 ==========

  // 移除監聽器
  off(event: string, callback?: Function) {
    this.socket?.off(event, callback as any)
  }

  // 移除所有監聽器
  removeAllListeners() {
    this.socket?.removeAllListeners()
  }

  // 檢查連線狀態
  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export default new SocketService()
