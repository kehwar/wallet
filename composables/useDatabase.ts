/**
 * IndexDB Database using Dexie.js
 * Implements the wallet database schema with offline-first storage
 */

import Dexie, { type EntityTable } from 'dexie'
import type {
  LedgerEntry,
  Account,
  Budget,
  ExchangeRate,
  RecurringRule
} from '~/types/models'

export class WalletDatabase extends Dexie {
  ledger_entries!: EntityTable<LedgerEntry, 'id'>
  accounts!: EntityTable<Account, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  rates!: EntityTable<ExchangeRate, 'id'>
  rules!: EntityTable<RecurringRule, 'id'>

  constructor() {
    super('wallet_db')

    this.version(1).stores({
      ledger_entries: `
        id,
        transaction_id,
        date,
        status,
        updated_at,
        account_id,
        budget_id,
        [account_id+date],
        [budget_id+date],
        [transaction_id+idx]
      `,
      accounts: 'id, updated_at',
      budgets: 'id, updated_at',
      rates: 'id, date, updated_at',
      rules: 'id, updated_at'
    })
  }
}

// Singleton instance
let dbInstance: WalletDatabase | null = null

/**
 * Get the database instance (singleton)
 */
export function useDatabase(): WalletDatabase {
  if (!dbInstance) {
    dbInstance = new WalletDatabase()
  }
  return dbInstance
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close()
    dbInstance = null
  }
}

/**
 * Delete the entire database (for testing or reset)
 */
export async function deleteDatabase(): Promise<void> {
  await closeDatabase()
  await Dexie.delete('wallet_db')
}
