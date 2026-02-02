/**
 * Unit tests for Budget operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createBudget,
  getBudget,
  getAllBudgets,
  updateBudget,
  archiveBudget,
  unarchiveBudget,
  deleteBudget
} from '../composables/useBudgets'
import { deleteDatabase } from '../composables/useDatabase'

describe('useBudgets', () => {
  beforeEach(async () => {
    await deleteDatabase()
  })

  afterEach(async () => {
    await deleteDatabase()
  })

  describe('createBudget', () => {
    it('should create a valid budget', async () => {
      const budget = await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      expect(budget.id).toBeDefined()
      expect(budget.name).toBe('Groceries')
      expect(budget.currency).toBe('USD')
      expect(budget.updated_at).toBeDefined()
    })

    it('should reject empty budget name', async () => {
      await expect(
        createBudget({
          name: '',
          currency: 'USD',
          is_archived: false
        })
      ).rejects.toThrow('name cannot be empty')
    })

    it('should reject invalid currency', async () => {
      await expect(
        createBudget({
          name: 'Test',
          currency: 'US',
          is_archived: false
        })
      ).rejects.toThrow('Invalid currency')
    })
  })

  describe('getBudget', () => {
    it('should retrieve budget by ID', async () => {
      const created = await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      const retrieved = await getBudget(created.id)
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.name).toBe('Groceries')
    })

    it('should return undefined for non-existent budget', async () => {
      const result = await getBudget('non-existent-id')
      expect(result).toBeUndefined()
    })
  })

  describe('getAllBudgets', () => {
    it('should return all non-archived budgets by default', async () => {
      await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      await createBudget({
        name: 'Archived',
        currency: 'USD',
        is_archived: true
      })

      const budgets = await getAllBudgets()
      expect(budgets).toHaveLength(1)
      expect(budgets[0].name).toBe('Groceries')
    })

    it('should return all budgets including archived when requested', async () => {
      await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      await createBudget({
        name: 'Archived',
        currency: 'USD',
        is_archived: true
      })

      const budgets = await getAllBudgets(true)
      expect(budgets).toHaveLength(2)
    })
  })

  describe('updateBudget', () => {
    it('should update budget properties', async () => {
      const budget = await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      const updated = await updateBudget(budget.id, {
        name: 'Food & Groceries'
      })

      expect(updated.name).toBe('Food & Groceries')
      expect(updated.currency).toBe('USD') // Currency remains unchanged
    })

    it('should throw error for non-existent budget', async () => {
      await expect(
        updateBudget('non-existent', { name: 'Updated' })
      ).rejects.toThrow('not found')
    })
  })

  describe('archiveBudget', () => {
    it('should mark budget as archived', async () => {
      const budget = await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      const archived = await archiveBudget(budget.id)
      expect(archived.is_archived).toBe(true)
    })
  })

  describe('unarchiveBudget', () => {
    it('should mark budget as not archived', async () => {
      const budget = await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: true
      })

      const unarchived = await unarchiveBudget(budget.id)
      expect(unarchived.is_archived).toBe(false)
    })
  })

  describe('deleteBudget', () => {
    it('should delete budget without ledger entries', async () => {
      const budget = await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      await deleteBudget(budget.id)

      const retrieved = await getBudget(budget.id)
      expect(retrieved).toBeUndefined()
    })

    it('should throw error when deleting budget with ledger entries', async () => {
      const budget = await createBudget({
        name: 'Groceries',
        currency: 'USD',
        is_archived: false
      })

      // Create an account and transaction with this budget
      const { createAccount } = await import('../composables/useAccounts')
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const { createTransaction } = await import('../composables/useLedger')
      await createTransaction([
        {
          date: new Date().toISOString(),
          description: 'Test',
          status: 'confirmed',
          currency_display: 'USD',
          amount_display: 100,
          account_id: account.id,
          amount_account: 100,
          rate_display_to_account: 1,
          budget_id: budget.id,
          amount_budget: 100,
          rate_display_to_budget: 1
        },
        {
          date: new Date().toISOString(),
          description: 'Test',
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

      await expect(deleteBudget(budget.id)).rejects.toThrow('Cannot delete')
    })
  })
})
