/**
 * Data Access Layer for Ledger Entries
 * CRUD operations with validation and sync support
 */

import type { LedgerEntry } from '~/types/models'
import { useDatabase } from './useDatabase'
import { validateTransaction } from '~/utils/validation'

/**
 * Create a new ledger entry
 */
export async function createLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at'>): Promise<LedgerEntry> {
  const db = useDatabase()
  const now = new Date().toISOString()

  const newEntry: LedgerEntry = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now
  } as LedgerEntry

  await db.ledger_entries.add(newEntry)
  return newEntry
}

/**
 * Create multiple ledger entries as a transaction
 * Validates the transaction before committing
 */
export async function createTransaction(
  entries: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at' | 'transaction_id' | 'idx'>[]
): Promise<LedgerEntry[]> {
  const db = useDatabase()
  const now = new Date().toISOString()
  const transaction_id = crypto.randomUUID()

  // Create entries with IDs and transaction_id
  const newEntries: LedgerEntry[] = entries.map((entry, idx) => ({
    ...entry,
    id: crypto.randomUUID(),
    transaction_id,
    idx,
    created_at: now,
    updated_at: now
  })) as LedgerEntry[]

  // Validate transaction before saving
  await validateTransaction(newEntries)

  // Save all entries
  await db.ledger_entries.bulkAdd(newEntries)

  return newEntries
}

/**
 * Get ledger entry by ID
 */
export async function getLedgerEntry(id: string): Promise<LedgerEntry | undefined> {
  const db = useDatabase()
  return await db.ledger_entries.get(id)
}

/**
 * Get all ledger entries for a transaction
 */
export async function getTransaction(transaction_id: string): Promise<LedgerEntry[]> {
  const db = useDatabase()
  return await db.ledger_entries
    .where('transaction_id')
    .equals(transaction_id)
    .sortBy('idx')
}

/**
 * Update a ledger entry
 */
export async function updateLedgerEntry(
  id: string,
  changes: Partial<Omit<LedgerEntry, 'id' | 'created_at'>>
): Promise<LedgerEntry> {
  const db = useDatabase()
  const entry = await db.ledger_entries.get(id)
  
  if (!entry) {
    throw new Error(`Ledger entry ${id} not found`)
  }

  const updated: LedgerEntry = {
    ...entry,
    ...changes,
    updated_at: new Date().toISOString()
  }

  await db.ledger_entries.put(updated)
  return updated
}

/**
 * Delete a ledger entry
 */
export async function deleteLedgerEntry(id: string): Promise<void> {
  const db = useDatabase()
  await db.ledger_entries.delete(id)
}

/**
 * Delete an entire transaction (all entries with same transaction_id)
 */
export async function deleteTransaction(transaction_id: string): Promise<void> {
  const db = useDatabase()
  await db.ledger_entries
    .where('transaction_id')
    .equals(transaction_id)
    .delete()
}

/**
 * Get account activity (all entries for an account in date range)
 */
export async function getAccountActivity(
  account_id: string,
  startDate?: string,
  endDate?: string
): Promise<LedgerEntry[]> {
  const db = useDatabase()
  
  const query = db.ledger_entries.where('account_id').equals(account_id)
  
  if (startDate && endDate) {
    return await db.ledger_entries
      .where('[account_id+date]')
      .between([account_id, startDate], [account_id, endDate])
      .toArray()
  }
  
  return await query.toArray()
}

/**
 * Calculate account balance
 */
export async function calculateAccountBalance(account_id: string): Promise<number> {
  const entries = await getAccountActivity(account_id)
  
  return entries.reduce((sum, entry) => {
    return sum + entry.amount_account
  }, 0)
}

/**
 * Get budget spending (all entries for a budget in date range)
 */
export async function getBudgetSpending(
  budget_id: string,
  startDate: string,
  endDate: string
): Promise<LedgerEntry[]> {
  const db = useDatabase()
  
  return await db.ledger_entries
    .where('[budget_id+date]')
    .between([budget_id, startDate], [budget_id, endDate])
    .toArray()
}

/**
 * Calculate budget total
 */
export async function calculateBudgetTotal(
  budget_id: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const entries = await getBudgetSpending(budget_id, startDate, endDate)
  
  return entries.reduce((sum, entry) => {
    return sum + (entry.amount_budget || 0)
  }, 0)
}

/**
 * Get entries by status
 */
export async function getEntriesByStatus(status: 'projected' | 'confirmed'): Promise<LedgerEntry[]> {
  const db = useDatabase()
  return await db.ledger_entries
    .where('status')
    .equals(status)
    .toArray()
}

/**
 * Calculate account balance at a specific date
 * Only includes entries on or before the specified date
 */
export async function calculateAccountBalanceAtDate(
  account_id: string,
  date: string
): Promise<number> {
  const db = useDatabase()
  
  const entries = await db.ledger_entries
    .where('[account_id+date]')
    .between([account_id, ''], [account_id, date], true, true)
    .toArray()
  
  return entries.reduce((sum, entry) => {
    return sum + entry.amount_account
  }, 0)
}

/**
 * Get account balance history over a date range
 * Returns an array of { date, balance } objects
 */
export async function getAccountBalanceHistory(
  account_id: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; balance: number }>> {
  const db = useDatabase()
  
  // Get all entries in the date range
  const entries = await db.ledger_entries
    .where('[account_id+date]')
    .between([account_id, startDate], [account_id, endDate], true, true)
    .sortBy('date')
  
  // Get starting balance (all entries before start date)
  const startingBalance = await calculateAccountBalanceAtDate(
    account_id,
    new Date(new Date(startDate).getTime() - 1).toISOString()
  )
  
  // Build balance history
  const history: Array<{ date: string; balance: number }> = []
  let runningBalance = startingBalance
  
  for (const entry of entries) {
    runningBalance += entry.amount_account
    
    // Extract just the date part (YYYY-MM-DD)
    const dateOnly = entry.date.split('T')[0]
    
    // Update or add entry for this date
    const existingIndex = history.findIndex(h => h.date === dateOnly)
    if (existingIndex >= 0) {
      history[existingIndex].balance = runningBalance
    } else {
      history.push({ date: dateOnly, balance: runningBalance })
    }
  }
  
  return history
}

/**
 * Calculate net worth (sum of all asset and liability accounts)
 * Net worth = Assets - Liabilities
 */
export async function calculateNetWorth(displayCurrency: string): Promise<number> {
  const { getAccountsByType } = await import('./useAccounts')
  const { convertAmount } = await import('./useCurrency')
  
  // Get all asset and liability accounts that should be included
  const allAccounts = await getAccountsByType('asset')
  const assetAccounts = allAccounts.filter(a => a.include_in_net_worth)
  
  const liabilityAccounts = (await getAccountsByType('liability'))
    .filter(a => a.include_in_net_worth)
  
  let totalAssets = 0
  let totalLiabilities = 0
  
  const today = new Date().toISOString().split('T')[0]
  
  // Calculate total assets
  for (const account of assetAccounts) {
    const balance = await calculateAccountBalance(account.id)
    
    // Convert to display currency
    const converted = await convertAmount(
      balance,
      account.currency,
      displayCurrency,
      today
    )
    
    if (converted !== null) {
      totalAssets += converted
    }
  }
  
  // Calculate total liabilities
  for (const account of liabilityAccounts) {
    const balance = await calculateAccountBalance(account.id)
    
    // Convert to display currency
    const converted = await convertAmount(
      balance,
      account.currency,
      displayCurrency,
      today
    )
    
    if (converted !== null) {
      totalLiabilities += converted
    }
  }
  
  return totalAssets - totalLiabilities
}
