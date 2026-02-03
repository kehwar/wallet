<template>
  <div>
    <!-- Offline indicator -->
    <Transition name="slide-down">
      <div v-if="isOffline" class="pwa-banner offline-banner">
        <div class="banner-content">
          <svg class="banner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
          </svg>
          <span class="banner-text">You are offline. Changes will sync when you're back online.</span>
        </div>
      </div>
    </Transition>

    <!-- Update available notification -->
    <Transition name="slide-down">
      <div v-if="needRefresh" class="pwa-banner update-banner">
        <div class="banner-content">
          <svg class="banner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 16h5v5"/>
          </svg>
          <span class="banner-text">A new version is available.</span>
          <button class="banner-button" @click="updateServiceWorker()">
            Update Now
          </button>
        </div>
      </div>
    </Transition>

    <!-- Install prompt -->
    <Transition name="slide-down">
      <div v-if="showInstallPrompt" class="pwa-banner install-banner">
        <div class="banner-content">
          <svg class="banner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span class="banner-text">Install Wallet PWA for a better experience.</span>
          <button class="banner-button" @click="install">
            Install
          </button>
          <button class="banner-button-secondary" @click="dismissInstallPrompt">
            Dismiss
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// Use the built-in usePWA from @vite-pwa/nuxt for update handling
const { needRefresh, updateServiceWorker } = usePWA()

// Use our custom composable for network status and install prompt
const { isOffline, showInstallPrompt, install, dismissInstallPrompt } = useNetworkStatus()
</script>

<style scoped>
.pwa-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.offline-banner {
  background-color: #fbbf24;
  color: #92400e;
}

.update-banner {
  background-color: #3b82f6;
  color: white;
}

.install-banner {
  background-color: #10b981;
  color: white;
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.banner-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.banner-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
  color: inherit;
}

.banner-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.banner-button-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid currentColor;
  background: transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: inherit;
}

.banner-button-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
