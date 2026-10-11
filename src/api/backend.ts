/**
 * Real backend implementation.
 *
 * Every endpoint the frontend uses is listed here. If your backend uses
 * different paths or payload shapes, adjust them in this file only.
 */
import type {
  ClientUpdate,
  LedgerEntry,
  LoginResponse,
  MarketWatch,
  NewClientInput,
  PaymentInfo,
  PaymentUpdate,
  Portfolio,
  RegisterInput,
  Trade,
  TradeInput,
  User,
  Withdrawal,
  WithdrawalInput,
  WithdrawalStatus,
} from '../types'
import { request } from './http'

export const backendApi = {
  auth: {
    // POST /auth/login  { username, password } -> { token, user }
    // username = email or client code; the user's role decides where they land.
    login: (username: string, password: string) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: { username, password } }),
    // POST /auth/register  { name, email, phone?, password } -> { token, user }
    // Self sign-up creates an unverified client account.
    register: (input: RegisterInput) =>
      request<LoginResponse>('/auth/register', { method: 'POST', body: input }),
    me: () => request<User>('/auth/me'),
  },

  /** Shared market data, readable by any logged-in user. */
  market: {
    get: () => request<MarketWatch>('/market'),
  },

  /** Deposit details (UPI QR + bank account), common for all clients. */
  payment: {
    get: () => request<PaymentInfo>('/payment'),
  },

  /** Endpoints for the logged-in client (scoped to their own data by token). */
  client: {
    getPortfolio: () => request<Portfolio>('/client/portfolio'),
    getTrades: () => request<Trade[]>('/client/trades'),
    getLedger: () => request<LedgerEntry[]>('/client/ledger'),
    getWithdrawals: () => request<Withdrawal[]>('/client/withdrawals'),
    requestWithdrawal: (input: WithdrawalInput) =>
      request<Withdrawal>('/client/withdrawals', { method: 'POST', body: input }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<void>('/client/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      }),
  },

  admin: {
    updateMarket: (market: MarketWatch) =>
      request<MarketWatch>('/admin/market', { method: 'PUT', body: market }),

    listUsers: () => request<User[]>('/admin/users'),
    getUser: (userId: string) => request<User>(`/admin/users/${userId}`),
    createUser: (input: NewClientInput) =>
      request<User>('/admin/users', { method: 'POST', body: input }),
    updateUser: (userId: string, input: ClientUpdate) =>
      request<User>(`/admin/users/${userId}`, { method: 'PUT', body: input }),

    getPortfolio: (userId: string) => request<Portfolio>(`/admin/users/${userId}/portfolio`),
    updatePortfolio: (userId: string, portfolio: Portfolio) =>
      request<Portfolio>(`/admin/users/${userId}/portfolio`, { method: 'PUT', body: portfolio }),

    getTrades: (userId: string) => request<Trade[]>(`/admin/users/${userId}/trades`),
    addTrade: (userId: string, trade: TradeInput) =>
      request<Trade>(`/admin/users/${userId}/trades`, { method: 'POST', body: trade }),
    updateTrade: (userId: string, tradeId: string, trade: TradeInput) =>
      request<Trade>(`/admin/users/${userId}/trades/${tradeId}`, { method: 'PUT', body: trade }),
    deleteTrade: (userId: string, tradeId: string) =>
      request<void>(`/admin/users/${userId}/trades/${tradeId}`, { method: 'DELETE' }),

    getLedger: (userId: string) => request<LedgerEntry[]>(`/admin/users/${userId}/ledger`),
    // Replaces the whole ledger list.
    updateLedger: (userId: string, entries: LedgerEntry[]) =>
      request<LedgerEntry[]>(`/admin/users/${userId}/ledger`, { method: 'PUT', body: entries }),

    // PUT multipart/form-data: upiId, bankName, accountHolderName, accountNumber, ifscCode, note, qrImage (file, optional)
    updatePayment: (update: PaymentUpdate) => {
      const form = new FormData()
      form.append('upiId', update.upiId)
      form.append('bankName', update.bankName)
      form.append('accountHolderName', update.accountHolderName)
      form.append('accountNumber', update.accountNumber)
      form.append('ifscCode', update.ifscCode)
      form.append('note', update.note)
      if (update.qrImage) form.append('qrImage', update.qrImage)
      return request<PaymentInfo>('/admin/payment', { method: 'PUT', body: form })
    },

    getWithdrawals: (userId: string) =>
      request<Withdrawal[]>(`/admin/users/${userId}/withdrawals`),
    updateWithdrawal: (userId: string, id: string, status: WithdrawalStatus, adminNote: string) =>
      request<Withdrawal>(`/admin/users/${userId}/withdrawals/${id}`, {
        method: 'PUT',
        body: { status, adminNote },
      }),
  },
}

export type Api = typeof backendApi
