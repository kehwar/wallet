/**
 * Tests for Transaction API
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  createIncomeTransaction,
  createExpenseTransaction,
  createTransferTransaction,
  createMultiSplitTransaction,
  type IncomeTransactionParams,
  type ExpenseTransactionParams,
  type TransferTransactionParams,
  type MultiSplitTransactionParams
} from '~/composables/useTransactions'
import { createAccount } from '~/composables/useAccounts'
import { createBudget } from '~/composables/useBudgets'
import { setExchangeRate } from '~/composables/useExchangeRates'
import { useDatabase } from '~/composables/useDatabase'

describe('Transaction API', () => {
  beforeEach(async () => {
    const db = useDatabase()
    await db.delete()
    await db.open()
  })

  describe('createIncomeTransaction', () => {
    it('creates an income transaction with two entries', async () => {
      // Create accounts
      const salaryAccount = await createAccount({
        name: 'Salary',
        type: 'income',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const bankAccount = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Create transaction
      const params: IncomeTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Monthly salary',
        amount: 5000,
        currency: 'USD',
        incomeAccountId: salaryAccount.id,
        assetAccountId: bankAccount.id,
        status: 'confirmed'
      }

      const entries = await createIncomeTransaction(params)

      // Verify two entries created
      expect(entries).toHaveLength(2)

      // Verify debit entry (asset increases)
      const debitEntry = entries.find(e => e.amount_display > 0)
      expect(debitEntry).toBeDefined()
      expect(debitEntry?.account_id).toBe(bankAccount.id)
      expect(debitEntry?.amount_display).toBe(5000)
      expect(debitEntry?.amount_account).toBe(5000)

      // Verify credit entry (income)
      const creditEntry = entries.find(e => e.amount_display < 0)
      expect(creditEntry).toBeDefined()
      expect(creditEntry?.account_id).toBe(salaryAccount.id)
      expect(creditEntry?.amount_display).toBe(-5000)
      expect(creditEntry?.amount_account).toBe(-5000)

      // Verify transaction balances
      const sum = entries.reduce((s, e) => s + e.amount_display, 0)
      expect(Math.abs(sum)).toBeLessThan(0.01)
    })

    it('handles multi-currency income with exchange rates', async () => {
      // Create accounts in different currencies
      const salaryAccount = await createAccount({
        name: 'Salary',
        type: 'income',
        currency: 'EUR',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const bankAccount = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'GBP',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      // Set exchange rates
      await setExchangeRate('USD', 'EUR', 0.85, '2026-02-01', 'manual')
      await setExchangeRate('USD', 'GBP', 0.75, '2026-02-01', 'manual')

      // Create transaction in USD
      const params: IncomeTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Monthly salary',
        amount: 5000,
        currency: 'USD',
        incomeAccountId: salaryAccount.id,
        assetAccountId: bankAccount.id
      }

      const entries = await createIncomeTransaction(params)

      // Verify currency conversions
      const debitEntry = entries.find(e => e.amount_display > 0)
      expect(debitEntry?.amount_display).toBe(5000) // USD
      expect(debitEntry?.amount_account).toBe(3750) // GBP: 5000 * 0.75

      const creditEntry = entries.find(e => e.amount_display < 0)
      expect(creditEntry?.amount_display).toBe(-5000) // USD
      expect(creditEntry?.amount_account).toBe(-4250) // EUR: -5000 * 0.85
    })

    it('includes budget information when provided', async () => {
      const salaryAccount = await createAccount({
        name: 'Salary',
        type: 'income',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const bankAccount = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const budget = await createBudget({
        name: 'Income Budget',
        currency: 'USD',
        is_archived: false
      })

      const params: IncomeTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Monthly salary',
        amount: 5000,
        currency: 'USD',
        incomeAccountId: salaryAccount.id,
        assetAccountId: bankAccount.id,
        budgetId: budget.id
      }

      const entries = await createIncomeTransaction(params)

      // Asset entry should have budget
      const debitEntry = entries.find(e => e.amount_display > 0)
      expect(debitEntry?.budget_id).toBe(budget.id)
      expect(debitEntry?.amount_budget).toBe(5000)
    })
  })

  describe('createExpenseTransaction', () => {
    it('creates an expense transaction with two entries', async () => {
      const groceriesAccount = await createAccount({
        name: 'Groceries',
        type: 'expense',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const bankAccount = await createAccount({
        name: 'Bank Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const params: ExpenseTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Weekly groceries',
        amount: 150,
        currency: 'USD',
        expenseAccountId: groceriesAccount.id,
        assetAccountId: bankAccount.id
      }

      const entries = await createExpenseTransaction(params)

      expect(entries).toHaveLength(2)

      // Verify debit entry (expense increases)
      const debitEntry = entries.find(e => e.amount_display > 0)
      expect(debitEntry?.account_id).toBe(groceriesAccount.id)
      expect(debitEntry?.amount_display).toBe(150)

      // Verify credit entry (asset decreases)
      const creditEntry = entries.find(e => e.amount_display < 0)
      expect(creditEntry?.account_id).toBe(bankAccount.id)
      expect(creditEntry?.amount_display).toBe(-150)
    })

    it('throws error for non-existent accounts', async () => {
      const params: ExpenseTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Test',
        amount: 100,
        currency: 'USD',
        expenseAccountId: 'invalid-id',
        assetAccountId: 'invalid-id-2'
      }

      await expect(createExpenseTransaction(params)).rejects.toThrow()
    })
  })

  describe('createTransferTransaction', () => {
    it('creates a transfer between two accounts', async () => {
      const checkingAccount = await createAccount({
        name: 'Checking',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const savingsAccount = await createAccount({
        name: 'Savings',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const params: TransferTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Transfer to savings',
        amount: 1000,
        currency: 'USD',
        fromAccountId: checkingAccount.id,
        toAccountId: savingsAccount.id
      }

      const entries = await createTransferTransaction(params)

      expect(entries).toHaveLength(2)

      // Verify debit entry (to account increases)
      const debitEntry = entries.find(e => e.amount_display > 0)
      expect(debitEntry?.account_id).toBe(savingsAccount.id)
      expect(debitEntry?.amount_display).toBe(1000)

      // Verify credit entry (from account decreases)
      const creditEntry = entries.find(e => e.amount_display < 0)
      expect(creditEntry?.account_id).toBe(checkingAccount.id)
      expect(creditEntry?.amount_display).toBe(-1000)
    })

    it('handles multi-currency transfers', async () => {
      const usdAccount = await createAccount({
        name: 'USD Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const eurAccount = await createAccount({
        name: 'EUR Account',
        type: 'asset',
        currency: 'EUR',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      await setExchangeRate('USD', 'EUR', 0.85, '2026-02-01', 'manual')

      const params: TransferTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Transfer USD to EUR',
        amount: 1000,
        currency: 'USD',
        fromAccountId: usdAccount.id,
        toAccountId: eurAccount.id
      }

      const entries = await createTransferTransaction(params)

      // EUR account gets 850 EUR (1000 USD * 0.85)
      const debitEntry = entries.find(e => e.amount_display > 0)
      expect(debitEntry?.amount_account).toBe(850)

      // USD account loses 1000 USD
      const creditEntry = entries.find(e => e.amount_display < 0)
      expect(creditEntry?.amount_account).toBe(-1000)
    })
  })

  describe('createMultiSplitTransaction', () => {
    it('creates a transaction with multiple splits', async () => {
      const diningAccount = await createAccount({
        name: 'Dining',
        type: 'expense',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const entertainmentAccount = await createAccount({
        name: 'Entertainment',
        type: 'expense',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const creditCardAccount = await createAccount({
        name: 'Credit Card',
        type: 'liability',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const params: MultiSplitTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Dinner and movie',
        currency: 'USD',
        splits: [
          { accountId: diningAccount.id, amount: 45 },
          { accountId: entertainmentAccount.id, amount: 15 },
          { accountId: creditCardAccount.id, amount: -60 }
        ]
      }

      const entries = await createMultiSplitTransaction(params)

      expect(entries).toHaveLength(3)
      expect(entries[0].amount_display).toBe(45)
      expect(entries[1].amount_display).toBe(15)
      expect(entries[2].amount_display).toBe(-60)

      // Verify transaction balances
      const sum = entries.reduce((s, e) => s + e.amount_display, 0)
      expect(Math.abs(sum)).toBeLessThan(0.01)
    })

    it('includes budget information in splits', async () => {
      const expenseAccount = await createAccount({
        name: 'Expense',
        type: 'expense',
        currency: 'USD',
        include_in_net_worth: false,
        is_system_default: false,
        is_archived: false
      })

      const bankAccount = await createAccount({
        name: 'Bank',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const budget = await createBudget({
        name: 'Test Budget',
        currency: 'USD',
        is_archived: false
      })

      const params: MultiSplitTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Split with budget',
        currency: 'USD',
        splits: [
          { accountId: expenseAccount.id, amount: 100, budgetId: budget.id },
          { accountId: bankAccount.id, amount: -100 }
        ]
      }

      const entries = await createMultiSplitTransaction(params)

      expect(entries[0].budget_id).toBe(budget.id)
      expect(entries[0].amount_budget).toBe(100)
      expect(entries[1].budget_id).toBeNull()
    })

    it('throws error if transaction does not balance', async () => {
      const account1 = await createAccount({
        name: 'Account 1',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const account2 = await createAccount({
        name: 'Account 2',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false
      })

      const params: MultiSplitTransactionParams = {
        date: '2026-02-01T12:00:00.000Z',
        description: 'Unbalanced transaction',
        currency: 'USD',
        splits: [
          { accountId: account1.id, amount: 100 },
          { accountId: account2.id, amount: -50 } // Should be -100
        ]
      }

      await expect(createMultiSplitTransaction(params)).rejects.toThrow()
    })
  })
})
