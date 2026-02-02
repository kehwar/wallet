/**
 * Core Types for Wallet PWA
 * Based on database schema specification
 */

export type TransactionStatus = 'projected' | 'confirmed'
export type AccountType = 'asset' | 'liability' | 'income' | 'expense' | 'equity'
export type CurrencyCode = string // ISO 4217 codes like "USD", "EUR", "GBP"
export type UUID = string // UUID v4
export type ISODate = string // ISO 8601 format: "2026-02-01T14:30:00.000Z"

/**
 * Ledger Entry - The atomic unit of the accounting system
 * Each entry is self-contained with full currency context
 */
export interface LedgerEntry {
  // === Identity & Sequencing ===
  id: UUID
  transaction_id: UUID
  idx: number

  // === Header Data (Denormalized) ===
  date: ISODate
  description: string
  status: TransactionStatus
  recurring_rule_id?: UUID | null
  search_tags?: string[]

  // === Triple Truth Currency System ===
  // 1. DISPLAY (The Receipt) - Used for Zero-Sum Validation
  currency_display: CurrencyCode
  amount_display: number // Signed (+/-)

  // 2. ACCOUNT (The Bank) - Used for Account Balances
  account_id: UUID
  amount_account: number
  rate_display_to_account: number

  // 3. BUDGET (The Plan) - Used for Budget Availability
  budget_id?: UUID | null
  amount_budget: number | null
  rate_display_to_budget: number | null

  // === Sync Metadata ===
  created_at: ISODate
  updated_at: ISODate
}

/**
 * Account - Represents financial accounts
 */
export interface Account {
  id: UUID
  name: string
  type: AccountType
  currency: CurrencyCode

  // Logic Flags
  include_in_net_worth: boolean
  is_system_default: boolean
  is_archived: boolean

  updated_at: ISODate
}

/**
 * Budget - Represents budget categories
 */
export interface Budget {
  id: UUID
  name: string
  currency: CurrencyCode

  is_archived: boolean
  updated_at: ISODate
}

/**
 * Exchange Rate - Historical rate tracking
 */
export interface ExchangeRate {
  id: string // Composite: "USD_EUR_2026-02-01"
  from: CurrencyCode
  to: CurrencyCode
  rate: number
  date: string // YYYY-MM-DD
  source: 'manual' | 'api'
  updated_at: ISODate
}

/**
 * Recurring Rule - Template for automatic transaction generation
 */
export interface RecurringRule {
  id: UUID
  title: string
  rrule: string // iCal RRULE string
  template_entries: Partial<LedgerEntry>[]
  generated_up_to: ISODate
  updated_at: ISODate
}

/**
 * Validation error for data integrity
 */
export interface ValidationError {
  field: string
  message: string
  code: string
}
