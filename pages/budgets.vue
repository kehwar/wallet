<template>
  <AppLayout>
    <div class="budgets-page">
      <div class="page-header">
        <h1>Budgets</h1>
        <button class="btn btn-primary" @click="showNewBudgetForm = true">
          + New Budget
        </button>
      </div>

      <!-- New/Edit Budget Form -->
      <div v-if="showNewBudgetForm || editingBudget" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ editingBudget ? 'Edit Budget' : 'New Budget' }}</h2>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          
          <form class="budget-form" @submit.prevent="handleSubmit">
            <div class="form-row">
              <label class="form-label">Budget Name</label>
              <input v-model="form.name" type="text" class="form-input" placeholder="e.g., Groceries" required >
            </div>

            <div class="form-row">
              <label class="form-label">Category</label>
              <select v-model="form.category" class="form-select" required>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div class="form-row">
              <label class="form-label">Currency</label>
              <select v-model="form.currency" class="form-select" required :disabled="!!editingBudget">
                <option v-for="currency in commonCurrencies" :key="currency" :value="currency">
                  {{ currency }}
                </option>
              </select>
              <p v-if="editingBudget" class="form-hint">Currency cannot be changed after creation</p>
            </div>

            <div class="form-row">
              <label class="form-label">Description (Optional)</label>
              <textarea v-model="form.description" class="form-textarea" placeholder="Budget details..." rows="3"/>
            </div>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Saving...' : (editingBudget ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Budgets List -->
      <div v-if="isLoading" class="loading">Loading budgets...</div>

      <div v-else class="budgets-groups">
        <div v-for="(group, category) in groupedBudgets" :key="category" class="budget-group">
          <h2 class="group-title">{{ formatCategory(category) }}</h2>
          
          <div v-if="group.length === 0" class="empty-group">
            No {{ category }} budgets yet.
          </div>

          <div v-else class="budgets-list">
            <div v-for="budget in group" :key="budget.id" class="budget-card">
              <div class="budget-info">
                <h3 class="budget-name">{{ budget.name }}</h3>
                <p v-if="budget.description" class="budget-description">{{ budget.description }}</p>
                <div class="budget-meta">
                  <span class="budget-currency">{{ budget.currency }}</span>
                  <span class="budget-transactions">{{ getTransactionCount(budget.id) }} transactions</span>
                </div>
              </div>
              <div class="budget-total">
                <div class="total-amount" :class="{ positive: getTotal(budget.id) > 0, negative: getTotal(budget.id) < 0 }">
                  {{ formatAmount(Math.abs(getTotal(budget.id)), budget.currency) }}
                </div>
                <div class="total-label">Total</div>
              </div>
              <div class="budget-actions">
                <button class="btn-icon" title="Edit" @click="editBudget(budget)">
                  ✏️
                </button>
                <button class="btn-icon" title="Delete" @click="deleteBudget(budget)">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBudgets } from '../composables/useBudgets'
import { useLedger } from '../composables/useLedger'
import { useCurrency } from '../composables/useCurrency'
import type { Budget } from '../types/models'
import Decimal from 'decimal.js'

const { budgets, listBudgets, createBudget, updateBudget, deleteBudget: removeBudget } = useBudgets()
const { entries, listEntries } = useLedger()
const { formatCurrency } = useCurrency()

const showNewBudgetForm = ref(false)
const editingBudget = ref<Budget | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')

const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'PEN']

const form = ref({
  name: '',
  category: 'expense' as 'expense' | 'income',
  currency: 'USD',
  description: '',
})

const groupedBudgets = computed(() => {
  const groups: Record<string, Budget[]> = {
    expense: [],
    income: [],
  }

  budgets.value.forEach(budget => {
    if (groups[budget.category]) {
      groups[budget.category].push(budget)
    }
  })

  return groups
})

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1) + ' Budgets'
}

function getTransactionCount(budgetId: string): number {
  return entries.value.filter(e => e.budget_id === budgetId).length
}

function getTotal(budgetId: string): number {
  const budgetEntries = entries.value.filter(e => e.budget_id === budgetId)
  const total = budgetEntries.reduce((sum, entry) => {
    return sum.add(new Decimal(entry.amount_display))
  }, new Decimal(0))
  return total.toNumber()
}

function formatAmount(amount: number, currency: string): string {
  return formatCurrency(amount, currency)
}

function editBudget(budget: Budget) {
  editingBudget.value = budget
  form.value = {
    name: budget.name,
    category: budget.category,
    currency: budget.currency,
    description: budget.description || '',
  }
}

async function deleteBudget(budget: Budget) {
  const transactionCount = getTransactionCount(budget.id)
  
  if (transactionCount > 0) {
    alert(`Cannot delete budget "${budget.name}" because it has ${transactionCount} transactions. Delete or reassign the transactions first.`)
    return
  }

  if (confirm(`Are you sure you want to delete "${budget.name}"?`)) {
    try {
      await removeBudget(budget.id)
      await loadData()
    } catch (error) {
      alert(`Failed to delete budget: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

function closeModal() {
  showNewBudgetForm.value = false
  editingBudget.value = null
  errorMessage.value = ''
  form.value = {
    name: '',
    category: 'expense',
    currency: 'USD',
    description: '',
  }
}

async function handleSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (editingBudget.value) {
      await updateBudget(editingBudget.value.id, {
        name: form.value.name,
        description: form.value.description,
      })
    } else {
      await createBudget({
        name: form.value.name,
        category: form.value.category,
        currency: form.value.currency,
        description: form.value.description,
      })
    }

    await loadData()
    closeModal()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save budget'
  } finally {
    isSubmitting.value = false
  }
}

async function loadData() {
  isLoading.value = true
  try {
    await Promise.all([
      listBudgets(),
      listEntries(),
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.budgets-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0;
}

.budget-form {
  padding: 1.5rem;
}

.form-row {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: white;
  border-radius: 0.5rem;
}

.budgets-groups {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.budget-group {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.group-title {
  font-size: 1.25rem;
  color: #1f2937;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.empty-group {
  color: #9ca3af;
  font-style: italic;
  padding: 1rem 0;
}

.budgets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.budget-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1.5rem;
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  align-items: center;
  transition: background 0.2s;
}

.budget-card:hover {
  background: #f3f4f6;
}

.budget-info {
  min-width: 0;
}

.budget-name {
  font-size: 1.125rem;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.budget-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.budget-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.budget-total {
  text-align: right;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.total-amount.positive {
  color: #059669;
}

.total-amount.negative {
  color: #dc2626;
}

.total-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.budget-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .budget-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .budget-total {
    text-align: left;
  }

  .budget-actions {
    justify-content: flex-start;
  }
}
</style>
