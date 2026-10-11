/**
 * In-browser mock of the backend, stored in localStorage.
 * Enabled with VITE_USE_MOCK=true. Admin and client must use the same browser.
 *
 * Seed logins:
 *   admin  -> admin@veltrex.com  / admin123
 *   client -> client@veltrex.com (or AD89898HH) / client123
 */
import type {
  LedgerEntry,
  MarketWatch,
  PaymentInfo,
  Portfolio,
  Role,
  Trade,
  User,
  Withdrawal,
} from '../types'
import type { Api } from './backend'
import { ApiError, tokenStore } from './http'

interface StoredUser extends User {
  password: string
}

interface DB {
  users: StoredUser[]
  market: MarketWatch
  portfolios: Record<string, Portfolio>
  trades: Record<string, Trade[]>
  ledgers: Record<string, LedgerEntry[]>
  payment: PaymentInfo
  withdrawals: Record<string, Withdrawal[]>
}

const DB_KEY = 'veltrex_mock_db_v3'

const emptyPortfolio = (): Portfolio => ({
  ledgerBalance: 0,
  marginAvailable: 0,
  marginUsed: 0,
  m2m: 0,
  todayPnl: 0,
  message: '',
  positions: [],
})

const daysAgo = (n: number, hour = 10) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}

function seed(): DB {
  return {
    users: [
      { id: 'u_admin', name: 'Admin', email: 'admin@veltrex.com', role: 'admin', password: 'admin123' },
      {
        id: 'u_client',
        name: 'Shivprakash',
        email: 'client@veltrex.com',
        phone: '9876543210',
        clientCode: 'AD89898HH',
        verified: true,
        role: 'client',
        password: 'client123',
      },
    ],
    market: {
      indices: [
        { id: 'i1', name: 'Nifty 50', value: 22520.45, change: 288.65, changePct: 1.3 },
        { id: 'i2', name: 'Bank Nifty', value: 55256.65, change: 741.6, changePct: 1.36 },
        { id: 'i3', name: 'Sensex', value: 72472.33, change: -879.09, changePct: -1.2 },
      ],
      stocks: [
        { id: 's1', symbol: 'DRREDDY', price: 1197, changePct: 1.4407, volume: 1510336, low: 1172, high: 1200.8 },
        { id: 's2', symbol: 'EICHERMOT', price: 7050, changePct: 4.1744, volume: 551231, low: 6801, high: 7078 },
        { id: 's3', symbol: 'GRASIM', price: 2890, changePct: -1.1621, volume: 222643, low: 2857.8, high: 2894.9 },
        { id: 's4', symbol: 'HCLTECH', price: 1216.7, changePct: 3.3818, volume: 2934650, low: 1175, high: 1221 },
        { id: 's5', symbol: 'HDFC', price: 2724.3, changePct: 0, volume: 0, low: 2710.6, high: 2777.65 },
        { id: 's6', symbol: 'HDFCBANK', price: 707.25, changePct: -2.1668, volume: 18397972, low: 695.3, high: 710.15 },
        { id: 's7', symbol: 'RELIANCE', price: 2945.1, changePct: 0.84, volume: 6412050, low: 2911.4, high: 2958 },
        { id: 's8', symbol: 'TCS', price: 4012.55, changePct: -0.42, volume: 1288410, low: 3990, high: 4040.2 },
      ],
    },
    portfolios: {
      u_client: {
        ledgerBalance: 50000,
        marginAvailable: 38250,
        marginUsed: 11750,
        m2m: 1840,
        todayPnl: 2365.5,
        message: 'Market hours: 9:15 AM to 3:30 PM IST',
        positions: [
          { id: 'p1', symbol: 'NIFTY 22500 CE', side: 'BUY', quantity: 50, avgPrice: 112.4, ltp: 140.2, pnl: 1390 },
          { id: 'p2', symbol: 'HDFCBANK', side: 'SELL', quantity: 100, avgPrice: 711.5, ltp: 707.25, pnl: 425 },
        ],
      },
    },
    trades: {
      u_client: [
        { id: 't1', symbol: 'NIFTY 22500 CE', side: 'BUY', orderType: 'MARKET', quantity: 50, entryPrice: 112.4, exitPrice: null, pnl: 1390, status: 'ACTIVE', date: daysAgo(0, 9) },
        { id: 't2', symbol: 'HDFCBANK', side: 'SELL', orderType: 'LIMIT', quantity: 100, entryPrice: 711.5, exitPrice: null, pnl: 425, status: 'ACTIVE', date: daysAgo(0, 11) },
        { id: 't3', symbol: 'TCS', side: 'BUY', orderType: 'LIMIT', quantity: 10, entryPrice: 3980, exitPrice: null, pnl: 0, status: 'PENDING', date: daysAgo(0, 12) },
        { id: 't4', symbol: 'RELIANCE', side: 'BUY', orderType: 'MARKET', quantity: 25, entryPrice: 2901, exitPrice: 2944, pnl: 1075, status: 'CLOSED', date: daysAgo(1) },
        { id: 't5', symbol: 'BANKNIFTY FUT', side: 'SELL', orderType: 'MARKET', quantity: 15, entryPrice: 52300, exitPrice: 52370, pnl: -1050, status: 'CLOSED', date: daysAgo(2) },
      ],
    },
    ledgers: {
      u_client: [
        { id: 'l1', date: daysAgo(10).slice(0, 10), description: 'UPI deposit', type: 'CREDIT', amount: 40000 },
        { id: 'l2', date: daysAgo(5).slice(0, 10), description: 'UPI deposit', type: 'CREDIT', amount: 10000 },
        { id: 'l3', date: daysAgo(2).slice(0, 10), description: 'Brokerage & charges', type: 'DEBIT', amount: 120 },
        { id: 'l4', date: daysAgo(1).slice(0, 10), description: 'Realised profit', type: 'CREDIT', amount: 120 },
      ],
    },
    payment: {
      qrImageUrl: null,
      upiId: '',
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      note: '',
    },
    withdrawals: {
      u_client: [
        { id: 'w1', amount: 5000, accountDetails: 'shiv@okaxis', status: 'APPROVED', adminNote: 'Paid', createdAt: daysAgo(6) },
      ],
    },
  }
}

