/**
 * Mock-only mirror of the backend's account maths (VeltrexAPI AccountService), so the
 * mock shows the same figures. The admin manages funds and trades; everything else is derived:
 *
 * Ledger balance   = ledger entries (funds added, adjustments) + closed-trade P&L − approved withdrawals
 * M2M              = P&L of active trades
 * Margin used      = entry value (price × qty) of active and pending trades
 * Margin available = ledger balance − margin used − pending withdrawals + M2M losses
 *                    (unrealised profit only counts once the trade is closed)
 * Today P&L        = M2M + P&L of closed trades dated today
 */
import type { LedgerEntry, Portfolio, Trade, Withdrawal } from '../types'

const round = (n: number) => Math.round(n * 100) / 100
const sum = <T>(list: T[], fn: (x: T) => number) => list.reduce((s, x) => s + fn(x), 0)
const toDay = (iso: string) => iso.slice(0, 10)
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()

/** Manual ledger entries plus the automatic ones (approved withdrawals, closed-trade P&L). */
export function fullLedger(manual: LedgerEntry[], trades: Trade[], withdrawals: Withdrawal[]): LedgerEntry[] {
  return [
    ...manual,
    ...withdrawals
      .filter((w) => w.status === 'APPROVED')
      .map((w): LedgerEntry => ({ id: `wd_${w.id}`, date: toDay(w.createdAt), description: 'Withdrawal', type: 'DEBIT', amount: w.amount })),
    ...trades
      .filter((t) => t.status === 'CLOSED' && t.pnl !== 0)
      .map((t): LedgerEntry => ({
        id: `pnl_${t.id}`,
        date: toDay(t.date),
        description: `${t.pnl > 0 ? 'Profit' : 'Loss'} on ${t.side} ${t.symbol}`,
        type: t.pnl > 0 ? 'CREDIT' : 'DEBIT',
        amount: Math.abs(t.pnl),
      })),
  ].sort((a, b) => a.date.localeCompare(b.date))
}

/** Portfolio summary computed from the account; only `message` is stored. */
export function summarize(message: string, manual: LedgerEntry[], trades: Trade[], withdrawals: Withdrawal[]): Portfolio {
  const ledger = fullLedger(manual, trades, withdrawals)
  const active = trades.filter((t) => t.status === 'ACTIVE').sort((a, b) => b.date.localeCompare(a.date))
  const ledgerBalance = round(sum(ledger, (e) => (e.type === 'CREDIT' ? e.amount : -e.amount)))
  const m2m = round(sum(active, (t) => t.pnl))
  const marginUsed = round(sum(trades.filter((t) => t.status !== 'CLOSED'), (t) => t.entryPrice * t.quantity))
  const held = sum(withdrawals.filter((w) => w.status === 'PENDING'), (w) => w.amount)

  return {
    message,
    ledgerBalance,
    m2m,
    marginUsed,
    marginAvailable: round(ledgerBalance - marginUsed - held + Math.min(m2m, 0)),
    todayPnl: round(m2m + sum(trades.filter((t) => t.status === 'CLOSED' && isToday(t.date)), (t) => t.pnl)),
    positions: active.map((t) => {
      const perUnit = t.quantity ? t.pnl / t.quantity : 0
      return {
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        avgPrice: t.entryPrice,
        ltp: round(t.side === 'BUY' ? t.entryPrice + perUnit : t.entryPrice - perUnit),
        pnl: t.pnl,
      }
    }),
  }
}
