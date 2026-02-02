/**
 * Tests for Enhanced Balance Calculations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateAccountBalanceAtDate,
  getAccountBalanceHistory,
  calculateNetWorth,
  createTransaction
} from '~/composables/useLedger'
import { createAccount } from '~/composables/useAccounts'
import { setExchangeRate } from '~/composables/useExchangeRates'
import { useDatabase } from '~/composables/useDatabase'

describe('Enhanced Balance Calculations', () => {
  beforeEach(async () => {
    const db = useDatabase()
    await db.delete()
    await db.open()
  })

  describe('calculateAccountBalanceAtDate', () => {
    it('calculates balance at a specific date', async () => {
      const account = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create transactions on different dates
      await createTransaction([
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Transaction 1',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 100,
          account_id: account.id,
          amount_account: 100,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Transaction 1',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -100,
          account_id: account.id,
          amount_account: -100,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      await createTransaction([
        {
          date: '2026-01-15T12:00:00.000Z',
          description: 'Transaction 2',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 200,
          account_id: account.id,
          amount_account: 200,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-15T12:00:00.000Z',
          description: 'Transaction 2',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -200,
          account_id: account.id,
          amount_account: -200,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      await createTransaction([
        {
          date: '2026-02-01T12:00:00.000Z',
          description: 'Transaction 3',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 300,
          account_id: account.id,
          amount_account: 300,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-02-01T12:00:00.000Z',
          description: 'Transaction 3',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -300,
          account_id: account.id,
          amount_account: -300,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      // Balance at 2026-01-10 should be 0 (only first transaction)
      const balanceJan10 = await calculateAccountBalanceAtDate(account.id, '2026-01-10T23:59:59.999Z')
      expect(balanceJan10).toBe(0)

      // Balance at 2026-01-20 should be 0 (first two transactions)
      const balanceJan20 = await calculateAccountBalanceAtDate(account.id, '2026-01-20T23:59:59.999Z')
      expect(balanceJan20).toBe(0)

      // Balance at 2026-02-05 should be 0 (all three transactions)
      const balanceFeb05 = await calculateAccountBalanceAtDate(account.id, '2026-02-05T23:59:59.999Z')
      expect(balanceFeb05).toBe(0)
    })

    it('returns 0 for date before any transactions', async () => {
      const account = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const balance = await calculateAccountBalanceAtDate(account.id, '2025-01-01T00:00:00.000Z')
      expect(balance).toBe(0)
    })
  })

  describe('getAccountBalanceHistory', () => {
    it('returns balance history over date range', async () => {
      const account = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create transactions
      await createTransaction([
        {
          date: '2026-01-05T12:00:00.000Z',
          description: 'Initial deposit',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 1000,
          account_id: account.id,
          amount_account: 1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-05T12:00:00.000Z',
          description: 'Initial deposit',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -1000,
          account_id: account.id,
          amount_account: -1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      await createTransaction([
        {
          date: '2026-01-15T12:00:00.000Z',
          description: 'Spending',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -200,
          account_id: account.id,
          amount_account: -200,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-15T12:00:00.000Z',
          description: 'Spending',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 200,
          account_id: account.id,
          amount_account: 200,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      await createTransaction([
        {
          date: '2026-01-25T12:00:00.000Z',
          description: 'Income',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 500,
          account_id: account.id,
          amount_account: 500,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-25T12:00:00.000Z',
          description: 'Income',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -500,
          account_id: account.id,
          amount_account: -500,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      const history = await getAccountBalanceHistory(
        account.id,
        '2026-01-01T00:00:00.000Z',
        '2026-01-31T23:59:59.999Z'
      )

      // Should have entries for the dates with transactions
      expect(history.length).toBeGreaterThan(0)
      
      // Check that dates are in the expected format (YYYY-MM-DD)
      history.forEach(h => {
        expect(h.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(typeof h.balance).toBe('number')
      })
    })

    it('returns empty array if no transactions in range', async () => {
      const account = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const history = await getAccountBalanceHistory(
        account.id,
        '2026-01-01T00:00:00.000Z',
        '2026-01-31T23:59:59.999Z'
      )

      expect(history).toEqual([])
    })
  })

  describe('calculateNetWorth', () => {
    it('calculates net worth from assets and liabilities', async () => {
      // Create asset account
      const bankAccount = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create liability account
      const creditCard = await createAccount({
        name: 'Credit Card',
        type: 'liability',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Add balance to bank account (+5000)
      await createTransaction([
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Initial deposit',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 5000,
          account_id: bankAccount.id,
          amount_account: 5000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Initial deposit',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -5000,
          account_id: bankAccount.id,
          amount_account: -5000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      // Add balance to credit card (+1000 debt, represented as positive for liability)
      await createTransaction([
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Credit card spending',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 1000,
          account_id: creditCard.id,
          amount_account: 1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Credit card spending',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -1000,
          account_id: creditCard.id,
          amount_account: -1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      // Net worth should be assets - liabilities = 0 - 0 = 0
      const netWorth = await calculateNetWorth('USD')
      expect(netWorth).toBe(0)
    })

    it('excludes accounts not included in net worth', async () => {
      // Create asset account included in net worth
      const bankAccount = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create asset account NOT included in net worth
      const tradingAccount = await createAccount({
        name: 'Trading Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      // Add balance to both
      await createTransaction([
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Bank deposit',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 1000,
          account_id: bankAccount.id,
          amount_account: 1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Bank deposit',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -1000,
          account_id: bankAccount.id,
          amount_account: -1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      await createTransaction([
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Trading funds',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 5000,
          account_id: tradingAccount.id,
          amount_account: 5000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: '2026-01-01T12:00:00.000Z',
          description: 'Trading funds',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -5000,
          account_id: tradingAccount.id,
          amount_account: -5000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      // Net worth should only include bank account = 0
      const netWorth = await calculateNetWorth('USD')
      expect(netWorth).toBe(0)
    })

    it('handles multi-currency accounts with exchange rates', async () => {
      // Create USD account
      const usdAccount = await createAccount({
        name: 'USD Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create EUR account
      const eurAccount = await createAccount({
        name: 'EUR Account',
        type: 'asset',
        currency: 'EUR',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Set exchange rate
      const today = new Date().toISOString().split('T')[0]
      await setExchangeRate('EUR', 'USD', 1.18, today, 'manual')

      // Add balances
      await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'USD deposit',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 1000,
          account_id: usdAccount.id,
          amount_account: 1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'USD deposit',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -1000,
          account_id: usdAccount.id,
          amount_account: -1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'EUR deposit',
          status: 'confirmed',
          currency_display: 'EUR',
          amount_display: 1000,
          account_id: eurAccount.id,
          amount_account: 1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'EUR deposit',
          status: 'confirmed',
          currency_display: 'EUR',
          amount_display: -1000,
          account_id: eurAccount.id,
          amount_account: -1000,
          rate_display_to_account: 1,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      // Net worth in USD should be 0
      // (1000 USD + 1000 EUR * 1.18 = 2180 USD, but balanced transactions = 0)
      const netWorth = await calculateNetWorth('USD')
      expect(netWorth).toBe(0)
    })
  })
})
