# 春酒抽獎系統 - 後端 PRD

## 專案資訊

| 項目 | 內容 |
|------|------|
| 專案名稱 | ohtani_backend |
| 技術棧 | Node.js + Express + TypeScript + Prisma + Socket.io |
| 資料庫 | SQLite |
| 部署方式 | Railway / Render（免費方案）|
| 開發時間 | 預估 8-10 小時 |

---

## 系統架構

```
Client (前端)
    ↓
WebSocket / REST API
    ↓
Express Server
    ↓
├── Socket.io (即時通訊)
├── REST API Routes
└── Services (業務邏輯)
    ↓
Prisma ORM
    ↓
SQLite Database
```

---

## 資料庫設計

### ER Diagram

```
employees (員工表)
├── id (PK)
├── employee_id (UNIQUE)
├── name
├── role_type ('A' or 'B')
├── department
└── created_at

prizes (獎項表)
├── id (PK)
├── name
├── value
├── quantity
├── remaining
├── image_url
└── created_at

draw_records (抽獎記錄表)
├── id (PK)
├── employee_id (UNIQUE, FK)
├── prize_id (FK)
├── prize_name
├── prize_value
└── drawn_at
```

### Prisma Schema

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./lottery.db"
}

generator client {
  provider = "prisma-client-js"
}

model Employee {
  id          Int          @id @default(autoincrement())
  employeeId  String       @unique @map("employee_id")
  name        String
  roleType    String       @map("role_type")
  department  String?
  createdAt   DateTime     @default(now()) @map("created_at")
  drawRecord  DrawRecord?
}

model Prize {
  id          Int          @id @default(autoincrement())
  name        String
  value       Int
  quantity    Int
  remaining   Int
  imageUrl    String?      @map("image_url")
  createdAt   DateTime     @default(now()) @map("created_at")
  drawRecords DrawRecord[]
}

model DrawRecord {
  id         Int      @id @default(autoincrement())
  employeeId String   @unique @map("employee_id")
  prizeId    Int      @map("prize_id")
  prizeName  String   @map("prize_name")
  prizeValue Int      @map("prize_value")
  drawnAt    DateTime @default(now()) @map("drawn_at")

  employee   Employee @relation(fields: [employeeId], references: [employeeId])
  prize      Prize    @relation(fields: [prizeId], references: [id])
}
```

### 資料表說明

#### 1. employees（員工表）

| 欄位 | 型別 | 說明 | 約束 |
|------|------|------|------|
| id | INTEGER | 主鍵 | PRIMARY KEY |
| employee_id | TEXT | 員工編號 | UNIQUE, NOT NULL |
| name | TEXT | 姓名 | NOT NULL |
| role_type | TEXT | 角色類型（'A' 或 'B'）| NOT NULL |
| department | TEXT | 部門 | NULLABLE |
| created_at | DATETIME | 建立時間 | DEFAULT NOW() |

**業務規則**：
- `role_type` 只能是 'A' 或 'B'
- 角色 A 可抽所有獎項
- 角色 B 只能抽價值 ≤ 10000 的獎項

#### 2. prizes（獎項表）

| 欄位 | 型別 | 說明 | 約束 |
|------|------|------|------|
| id | INTEGER | 主鍵 | PRIMARY KEY |
| name | TEXT | 獎品名稱 | NOT NULL |
| value | INTEGER | 獎品價值（元）| NOT NULL |
| quantity | INTEGER | 總數量 | NOT NULL |
| remaining | INTEGER | 剩餘數量 | NOT NULL |
| image_url | TEXT | 獎品圖片 URL | NULLABLE |
| created_at | DATETIME | 建立時間 | DEFAULT NOW() |

**業務規則**：
- `remaining` 不能小於 0
- `remaining` 初始值等於 `quantity`
- 每次抽獎成功，`remaining` 減 1

#### 3. draw_records（抽獎記錄表）

| 欄位 | 型別 | 說明 | 約束 |
|------|------|------|------|
| id | INTEGER | 主鍵 | PRIMARY KEY |
| employee_id | TEXT | 員工編號 | UNIQUE, FK, NOT NULL |
| prize_id | INTEGER | 獎項 ID | FK, NOT NULL |
| prize_name | TEXT | 獎品名稱（冗餘）| NOT NULL |
| prize_value | INTEGER | 獎品價值（冗餘）| NOT NULL |
| drawn_at | DATETIME | 抽獎時間 | DEFAULT NOW() |

**業務規則**：
- `employee_id` 設為 UNIQUE，確保一人只能抽一次
- `prize_name` 和 `prize_value` 冗餘儲存，方便查詢歷史紀錄

---

## API 規格

### 1. 員工管理 API

#### 1.1 批次匯入員工

```
POST /api/employees/batch
Content-Type: application/json

