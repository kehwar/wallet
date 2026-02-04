<template>
  <AppLayout>
    <div class="reports-page">
      <div class="page-header">
        <h1>Reports</h1>
      </div>

      <div v-if="isLoading" class="loading">Loading reports...</div>

      <div v-else class="reports-container">
        <!-- Net Worth Card -->
        <div class="report-card">
          <h2 class="report-title">Net Worth</h2>
          <div class="net-worth-summary">
            <div class="summary-item">
              <div class="summary-label">Total Assets</div>
              <div class="summary-value positive">{{ formatAmount(totals.assets, 'USD') }}</div>
            </div>
            <div class="summary-divider">−</div>
            <div class="summary-item">
              <div class="summary-label">Total Liabilities</div>
              <div class="summary-value negative">{{ formatAmount(totals.liabilities, 'USD') }}</div>
            </div>
            <div class="summary-divider">=</div>
            <div class="summary-item highlight">
              <div class="summary-label">Net Worth</div>
              <div class="summary-value" :class="{ positive: netWorth > 0, negative: netWorth < 0 }">
                {{ formatAmount(netWorth, 'USD') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Income vs Expenses -->
        <div class="report-card">
          <h2 class="report-title">Income vs Expenses (All Time)</h2>
          <div class="comparison-summary">
            <div class="comparison-item">
              <div class="comparison-label">Total Income</div>
              <div class="comparison-value positive">{{ formatAmount(totals.income, 'USD') }}</div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">Total Expenses</div>
              <div class="comparison-value negative">{{ formatAmount(Math.abs(totals.expenses), 'USD') }}</div>
            </div>
            <div class="comparison-item highlight">
              <div class="comparison-label">Net</div>
              <div class="comparison-value" :class="{ positive: netIncome > 0, negative: netIncome < 0 }">
                {{ formatAmount(netIncome, 'USD') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Account Balances -->
        <div class="report-card">
          <h2 class="report-title">Account Balances</h2>
          
          <div v-if="accounts.length === 0" class="empty-state">
            No accounts yet. <NuxtLink to="/accounts">Create an account</NuxtLink> to get started.
          </div>

          <div v-else class="account-balances">
            <div v-for="account in accountsWithBalances" :key="account.id" class="balance-item">
              <div class="balance-info">
                <div class="balance-name">{{ account.name }}</div>
                <div class="balance-type">{{ account.type }}</div>
              </div>
              <div class="balance-amount" :class="{ positive: account.balance > 0, negative: account.balance < 0 }">
                {{ formatAmount(account.balance, account.currency) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Budget Summary -->
        <div class="report-card">
          <h2 class="report-title">Budget Summary</h2>
          
          <div v-if="budgets.length === 0" class="empty-state">
            No budgets yet. <NuxtLink to="/budgets">Create a budget</NuxtLink> to track spending.
          </div>

          <div v-else class="budget-summary">
            <div v-for="budget in budgetsWithTotals" :key="budget.id" class="budget-item">
              <div class="budget-info">
                <div class="budget-name">{{ budget.name }}</div>
                <div class="budget-category">{{ budget.category }}</div>
              </div>
              <div class="budget-amount" :class="{ positive: budget.total > 0, negative: budget.total < 0 }">
                {{ formatAmount(Math.abs(budget.total), budget.currency) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="report-card">
          <h2 class="report-title">Recent Transactions</h2>
          
          <div v-if="recentTransactions.length === 0" class="empty-state">
            No transactions yet. <NuxtLink to="/transactions">Create a transaction</NuxtLink> to get started.
          </div>

          <div v-else class="recent-transactions">
            <div v-for="entry in recentTransactions" :key="entry.id" class="transaction-item">
              <div class="transaction-date">{{ formatDate(entry.date) }}</div>
              <div class="transaction-description">{{ entry.description }}</div>
              <div class="transaction-amount" :class="{ positive: entry.amount_display > 0, negative: entry.amount_display < 0 }">
                {{ formatAmount(entry.amount_display, entry.currency_display) }}
              </div>
            </div>
            <NuxtLink to="/transactions" class="view-all-link">View All Transactions →</NuxtLink>
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
import { useCurrency } from '../composables/useCurrency'
import Decimal from 'decimal.js'

const { accounts, listAccounts } = useAccounts()
const { budgets, listBudgets } = useBudgets()
const { entries, listEntries } = useLedger()
const { formatCurrency } = useCurrency()

const isLoading = ref(true)

const totals = computed(() => {
  const result = {
    assets: 0,
    liabilities: 0,
    income: 0,
    expenses: 0,
  }

  accounts.value.forEach(account => {
    const balance = getAccountBalance(account.id)
    
    if (account.type === 'asset') {
      result.assets += balance
    } else if (account.type === 'liability') {
      result.liabilities += Math.abs(balance)
    } else if (account.type === 'income') {
      result.income += Math.abs(balance)
    } else if (account.type === 'expense') {
      result.expenses += balance
    }
  })

  return result
})

const netWorth = computed(() => {
  return totals.value.assets - totals.value.liabilities
})

const netIncome = computed(() => {
  return totals.value.income + totals.value.expenses
})

const accountsWithBalances = computed(() => {
  return accounts.value.map(account => ({
    ...account,
    balance: getAccountBalance(account.id),
  })).filter(a => a.balance !== 0).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
})

const budgetsWithTotals = computed(() => {
  return budgets.value.map(budget => ({
    ...budget,
    total: getBudgetTotal(budget.id),
  })).filter(b => b.total !== 0).sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
})

const recentTransactions = computed(() => {
  return [...entries.value]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
})

function getAccountBalance(accountId: string): number {
  const accountEntries = entries.value.filter(e => e.account_id === accountId)
  const balance = accountEntries.reduce((sum, entry) => {
    return sum.add(new Decimal(entry.amount_display))
  }, new Decimal(0))
  return balance.toNumber()
}

function getBudgetTotal(budgetId: string): number {
  const budgetEntries = entries.value.filter(e => e.budget_id === budgetId)
  const total = budgetEntries.reduce((sum, entry) => {
    return sum.add(new Decimal(entry.amount_display))
  }, new Decimal(0))
  return total.toNumber()
}

function formatAmount(amount: number, currency: string): string {
  return formatCurrency(amount, currency)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
.reports-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: white;
  border-radius: 0.5rem;
}

.reports-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.report-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.report-title {
  font-size: 1.25rem;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.net-worth-summary {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.summary-item {
  text-align: center;
  flex: 1;
}

.summary-item.highlight {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-divider {
  font-size: 1.5rem;
  color: #d1d5db;
  font-weight: 300;
}

.comparison-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.comparison-item {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.comparison-item.highlight {
  background: #eff6ff;
  border: 2px solid #2563eb;
}

.comparison-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.comparison-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.positive {
  color: #059669;
}

.negative {
  color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-state a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.empty-state a:hover {
  text-decoration: underline;
}

.account-balances,
.budget-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.balance-item,
.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.balance-info,
.budget-info {
  min-width: 0;
  flex: 1;
}

.balance-name,
.budget-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.balance-type,
.budget-category {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.balance-amount,
.budget-amount {
  font-size: 1.125rem;
  font-weight: 600;
  white-space: nowrap;
}

.recent-transactions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transaction-item {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  align-items: center;
}

.transaction-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.transaction-description {
  color: #1f2937;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-amount {
  font-weight: 600;
  white-space: nowrap;
}

.view-all-link {
  display: block;
  text-align: center;
  padding: 1rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  margin-top: 0.5rem;
}

.view-all-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .net-worth-summary {
    flex-direction: column;
  }

  .summary-divider {
    transform: rotate(90deg);
  }

  .comparison-summary {
    grid-template-columns: 1fr;
  }

  .transaction-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .transaction-date {
    order: 2;
  }

  .transaction-description {
    order: 1;
  }

  .transaction-amount {
    order: 3;
  }
}
</style>
