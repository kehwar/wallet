/**
 * Factory Reset Functionality
 * Clears all data and seeds with default accounts and example transactions
 */

import { deleteDatabase, useDatabase } from './useDatabase'
import { createAccount } from './useAccounts'
import { createExpenseTransaction, createIncomeTransaction, createTransferTransaction } from './useTransactions'
import type { Account } from '~/types/models'

/**
 * Seed data structure
 */
interface SeedData {
  accounts: {
    cash: Account
    bank: Account
    income: Account
    expense: Account
  }
}

/**
 * Clear all data and seed default accounts and transactions
 */
export async function factoryReset(): Promise<void> {
  // Step 1: Delete the entire database
  await deleteDatabase()
  
  // Step 2: Reinitialize the database (just ensure it's initialized)
  useDatabase()
  
  // Step 3: Seed default accounts
  const seedData = await seedDefaultAccounts()
  
  // Step 4: Seed example transactions
  await seedExampleTransactions(seedData)
}

/**
 * Seed default accounts (Cash, Bank, Income, Expense)
 */
async function seedDefaultAccounts(): Promise<SeedData> {
  const currency = 'USD' // Default currency
  
  // Create Cash account
  const cash = await createAccount({
    name: 'Cash',
    type: 'asset',
    currency,
    include_in_net_worth: true,
    is_system_default: false,
    is_archived: false,
  })
  
  // Create Bank account
  const bank = await createAccount({
    name: 'Bank Account',
    type: 'asset',
    currency,
    include_in_net_worth: true,
    is_system_default: false,
    is_archived: false,
  })
  
  // Create Income account
  const income = await createAccount({
    name: 'Salary',
    type: 'income',
    currency,
    include_in_net_worth: false,
    is_system_default: false,
    is_archived: false,
  })
  
  // Create Expense account
  const expense = await createAccount({
    name: 'Groceries',
    type: 'expense',
    currency,
    include_in_net_worth: false,
    is_system_default: false,
    is_archived: false,
  })
  
  return {
    accounts: {
      cash,
      bank,
      income,
      expense,
    },
  }
}

/**
 * Seed example transactions (income, expense, transfer)
 */
async function seedExampleTransactions(seedData: SeedData): Promise<void> {
  const { cash, bank, income, expense } = seedData.accounts
  const currency = 'USD'
  
  // Get dates for example transactions
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  // Example 1: Income transaction - Salary received
  await createIncomeTransaction({
    date: lastWeek.toISOString(),
    description: 'Monthly Salary',
    amount: 3000,
    currency,
    incomeAccountId: income.id,
    assetAccountId: bank.id,
    status: 'confirmed',
    search_tags: ['salary', 'income'],
  })
  
  // Example 2: Expense transaction - Grocery shopping
  await createExpenseTransaction({
    date: yesterday.toISOString(),
    description: 'Grocery Shopping',
    amount: 150,
    currency,
    expenseAccountId: expense.id,
    assetAccountId: bank.id,
    status: 'confirmed',
    search_tags: ['groceries', 'food'],
  })
  
  // Example 3: Transfer transaction - ATM withdrawal
  await createTransferTransaction({
    date: yesterday.toISOString(),
    description: 'ATM Withdrawal',
    amount: 200,
    currency,
    fromAccountId: bank.id,
    toAccountId: cash.id,
    status: 'confirmed',
    search_tags: ['transfer', 'atm'],
  })
}

/**
 * Vue composable wrapper for factory reset functionality
 */
export function useFactoryReset() {
  const isResetting = ref(false)
  const resetError = ref<string | null>(null)
  
  const performReset = async (): Promise<boolean> => {
    isResetting.value = true
    resetError.value = null
    
    try {
      await factoryReset()
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform factory reset'
      resetError.value = errorMessage
      console.error('Factory reset error:', error)
      return false
    } finally {
      isResetting.value = false
    }
  }
  
  return {
    isResetting,
    resetError,
    performReset,
  }
}
