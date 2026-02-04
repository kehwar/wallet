/**
 * High-Level Transaction API
 * Provides convenient functions for common transaction patterns
 */

import type { LedgerEntry, CurrencyCode, TransactionStatus } from '~/types/models'
import { createTransaction } from './useLedger'
import { getAccount, getOrCreateSystemExpenseAccount, getOrCreateSystemIncomeAccount } from './useAccounts'
import { getBudget } from './useBudgets'
import { findExchangeRate } from './useExchangeRates'

/**
 * Parameters for creating an income transaction
 */
export interface IncomeTransactionParams {
  date: string
  description: string
  amount: number
  currency: CurrencyCode
  incomeAccountId: string // e.g., Salary account
  assetAccountId: string // e.g., Bank account
  budgetId?: string
  status?: TransactionStatus
  search_tags?: string[]
}

/**
 * Parameters for creating an expense transaction
 */
export interface ExpenseTransactionParams {
  date: string
  description: string
  amount: number
  currency: CurrencyCode
  expenseAccountId: string // e.g., Groceries account
  assetAccountId: string // e.g., Bank or Cash account
  budgetId?: string
  status?: TransactionStatus
  search_tags?: string[]
}

/**
 * Parameters for creating a transfer between accounts
 */
export interface TransferTransactionParams {
  date: string
  description: string
  amount: number
  currency: CurrencyCode
  fromAccountId: string
  toAccountId: string
  status?: TransactionStatus
  search_tags?: string[]
}

/**
 * Parameters for creating a multi-split transaction
 */
export interface MultiSplitTransactionParams {
  date: string
  description: string
  currency: CurrencyCode
  splits: {
    accountId: string
    amount: number // Signed: positive for debit, negative for credit
    budgetId?: string
  }[]
  status?: TransactionStatus
  search_tags?: string[]
}

/**
 * Get exchange rate for conversion, returns 1 if same currency
 */
