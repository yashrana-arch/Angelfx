# Veltrex

A trading app built with React 19, TypeScript, Vite and React Router 7. It has a public homepage and one shared login. After login, each user lands in the client app or the admin panel based on the `role` the backend returns.

## Routes

| Area | Routes |
| ---- | ------ |
| Public | `/` homepage (with a hamburger menu on mobile), `/login` |
| Client | `/client` Watchlist, `/client/trades`, `/client/portfolio`, `/client/profile`, `/client/deposit` (UPI QR and bank details), `/client/withdraw`, `/client/ledger`, `/client/change-password` |
| Admin | `/admin` clients list, `/admin/market` Market Watch editor, `/admin/payment` deposit details (common for all clients), `/admin/users/:id` with tabs `portfolio`, `trades`, `ledger`, `withdrawals` (the tab with no suffix is the client's profile) |

A client can't open admin routes, and an admin can't open client routes. Either one is redirected to their own area.

## Setup

```bash
npm install
cp .env.example .env.development.local   # then edit
npm run dev
```

| Variable            | Meaning |
| ------------------- | ------- |
| `VITE_API_BASE_URL` | Backend base URL, e.g. `http://localhost:5000/api` |
| `VITE_USE_MOCK`     | `true` stores data in localStorage instead of calling the backend |

Mock logins: `client@veltrex.com` (or user ID `AD89898HH`) / `client123`, and `admin@veltrex.com` / `admin123`.

## Backend contract

All endpoints live in `src/api/backend.ts`, and the data shapes are in `src/types.ts`. If your backend differs, change those two files.
Auth uses `Authorization: Bearer <token>`. Any 401 logs the user out. Error bodies should be `{ "message": "..." }`.

| Method | Path | Body / Response |
| ------ | ---- | --------------- |
| POST | `/auth/login` | `{ username, password }` (username is the email or user ID) → `{ token, user }`. `user.role` decides the landing page |
| POST | `/auth/register` | `{ name, email, phone?, password }` → `{ token, user }` (creates an unverified client) |
| GET | `/auth/me` | → `User` |
| GET | `/market` | → `MarketWatch` (indices and stocks, shared by all clients) |
| GET | `/payment` | → `PaymentInfo` (UPI QR + bank details, shared by all clients) |
| GET | `/client/portfolio` | → `Portfolio` (summary and positions) |
| GET | `/client/trades` | → `Trade[]` |
| GET | `/client/ledger` | → `LedgerEntry[]` |
| GET/POST | `/client/withdrawals` | → `Withdrawal[]`; POST `{ amount, accountDetails }` → `Withdrawal` |
| POST | `/client/change-password` | `{ currentPassword, newPassword }` |
| PUT | `/admin/market` | `MarketWatch` |
| GET/POST | `/admin/users` | → `User[]`; POST `NewClientInput` → `User` |
| GET/PUT | `/admin/users/:id` | `User`; PUT `ClientUpdate` |
| GET/PUT | `/admin/users/:id/portfolio` | `Portfolio` |
| GET/POST | `/admin/users/:id/trades` | `Trade[]`; POST `TradeInput` → `Trade` |
| PUT/DELETE | `/admin/users/:id/trades/:tradeId` | `TradeInput` → `Trade` / 204 |
| GET/PUT | `/admin/users/:id/ledger` | `LedgerEntry[]` (PUT replaces the whole list) |
| PUT | `/admin/payment` | → `PaymentInfo`; multipart `upiId`, `bankName`, `accountHolderName`, `accountNumber`, `ifscCode`, `note`, `qrImage` (optional file) |
| GET | `/admin/users/:id/withdrawals` | → `Withdrawal[]` |
| PUT | `/admin/users/:id/withdrawals/:wid` | `{ status, adminNote }` → `Withdrawal` |

`PaymentInfo.qrImageUrl` must be a URL the browser can load.
