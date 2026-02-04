<template>
  <AppLayout>
    <div class="transactions-page">
      <div class="page-header">
        <h1>Transactions</h1>
        <button class="btn btn-primary" @click="showNewTransactionForm = true">
          + New Transaction
        </button>
      </div>

      <!-- New Transaction Form -->
      <div v-if="showNewTransactionForm" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>New Transaction</h2>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          
          <form class="transaction-form" @submit.prevent="handleSubmit">
            <div class="form-row">
              <label class="form-label">Type</label>
              <select v-model="form.type" class="form-select">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div class="form-row">
              <label class="form-label">Date</label>
              <input v-model="form.date" type="date" class="form-input" required >
            </div>

            <div class="form-row">
              <label class="form-label">Description</label>
              <input v-model="form.description" type="text" class="form-input" placeholder="e.g., Grocery shopping" required >
            </div>

            <div class="form-row">
              <label class="form-label">Amount</label>
              <div class="input-group">
                <input v-model.number="form.amount" type="number" step="0.01" min="0" class="form-input" placeholder="0.00" required >
                <select v-model="form.currency" class="form-select-addon">
                  <option v-for="currency in commonCurrencies" :key="currency" :value="currency">
                    {{ currency }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="form.type === 'expense'" class="form-row">
              <label class="form-label">From Account</label>
              <select v-model="form.fromAccountId" class="form-select" required>
                <option value="">Select account...</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.currency }})
                </option>
              </select>
            </div>

            <div v-if="form.type === 'expense'" class="form-row">
              <label class="form-label">Category (Optional)</label>
              <select v-model="form.budgetId" class="form-select">
                <option value="">None</option>
                <option v-for="budget in budgets" :key="budget.id" :value="budget.id">
                  {{ budget.name }}
                </option>
              </select>
            </div>

            <div v-if="form.type === 'income'" class="form-row">
              <label class="form-label">To Account</label>
              <select v-model="form.toAccountId" class="form-select" required>
                <option value="">Select account...</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.currency }})
                </option>
              </select>
            </div>

            <div v-if="form.type === 'income'" class="form-row">
              <label class="form-label">Source (Optional)</label>
              <select v-model="form.budgetId" class="form-select">
                <option value="">None</option>
                <option v-for="budget in budgets" :key="budget.id" :value="budget.id">
                  {{ budget.name }}
                </option>
              </select>
            </div>

            <div v-if="form.type === 'transfer'" class="form-row">
              <label class="form-label">From Account</label>
              <select v-model="form.fromAccountId" class="form-select" required>
                <option value="">Select account...</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.currency }})
                </option>
              </select>
            </div>

            <div v-if="form.type === 'transfer'" class="form-row">
              <label class="form-label">To Account</label>
              <select v-model="form.toAccountId" class="form-select" required>
                <option value="">Select account...</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.currency }})
                </option>
              </select>
            </div>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Saving...' : 'Save Transaction' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filter-group">
          <input v-model="filters.search" type="text" placeholder="Search transactions..." class="form-input" >
        </div>
        <div class="filter-group">
          <select v-model="filters.accountId" class="form-select">
            <option value="">All Accounts</option>
            <option v-for="account in accounts" :key="account.id" :value="account.id">
              {{ account.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Transaction List -->
      <div v-if="isLoading" class="loading">Loading transactions...</div>
      
      <div v-else-if="filteredTransactions.length === 0" class="empty-state">
        <p>No transactions yet. Create your first transaction!</p>
      </div>

      <div v-else class="transactions-list">
        <div v-for="entry in filteredTransactions" :key="entry.id" class="transaction-item">
          <div class="transaction-date">
            {{ formatDate(entry.date) }}
          </div>
          <div class="transaction-details">
            <div class="transaction-description">{{ entry.description }}</div>
            <div class="transaction-account">
              {{ getAccountName(entry.account_id) }}
              <span v-if="entry.budget_id" class="transaction-budget">
                • {{ getBudgetName(entry.budget_id) }}
              </span>
            </div>
          </div>
          <div class="transaction-amount" :class="{ positive: entry.amount_display > 0, negative: entry.amount_display < 0 }">
            {{ formatAmount(entry.amount_display, entry.currency_display) }}
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccounts } from '../composables/useAccounts'
import { useBudgets } from '../composables/useBudgets'
import { useLedger } from '../composables/useLedger'
import { useTransactions } from '../composables/useTransactions'
import { useCurrency } from '../composables/useCurrency'

const { accounts, listAccounts } = useAccounts()
const { budgets, listBudgets } = useBudgets()
const { entries, listEntries } = useLedger()
const { createExpense, createIncome, createTransfer } = useTransactions()
const { formatCurrency } = useCurrency()

const showNewTransactionForm = ref(false)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')

const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'PEN']