async function getExchangeRateOrOne(
  date: string,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1
  }
  
  const rate = await findExchangeRate(fromCurrency, toCurrency, date.split('T')[0])
  if (rate === null) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency} on ${date}`)
  }
  
  return rate
}

/**
 * Create an income transaction
 * 
 * Example: Recording salary of $5000
 * - Debit: Bank Account (Asset) +$5000
 * - Credit: Salary (Income) -$5000
 */
export async function createIncomeTransaction(
  params: IncomeTransactionParams
): Promise<LedgerEntry[]> {
  // Validate accounts exist
  const incomeAccount = await getAccount(params.incomeAccountId)
  const assetAccount = await getAccount(params.assetAccountId)
  
  if (!incomeAccount || !assetAccount) {
    throw new Error('Income or asset account not found')
  }
  
  // Validate budget if provided
  if (params.budgetId) {
    const budget = await getBudget(params.budgetId)
    if (!budget) {
      throw new Error('Budget not found')
    }
  }
  
  // Get exchange rates
  const rateToIncome = await getExchangeRateOrOne(params.date, params.currency, incomeAccount.currency)
  const rateToAsset = await getExchangeRateOrOne(params.date, params.currency, assetAccount.currency)
  
  // Get budget rate if budget specified
  let rateToBudget: number | null = null
  if (params.budgetId) {
    const budget = await getBudget(params.budgetId)
    if (budget) {
      rateToBudget = await getExchangeRateOrOne(params.date, params.currency, budget.currency)
    }
  }
  
  // Create ledger entries
  const entries: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at' | 'transaction_id' | 'idx'>[] = [
    // Debit: Asset account increases
    {
      date: params.date,
      description: params.description,
      status: params.status || 'confirmed',
      search_tags: params.search_tags,
      currency_display: params.currency,
      amount_display: params.amount,
      account_id: params.assetAccountId,
      amount_account: params.amount * rateToAsset,
      rate_display_to_account: rateToAsset,
      budget_id: params.budgetId || null,
      amount_budget: rateToBudget ? params.amount * rateToBudget : null,
      rate_display_to_budget: rateToBudget
    },
    // Credit: Income account (negative for credit)
    {
      date: params.date,
      description: params.description,
      status: params.status || 'confirmed',
      search_tags: params.search_tags,
      currency_display: params.currency,
      amount_display: -params.amount,
      account_id: params.incomeAccountId,
      amount_account: -params.amount * rateToIncome,
      rate_display_to_account: rateToIncome,
      budget_id: null,
      amount_budget: null,
      rate_display_to_budget: null
    }
  ]
  
  return await createTransaction(entries)
}

/**
 * Create an expense transaction
 * 
 * Example: Buying groceries for $50
 * - Debit: Groceries (Expense) +$50
 * - Credit: Bank Account (Asset) -$50
 */
export async function createExpenseTransaction(
  params: ExpenseTransactionParams
): Promise<LedgerEntry[]> {
  // Validate accounts exist
  const expenseAccount = await getAccount(params.expenseAccountId)
  const assetAccount = await getAccount(params.assetAccountId)
  
  if (!expenseAccount || !assetAccount) {
    throw new Error('Expense or asset account not found')
  }
  
  // Validate budget if provided
  if (params.budgetId) {
    const budget = await getBudget(params.budgetId)
    if (!budget) {
      throw new Error('Budget not found')
    }
  }
  
  // Get exchange rates
  const rateToExpense = await getExchangeRateOrOne(params.date, params.currency, expenseAccount.currency)
  const rateToAsset = await getExchangeRateOrOne(params.date, params.currency, assetAccount.currency)
  
  // Get budget rate if budget specified
  let rateToBudget: number | null = null
  if (params.budgetId) {
    const budget = await getBudget(params.budgetId)
    if (budget) {
      rateToBudget = await getExchangeRateOrOne(params.date, params.currency, budget.currency)
    }
  }
  
  // Create ledger entries
  const entries: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at' | 'transaction_id' | 'idx'>[] = [
    // Debit: Expense account increases
    {
      date: params.date,
      description: params.description,
      status: params.status || 'confirmed',
      search_tags: params.search_tags,
      currency_display: params.currency,
      amount_display: params.amount,
      account_id: params.expenseAccountId,
      amount_account: params.amount * rateToExpense,
      rate_display_to_account: rateToExpense,
      budget_id: params.budgetId || null,
      amount_budget: rateToBudget ? params.amount * rateToBudget : null,
      rate_display_to_budget: rateToBudget
    },
    // Credit: Asset account decreases (negative for credit)
    {
      date: params.date,
      description: params.description,
      status: params.status || 'confirmed',
      search_tags: params.search_tags,
      currency_display: params.currency,
      amount_display: -params.amount,
      account_id: params.assetAccountId,
      amount_account: -params.amount * rateToAsset,
      rate_display_to_account: rateToAsset,
      budget_id: null,
      amount_budget: null,
      rate_display_to_budget: null
    }
  ]
  
  return await createTransaction(entries)
}

/**
 * Create a transfer transaction between accounts
 * 
 * Example: Transferring $100 from checking to savings
 * - Debit: Savings Account (Asset) +$100
 * - Credit: Checking Account (Asset) -$100
 */
export async function createTransferTransaction(
  params: TransferTransactionParams
): Promise<LedgerEntry[]> {
  // Validate accounts exist
  const fromAccount = await getAccount(params.fromAccountId)
  const toAccount = await getAccount(params.toAccountId)
  
  if (!fromAccount || !toAccount) {
    throw new Error('From or to account not found')
  }
  
  // Get exchange rates
  const rateToFrom = await getExchangeRateOrOne(params.date, params.currency, fromAccount.currency)
  const rateToTo = await getExchangeRateOrOne(params.date, params.currency, toAccount.currency)
  
  // Create ledger entries
  const entries: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at' | 'transaction_id' | 'idx'>[] = [
    // Debit: To account increases
    {
      date: params.date,
      description: params.description,
      status: params.status || 'confirmed',
      search_tags: params.search_tags,
      currency_display: params.currency,
      amount_display: params.amount,
      account_id: params.toAccountId,
      amount_account: params.amount * rateToTo,
      rate_display_to_account: rateToTo,
      budget_id: null,
      amount_budget: null,
      rate_display_to_budget: null
    },
    // Credit: From account decreases (negative for credit)
    {
      date: params.date,
      description: params.description,
      status: params.status || 'confirmed',
      search_tags: params.search_tags,
      currency_display: params.currency,
      amount_display: -params.amount,
      account_id: params.fromAccountId,
      amount_account: -params.amount * rateToFrom,
      rate_display_to_account: rateToFrom,
      budget_id: null,
      amount_budget: null,
      rate_display_to_budget: null
    }
  ]
  
  return await createTransaction(entries)
}

/**
 * Create a multi-split transaction
 * 
 * Example: Splitting restaurant bill - $60 total
 * - Debit: Dining (Expense) +$45
 * - Debit: Entertainment (Expense) +$15
 * - Credit: Credit Card (Liability) -$60
 * 
 * The amounts must balance to zero when summed
 */
export async function createMultiSplitTransaction(
  params: MultiSplitTransactionParams
): Promise<LedgerEntry[]> {
  // Validate all accounts exist
  for (const split of params.splits) {
    const account = await getAccount(split.accountId)
    if (!account) {
      throw new Error(`Account ${split.accountId} not found`)
    }
    
    // Validate budget if provided
    if (split.budgetId) {
      const budget = await getBudget(split.budgetId)
      if (!budget) {
        throw new Error(`Budget ${split.budgetId} not found`)
      }
    }
  }
  
  // Create ledger entries
  const entries: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at' | 'transaction_id' | 'idx'>[] = []
  
  for (const split of params.splits) {
    const account = await getAccount(split.accountId)
    if (!account) continue // Should not happen due to validation above
    
    const rateToAccount = await getExchangeRateOrOne(params.date, params.currency, account.currency)
    
    // Get budget rate if budget specified
    let rateToBudget: number | null = null
    let amountBudget: number | null = null
    if (split.budgetId) {
      const budget = await getBudget(split.budgetId)
      if (budget) {
        rateToBudget = await getExchangeRateOrOne(params.date, params.currency, budget.currency)
        amountBudget = split.amount * rateToBudget
      }
    }
    
    entries.push({
      date: params.date,
      description: params.description,
      status: params.status || 'confirmed',
      search_tags: params.search_tags,
      currency_display: params.currency,
      amount_display: split.amount,
      account_id: split.accountId,
      amount_account: split.amount * rateToAccount,
      rate_display_to_account: rateToAccount,
      budget_id: split.budgetId || null,
      amount_budget: amountBudget,
      rate_display_to_budget: rateToBudget
    })
  }
  
  return await createTransaction(entries)
}

/**
 * Simplified transaction creation functions for UI
 * These create system accounts automatically
 */

/**
 * Simplified parameters for creating an expense (UI-friendly)
 */
export interface SimpleExpenseParams {
  fromAccountId: string  // Asset account to pay from
  amount: number
  currency: CurrencyCode
  description: string
  date: string
  budgetId?: string
  status?: TransactionStatus
}

/**
 * Simplified parameters for creating an income (UI-friendly)
 */
export interface SimpleIncomeParams {
  toAccountId: string  // Asset account to receive into
  amount: number
  currency: CurrencyCode
  description: string
  date: string
  budgetId?: string
  status?: TransactionStatus
}

/**
 * Create an expense transaction (simplified - creates system expense account automatically)
 */
async function createSimpleExpense(params: SimpleExpenseParams): Promise<LedgerEntry[]> {
  // Get or create a default expense account for this currency
  const expenseAccount = await getOrCreateSystemExpenseAccount(params.currency)
  
  return await createExpenseTransaction({
    ...params,
    expenseAccountId: expenseAccount.id,
    assetAccountId: params.fromAccountId,
  })
}

/**
 * Create an income transaction (simplified - creates system income account automatically)
 */
async function createSimpleIncome(params: SimpleIncomeParams): Promise<LedgerEntry[]> {
  // Get or create a default income account for this currency
  const incomeAccount = await getOrCreateSystemIncomeAccount(params.currency)
  
  return await createIncomeTransaction({
    ...params,
    incomeAccountId: incomeAccount.id,
    assetAccountId: params.toAccountId,
  })
}

/**
 * Aliases for convenience (use simplified versions for UI)
 */
const createExpense = createSimpleExpense
const createIncome = createSimpleIncome
const createTransfer = createTransferTransaction
const createMultiSplit = createMultiSplitTransaction

/**
 * Vue composable wrapper for transactions functionality
 * Provides all transaction utilities
 */
export function useTransactions() {
  return {
    createExpense,
    createIncome,
    createTransfer,
    createMultiSplit,
  }
}

