import type { WithdrawalStatus } from '../types'

export const withdrawalChip: Record<WithdrawalStatus, string> = {
  PENDING: 'chip-warn',
  APPROVED: 'chip-up',
  REJECTED: 'chip-down',
}
