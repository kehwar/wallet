<template>
  <div class="container">
    <div class="header">
      <div>
        <h1>Wallet PWA</h1>
        <p>Local-First Personal Finance Management</p>
      </div>
      <NuxtLink to="/settings" class="settings-link">
        ⚙️ Settings
      </NuxtLink>
    </div>
    
    <!-- Sync Status -->
    <SyncStatus />
    
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

    <div class="features-card">
      <h2>Key Features</h2>
      <ul class="features-list">
        <li>✓ Works fully offline with IndexedDB storage</li>
        <li>✓ Double-entry accounting with automatic validation</li>
        <li>✓ Support for 34 currencies with frozen exchange rates</li>
        <li>✓ Transaction APIs (income, expense, transfer, multi-split)</li>
        <li>✓ Balance calculations and net worth tracking</li>
        <li>✓ PWA capabilities (installable, offline-ready)</li>
        <li>✓ Firestore sync with BYOB (Bring Your Own Backend)</li>
        <li>✓ Last-Write-Wins conflict resolution</li>
        <li>🔜 User interface for transaction management</li>
      </ul>
    </div>
  </div>
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
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.settings-link {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: background 0.2s;
}

.settings-link:hover {
  background: #e5e7eb;
}

h1 {
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

h2 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

p {
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.status-card,
.pwa-status,
.features-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  font-size: 1.125rem;
  color: #1f2937;
  font-weight: 600;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  padding: 0.75rem 0;
  color: #4b5563;
  font-size: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.features-list li:last-child {
  border-bottom: none;
}
</style>
