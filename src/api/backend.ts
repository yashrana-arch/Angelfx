/**
 * Real backend implementation.
 *
 * Every endpoint the frontend uses is listed here. If your backend uses
 * different paths or payload shapes, adjust them in this file only.
 */
import type {
  ClientUpdate,
  Kyc,
  KycInput,
  KycStatus,
  LedgerEntry,
  LoginResponse,
  MarketWatch,
  NewClientInput,
  PaymentInfo,
  PaymentProof,
  PaymentProofStatus,
  PaymentProofUpload,
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
    getPaymentProofs: () => request<PaymentProof[]>('/client/payment-proofs'),
    // POST multipart/form-data: image (file), amount?, reference?
    uploadPaymentProof: ({ image, amount, reference }: PaymentProofUpload) => {
      const form = new FormData()
      form.append('image', image)
      if (amount) form.append('amount', String(amount))
      if (reference) form.append('reference', reference)
      return request<PaymentProof>('/client/payment-proofs', { method: 'POST', body: form })
    },
    getPaymentProofImage: (proofId: string) =>
      request<Blob>(`/client/payment-proofs/${proofId}/image`, { blob: true }),

    // GET returns 204 (-> null) until the client has submitted KYC.
    getKyc: () => request<Kyc | undefined>('/client/kyc').then((k) => k ?? null),
    // Submits or re-submits; puts the KYC back into review.
    submitKyc: (input: KycInput) => request<Kyc>('/client/kyc', { method: 'PUT', body: input }),
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

    // All clients' screenshots, newest first; pass a status for the review queue.
    listPaymentProofs: (status?: PaymentProofStatus) =>
      request<PaymentProof[]>(`/admin/payment-proofs${status ? `?status=${status}` : ''}`),
    getPaymentProofs: (userId: string) => request<PaymentProof[]>(`/admin/users/${userId}/payment-proofs`),
    getPaymentProofImage: (userId: string, proofId: string) =>
      request<Blob>(`/admin/users/${userId}/payment-proofs/${proofId}/image`, { blob: true }),
    // Approving doesn't credit the ledger; the admin does that on the Ledger tab.
    updatePaymentProof: (userId: string, proofId: string, status: PaymentProofStatus, adminNote: string) =>
      request<PaymentProof>(`/admin/users/${userId}/payment-proofs/${proofId}`, {
        method: 'PUT',
        body: { status, adminNote },
      }),

    getKyc: (userId: string) => request<Kyc | undefined>(`/admin/users/${userId}/kyc`).then((k) => k ?? null),
    saveKyc: (userId: string, input: KycInput) =>
      request<Kyc>(`/admin/users/${userId}/kyc`, { method: 'PUT', body: input }),
    // APPROVED also marks the client verified; REJECTED un-verifies.
    setKycStatus: (userId: string, status: KycStatus, adminNote: string) =>
      request<Kyc>(`/admin/users/${userId}/kyc/status`, { method: 'PUT', body: { status, adminNote } }),

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
