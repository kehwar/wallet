<template>
  <div class="app-layout">
    <nav class="navbar">
      <div class="navbar-brand">
        <NuxtLink to="/" class="brand-link">💰 Wallet</NuxtLink>
      </div>
      <div class="navbar-menu">
        <NuxtLink to="/transactions" class="nav-link">Transactions</NuxtLink>
        <NuxtLink to="/accounts" class="nav-link">Accounts</NuxtLink>
        <NuxtLink to="/budgets" class="nav-link">Budgets</NuxtLink>
        <NuxtLink to="/reports" class="nav-link">Reports</NuxtLink>
        <NuxtLink to="/settings" class="nav-link">⚙️ Settings</NuxtLink>
      </div>
    </nav>
    
    <SyncStatus />
    
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #f9fafb;
  font-family: system-ui, -apple-system, sans-serif;
}

.navbar {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: 700;
}

.brand-link {
  color: #1f2937;
  text-decoration: none;
}

.navbar-menu {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  color: #6b7280;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  color: #1f2937;
  background: #f3f4f6;
}

.nav-link.router-link-active {
  color: #2563eb;
  background: #eff6ff;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .navbar-menu {
    width: 100%;
    justify-content: space-around;
    flex-wrap: wrap;
  }
  
  .nav-link {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>
