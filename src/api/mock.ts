/**
 * In-browser mock of the backend, stored in localStorage.
 * Enabled with VITE_USE_MOCK=true. Admin and client must use the same browser.
 *
 * Seed logins:
 *   admin  -> admin@veltrex.com  / admin123
 *   client -> client@veltrex.com (or AD89898HH) / client123
 */
import type {
  Kyc,
  KycInput,
  PaymentProof,
  SupportConversation,
  SupportMessage,
  SupportThread,
  LedgerEntry,
  MarketWatch,
  PaymentInfo,
  Portfolio,
  Role,
  Trade,
  User,
  Withdrawal,
} from '../types'
import { fullLedger, summarize } from './account'
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
  kyc: Record<string, Kyc>
  /** Newest first. The mock keeps the image as a data URL. */
  proofs: (PaymentProof & { dataUrl: string })[]
  /** All support messages, oldest first; `userId` is the client the conversation belongs to. */
  support: (SupportMessage & { userId: string })[]
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

/** Calculated account summary, same rules as the backend (see ./account). */
const portfolioOf = (db: DB, userId: string) =>
  summarize(db.portfolios[userId]?.message ?? '', db.ledgers[userId] ?? [], db.trades[userId] ?? [], db.withdrawals[userId] ?? [])

const daysAgo =(n: number, hour = 10) => {
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
    kyc: {},
    proofs: [],
    support: [],
    withdrawals: {
      u_client: [
        { id: 'w1', amount: 5000, accountDetails: 'shiv@okaxis', status: 'APPROVED', adminNote: 'Paid', createdAt: daysAgo(6) },
      ],
    },
  }
}

