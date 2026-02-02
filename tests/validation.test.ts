/**
 * Unit tests for validation utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  validateTransaction,
  validateAccount,
  isValidCurrencyCode,
  isValidUUID,
  validateExchangeRate
} from '../utils/validation'
import type { LedgerEntry, Account } from '../types/models'
import { deleteDatabase } from '../composables/useDatabase'
import { createAccount } from '../composables/useAccounts'

describe('validation utilities', () => {
  beforeEach(async () => {
    await deleteDatabase()
  })

  afterEach(async () => {
    await deleteDatabase()
  })

  describe('validateTransaction', () => {
    it('should accept balanced transaction', async () => {
      // Create accounts first
      const account1 = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const account2 = await createAccount({
        name: 'Income',
        type: 'income',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const entries: LedgerEntry[] = [
        {
          id: crypto.randomUUID(),
          transaction_id: crypto.randomUUID(),
          idx: 0,
          date: new Date().toISOString(),
          description: 'Test Transaction',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 100,
          account_id: account1.id,
          amount_account: 100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          transaction_id: crypto.randomUUID(),
          idx: 1,
          date: new Date().toISOString(),
          description: 'Test Transaction',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -100,
          account_id: account2.id,
          amount_account: -100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      // Set same transaction_id
      entries[1].transaction_id = entries[0].transaction_id

      await expect(validateTransaction(entries)).resolves.toBe(true)
    })

    it('should reject unbalanced transaction', async () => {
      const account1 = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const account2 = await createAccount({
        name: 'Income',
        type: 'income',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const entries: LedgerEntry[] = [
        {
          id: crypto.randomUUID(),
          transaction_id: crypto.randomUUID(),
          idx: 0,
          date: new Date().toISOString(),
          description: 'Unbalanced',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 100,
          account_id: account1.id,
          amount_account: 100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          transaction_id: crypto.randomUUID(),
          idx: 1,
          date: new Date().toISOString(),
          description: 'Unbalanced',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -50, // Only -50, not -100
          account_id: account2.id,
          amount_account: -50,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      entries[1].transaction_id = entries[0].transaction_id

      await expect(validateTransaction(entries)).rejects.toThrow('unbalanced')
    })

    it('should reject transaction with less than 2 entries', async () => {
      const account1 = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const entries: LedgerEntry[] = [
        {
          id: crypto.randomUUID(),
          transaction_id: crypto.randomUUID(),
          idx: 0,
          date: new Date().toISOString(),
          description: 'Single Entry',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 0,
          account_id: account1.id,
          amount_account: 0,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      await expect(validateTransaction(entries)).rejects.toThrow('at least 2')
    })
  })

  describe('validateAccount', () => {
    it('should accept valid account', () => {
      const account: Account = {
        id: crypto.randomUUID(),
        name: 'Test Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false,
        updated_at: new Date().toISOString()
      }

      expect(validateAccount(account)).toBe(true)
    })

    it('should reject invalid account type', () => {
      const account: Account = {
        id: crypto.randomUUID(),
        name: 'Test Account',
        type: 'invalid' as AccountType,
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false,
        updated_at: new Date().toISOString()
      }

      expect(() => validateAccount(account)).toThrow('Invalid account type')
    })

    it('should reject invalid currency code', () => {
      const account: Account = {
        id: crypto.randomUUID(),
        name: 'Test Account',
        type: 'asset',
        currency: 'US', // Too short
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false,
        updated_at: new Date().toISOString()
      }

      expect(() => validateAccount(account)).toThrow('Invalid currency')
    })

    it('should reject empty account name', () => {
      const account: Account = {
        id: crypto.randomUUID(),
        name: '',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false,
        updated_at: new Date().toISOString()
      }

      expect(() => validateAccount(account)).toThrow('name cannot be empty')
    })
  })

  describe('isValidCurrencyCode', () => {
    it('should accept valid currency codes', () => {
      expect(isValidCurrencyCode('USD')).toBe(true)
      expect(isValidCurrencyCode('EUR')).toBe(true)
      expect(isValidCurrencyCode('GBP')).toBe(true)
    })

    it('should reject invalid currency codes', () => {
      expect(isValidCurrencyCode('US')).toBe(false)
      expect(isValidCurrencyCode('USDD')).toBe(false)
      expect(isValidCurrencyCode('usd')).toBe(false)
      expect(isValidCurrencyCode('123')).toBe(false)
    })
  })

  describe('isValidUUID', () => {
    it('should accept valid UUID v4', () => {
      const uuid = crypto.randomUUID()
      expect(isValidUUID(uuid)).toBe(true)
    })

    it('should reject invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('12345678-1234-1234-1234-123456789012')).toBe(false)
    })
  })

  describe('validateExchangeRate', () => {
    it('should accept positive exchange rate', () => {
      expect(validateExchangeRate(1.5)).toBe(true)
      expect(validateExchangeRate(0.5)).toBe(true)
    })

    it('should reject zero or negative exchange rate', () => {
      expect(() => validateExchangeRate(0)).toThrow('positive')
      expect(() => validateExchangeRate(-1)).toThrow('positive')
    })

    it('should reject infinite exchange rate', () => {
      expect(() => validateExchangeRate(Infinity)).toThrow('finite')
    })
  })
})
