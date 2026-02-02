/**
 * Unit tests for Account operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAccount,
  getAccount,
  getAllAccounts,
  getAccountsByType,
  updateAccount,
  archiveAccount,
  unarchiveAccount,
  deleteAccount
} from '../composables/useAccounts'
import { deleteDatabase } from '../composables/useDatabase'

describe('useAccounts', () => {
  beforeEach(async () => {
    await deleteDatabase()
  })

  afterEach(async () => {
    await deleteDatabase()
  })

  describe('createAccount', () => {
    it('should create a valid account', async () => {
      const account = await createAccount({
        name: 'Test Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      expect(account.id).toBeDefined()
      expect(account.name).toBe('Test Account')
      expect(account.type).toBe('asset')
      expect(account.updated_at).toBeDefined()
    })

    it('should reject invalid account type', async () => {
      await expect(
        createAccount({
          name: 'Invalid',
          type: 'invalid' as 'asset', // Type assertion to bypass TS check for test
          currency: 'USD',
          include_in_net_worth: true,
          is_system_default: false,
          is_archived: false
        })
      ).rejects.toThrow()
    })
  })

  describe('getAccount', () => {
    it('should retrieve account by ID', async () => {
      const created = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const retrieved = await getAccount(created.id)
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.name).toBe('Cash')
    })

    it('should return undefined for non-existent account', async () => {
      const result = await getAccount('non-existent-id')
      expect(result).toBeUndefined()
    })
  })

  describe('getAllAccounts', () => {
    it('should return all non-archived accounts by default', async () => {
      await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      await createAccount({
        name: 'Archived',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: true
      })

      const accounts = await getAllAccounts()
      expect(accounts).toHaveLength(1)
      expect(accounts[0].name).toBe('Cash')
    })

    it('should return all accounts including archived when requested', async () => {
      await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      await createAccount({
        name: 'Archived',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: true
      })

      const accounts = await getAllAccounts(true)
      expect(accounts).toHaveLength(2)
    })
  })

  describe('getAccountsByType', () => {
    it('should filter accounts by type', async () => {
      await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      await createAccount({
        name: 'Salary',
        type: 'income',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const assets = await getAccountsByType('asset')
      expect(assets).toHaveLength(1)
      expect(assets[0].name).toBe('Cash')
    })
  })

  describe('updateAccount', () => {
    it('should update account properties', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const updated = await updateAccount(account.id, {
        name: 'Cash Updated'
      })

      expect(updated.name).toBe('Cash Updated')
      expect(updated.currency).toBe('USD') // Currency remains unchanged
    })

    it('should throw error for non-existent account', async () => {
      await expect(
        updateAccount('non-existent', { name: 'Updated' })
      ).rejects.toThrow('not found')
    })
  })

  describe('archiveAccount', () => {
    it('should mark account as archived', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const archived = await archiveAccount(account.id)
      expect(archived.is_archived).toBe(true)
    })
  })

  describe('unarchiveAccount', () => {
    it('should mark account as not archived', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: true
      })

      const unarchived = await unarchiveAccount(account.id)
      expect(unarchived.is_archived).toBe(false)
    })
  })

  describe('deleteAccount', () => {
    it('should delete account without ledger entries', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      await deleteAccount(account.id)

      const retrieved = await getAccount(account.id)
      expect(retrieved).toBeUndefined()
    })

    it('should throw error when deleting account with ledger entries', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create a transaction with this account
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
          budget_id: null,
          amount_budget: null,
          rate_display_to_budget: null
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

      await expect(deleteAccount(account.id)).rejects.toThrow('Cannot delete')
    })
  })
})
