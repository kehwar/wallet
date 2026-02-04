<template>
  <AppLayout>
    <div class="accounts-page">
      <div class="page-header">
        <h1>Accounts</h1>
        <button class="btn btn-primary" @click="showNewAccountForm = true">
          + New Account
        </button>
      </div>

      <!-- New/Edit Account Form -->
      <div v-if="showNewAccountForm || editingAccount" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ editingAccount ? 'Edit Account' : 'New Account' }}</h2>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          
          <form class="account-form" @submit.prevent="handleSubmit">
            <div class="form-row">
              <label class="form-label">Account Name</label>
              <input v-model="form.name" type="text" class="form-input" placeholder="e.g., Checking Account" required >
            </div>

            <div class="form-row">
              <label class="form-label">Account Type</label>
              <select v-model="form.type" class="form-select" required>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div class="form-row">
              <label class="form-label">Currency</label>
              <select v-model="form.currency" class="form-select" required :disabled="!!editingAccount">
                <option v-for="currency in commonCurrencies" :key="currency" :value="currency">
                  {{ currency }}
                </option>
              </select>
              <p v-if="editingAccount" class="form-hint">Currency cannot be changed after creation</p>
            </div>

            <div class="form-row">
              <label class="form-label">Description (Optional)</label>
              <textarea v-model="form.description" class="form-textarea" placeholder="Account details..." rows="3"/>
            </div>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Saving...' : (editingAccount ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Accounts List -->
      <div v-if="isLoading" class="loading">Loading accounts...</div>

      <div v-else class="accounts-groups">
        <div v-for="(group, type) in groupedAccounts" :key="type" class="account-group">
          <h2 class="group-title">{{ formatAccountType(type) }}</h2>
          
          <div v-if="group.length === 0" class="empty-group">
            No {{ type }} accounts yet.
          </div>

          <div v-else class="accounts-list">
            <div v-for="account in group" :key="account.id" class="account-card">
              <div class="account-info">
                <h3 class="account-name">{{ account.name }}</h3>
                <p v-if="account.description" class="account-description">{{ account.description }}</p>
                <div class="account-meta">
                  <span class="account-currency">{{ account.currency }}</span>
                  <span class="account-transactions">{{ getTransactionCount(account.id) }} transactions</span>
                </div>
              </div>
              <div class="account-balance">
                <div class="balance-amount" :class="{ positive: getBalance(account.id) > 0, negative: getBalance(account.id) < 0 }">
                  {{ formatAmount(getBalance(account.id), account.currency) }}
                </div>
                <div class="balance-label">Balance</div>
              </div>
              <div class="account-actions">
                <button class="btn-icon" title="Edit" @click="editAccount(account)">
                  ✏️
                </button>
                <button class="btn-icon" title="Delete" @click="deleteAccount(account)">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAccounts } from '../composables/useAccounts'
import { useLedger } from '../composables/useLedger'
import { useCurrency } from '../composables/useCurrency'
import type { Account } from '../types/models'
import Decimal from 'decimal.js'

const { accounts, listAccounts, createAccount, updateAccount, deleteAccount: removeAccount } = useAccounts()
const { entries, listEntries } = useLedger()
const { formatCurrency } = useCurrency()

const showNewAccountForm = ref(false)
const editingAccount = ref<Account | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')

const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'PEN']

const form = ref({
  name: '',
  type: 'asset' as 'asset' | 'liability' | 'equity' | 'income' | 'expense',
  currency: 'USD',
  description: '',
})

const groupedAccounts = computed(() => {
  const groups: Record<string, Account[]> = {
    asset: [],
    liability: [],
    equity: [],
    income: [],
    expense: [],
  }

  accounts.value.forEach(account => {
    if (groups[account.type]) {
      groups[account.type].push(account)
    }
  })

  return groups
})

function formatAccountType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1) + 's'
}

function getTransactionCount(accountId: string): number {
  return entries.value.filter(e => e.account_id === accountId).length
}

function getBalance(accountId: string): number {
  const accountEntries = entries.value.filter(e => e.account_id === accountId)
  const balance = accountEntries.reduce((sum, entry) => {
    return sum.add(new Decimal(entry.amount_display))
  }, new Decimal(0))
  return balance.toNumber()
}

function formatAmount(amount: number, currency: string): string {
  return formatCurrency(amount, currency)
}

function editAccount(account: Account) {
  editingAccount.value = account
  form.value = {
    name: account.name,
    type: account.type,
    currency: account.currency,
    description: account.description || '',
  }
}

async function deleteAccount(account: Account) {
  const transactionCount = getTransactionCount(account.id)
  
  if (transactionCount > 0) {
    alert(`Cannot delete account "${account.name}" because it has ${transactionCount} transactions. Delete or reassign the transactions first.`)
    return
  }

  if (confirm(`Are you sure you want to delete "${account.name}"?`)) {
    try {
      await removeAccount(account.id)
      await loadData()
    } catch (error) {
      alert(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

function closeModal() {
  showNewAccountForm.value = false
  editingAccount.value = null
  errorMessage.value = ''
  form.value = {
    name: '',
    type: 'asset',
    currency: 'USD',
    description: '',
  }
}

async function handleSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (editingAccount.value) {
      await updateAccount(editingAccount.value.id, {
        name: form.value.name,
        description: form.value.description,
      })
    } else {
      await createAccount({
        name: form.value.name,
        type: form.value.type,
        currency: form.value.currency,
        description: form.value.description,
      })
    }

    await loadData()
    closeModal()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save account'
  } finally {
    isSubmitting.value = false
  }
}

async function loadData() {
  isLoading.value = true
  try {
    await Promise.all([
      listAccounts(),
      listEntries(),
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    isLoading.value = false
  }
}

// Keyboard event handler for Escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && (showNewAccountForm.value || editingAccount.value)) {
    closeModal()
  }
}

onMounted(() => {
  loadData()
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeydown)
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.accounts-page {
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

.account-form {
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

.accounts-groups {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.account-group {
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

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.account-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1.5rem;
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  align-items: center;
  transition: background 0.2s;
}

.account-card:hover {
  background: #f3f4f6;
}

.account-info {
  min-width: 0;
}

.account-name {
  font-size: 1.125rem;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.account-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.account-balance {
  text-align: right;
}

.balance-amount {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.balance-amount.positive {
  color: #059669;
}

.balance-amount.negative {
  color: #dc2626;
}

.balance-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.account-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .account-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .account-balance {
    text-align: left;
  }

  .account-actions {
    justify-content: flex-start;
  }
}
</style>
