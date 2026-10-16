import type { KycStatus, PaymentProofStatus, WithdrawalStatus } from '../types'

export const proofChip: Record<PaymentProofStatus, string> = {
  PENDING: 'chip-warn',
  APPROVED: 'chip-up',
  REJECTED: 'chip-down',
}

export const proofLabel: Record<PaymentProofStatus, string> = {
  PENDING: 'Under review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
}

/** Chip class + label for a KYC status; `null` means not submitted yet. */
export const kycBadge = (status: KycStatus | null | undefined) =>
  status === 'APPROVED'
    ? { chip: 'chip-up', label: 'KYC verified' }
    : status === 'SUBMITTED'
      ? { chip: 'chip-info', label: 'Under review' }
      : status === 'REJECTED'
        ? { chip: 'chip-down', label: 'Needs changes' }
        : { chip: 'chip-warn', label: 'KYC pending' }

export const withdrawalChip: Record<WithdrawalStatus, string> = {
  PENDING: 'chip-warn',
  APPROVED: 'chip-up',
  REJECTED: 'chip-down',
}
