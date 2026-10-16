import { FileText, Landmark, MapPin, UserRound, type LucideIcon } from 'lucide-react'
import type { KycInput, User } from '../types'

export type KycSectionKey = 'personal' | 'address' | 'bank' | 'documents'

export const KYC_SECTIONS: { key: KycSectionKey; title: string; short: string; hint: string; icon: LucideIcon }[] = [
  { key: 'personal', title: 'Personal details', short: 'Personal', hint: 'As they appear on your PAN card', icon: UserRound },
  { key: 'address', title: 'Address', short: 'Address', hint: 'Your current residential address', icon: MapPin },
  { key: 'bank', title: 'Bank account', short: 'Bank', hint: 'Withdrawals are paid to this account', icon: Landmark },
  { key: 'documents', title: 'Documents', short: 'Documents', hint: 'Used only to verify your identity', icon: FileText },
]

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

/** A blank form, pre-filled from the account where we can. */
export function emptyKyc(user: Pick<User, 'name' | 'email' | 'phone'>): KycInput {
  const [firstName = '', ...rest] = user.name.trim().split(/\s+/)
  return {
    firstName,
    lastName: rest.join(' '),
    email: user.email,
    phone: user.phone ?? '',
    dateOfBirth: '',
    addressLine: '',
    city: '',
    state: '',
    nationality: 'Indian',
    bankName: '',
    accountHolderName: user.name.trim(),
    accountNumber: '',
    ifscCode: '',
    aadhaarNumber: '',
    panNumber: '',
  }
}

/** Just the input fields of a saved KYC (drops status etc.). */
export const kycInputOf = (k: KycInput): KycInput => ({
  firstName: k.firstName,
  lastName: k.lastName,
  email: k.email,
  phone: k.phone,
  dateOfBirth: k.dateOfBirth,
  addressLine: k.addressLine,
  city: k.city,
  state: k.state,
  nationality: k.nationality,
  bankName: k.bankName,
  accountHolderName: k.accountHolderName,
  accountNumber: k.accountNumber,
  ifscCode: k.ifscCode,
  aadhaarNumber: formatAadhaar(k.aadhaarNumber),
  panNumber: k.panNumber,
})

/** "123456789012" -> "1234 5678 9012" */
export const formatAadhaar = (v: string) =>
  v.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ')
