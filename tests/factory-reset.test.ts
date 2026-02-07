/**
 * Unit tests for Factory Reset functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { factoryReset } from '../composables/useFactoryReset'
import { getAllAccounts } from '../composables/useAccounts'
import { useDatabase, deleteDatabase } from '../composables/useDatabase'

describe('useFactoryReset', () => {
  beforeEach(async () => {
    await deleteDatabase()
  })

  afterEach(async () => {
    await deleteDatabase()
  })

  describe('factoryReset', () => {
    it('should create default accounts', async () => {
      await factoryReset()
      
      const accounts = await getAllAccounts()
      
      // Should have 4 default accounts
      expect(accounts).toHaveLength(4)
      
      // Find each account type
      const cash = accounts.find(a => a.name === 'Cash')
      const bank = accounts.find(a => a.name === 'Bank Account')
      const income = accounts.find(a => a.name === 'Salary')
      const expense = accounts.find(a => a.name === 'Groceries')
      
      expect(cash).toBeDefined()
      expect(cash?.type).toBe('asset')
      expect(cash?.currency).toBe('USD')
      
      expect(bank).toBeDefined()
      expect(bank?.type).toBe('asset')
      expect(bank?.currency).toBe('USD')
      
      expect(income).toBeDefined()
      expect(income?.type).toBe('income')
      expect(income?.currency).toBe('USD')
      
      expect(expense).toBeDefined()
      expect(expense?.type).toBe('expense')
      expect(expense?.currency).toBe('USD')
    })

    it('should create example transactions', async () => {
      await factoryReset()
      
      const db = useDatabase()
      const entries = await db.ledger_entries.toArray()
      
      // Should have 6 ledger entries (3 transactions × 2 entries each)
      expect(entries).toHaveLength(6)
      
      // Get unique transaction IDs
      const transactionIds = new Set(entries.map(e => e.transaction_id))
      expect(transactionIds.size).toBe(3)
      
      // Check descriptions
      const descriptions = entries.map(e => e.description)
      expect(descriptions).toContain('Monthly Salary')
      expect(descriptions).toContain('Grocery Shopping')
      expect(descriptions).toContain('ATM Withdrawal')
    })

    it('should create balanced transactions', async () => {
      await factoryReset()
      
      const db = useDatabase()
      const entries = await db.ledger_entries.toArray()
      
      // Group by transaction_id
      const transactions = new Map<string, typeof entries>()
      entries.forEach(entry => {
        if (!transactions.has(entry.transaction_id)) {
          transactions.set(entry.transaction_id, [])
        }
        transactions.get(entry.transaction_id)!.push(entry)
      })
      
      // Each transaction should balance to zero
      transactions.forEach(txEntries => {
        const sum = txEntries.reduce((acc, e) => acc + e.amount_display, 0)
        expect(Math.abs(sum)).toBeLessThan(0.01) // Allow small floating point errors
      })
    })

    it('should clear existing data before seeding', async () => {
      // First, do a factory reset
      await factoryReset()
      
      let accounts = await getAllAccounts()
      let db = useDatabase()
      let entries = await db.ledger_entries.toArray()
      
      expect(accounts).toHaveLength(4)
      expect(entries).toHaveLength(6)
      
      // Do another factory reset
      await factoryReset()
      
      // Get fresh db instance after reset
      db = useDatabase()
      accounts = await getAllAccounts()
      entries = await db.ledger_entries.toArray()
      
      // Should still have the same counts (old data cleared)
      expect(accounts).toHaveLength(4)
      expect(entries).toHaveLength(6)
    })

    it('should set correct account properties', async () => {
      await factoryReset()
      
      const accounts = await getAllAccounts()
      
      // All accounts should not be archived
      accounts.forEach(account => {
        expect(account.is_archived).toBe(false)
      })
      
      // Asset accounts should include in net worth
      const assetAccounts = accounts.filter(a => a.type === 'asset')
      assetAccounts.forEach(account => {
        expect(account.include_in_net_worth).toBe(true)
      })
      
      // Income/Expense accounts should not include in net worth
      const incomeExpenseAccounts = accounts.filter(a => 
        a.type === 'income' || a.type === 'expense'
      )
      incomeExpenseAccounts.forEach(account => {
        expect(account.include_in_net_worth).toBe(false)
      })
    })

    it('should create transactions with correct statuses', async () => {
      await factoryReset()
      
      const db = useDatabase()
      const entries = await db.ledger_entries.toArray()
      
      // All example transactions should be confirmed
      entries.forEach(entry => {
        expect(entry.status).toBe('confirmed')
      })
    })

    it('should create transactions with search tags', async () => {
      await factoryReset()
      
      const db = useDatabase()
      const entries = await db.ledger_entries.toArray()
      
      // Find entries with search tags
      const salaryEntries = entries.filter(e => e.description === 'Monthly Salary')
      const groceryEntries = entries.filter(e => e.description === 'Grocery Shopping')
      const atmEntries = entries.filter(e => e.description === 'ATM Withdrawal')
      
      // Check tags exist
      expect(salaryEntries[0]?.search_tags).toBeDefined()
      expect(salaryEntries[0]?.search_tags).toContain('salary')
      
      expect(groceryEntries[0]?.search_tags).toBeDefined()
      expect(groceryEntries[0]?.search_tags).toContain('groceries')
      
      expect(atmEntries[0]?.search_tags).toBeDefined()
      expect(atmEntries[0]?.search_tags).toContain('transfer')
    })
  })
})
