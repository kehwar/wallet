/**
 * Data Access Layer for Accounts
 * CRUD operations with validation
 */

import type { Account, AccountType } from '~/types/models'
import { useDatabase } from './useDatabase'
import { validateAccount } from '~/utils/validation'

/**
 * Create a new account
 */
export async function createAccount(
  data: Omit<Account, 'id' | 'updated_at'>
): Promise<Account> {
  const db = useDatabase()
  const now = new Date().toISOString()

  const newAccount: Account = {
    ...data,
    id: crypto.randomUUID(),
    updated_at: now
  }

  // Validate before saving
  validateAccount(newAccount)

  await db.accounts.add(newAccount)
  return newAccount
}

/**
 * Get account by ID
 */
export async function getAccount(id: string): Promise<Account | undefined> {
  const db = useDatabase()
  return await db.accounts.get(id)
}

/**
 * Get all accounts
 */
export async function getAllAccounts(includeArchived = false): Promise<Account[]> {
  const db = useDatabase()
  const accounts = await db.accounts.toArray()
  
  if (includeArchived) {
    return accounts
  }
  
  return accounts.filter(account => !account.is_archived)
}

/**
 * Get accounts by type
 */
export async function getAccountsByType(type: AccountType, includeArchived = false): Promise<Account[]> {
  const accounts = await getAllAccounts(includeArchived)
  return accounts.filter(account => account.type === type)
}

/**
 * Update an account
 */
export async function updateAccount(
  id: string,
  changes: Partial<Omit<Account, 'id' | 'currency'>> // Currency is immutable
): Promise<Account> {
  const db = useDatabase()
  const account = await db.accounts.get(id)
  
  if (!account) {
    throw new Error(`Account ${id} not found`)
  }

  const updated: Account = {
    ...account,
    ...changes,
    updated_at: new Date().toISOString()
  }

  // Validate updated account
  validateAccount(updated)

  await db.accounts.put(updated)
  return updated
}

/**
 * Archive an account (soft delete)
 */
export async function archiveAccount(id: string): Promise<Account> {
  return await updateAccount(id, { is_archived: true })
}

/**
 * Unarchive an account
 */
export async function unarchiveAccount(id: string): Promise<Account> {
  return await updateAccount(id, { is_archived: false })
}

/**
 * Delete an account (hard delete - use with caution)
 * Should only be used if no ledger entries exist for this account
 */
export async function deleteAccount(id: string): Promise<void> {
  const db = useDatabase()
  
  // Check if any ledger entries exist for this account
  const entries = await db.ledger_entries
    .where('account_id')
    .equals(id)
    .count()
  
  if (entries > 0) {
    throw new Error(`Cannot delete account ${id}: ${entries} ledger entries exist. Use archive instead.`)
  }
  
  await db.accounts.delete(id)
}

/**
 * Get system default account (e.g., "Ready to Assign")
 */
export async function getSystemDefaultAccount(): Promise<Account | undefined> {
  const db = useDatabase()
  const accounts = await db.accounts.toArray()
  return accounts.find(account => account.is_system_default)
}

/**
 * Vue composable wrapper for accounts functionality
 * Provides reactive state and all CRUD operations
 */
export function useAccounts() {
  const accounts = ref<Account[]>([])

  const listAccounts = async (includeArchived = false) => {
    accounts.value = await getAllAccounts(includeArchived)
  }

  return {
    accounts,
    listAccounts,
    createAccount,
    getAccount,
    getAllAccounts,
    updateAccount,
    archiveAccount,
    unarchiveAccount,
    deleteAccount,
    getSystemDefaultAccount,
  }
}

/**
 * Get or create a system expense account for a currency
 */
export async function getOrCreateSystemExpenseAccount(currency: string): Promise<Account> {
  const db = useDatabase()
  const accounts = await db.accounts.toArray()
  
  // Look for existing system expense account
  const existing = accounts.find(a => 
    a.type === 'expense' && 
    a.currency === currency &&
    a.name.startsWith('System Expense')
  )
  
  if (existing) {
    return existing
  }
  
  // Create new system expense account
  return await createAccount({
    name: `System Expense (${currency})`,
    type: 'expense',
    currency,
    description: 'Auto-created system expense account',
  })
}

/**
 * Get or create a system income account for a currency
 */
export async function getOrCreateSystemIncomeAccount(currency: string): Promise<Account> {
  const db = useDatabase()
  const accounts = await db.accounts.toArray()
  
  // Look for existing system income account
  const existing = accounts.find(a => 
    a.type === 'income' && 
    a.currency === currency &&
    a.name.startsWith('System Income')
  )
  
  if (existing) {
    return existing
  }
  
  // Create new system income account
  return await createAccount({
    name: `System Income (${currency})`,
    type: 'income',
    currency,
    description: 'Auto-created system income account',
  })
}

