import { ref, computed } from 'vue'
import type { Ref } from 'vue'

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Composable for network status detection and PWA install prompt handling
 */
export function useNetworkStatus() {
  const isOnline: Ref<boolean> = ref(true)
  const showInstallPrompt: Ref<boolean> = ref(false)
  let deferredPrompt: BeforeInstallPromptEvent | null = null

  // Initialize online/offline status
  if (import.meta.client) {
    isOnline.value = navigator.onLine

    // Listen for online/offline events
    window.addEventListener('online', () => {
      isOnline.value = true
    })

    window.addEventListener('offline', () => {
      isOnline.value = false
    })

    // Listen for app install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      showInstallPrompt.value = true
    })

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      showInstallPrompt.value = false
    }
  }

  /**
   * Trigger the installation prompt
   */
  const install = async () => {
    if (!deferredPrompt) {
      return false
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      showInstallPrompt.value = false
    }

    deferredPrompt = null
    return outcome === 'accepted'
  }

  /**
   * Dismiss the install prompt
   */
  const dismissInstallPrompt = () => {
    showInstallPrompt.value = false
    deferredPrompt = null
  }

  return {
    isOnline: computed(() => isOnline.value),
    isOffline: computed(() => !isOnline.value),
    showInstallPrompt: computed(() => showInstallPrompt.value),
    install,
    dismissInstallPrompt,
  }
}
