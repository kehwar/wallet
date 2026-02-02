/**
 * Unit tests for Ledger operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createTransaction,
  getTransaction,
  updateLedgerEntry,
  deleteTransaction,
  calculateAccountBalance
} from '../composables/useLedger'
import { createAccount } from '../composables/useAccounts'
import { deleteDatabase } from '../composables/useDatabase'

describe('useLedger', () => {
  beforeEach(async () => {
    await deleteDatabase()
  })

  afterEach(async () => {
    await deleteDatabase()
  })

  describe('createTransaction', () => {
    it('should create a balanced transaction', async () => {
      const account1 = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const account2 = await createAccount({
        name: 'Groceries',
        type: 'expense',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const entries = await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'Grocery Shopping',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -50,
          account_id: account1.id,
          amount_account: -50,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'Grocery Shopping',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 50,
          account_id: account2.id,
          amount_account: 50,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      expect(entries).toHaveLength(2)
      expect(entries[0].transaction_id).toBe(entries[1].transaction_id)
      expect(entries[0].idx).toBe(0)
      expect(entries[1].idx).toBe(1)
      expect(entries[0].id).toBeDefined()
      expect(entries[0].created_at).toBeDefined()
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
        name: 'Groceries',
        type: 'expense',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      await expect(
        createTransaction([
          {
            date: new Date().toISOString(),
            description: 'Unbalanced',
            status: 'confirmed',
            currency_display: 'USD',
            amount_display: -50,
            account_id: account1.id,
            amount_account: -50,
            rate_display_to_account: 1,
            budget_id: null,
            amount_budget: null,
            rate_display_to_budget: null
          },
          {
            date: new Date().toISOString(),
            description: 'Unbalanced',
            status: 'confirmed',
            currency_display: 'USD',
            amount_display: 30, // Doesn't balance
            account_id: account2.id,
            amount_account: 30,
            rate_display_to_account: 1,
            budget_id: null,
            amount_budget: null,
            rate_display_to_budget: null
          }
        ])
      ).rejects.toThrow()
    })
  })

  describe('getTransaction', () => {
    it('should retrieve all entries for a transaction in order', async () => {
      const account1 = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const account2 = await createAccount({
        name: 'Groceries',
        type: 'expense',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const created = await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'Shopping',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -100,
          account_id: account1.id,
          amount_account: -100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'Shopping',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 100,
          account_id: account2.id,
          amount_account: 100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      const retrieved = await getTransaction(created[0].transaction_id)

      expect(retrieved).toHaveLength(2)
      expect(retrieved[0].idx).toBe(0)
      expect(retrieved[1].idx).toBe(1)
      expect(retrieved[0].id).toBe(created[0].id)
      expect(retrieved[1].id).toBe(created[1].id)
    })
  })

  describe('updateLedgerEntry', () => {
    it('should update a ledger entry', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const entries = await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'Original',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 100,
          account_id: account.id,
          amount_account: 100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'Original',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -100,
          account_id: account.id,
          amount_account: -100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      const updated = await updateLedgerEntry(entries[0].id, {
        description: 'Updated Description'
      })

      expect(updated.description).toBe('Updated Description')
      expect(updated.updated_at).not.toBe(entries[0].updated_at)
    })
  })

  describe('deleteTransaction', () => {
    it('should delete all entries for a transaction', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const entries = await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'To Delete',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 50,
          account_id: account.id,
          amount_account: 50,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'To Delete',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -50,
          account_id: account.id,
          amount_account: -50,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      await deleteTransaction(entries[0].transaction_id)

      const retrieved = await getTransaction(entries[0].transaction_id)
      expect(retrieved).toHaveLength(0)
    })
  })

  describe('calculateAccountBalance', () => {
    it('should calculate correct account balance', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create multiple transactions
      await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'Income',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 100,
          account_id: account.id,
          amount_account: 100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'Income',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -100,
          account_id: account.id,
          amount_account: -100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'Expense',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -30,
          account_id: account.id,
          amount_account: -30,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'Expense',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 30,
          account_id: account.id,
          amount_account: 30,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      const balance = await calculateAccountBalance(account.id)
      expect(balance).toBe(0) // 100 - 100 - 30 + 30 = 0
    })
  })

  describe('getEntriesByStatus', () => {
    it('should filter entries by status', async () => {
      const { getEntriesByStatus } = await import('../composables/useLedger')
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create confirmed transaction
      await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'Confirmed',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 50,
          account_id: account.id,
          amount_account: 50,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'Confirmed',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -50,
          account_id: account.id,
          amount_account: -50,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      // Create projected transaction
      await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'Projected',
          status: 'projected',
          currency_display: 'USD',
          amount_display: 100,
          account_id: account.id,
          amount_account: 100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        },
        {
          date: new Date().toISOString(),
          description: 'Projected',
          status: 'projected',
          currency_display: 'USD',
          amount_display: -100,
          account_id: account.id,
          amount_account: -100,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      const confirmed = await getEntriesByStatus('confirmed')
      const projected = await getEntriesByStatus('projected')

      expect(confirmed).toHaveLength(2)
      expect(projected).toHaveLength(2)
      expect(confirmed[0].status).toBe('confirmed')
      expect(projected[0].status).toBe('projected')
    })
  })

  describe('getBudgetSpending', () => {
    it('should get budget spending in date range', async () => {
      const { getBudgetSpending, calculateBudgetTotal } = await import('../composables/useLedger')
      const { createBudget } = await import('../composables/useBudgets')
      
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const budget = await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      const startDate = '2024-01-01T00:00:00.000Z'
      const endDate = '2024-12-31T23:59:59.999Z'

      await createTransaction([
        {
          date: '2024-06-15T12:00:00.000Z',
          description: 'Grocery Shopping',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 50,
          account_id: account.id,
          amount_account: 50,
          rate_display_to_account: 1,
          budget_id: budget.id,
          amount_budget: 50,
          rate_display_to_budget: 1
        },
        {
          date: '2024-06-15T12:00:00.000Z',
          description: 'Grocery Shopping',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: -50,
          account_id: account.id,
          amount_account: -50,
          rate_display_to_account: 1,
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
        }
      ])

      const entries = await getBudgetSpending(budget.id, startDate, endDate)
      expect(entries).toHaveLength(1)
      expect(entries[0].budget_id).toBe(budget.id)

      const total = await calculateBudgetTotal(budget.id, startDate, endDate)
      expect(total).toBe(50)
    })
  })
})
