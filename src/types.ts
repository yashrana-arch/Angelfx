export type Role = 'client' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  /** Broker-style client ID shown on the profile, e.g. AD89898HH. */
  clientCode?: string
  verified?: boolean
}

export interface LoginResponse {
  token: string
  user: User
}

/* ---------- Market watch (shared by all clients) ---------- */

export interface MarketIndex {
  id: string
  name: string
  value: number
  change: number
  changePct: number
}

export interface Stock {
  id: string
  symbol: string
  price: number
  changePct: number
  volume: number
  low: number
  high: number
}

export interface MarketWatch {
  indices: MarketIndex[]
  stocks: Stock[]
}

/* ---------- Per-client data ---------- */

export type TradeSide = 'BUY' | 'SELL'

export interface Position {
  id: string
  symbol: string
  side: TradeSide
  quantity: number
  avgPrice: number
  ltp: number
  pnl: number
}

/** Account summary shown on the client's Portfolio page. */
export interface Portfolio {
  ledgerBalance: number
  marginAvailable: number
  marginUsed: number
  m2m: number
  todayPnl: number
  message: string
  positions: Position[]
}

export type TradeStatus = 'PENDING' | 'ACTIVE' | 'CLOSED'
export type OrderType = 'MARKET' | 'LIMIT'

export interface Trade {
  id: string
  symbol: string
  side: TradeSide
  orderType: OrderType
  quantity: number
  entryPrice: number
  exitPrice: number | null
  pnl: number
  status: TradeStatus
  date: string // ISO datetime
}

export type TradeInput = Omit<Trade, 'id'>

export type LedgerType = 'CREDIT' | 'DEBIT'

export interface LedgerEntry {
  id: string
  date: string // yyyy-mm-dd
  description: string
  type: LedgerType
  amount: number
}

/** Recharge details shown on the client's Deposit page. */
/** Deposit details shared by all clients: UPI QR plus bank transfer details. */
export interface PaymentInfo {
  qrImageUrl: string | null
  upiId: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  note: string
}

export interface PaymentUpdate {
  upiId: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  note: string
  /** New QR image to upload; omit to keep the existing one. */
  qrImage?: File
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Withdrawal {
  id: string
  amount: number
  accountDetails: string
  status: WithdrawalStatus
  adminNote: string
  createdAt: string // ISO datetime
}

export interface WithdrawalInput {
  amount: number
  accountDetails: string
}

export interface RegisterInput {
  name: string
  email: string
  phone?: string
  password: string
}

export interface NewClientInput {
  name: string
  email: string
  phone?: string
  clientCode?: string
  password: string
}

export interface ClientUpdate {
  name: string
  email: string
  phone?: string
  clientCode?: string
  verified: boolean
  /** Set to reset the client's password; omit to keep it. */
  password?: string
}
