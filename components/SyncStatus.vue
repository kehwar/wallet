<script setup lang="ts">
import { computed } from 'vue'
import { useSync } from '../composables/useSync'
import { useFirebase } from '../composables/useFirebase'

const { syncStatus, lastSyncTime, syncError, isSyncing, sync } = useSync()
const { isInitialized } = useFirebase()

// Format last sync time
const formattedLastSync = computed(() => {
  if (!lastSyncTime.value) return 'Never'

  const date = new Date(lastSyncTime.value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
})

// Status color and icon
const statusConfig = computed(() => {
  switch (syncStatus.value) {
    case 'syncing':
      return {
        color: 'text-blue-600 bg-blue-50',
        icon: '🔄',
        label: 'Syncing...',
      }
    case 'synced':
      return {
        color: 'text-green-600 bg-green-50',
        icon: '✓',
        label: 'Synced',
      }
    case 'error':
      return {
        color: 'text-red-600 bg-red-50',
        icon: '⚠️',
        label: 'Sync Error',
      }
    case 'offline':
      return {
        color: 'text-gray-600 bg-gray-50',
        icon: '📡',
        label: 'Offline',
      }
    default:
      return {
        color: 'text-gray-600 bg-gray-50',
        icon: '○',
        label: 'Not Syncing',
      }
  }
})

// Manual sync handler
async function handleManualSync() {
  if (isSyncing.value) return
  
  const result = await sync()
  
  if (result.success) {
    console.log('Sync completed:', result.stats)
  } else {
    console.error('Sync failed')
  }
}
</script>

<template>
  <div v-if="isInitialized" class="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200">
    <!-- Status indicator -->
    <div class="flex items-center gap-2">
      <span :class="[statusConfig.color, 'px-2 py-1 rounded text-sm font-medium flex items-center gap-1']">
        <span class="text-base">{{ statusConfig.icon }}</span>
        {{ statusConfig.label }}
      </span>
    </div>

    <!-- Last sync time -->
    <div class="text-sm text-gray-600">
      Last sync: {{ formattedLastSync }}
    </div>

    <!-- Error message -->
    <div v-if="syncError" class="text-sm text-red-600 flex-1">
      {{ syncError }}
    </div>

    <!-- Sync button -->
    <button
      :disabled="isSyncing"
      :class="[
        'px-3 py-1 text-sm rounded',
        isSyncing
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600',
      ]"
      @click="handleManualSync"
    >
      {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
    </button>
  </div>
</template>