function load(): DB {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) return JSON.parse(raw) as DB
  const db = seed()
  save(db)
  return db
}

function save(db: DB) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    throw new ApiError(507, 'Mock storage is full. Try a smaller QR image.')
  }
}

const delay = <T>(value: T) => new Promise<T>((r) => setTimeout(() => r(value), 200))
const uid = () => Math.random().toString(36).slice(2, 10)
const publicUser = ({ id, name, email, phone, role, clientCode, verified }: StoredUser): User => ({
  id, name, email, phone, role, clientCode, verified,
})

function currentUser(db: DB, role?: Role): StoredUser {
  const token = tokenStore.get()
  const user = db.users.find((u) => token === `mock:${u.id}`)
  if (!user) throw new ApiError(401, 'Not authenticated')
  if (role && user.role !== role) throw new ApiError(403, 'Forbidden')
  return user
}

function getClient(db: DB, userId: string): StoredUser {
  currentUser(db, 'admin')
  const user = db.users.find((u) => u.id === userId && u.role === 'client')
  if (!user) throw new ApiError(404, 'Client not found')
  return user
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const mockApi: Api = {
  auth: {
    async login(username, password) {
      const db = load()
      const id = username.toLowerCase()
      const user = db.users.find(
        (u) => (u.email.toLowerCase() === id || u.clientCode?.toLowerCase() === id) && u.password === password,
      )
      if (!user) throw new ApiError(401, 'Invalid credentials')
      return delay({ token: `mock:${user.id}`, user: publicUser(user) })
    },
    async register(input) {
      const db = load()
      if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError(409, 'A user with this email already exists')
      }
      const user: StoredUser = { id: `u_${uid()}`, role: 'client', verified: false, ...input }
      db.users.push(user)
      save(db)
      return delay({ token: `mock:${user.id}`, user: publicUser(user) })
    },
    async me() {
      return delay(publicUser(currentUser(load())))
    },
  },

  market: {
    async get() {
      const db = load()
      currentUser(db)
      return delay(db.market)
    },
  },

  payment: {
    async get() {
      const db = load()
      currentUser(db)
      return delay(db.payment)
    },
  },

  client: {
    async getPortfolio() {
      const db = load()
      return delay(db.portfolios[currentUser(db, 'client').id] ?? emptyPortfolio())
    },
    async getTrades() {
      const db = load()
      return delay(db.trades[currentUser(db, 'client').id] ?? [])
    },
    async getLedger() {
      const db = load()
      return delay(db.ledgers[currentUser(db, 'client').id] ?? [])
    },
    async getWithdrawals() {
      const db = load()
      return delay(db.withdrawals[currentUser(db, 'client').id] ?? [])
    },
    async requestWithdrawal(input) {
      const db = load()
      const user = currentUser(db, 'client')
      const available = db.portfolios[user.id]?.marginAvailable ?? 0
      if (input.amount <= 0) throw new ApiError(400, 'Enter a valid amount')
      if (input.amount > available) throw new ApiError(400, 'Amount exceeds available margin')
      const w: Withdrawal = { id: uid(), ...input, status: 'PENDING', adminNote: '', createdAt: new Date().toISOString() }
      db.withdrawals[user.id] = [w, ...(db.withdrawals[user.id] ?? [])]
      save(db)
      return delay(w)
    },
    async changePassword(currentPassword, newPassword) {
      const db = load()
      const user = currentUser(db, 'client')
      if (user.password !== currentPassword) throw new ApiError(400, 'Current password is incorrect')
      user.password = newPassword
      save(db)
      return delay(undefined)
    },
  },

  admin: {
    async updateMarket(market) {
      const db = load()
      currentUser(db, 'admin')
      db.market = market
      save(db)
      return delay(market)
    },

    async listUsers() {
      const db = load()
      currentUser(db, 'admin')
      return delay(db.users.filter((u) => u.role === 'client').map(publicUser))
    },
    async getUser(userId) {
      return delay(publicUser(getClient(load(), userId)))
    },
    async createUser(input) {
      const db = load()
      currentUser(db, 'admin')
      if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError(409, 'A user with this email already exists')
      }
      const user: StoredUser = { id: `u_${uid()}`, role: 'client', verified: false, ...input }
      db.users.push(user)
      save(db)
      return delay(publicUser(user))
    },
    async updateUser(userId, input) {
      const db = load()
      const user = getClient(db, userId)
      const { password, ...rest } = input
      Object.assign(user, rest)
      if (password) user.password = password
      save(db)
      return delay(publicUser(user))
    },

    async getPortfolio(userId) {
      const db = load()
      getClient(db, userId)
      return delay(db.portfolios[userId] ?? emptyPortfolio())
    },
    async updatePortfolio(userId, portfolio) {
      const db = load()
      getClient(db, userId)
      db.portfolios[userId] = portfolio
      save(db)
      return delay(portfolio)
    },

    async getTrades(userId) {
      const db = load()
      getClient(db, userId)
      return delay(db.trades[userId] ?? [])
    },
    async addTrade(userId, input) {
      const db = load()
      getClient(db, userId)
      const trade: Trade = { id: uid(), ...input }
      db.trades[userId] = [...(db.trades[userId] ?? []), trade]
      save(db)
      return delay(trade)
    },
    async updateTrade(userId, tradeId, input) {
      const db = load()
      getClient(db, userId)
      const trade: Trade = { id: tradeId, ...input }
      db.trades[userId] = (db.trades[userId] ?? []).map((t) => (t.id === tradeId ? trade : t))
      save(db)
      return delay(trade)
    },
    async deleteTrade(userId, tradeId) {
      const db = load()
      getClient(db, userId)
      db.trades[userId] = (db.trades[userId] ?? []).filter((t) => t.id !== tradeId)
      save(db)
      return delay(undefined)
    },

    async getLedger(userId) {
      const db = load()
      getClient(db, userId)
      return delay(db.ledgers[userId] ?? [])
    },
    async updateLedger(userId, entries) {
      const db = load()
      getClient(db, userId)
      db.ledgers[userId] = entries
      save(db)
      return delay(entries)
    },

    async updatePayment({ qrImage, ...fields }) {
      const db = load()
      currentUser(db, 'admin')
      const payment: PaymentInfo = {
        ...fields,
        ifscCode: fields.ifscCode.toUpperCase(),
        qrImageUrl: qrImage ? await fileToDataUrl(qrImage) : db.payment.qrImageUrl,
      }
      db.payment = payment
      save(db)
      return delay(payment)
    },

    async getWithdrawals(userId) {
      const db = load()
      getClient(db, userId)
      return delay(db.withdrawals[userId] ?? [])
    },
    async updateWithdrawal(userId, id, status, adminNote) {
      const db = load()
      getClient(db, userId)
      const list = db.withdrawals[userId] ?? []
      const w = list.find((x) => x.id === id)
      if (!w) throw new ApiError(404, 'Request not found')
      w.status = status
      w.adminNote = adminNote
      save(db)
      return delay({ ...w })
    },
  },
}
