/**
 * Data Access Layer for Budgets
 * CRUD operations for budget categories
 */

import type { Budget } from '~/types/models'
import { useDatabase } from './useDatabase'

/**
 * Create a new budget
 */
export async function createBudget(
  data: Omit<Budget, 'id' | 'updated_at'>
): Promise<Budget> {
  const db = useDatabase()
  const now = new Date().toISOString()

  const newBudget: Budget = {
    ...data,
    id: crypto.randomUUID(),
    updated_at: now
  }

  // Basic validation
  if (!newBudget.name || newBudget.name.trim().length === 0) {
    throw new Error('Budget name cannot be empty')
  }

  if (!newBudget.currency || newBudget.currency.length !== 3) {
    throw new Error('Invalid currency code')
  }

  await db.budgets.add(newBudget)
  return newBudget
}

/**
 * Get budget by ID
 */
export async function getBudget(id: string): Promise<Budget | undefined> {
  const db = useDatabase()
  return await db.budgets.get(id)
}

/**
 * Get all budgets
 */
export async function getAllBudgets(includeArchived = false): Promise<Budget[]> {
  const db = useDatabase()
  const budgets = await db.budgets.toArray()
  
  if (includeArchived) {
    return budgets
  }
  
  return budgets.filter(budget => !budget.is_archived)
}

/**
 * Update a budget
 */
export async function updateBudget(
  id: string,
  changes: Partial<Omit<Budget, 'id' | 'currency'>> // Currency is immutable
): Promise<Budget> {
  const db = useDatabase()
  const budget = await db.budgets.get(id)
  
  if (!budget) {
    throw new Error(`Budget ${id} not found`)
  }

  const updated: Budget = {
    ...budget,
    ...changes,
    updated_at: new Date().toISOString()
  }

  await db.budgets.put(updated)
  return updated
}

/**
 * Archive a budget (soft delete)
 */
export async function archiveBudget(id: string): Promise<Budget> {
  return await updateBudget(id, { is_archived: true })
}

/**
 * Unarchive a budget
 */
export async function unarchiveBudget(id: string): Promise<Budget> {
  return await updateBudget(id, { is_archived: false })
}

/**
 * Delete a budget (hard delete - use with caution)
 * Should only be used if no ledger entries exist for this budget
 */
export async function deleteBudget(id: string): Promise<void> {
  const db = useDatabase()
  
  // Check if any ledger entries exist for this budget
  const entries = await db.ledger_entries
    .where('budget_id')
    .equals(id)
    .count()
  
  if (entries > 0) {
    throw new Error(`Cannot delete budget ${id}: ${entries} ledger entries exist. Use archive instead.`)
  }
  
  await db.budgets.delete(id)
}

/**
 * Vue composable wrapper for budgets functionality
 * Provides reactive state and all CRUD operations
 */
export function useBudgets() {
  const budgets = ref<Budget[]>([])

  const listBudgets = async (includeArchived = false) => {
    budgets.value = await getAllBudgets(includeArchived)
  }

  return {
    budgets,
    listBudgets,
    createBudget,
    getBudget,
    getAllBudgets,
    updateBudget,
    archiveBudget,
    unarchiveBudget,
    deleteBudget,
  }
}

