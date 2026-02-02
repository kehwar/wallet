/**
 * Validation utilities for wallet data
 */

import Decimal from 'decimal.js'
import type {
  LedgerEntry,
  Account,
  AccountType,
  CurrencyCode,
  ValidationError
} from '~/types/models'
import { useDatabase } from '~/composables/useDatabase'

/**
 * Valid account types
 */
const VALID_ACCOUNT_TYPES: AccountType[] = ['asset', 'liability', 'equity', 'income', 'expense']

/**
 * Validate that a transaction (group of ledger entries) is balanced
 * @param entries Array of ledger entries with the same transaction_id
 * @returns True if valid
 * @throws Error if invalid
 */
export async function validateTransaction(entries: LedgerEntry[]): Promise<boolean> {
  const errors: ValidationError[] = []

  // Must have at least 2 entries
  if (entries.length < 2) {
    errors.push({
      field: 'entries',
      message: 'Transaction must have at least 2 ledger entries',
      code: 'INSUFFICIENT_ENTRIES'
    })
  }

  // Calculate sum of display amounts (must equal zero)
  const sum = entries.reduce((total, entry) => {
    return total.add(new Decimal(entry.amount_display))
  }, new Decimal(0))

  // Must balance to zero (within tolerance of 0.01)
  if (sum.abs().greaterThan(0.01)) {
    errors.push({
      field: 'amount_display',
      message: `Transaction unbalanced: sum=${sum.toString()}, expected 0`,
      code: 'UNBALANCED_TRANSACTION'
    })
  }

  // Verify all accounts exist
  const db = useDatabase()
  for (const entry of entries) {
    const account = await db.accounts.get(entry.account_id)
    if (!account) {
      errors.push({
        field: 'account_id',
        message: `Account ${entry.account_id} not found`,
        code: 'ACCOUNT_NOT_FOUND'
      })
    }

    // If budget_id present, verify it exists
    if (entry.budget_id) {
      const budget = await db.budgets.get(entry.budget_id)
      if (!budget) {
        errors.push({
          field: 'budget_id',
          message: `Budget ${entry.budget_id} not found`,
          code: 'BUDGET_NOT_FOUND'
        })
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`)
  }

  return true
}

/**
 * Validate an account
 * @param account Account to validate
 * @returns True if valid
 * @throws Error if invalid
 */
export function validateAccount(account: Account): boolean {
  const errors: ValidationError[] = []

  // Valid type
  if (!VALID_ACCOUNT_TYPES.includes(account.type)) {
    errors.push({
      field: 'type',
      message: `Invalid account type: ${account.type}`,
      code: 'INVALID_ACCOUNT_TYPE'
    })
  }

  // Valid currency (basic check - could be enhanced with ISO 4217 validation)
  if (!account.currency || account.currency.length !== 3) {
    errors.push({
      field: 'currency',
      message: `Invalid currency code: ${account.currency}`,
      code: 'INVALID_CURRENCY'
    })
  }

  // Name must not be empty
  if (!account.name || account.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Account name cannot be empty',
      code: 'EMPTY_NAME'
    })
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`)
  }

  return true
}

/**
 * Validate currency code format (basic check)
 */
export function isValidCurrencyCode(code: CurrencyCode): boolean {
  return /^[A-Z]{3}$/.test(code)
}

/**
 * Validate UUID v4 format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Validate exchange rate
 */
export function validateExchangeRate(rate: number): boolean {
  if (rate <= 0) {
    throw new Error('Exchange rate must be positive')
  }
  if (!isFinite(rate)) {
    throw new Error('Exchange rate must be finite')
  }
  return true
}
