<template>
  <AppLayout>
    <div class="home-page">
      <div class="welcome-section">
        <h1>Welcome to Wallet PWA</h1>
        <p>Your local-first personal finance management tool</p>
      </div>

      <div class="quick-actions">
        <NuxtLink to="/transactions" class="action-card">
          <div class="action-icon">💸</div>
          <h3>Transactions</h3>
          <p>View and manage your transactions</p>
        </NuxtLink>
        
        <NuxtLink to="/accounts" class="action-card">
          <div class="action-icon">🏦</div>
          <h3>Accounts</h3>
          <p>Manage your accounts</p>
        </NuxtLink>
        
        <NuxtLink to="/budgets" class="action-card">
          <div class="action-icon">📊</div>
          <h3>Budgets</h3>
          <p>Track your budget categories</p>
        </NuxtLink>
        
        <NuxtLink to="/reports" class="action-card">
          <div class="action-icon">📈</div>
          <h3>Reports</h3>
          <p>View financial reports</p>
        </NuxtLink>
      </div>

      <div class="status-section">
        <div class="status-card">
          <h2>Development Status</h2>
          <div class="status-item">
            <span class="status-label">Phase 1: Core Data Layer</span>
            <span class="status-badge complete">✓ Complete</span>
          </div>
          <div class="status-item">
            <span class="status-label">Phase 2: Accounting Engine</span>
            <span class="status-badge complete">✓ Complete</span>
          </div>
          <div class="status-item">
            <span class="status-label">Phase 3: PWA Foundation</span>
            <span class="status-badge complete">✓ Complete</span>
          </div>
          <div class="status-item">
            <span class="status-label">Phase 4: Sync Implementation</span>
            <span class="status-badge complete">✓ Complete</span>
          </div>
          <div class="status-item">
            <span class="status-label">Phase 5: User Interface</span>
            <span class="status-badge in-progress">🔄 In Progress</span>
          </div>
        </div>

        <div class="pwa-status">
          <h2>PWA Status</h2>
          <div class="status-grid">
            <div class="status-box">
              <div class="status-indicator" :class="{ online: isOnline, offline: isOffline }"/>
              <div class="status-info">
                <div class="status-title">Network</div>
                <div class="status-value">{{ isOnline ? 'Online' : 'Offline' }}</div>
              </div>
            </div>
            
            <div class="status-box">
              <div class="status-indicator" :class="{ success: isPWAInstalled }"/>
              <div class="status-info">
                <div class="status-title">Installation</div>
                <div class="status-value">{{ isPWAInstalled ? 'Installed' : 'Not Installed' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
const { isOnline, isOffline } = useNetworkStatus()

// Check if PWA is installed
const isPWAInstalled = ref(false)
if (import.meta.client) {
  isPWAInstalled.value = window.matchMedia('(display-mode: standalone)').matches
}
</script>

<style scoped>
.home-page {
  max-width: 1000px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  font-size: 1.125rem;
  color: #6b7280;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.action-card {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-card h3 {
  font-size: 1.25rem;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.action-card p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.status-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.status-card,
.pwa-status {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.complete {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.in-progress {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.status-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.status-indicator {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #d1d5db;
  flex-shrink: 0;
}

.status-indicator.online {
  background-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.status-indicator.offline {
  background-color: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
}

.status-indicator.success {
  background-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.status-value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 600;
}

@media (max-width: 768px) {
  .welcome-section h1 {
    font-size: 2rem;
  }

  .quick-actions {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

  .action-card {
    padding: 1.5rem 1rem;
  }

  .action-icon {
    font-size: 2.5rem;
  }

  .status-section {
    grid-template-columns: 1fr;
  }
}
</style>