const form = ref({
  type: 'expense',
  date: new Date().toISOString().split('T')[0],
  description: '',
  amount: 0,
  currency: 'USD',
  fromAccountId: '',
  toAccountId: '',
  budgetId: '',
})

const filters = ref({
  search: '',
  accountId: '',
})

const filteredTransactions = computed(() => {
  let result = entries.value

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(e => 
      e.description.toLowerCase().includes(search)
    )
  }

  if (filters.value.accountId) {
    result = result.filter(e => e.account_id === filters.value.accountId)
  }

  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

function getAccountName(accountId: string): string {
  const account = accounts.value.find(a => a.id === accountId)
  return account?.name || 'Unknown'
}

function getBudgetName(budgetId: string): string {
  const budget = budgets.value.find(b => b.id === budgetId)
  return budget?.name || 'Unknown'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatAmount(amount: number, currency: string): string {
  return formatCurrency(amount, currency)
}

function closeModal() {
  showNewTransactionForm.value = false
  errorMessage.value = ''
  form.value = {
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    currency: 'USD',
    fromAccountId: '',
    toAccountId: '',
    budgetId: '',
  }
}

async function handleSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const date = new Date(form.value.date + 'T12:00:00Z').toISOString()
    
    if (form.value.type === 'expense') {
      await createExpense({
        fromAccountId: form.value.fromAccountId,
        amount: form.value.amount,
        currency: form.value.currency,
        description: form.value.description,
        date,
        budgetId: form.value.budgetId || undefined,
      })
    } else if (form.value.type === 'income') {
      await createIncome({
        toAccountId: form.value.toAccountId,
        amount: form.value.amount,
        currency: form.value.currency,
        description: form.value.description,
        date,
        budgetId: form.value.budgetId || undefined,
      })
    } else if (form.value.type === 'transfer') {
      await createTransfer({
        fromAccountId: form.value.fromAccountId,
        toAccountId: form.value.toAccountId,
        amount: form.value.amount,
        currency: form.value.currency,
        description: form.value.description,
        date,
      })
    }

    await loadData()
    closeModal()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to create transaction'
  } finally {
    isSubmitting.value = false
  }
}

async function loadData() {
  isLoading.value = true
  try {
    await Promise.all([
      listAccounts(),
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
.transactions-page {
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

.transaction-form {
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
.form-select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.form-select-addon {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  min-width: 100px;
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

.filters-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
}

.filter-group {
  flex: 1;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: white;
  border-radius: 0.5rem;
}

.transactions-list {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.transaction-item {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-item:hover {
  background: #f9fafb;
}

.transaction-date {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.transaction-details {
  min-width: 0;
}

.transaction-description {
  color: #1f2937;
  font-weight: 500;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-account {
  color: #6b7280;
  font-size: 0.875rem;
}

.transaction-budget {
  color: #9ca3af;
}

.transaction-amount {
  font-weight: 600;
  font-size: 1rem;
  text-align: right;
  white-space: nowrap;
}

.transaction-amount.positive {
  color: #059669;
}

.transaction-amount.negative {
  color: #dc2626;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filters-card {
    flex-direction: column;
  }

  .transaction-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .transaction-date {
    order: 2;
  }

  .transaction-details {
    order: 1;
  }

  .transaction-amount {
    order: 3;
    text-align: left;
    font-size: 1.125rem;
  }
}
</style>