function load(): DB {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) {
    const db = JSON.parse(raw) as DB
    db.kyc ??= {} // added after v3 was seeded
    db.proofs ??= []
    db.support ??= []
    return db
  }
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
const publicUser = ({ id, name, email, phone, role, clientCode, verified, kycStatus }: StoredUser): User => ({
  id, name, email, phone, role, clientCode, verified, kycStatus: kycStatus ?? null,
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

/** Same clean-up the API does: strip spaces from numbers, upper-case codes. */
const normalizeKyc = (i: KycInput): KycInput => ({
  ...i,
  phone: i.phone.replace(/[\s-]/g, ''),
  accountNumber: i.accountNumber.replace(/[\s-]/g, ''),
  aadhaarNumber: i.aadhaarNumber.replace(/[\s-]/g, ''),
  ifscCode: i.ifscCode.trim().toUpperCase(),
  panNumber: i.panNumber.trim().toUpperCase(),
})

/* Support chat helpers (mirror SupportService in the API) */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const publicMessage = ({ userId, ...m }: DB['support'][number]): SupportMessage => m

function supportThread(db: DB, userId: string, viewerIsAdmin: boolean, afterId?: number): SupportThread {
  const mine = db.support.filter((m) => m.userId === userId)
  const messages = (afterId ? mine.filter((m) => m.id > afterId) : mine.slice(-200)).map(publicMessage)
  const read = mine.filter((m) => m.fromAdmin === viewerIsAdmin && m.readAt)
  return { messages, readUpTo: read.length ? read[read.length - 1]!.id : null }
}

function addSupportMessage(db: DB, userId: string, fromAdmin: boolean, body: string): SupportMessage {
  const text = body.trim()
  if (!text) throw new ApiError(400, 'Type a message')
  if (text.length > 2000) throw new ApiError(400, 'Message is too long (max 2000 characters)')
  const m = { id: (db.support.at(-1)?.id ?? 0) + 1, userId, fromAdmin, body: text, createdAt: new Date().toISOString(), readAt: null }
  db.support.push(m)
  save(db)
  return publicMessage(m)
}

function markSupportRead(db: DB, userId: string, viewerIsAdmin: boolean) {
  const now = new Date().toISOString()
  db.support.forEach((m) => {
    if (m.userId === userId && m.fromAdmin !== viewerIsAdmin && !m.readAt) m.readAt = now
  })
  save(db)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const publicProof =({ dataUrl, ...p }: DB['proofs'][number]): PaymentProof => p

async function proofImage(p: DB['proofs'][number] | undefined): Promise<Blob> {
  if (!p) throw new ApiError(404, 'Screenshot not found')
  return (await fetch(p.dataUrl)).blob()
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
      return delay(portfolioOf(db, currentUser(db, 'client').id))
    },
    async getTrades() {
      const db = load()
      return delay(db.trades[currentUser(db, 'client').id] ?? [])
    },
    async getLedger() {
      const db = load()
      const id = currentUser(db, 'client').id
      return delay(fullLedger(db.ledgers[id] ?? [], db.trades[id] ?? [], db.withdrawals[id] ?? []))
    },
    async getWithdrawals() {
      const db = load()
      return delay(db.withdrawals[currentUser(db, 'client').id] ?? [])
    },
    async requestWithdrawal(input) {
      const db = load()
      const user = currentUser(db, 'client')
      const available = portfolioOf(db, user.id).marginAvailable
      if (input.amount <= 0) throw new ApiError(400, 'Enter a valid amount')
      if (input.amount > available) throw new ApiError(400, 'Amount exceeds available margin')
      const w: Withdrawal = { id: uid(), ...input, status: 'PENDING', adminNote: '', createdAt: new Date().toISOString() }
      db.withdrawals[user.id] = [w, ...(db.withdrawals[user.id] ?? [])]
      save(db)
      return delay(w)
    },
    async getSupportThread(afterId) {
      const db = load()
      return delay(supportThread(db, currentUser(db, 'client').id, false, afterId))
    },
    async sendSupportMessage(body) {
      const db = load()
      return delay(addSupportMessage(db, currentUser(db, 'client').id, false, body))
    },
    async markSupportRead() {
      const db = load()
      markSupportRead(db, currentUser(db, 'client').id, false)
      return delay(undefined)
    },
    async getSupportUnread() {
      const db = load()
      const id = currentUser(db, 'client').id
      return delay({ count: db.support.filter((m) => m.userId === id && m.fromAdmin && !m.readAt).length })
    },

    async getPaymentProofs() {
      const db = load()
      const user = currentUser(db, 'client')
      return delay(db.proofs.filter((p) => p.userId === user.id).map(publicProof))
    },
    async uploadPaymentProof({ image, amount, reference }) {
      const db = load()
      const user = currentUser(db, 'client')
      if (!image.type.startsWith('image/')) throw new ApiError(400, 'Please upload a PNG, JPG, WEBP or GIF image')
      if (image.size > 5 * 1024 * 1024) throw new ApiError(400, 'Image must be under 5 MB')
      const proof = {
        id: uid(),
        userId: user.id,
        clientName: user.name,
        clientCode: user.clientCode ?? null,
        amount: amount ?? null,
        reference: reference?.trim() ?? '',
        fileName: image.name,
        fileSize: image.size,
        status: 'PENDING' as const,
        adminNote: '',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        dataUrl: await fileToDataUrl(image),
      }
      db.proofs.unshift(proof)
      save(db)
      return delay(publicProof(proof))
    },
    async deletePaymentProof(proofId) {
      const db = load()
      const user = currentUser(db, 'client')
      const p = db.proofs.find((x) => x.id === proofId && x.userId === user.id)
      if (!p) throw new ApiError(404, 'Screenshot not found')
      if (p.status !== 'PENDING') throw new ApiError(409, "This screenshot has already been reviewed, so it can't be deleted")
      db.proofs = db.proofs.filter((x) => x !== p)
      save(db)
      return delay(undefined)
    },
    async getPaymentProofImage(proofId) {
      const db = load()
      const user = currentUser(db, 'client')
      return proofImage(db.proofs.find((p) => p.id === proofId && p.userId === user.id))
    },
    async getKyc() {
      const db = load()
      return delay(db.kyc[currentUser(db, 'client').id] ?? null)
    },
    async submitKyc(input) {
      const db = load()
      const user = currentUser(db, 'client')
      if (db.kyc[user.id]?.status === 'APPROVED') {
        throw new ApiError(409, 'Your KYC is already approved. Contact support to change your details.')
      }
      const kyc: Kyc = { ...normalizeKyc(input), status: 'SUBMITTED', adminNote: '', submittedAt: new Date().toISOString(), reviewedAt: null }
      db.kyc[user.id] = kyc
      user.kycStatus = kyc.status
      save(db)
      return delay(kyc)
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

    async listSupportConversations() {
      const db = load()
      currentUser(db, 'admin')
      const byUser = new Map<string, SupportConversation>()
      for (const m of db.support) {
        const user = db.users.find((u) => u.id === m.userId)
        if (!user) continue
        const prev = byUser.get(m.userId)
        byUser.set(m.userId, {
          userId: m.userId,
          clientName: user.name,
          clientCode: user.clientCode ?? null,
          email: user.email,
          lastMessage: m.body.length > 120 ? `${m.body.slice(0, 120)}…` : m.body,
          lastFromAdmin: m.fromAdmin,
          lastAt: m.createdAt,
          unread: (prev?.unread ?? 0) + (!m.fromAdmin && !m.readAt ? 1 : 0),
        })
      }
      return delay([...byUser.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt)))
    },
    async getSupportUnread() {
      const db = load()
      currentUser(db, 'admin')
      return delay({ count: db.support.filter((m) => !m.fromAdmin && !m.readAt).length })
    },
    async getSupportThread(userId, afterId) {
      const db = load()
      getClient(db, userId)
      return delay(supportThread(db, userId, true, afterId))
    },
    async sendSupportMessage(userId, body) {
      const db = load()
      getClient(db, userId)
      return delay(addSupportMessage(db, userId, true, body))
    },
    async markSupportRead(userId) {
      const db = load()
      getClient(db, userId)
      markSupportRead(db, userId, true)
      return delay(undefined)
    },

    async listPaymentProofs(status) {
      const db = load()
      currentUser(db, 'admin')
      return delay(db.proofs.filter((p) => !status || p.status === status).map(publicProof))
    },
    async getPaymentProofs(userId) {
      const db = load()
      getClient(db, userId)
      return delay(db.proofs.filter((p) => p.userId === userId).map(publicProof))
    },
    async deletePaymentProof(userId, proofId) {
      const db = load()
      getClient(db, userId)
      const before = db.proofs.length
      db.proofs = db.proofs.filter((x) => !(x.id === proofId && x.userId === userId))
      if (db.proofs.length === before) throw new ApiError(404, 'Screenshot not found')
      save(db)
      return delay(undefined)
    },
    async getPaymentProofImage(userId, proofId) {
      const db = load()
      getClient(db, userId)
      return proofImage(db.proofs.find((p) => p.id === proofId && p.userId === userId))
    },
    async updatePaymentProof(userId, proofId, status, adminNote) {
      const db = load()
      getClient(db, userId)
      const p = db.proofs.find((x) => x.id === proofId && x.userId === userId)
      if (!p) throw new ApiError(404, 'Screenshot not found')
      p.status = status
      p.adminNote = adminNote.trim()
      p.reviewedAt = status === 'PENDING' ? null : new Date().toISOString()
      save(db)
      return delay(publicProof(p))
    },

    async getKyc(userId) {
      const db = load()
      getClient(db, userId)
      return delay(db.kyc[userId] ?? null)
    },
    async saveKyc(userId, input) {
      const db = load()
      const user = getClient(db, userId)
      const prev = db.kyc[userId]
      const kyc: Kyc = prev
        ? { ...prev, ...normalizeKyc(input) }
        : { ...normalizeKyc(input), status: 'SUBMITTED', adminNote: '', submittedAt: new Date().toISOString(), reviewedAt: null }
      db.kyc[userId] = kyc
      user.kycStatus = kyc.status
      save(db)
      return delay(kyc)
    },
    async setKycStatus(userId, status, adminNote) {
      const db = load()
      const user = getClient(db, userId)
      const kyc = db.kyc[userId]
      if (!kyc) throw new ApiError(400, "This client hasn't submitted KYC details yet")
      kyc.status = status
      kyc.adminNote = adminNote.trim()
      kyc.reviewedAt = status === 'SUBMITTED' ? null : new Date().toISOString()
      user.kycStatus = status
      if (status === 'APPROVED') user.verified = true
      if (status === 'REJECTED') user.verified = false
      save(db)
      return delay({ ...kyc })
    },

    async getPortfolio(userId) {
      const db = load()
      getClient(db, userId)
      return delay(portfolioOf(db, userId))
    },
    async updatePortfolio(userId, portfolio) {
      const db = load()
      getClient(db, userId)
      // Only the announcement is stored; the figures are calculated.
      db.portfolios[userId] = { ...(db.portfolios[userId] ?? emptyPortfolio()), message: portfolio.message.trim() }
      save(db)
      return delay(portfolioOf(db, userId))
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
    async addFunds(userId, { amount, description }) {
      const db = load()
      getClient(db, userId)
      if (!(amount > 0)) throw new ApiError(400, 'Enter a valid amount')
      const entry: LedgerEntry = {
        id: uid(),
        date: new Date().toISOString().slice(0, 10),
        description: description?.trim() || 'Funds added',
        type: 'CREDIT',
        amount,
      }
      db.ledgers[userId] = [...(db.ledgers[userId] ?? []), entry]
      save(db)
      return delay(entry)
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
      // A pending request is already held back from available margin; a rejected one would be newly deducted.
      if (status === 'APPROVED' && w.status !== 'APPROVED') {
        const hold = w.status === 'PENDING' ? 0 : w.amount
        if (portfolioOf(db, userId).marginAvailable - hold < 0)
          throw new ApiError(400, "The client's available margin is too low to approve this withdrawal")
      }
      w.status = status
      w.adminNote = adminNote
      save(db)
      return delay({ ...w })
    },
  },
}