Request Body:
{
  "employees": [
    {
      "employeeId": "E001",
      "name": "張三",
      "roleType": "A",
      "department": "資訊部"
    },
    {
      "employeeId": "E002",
      "name": "李四",
      "roleType": "B",
      "department": "業務部"
    }
  ]
}

Response (200 OK):
{
  "success": true,
  "count": 2,
  "message": "成功匯入 2 位員工"
}

Error (400 Bad Request):
{
  "success": false,
  "error": "員工編號 E001 已存在"
}
```

**驗證規則**：
- `employeeId` 必填，不可重複
- `name` 必填
- `roleType` 必填，只能是 'A' 或 'B'
- `department` 可選

#### 1.2 取得所有員工

```
GET /api/employees

Response (200 OK):
{
  "success": true,
  "employees": [
    {
      "id": 1,
      "employeeId": "E001",
      "name": "張三",
      "roleType": "A",
      "department": "資訊部",
      "hasDrawn": false,
      "createdAt": "2026-01-14T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### 1.3 新增單一員工

```
POST /api/employees
Content-Type: application/json

Request Body:
{
  "employeeId": "E003",
  "name": "王五",
  "roleType": "B",
  "department": "行銷部"
}

Response (201 Created):
{
  "success": true,
  "employee": {
    "id": 3,
    "employeeId": "E003",
    "name": "王五",
    "roleType": "B",
    "department": "行銷部"
  }
}
```

#### 1.4 刪除員工

```
DELETE /api/employees/:id

Response (200 OK):
{
  "success": true,
  "message": "員工已刪除"
}

Error (400 Bad Request):
{
  "success": false,
  "error": "該員工已有抽獎記錄，無法刪除"
}
```

---

### 2. 獎項管理 API

#### 2.1 新增獎項

```
POST /api/prizes
Content-Type: application/json

Request Body:
{
  "name": "iPhone 15 Pro",
  "value": 35000,
  "quantity": 2,
  "imageUrl": "https://example.com/iphone.jpg"
}

Response (201 Created):
{
  "success": true,
  "prize": {
    "id": 1,
    "name": "iPhone 15 Pro",
    "value": 35000,
    "quantity": 2,
    "remaining": 2,
    "imageUrl": "https://example.com/iphone.jpg"
  }
}
```

**驗證規則**：
- `name` 必填
- `value` 必填，必須 > 0
- `quantity` 必填，必須 > 0
- `imageUrl` 可選

#### 2.2 取得所有獎項

```
GET /api/prizes

Response (200 OK):
{
  "success": true,
  "prizes": [
    {
      "id": 1,
      "name": "iPhone 15 Pro",
      "value": 35000,
      "quantity": 2,
      "remaining": 1,
      "imageUrl": "https://example.com/iphone.jpg",
      "createdAt": "2026-01-14T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### 2.3 更新獎項

```
PUT /api/prizes/:id
Content-Type: application/json

Request Body:
{
  "name": "iPhone 15 Pro Max",
  "value": 40000,
  "quantity": 3
}

Response (200 OK):
{
  "success": true,
  "prize": {
    "id": 1,
    "name": "iPhone 15 Pro Max",
    "value": 40000,
    "quantity": 3,
    "remaining": 2
  }
}
```

**注意**：
- 更新 `quantity` 時，`remaining` 會同步調整
- 不能將 `quantity` 改為小於已抽出的數量

#### 2.4 刪除獎項

```
DELETE /api/prizes/:id

Response (200 OK):
{
  "success": true,
  "message": "獎項已刪除"
}

Error (400 Bad Request):
{
  "success": false,
  "error": "該獎項已有抽獎記錄，無法刪除"
}
```

---

### 3. 抽獎 API

#### 3.1 批次抽獎

```
POST /api/draw/batch
Content-Type: application/json

Request Body:
{
  "count": 5
}

Response (200 OK):
{
  "success": true,
  "results": [
    {
      "success": true,
      "employee": {
        "id": "E001",
        "name": "張三",
        "roleType": "A",
        "department": "資訊部"
      },
      "prize": {
        "id": 1,
        "name": "iPhone 15 Pro",
        "value": 35000,
        "imageUrl": "..."
      }
    },
    {
      "success": true,
      "employee": {
        "id": "E002",
        "name": "李四",
        "roleType": "B",
        "department": "業務部"
      },
      "prize": {
        "id": 2,
        "name": "AirPods Pro",
        "value": 7000,
        "imageUrl": "..."
      }
    },
    {
      "success": false,
      "message": "🎤 請大喊老闆加碼！",
      "employee": {
        "id": "E003",
        "name": "王五",
        "roleType": "B",
        "department": "行銷部"
      },
      "reason": "no_available_prizes"
    }
  ],
  "summary": {
    "total": 5,
    "succeeded": 2,
    "failed": 1,
    "stopped": true,
    "stopReason": "no_available_prizes"
  }
}
```

**業務邏輯**：
1. 迴圈執行 `count` 次
2. 每次隨機選一個還沒中獎的員工
3. 根據員工角色篩選可抽獎項
4. 如果有獎品 → 抽獎成功
5. 如果沒獎品 → 回傳「老闆加碼」，繼續下一輪
6. 如果沒有未中獎員工 → 停止

**錯誤處理**：
```
Error (400 Bad Request):
{
  "success": false,
  "error": "count 必須大於 0 且小於等於 100"
}
```

#### 3.2 查詢所有中獎記錄

```
GET /api/draw/records

Response (200 OK):
{
  "success": true,
  "records": [
    {
      "id": 1,
      "employee": {
        "id": "E001",
        "name": "張三",
        "roleType": "A",
        "department": "資訊部"
      },
      "prize": {
        "id": 1,
        "name": "iPhone 15 Pro",
        "value": 35000
      },
      "drawnAt": "2026-01-14T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

### 4. 統計 API

#### 4.1 取得統計資訊

```
GET /api/stats

Response (200 OK):
{
  "success": true,
  "stats": {
    "employees": {
      "total": 100,
      "drawn": 25,
      "undrawn": 75,
      "roleA": 30,
      "roleB": 70
    },
    "prizes": {
      "total": 50,
      "remaining": 25,
      "totalValue": 500000,
      "distributedValue": 250000,
      "byValue": [
        { "range": "0-10000", "count": 30, "remaining": 15 },
        { "range": "10000+", "count": 20, "remaining": 10 }
      ]
    },
    "draws": {
      "total": 25,
      "avgValue": 10000,
      "maxValue": 35000,
      "minValue": 500
    }
  }
}
```

---

### 5. 系統管理 API

#### 5.1 重置抽獎記錄

```
POST /api/reset
Content-Type: application/json

Request Body:
{
  "confirm": true
}

Response (200 OK):
{
  "success": true,
  "message": "抽獎記錄已重置",
  "details": {
    "deletedRecords": 25,
    "resetPrizes": 10
  }
}
```

**業務邏輯**：
1. 刪除所有 `draw_records`
2. 將所有獎項的 `remaining` 重置為 `quantity`

**安全性**：
- 需要 `confirm: true` 參數
- 建議加入權限驗證

---

### 6. 輔助 API

#### 6.1 健康檢查

```
GET /api/health

Response (200 OK):
{
  "status": "ok",
  "timestamp": "2026-01-14T10:00:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## WebSocket 事件

### Client -> Server

#### 1. 加入大廳

```javascript
socket.emit('join_hall')
```

#### 2. 執行單次抽獎

```javascript
socket.emit('draw')
```

#### 3. 執行批次抽獎

```javascript
socket.emit('draw_batch', { count: 5 })
```

### Server -> Client

#### 1. 連線成功

```javascript
socket.on('connected', {
  message: 'Connected to lottery server',
  socketId: 'abc123'
})
```

#### 2. 單次抽獎結果

```javascript
socket.on('draw_result', {
  success: true,
  employee: { id: 'E001', name: '張三', roleType: 'A', department: '資訊部' },
  prize: { id: 1, name: 'iPhone 15', value: 30000, imageUrl: '...' }
})
```

#### 3. 批次抽獎結果

```javascript
socket.on('batch_draw_result', {
  success: true,
  results: [
    { success: true, employee: {...}, prize: {...} },
    { success: true, employee: {...}, prize: {...} },
    { success: false, message: '請大喊老闆加碼', employee: {...} }
  ],
  summary: {
    total: 5,
    succeeded: 4,
    failed: 1
  }
})
```

#### 4. 全場廣播

```javascript
socket.on('winner_announced', {
  employee: { id: 'E001', name: '張三', department: '資訊部' },
  prize: { name: 'iPhone 15', value: 30000 },
  timestamp: '2026-01-14T10:30:00Z'
})
```

#### 5. 批次中獎廣播

```javascript
socket.on('batch_winners_announced', {
  winners: [
    { employee: {...}, prize: {...} },
    { employee: {...}, prize: {...} }
  ],
  timestamp: '2026-01-14T10:30:00Z'
})
```

#### 6. 獎池更新

```javascript
socket.on('prizes_updated', {
  prizes: [
    { id: 1, name: 'iPhone 15', remaining: 1, value: 30000 },
    { id: 2, name: 'AirPods Pro', remaining: 3, value: 7000 }
  ]
})
```

#### 7. 錯誤通知

```javascript
socket.on('draw_error', {
  message: '所有員工都已抽過獎了',
  reason: 'all_drawn'
})
```

---

## 核心業務邏輯

### DrawService 類別

```typescript
export class DrawService {
  // 1. 隨機選一個還沒抽過獎的員工
  async getRandomUndrawnEmployee(): Promise<Employee | null>

  // 2. 取得該員工可抽的獎項
  async getAvailablePrizes(roleType: string): Promise<Prize[]>

  // 3. 執行單次抽獎
  async executeRandomDraw(): Promise<DrawResult>

  // 4. 執行批次抽獎
  async executeBatchDraw(count: number): Promise<BatchDrawResult>

  // 5. 重置抽獎記錄
  async resetDrawRecords(): Promise<ResetResult>
}
```

### 單次抽獎流程

```typescript
async executeRandomDraw() {
  // 1. 隨機選出員工
  const employee = await this.getRandomUndrawnEmployee()
  if (!employee) {
    return {
      success: false,
      message: '所有員工都已抽過獎了',
      reason: 'all_drawn'
    }
  }

  // 2. 取得可抽獎項
  const availablePrizes = await this.getAvailablePrizes(employee.roleType)
  if (availablePrizes.length === 0) {
    return {
      success: false,
      message: '🎤 請大喊老闆加碼！',
      employee: {
        id: employee.employeeId,
        name: employee.name,
        roleType: employee.roleType,
        department: employee.department
      },
      reason: 'no_available_prizes'
    }
  }

  // 3. 隨機抽選獎品
  const selectedPrize = availablePrizes[
    Math.floor(Math.random() * availablePrizes.length)
  ]

  // 4. 交易式寫入
  const result = await prisma.$transaction(async (tx) => {
    // 扣減獎品數量
    await tx.prize.update({
      where: { id: selectedPrize.id },
      data: { remaining: { decrement: 1 } }
    })

    // 記錄中獎
    await tx.drawRecord.create({
      data: {
        employeeId: employee.employeeId,
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.name,
        prizeValue: selectedPrize.value
      }
    })

    return {
      success: true,
      employee: {
        id: employee.employeeId,
        name: employee.name,
        roleType: employee.roleType,
        department: employee.department
      },
      prize: {
        id: selectedPrize.id,
        name: selectedPrize.name,
        value: selectedPrize.value,
        imageUrl: selectedPrize.imageUrl
      }
    }
  })

  return result
}
```

### 批次抽獎流程

```typescript
async executeBatchDraw(count: number) {
  if (count <= 0 || count > 100) {
    throw new Error('count 必須介於 1-100 之間')
  }

  const results = []
  let succeeded = 0
  let failed = 0

  for (let i = 0; i < count; i++) {
    const result = await this.executeRandomDraw()
    results.push(result)

    if (result.success) {
      succeeded++
    } else {
      failed++
      // 如果沒有未中獎員工，停止抽獎
      if (result.reason === 'all_drawn') {
        break
      }
    }
  }

  return {
    success: true,
    results,
    summary: {
      total: count,
      succeeded,
      failed
    }
  }
}
```

### 角色權限判斷

```typescript
async getAvailablePrizes(roleType: string) {
  let prizes = await prisma.prize.findMany({
    where: { remaining: { gt: 0 } }
  })

  // 角色 B 只能抽萬元以下
  if (roleType === 'B') {
    prizes = prizes.filter(p => p.value <= 10000)
  }

  return prizes
}
```

---

## 錯誤處理

### 錯誤碼定義

| 錯誤碼 | 說明 | HTTP 狀態碼 |
|--------|------|-------------|
| EMPLOYEE_NOT_FOUND | 員工不存在 | 404 |
| EMPLOYEE_ALREADY_DRAWN | 員工已抽過獎 | 400 |
| NO_AVAILABLE_PRIZES | 沒有可抽的獎項 | 400 |
| ALL_DRAWN | 所有員工都抽過獎 | 400 |
| PRIZE_NOT_FOUND | 獎項不存在 | 404 |
| PRIZE_OUT_OF_STOCK | 獎品已抽完 | 400 |
| INVALID_ROLE_TYPE | 無效的角色類型 | 400 |
| DUPLICATE_EMPLOYEE_ID | 員工編號重複 | 400 |
| DATABASE_ERROR | 資料庫錯誤 | 500 |

### 錯誤回應格式

```json
{
  "success": false,
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "員工編號 E001 不存在",
    "details": {
      "employeeId": "E001"
    }
  }
}
```

---

## 專案結構

```
ohtani_backend/
├── src/
│   ├── index.ts                 # 主入口
│   ├── config/
│   │   └── database.ts          # 資料庫連線設定
│   ├── services/
│   │   ├── drawService.ts       # 抽獎核心邏輯
│   │   ├── employeeService.ts   # 員工管理
│   │   ├── prizeService.ts      # 獎項管理
│   │   ├── statsService.ts      # 統計服務
│   │   └── socketService.ts     # WebSocket 服務
│   ├── routes/
│   │   ├── employees.ts         # 員工路由
│   │   ├── prizes.ts            # 獎項路由
│   │   ├── draw.ts              # 抽獎路由
│   │   └── stats.ts             # 統計路由
│   ├── middleware/
│   │   ├── errorHandler.ts      # 錯誤處理
│   │   └── validation.ts        # 請求驗證
│   ├── types/
│   │   └── index.ts             # TypeScript 型別定義
│   └── utils/
│       └── logger.ts            # 日誌工具
├── scripts/
│   ├── import-employees.ts      # 員工資料匯入腳本
│   └── seed-prizes.ts           # 獎項資料種子腳本
├── prisma/
│   ├── schema.prisma            # Prisma Schema
│   ├── migrations/              # 資料庫遷移檔案
│   └── lottery.db               # SQLite 資料庫檔案
├── .env                         # 環境變數
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 環境變數

```.env
# 資料庫
DATABASE_URL="file:./lottery.db"

# 伺服器
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# 日誌
LOG_LEVEL=info
```

---

## 依賴套件

### 核心套件

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "@prisma/client": "^5.8.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "prisma": "^5.8.0"
  }
}
```

### 可選套件

```json
{
  "csv-parser": "^3.0.0",        // CSV 匯入
  "winston": "^3.11.0",          // 日誌管理
  "express-validator": "^7.0.1"  // 請求驗證
}
```

---

## 開發流程

### 1. 初始化專案

```bash
mkdir ohtani_backend
cd ohtani_backend
npm init -y
npm install express socket.io @prisma/client cors dotenv
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon prisma
npx tsc --init
npx prisma init --datasource-provider sqlite
```

### 2. 設定 Prisma

```bash
# 編輯 prisma/schema.prisma
npx prisma migrate dev --name init
npx prisma generate
```

### 3. 建立核心程式碼

- Services（業務邏輯）
- Routes（API 路由）
- Socket Service（WebSocket）

### 4. 測試

```bash
npm run dev
```

### 5. 建置

```bash
npm run build
npm start
```

---

## 測試計畫

### 單元測試

- [ ] DrawService.getRandomUndrawnEmployee()
- [ ] DrawService.getAvailablePrizes()
- [ ] DrawService.executeRandomDraw()
- [ ] DrawService.executeBatchDraw()

### 整合測試

- [ ] REST API 端點測試
- [ ] WebSocket 事件測試
- [ ] 資料庫交易測試

### 邊界測試

- [ ] 所有員工都抽過獎
- [ ] 所有獎品都抽完
- [ ] 角色 B 只剩萬元以上獎品
- [ ] 並發抽獎（多人同時抽）

---

## 部署檢查清單

### 部署前

- [ ] 所有測試通過
- [ ] 環境變數設定完成
- [ ] 資料庫遷移執行完成
- [ ] 錯誤處理完善
- [ ] 日誌記錄完整

### 部署到 Railway

1. 連結 GitHub Repository
2. 設定環境變數
3. 確保 `lottery.db` 被 Git 追蹤
4. 設定 Build Command: `npm run build`
5. 設定 Start Command: `npm start`

### 部署後

- [ ] API 健康檢查正常
- [ ] WebSocket 連線正常
- [ ] 資料庫讀寫正常
- [ ] CORS 設定正確

---

## 效能考量

### 資料庫優化

```sql
-- 建立索引
CREATE INDEX idx_draw_records_employee ON draw_records(employee_id);
CREATE INDEX idx_prizes_remaining ON prizes(remaining) WHERE remaining > 0;
```

### 快取策略（可選）

- 快取可抽獎項列表（60 秒）
- 快取統計資訊（30 秒）

### 並發控制

- 使用資料庫交易確保原子性
- Prisma 的 `$transaction` 自動處理鎖定

---

## 安全性

### 輸入驗證

- 所有 API 輸入需驗證
- 防止 SQL Injection（Prisma 自動處理）
- 防止 XSS 攻擊

### CORS 設定

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
```

### Rate Limiting（可選）

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 100 // 最多 100 次請求
})

app.use('/api/', limiter)
```

---

## 監控與日誌

### 日誌級別

- `error`: 錯誤（需要立即處理）
- `warn`: 警告（需要關注）
- `info`: 一般資訊
- `debug`: 除錯資訊

### 需要記錄的事件

- API 請求與回應
- 抽獎事件（誰抽到什麼）
- 錯誤與異常
- WebSocket 連線/斷線

---

## 時間預估

| 任務 | 預估時間 |
|------|---------|
| 專案初始化 | 30 分鐘 |
| 資料庫設計與遷移 | 1 小時 |
| DrawService 開發 | 2 小時 |
| REST API 開發 | 2 小時 |
| WebSocket 開發 | 1 小時 |
| 測試與除錯 | 1.5 小時 |
| 部署 | 1 小時 |
| **總計** | **9 小時** |

---

## 里程碑

### Milestone 1: 基礎建設（Day 1）
- ✅ 專案初始化
- ✅ 資料庫設計
- ✅ Prisma 設定

### Milestone 2: 核心功能（Day 2）
- ✅ DrawService 實作
- ✅ 員工/獎項管理 API
- ✅ 抽獎 API

### Milestone 3: 即時功能（Day 3）
- ✅ WebSocket 實作
- ✅ 批次抽獎功能

### Milestone 4: 測試與部署（Day 4）
- ✅ 測試
- ✅ 部署到 Railway
- ✅ 前後端整合測試

---

## 參考文件

- [Prisma 文件](https://www.prisma.io/docs/)
- [Socket.io 文件](https://socket.io/docs/v4/)
- [Express 文件](https://expressjs.com/)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)

---

**最後更新**：2026-01-18
**版本**：1.0.0
