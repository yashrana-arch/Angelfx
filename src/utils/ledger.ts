import type { LedgerEntry } from '../types'

/** Sorts entries oldest-first and attaches the running balance after each one. */
export function withRunningBalance(entries: LedgerEntry[]) {
  let balance = 0
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      balance += e.type === 'CREDIT' ? e.amount : -e.amount
      return { ...e, balance }
    })
}
