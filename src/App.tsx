import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthContext'
import { RequireRole } from './auth/RequireRole'
import AdminLayout from './layouts/AdminLayout'
import ClientLayout from './layouts/ClientLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ClientDetail from './pages/admin/ClientDetail'
import Clients from './pages/admin/Clients'
import ClientPaymentProofs from './pages/admin/ClientPaymentProofs'
import EditKyc from './pages/admin/EditKyc'
import EditLedger from './pages/admin/EditLedger'
import EditPortfolio from './pages/admin/EditPortfolio'
import EditProfile from './pages/admin/EditProfile'
import EditTrades from './pages/admin/EditTrades'
import MarketWatchEditor from './pages/admin/MarketWatchEditor'
import PaymentProofsQueue from './pages/admin/PaymentProofsQueue'
import PaymentSettings from './pages/admin/PaymentSettings'
import Withdrawals from './pages/admin/Withdrawals'
import ChangePassword from './pages/client/ChangePassword'
import Deposit from './pages/client/Deposit'
import Kyc from './pages/client/Kyc'
import Ledger from './pages/client/Ledger'
import Portfolio from './pages/client/Portfolio'
import Profile from './pages/client/Profile'
import Trades from './pages/client/Trades'
import Watchlist from './pages/client/Watchlist'
import Withdraw from './pages/client/Withdraw'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />

          {/* Client */}
          <Route element={<RequireRole role="client" />}>
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<Watchlist />} />
              <Route path="trades" element={<Trades />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="profile" element={<Profile />} />
              <Route path="kyc" element={<Kyc />} />
              <Route path="deposit" element={<Deposit />} />
              <Route path="withdraw" element={<Withdraw />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<RequireRole role="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Clients />} />
              <Route path="market" element={<MarketWatchEditor />} />
              <Route path="payment" element={<PaymentSettings />} />
              <Route path="payment-proofs" element={<PaymentProofsQueue />} />
              <Route path="users/:userId" element={<ClientDetail />}>
                <Route index element={<EditProfile />} />
                <Route path="kyc" element={<EditKyc />} />
                <Route path="portfolio" element={<EditPortfolio />} />
                <Route path="trades" element={<EditTrades />} />
                <Route path="ledger" element={<EditLedger />} />
                <Route path="deposits" element={<ClientPaymentProofs />} />
                <Route path="withdrawals" element={<Withdrawals />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
