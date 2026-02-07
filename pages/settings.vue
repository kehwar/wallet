<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useFirebase } from '../composables/useFirebase'
import { useFactoryReset } from '../composables/useFactoryReset'
import type { FirebaseConfig } from '../types/models'

const { initialize, disconnect, validateConfig, testConnection, isInitialized, currentConfig, configError } = useFirebase()
const { isResetting, resetError, performReset } = useFactoryReset()

// Form state
const config = reactive<FirebaseConfig>({
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  enabled: false,
})

// UI state
const isLoading = ref(false)
const testResult = ref<{ success: boolean, message: string } | null>(null)
const isSaved = ref(false)
const showResetConfirmation = ref(false)
const resetSuccess = ref(false)

// Load saved config on mount
async function loadSavedConfig() {
  try {
    // In a real app, you'd store this in a secure config table in IndexedDB
    const saved = localStorage.getItem('firebase_config')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(config, parsed)
    }
  } catch (error) {
    console.error('Failed to load config:', error)
  }
}

// Save config
async function saveConfig() {
  isLoading.value = true
  testResult.value = null
  
  try {
    // Validate
    const validation = validateConfig(config)
    if (!validation.valid) {
      testResult.value = {
        success: false,
        message: validation.errors.join(', '),
      }
      return
    }
    
    // Save to localStorage (in production, use IndexedDB)
    localStorage.setItem('firebase_config', JSON.stringify(config))
    
    // Initialize Firebase if enabled
    if (config.enabled) {
      const success = await initialize(config)
      if (!success) {
        testResult.value = {
          success: false,
          message: configError.value || 'Failed to initialize Firebase',
        }
        return
      }
    } else {
      disconnect()
    }
    
    isSaved.value = true
    testResult.value = {
      success: true,
      message: 'Configuration saved successfully!',
    }
    
    setTimeout(() => {
      isSaved.value = false
      testResult.value = null
    }, 3000)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration'
    testResult.value = {
      success: false,
      message: errorMessage,
    }
  } finally {
    isLoading.value = false
  }
}

// Test connection
async function handleTestConnection() {
  isLoading.value = true
  testResult.value = null
  
  try {
    const validation = validateConfig(config)
    if (!validation.valid) {
      testResult.value = {
        success: false,
        message: validation.errors.join(', '),
      }
      return
    }
    
    // Initialize temporarily for testing
    const success = await initialize(config)
    if (!success) {
      testResult.value = {
        success: false,
        message: configError.value || 'Failed to connect',
      }
      return
    }
    
    // Test connection
    const result = await testConnection()
    testResult.value = result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed'
    testResult.value = {
      success: false,
      message: errorMessage,
    }
  } finally {
    isLoading.value = false
  }
}

// Load config on mount
loadSavedConfig()

// Handle factory reset
async function handleFactoryReset() {
  showResetConfirmation.value = false
  const success = await performReset()
  
  if (success) {
    resetSuccess.value = true
    setTimeout(() => {
      resetSuccess.value = false
      // Reload the page to reflect the reset
      window.location.reload()
    }, 2000)
  }
}

function showResetDialog() {
  showResetConfirmation.value = true
}

function cancelReset() {
  showResetConfirmation.value = false
}
</script>

<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Firebase Configuration</h1>
      <p class="text-gray-600">
        Configure your own Firebase backend for data synchronization (BYOB - Bring Your Own Backend).
      </p>
    </div>

    <!-- Current Status -->
    <div v-if="isInitialized" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-green-600 text-xl">✓</span>
        <div>
          <p class="font-medium text-green-800">Firebase Connected</p>
          <p class="text-sm text-green-700">Project: {{ currentConfig?.projectId }}</p>
        </div>
      </div>
    </div>

    <!-- Configuration Form -->
    <form class="space-y-6" @submit.prevent="saveConfig">
      <!-- Enable Sync -->
      <div class="flex items-center gap-3">
        <input
          id="enabled"
          v-model="config.enabled"
          type="checkbox"
          class="h-5 w-5 rounded border-gray-300"
        >
        <label for="enabled" class="text-sm font-medium text-gray-700">
          Enable Firestore Sync
        </label>
      </div>

      <!-- Firebase Config Fields -->
      <div class="space-y-4">
        <div>
          <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-1">
            API Key *
          </label>
          <input
            id="apiKey"
            v-model="config.apiKey"
            type="text"
            required
            placeholder="AIzaSy..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
        </div>

        <div>
          <label for="projectId" class="block text-sm font-medium text-gray-700 mb-1">
            Project ID *
          </label>
          <input
            id="projectId"
            v-model="config.projectId"
            type="text"
            required
            placeholder="your-project-id"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
        </div>

        <div>
          <label for="appId" class="block text-sm font-medium text-gray-700 mb-1">
            App ID *
          </label>
          <input
            id="appId"
            v-model="config.appId"
            type="text"
            required
            placeholder="1:123456789:web:abc123"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
        </div>

        <div>
          <label for="authDomain" class="block text-sm font-medium text-gray-700 mb-1">
            Auth Domain *
          </label>
          <input
            id="authDomain"
            v-model="config.authDomain"
            type="text"
            required
            placeholder="your-project.firebaseapp.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
        </div>

        <div>
          <label for="storageBucket" class="block text-sm font-medium text-gray-700 mb-1">
            Storage Bucket (Optional)
          </label>
          <input
            id="storageBucket"
            v-model="config.storageBucket"
            type="text"
            placeholder="your-project.appspot.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
        </div>

        <div>
          <label for="messagingSenderId" class="block text-sm font-medium text-gray-700 mb-1">
            Messaging Sender ID (Optional)
          </label>
          <input
            id="messagingSenderId"
            v-model="config.messagingSenderId"
            type="text"
            placeholder="123456789"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
        </div>
      </div>

      <!-- Test Result -->
      <div
v-if="testResult" :class="[
        'p-4 rounded-lg',
        testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200',
      ]">
        <p
:class="[
          'text-sm',
          testResult.success ? 'text-green-800' : 'text-red-800',
        ]">
          {{ testResult.message }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          type="button"
          :disabled="isLoading"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          @click="handleTestConnection"
        >
          Test Connection
        </button>

        <button
          type="submit"
          :disabled="isLoading"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {{ isLoading ? 'Saving...' : 'Save Configuration' }}
        </button>
      </div>
    </form>

    <!-- Help Section -->
    <div class="mt-8 p-6 bg-gray-50 rounded-lg">
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Setup Instructions</h2>
      <ol class="list-decimal list-inside space-y-2 text-sm text-gray-700">
        <li>Go to <a href="https://console.firebase.google.com/" target="_blank" class="text-blue-600 hover:underline">Firebase Console</a></li>
        <li>Create a new project or select existing one</li>
        <li>Enable Firestore Database</li>
        <li>Go to Project Settings → Your apps → Web app</li>
        <li>Copy the configuration values and paste above</li>
        <li>Configure <a href="/docs/firestore-security-rules" class="text-blue-600 hover:underline">security rules</a> in Firestore</li>
      </ol>

      <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p class="text-sm text-yellow-800">
          <strong>Important:</strong> Configure Firestore security rules to protect your data.
          See <a href="/docs/firestore-security-rules" class="underline">documentation</a> for examples.
        </p>
      </div>
    </div>

    <!-- Factory Reset Section -->
    <div class="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 class="text-lg font-semibold text-red-900 mb-3">⚠️ Danger Zone</h2>
      <p class="text-sm text-red-700 mb-4">
        Reset all data to factory settings. This will delete all accounts, transactions, and budgets, 
        and create new default accounts with example transactions.
      </p>
      
      <!-- Reset Success Message -->
      <div v-if="resetSuccess" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-sm text-green-800">
          ✓ Factory reset completed successfully! Reloading...
        </p>
      </div>
      
      <!-- Reset Error Message -->
      <div v-if="resetError" class="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
        <p class="text-sm text-red-900">
          ✗ Error: {{ resetError }}
        </p>
      </div>
      
      <button
        type="button"
        :disabled="isResetting"
        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        @click="showResetDialog"
      >
        {{ isResetting ? 'Resetting...' : 'Reset to Factory Settings' }}
      </button>
    </div>

    <!-- Confirmation Dialog -->
    <div
      v-if="showResetConfirmation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="cancelReset"
    >
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Confirm Factory Reset</h3>
        <p class="text-gray-700 mb-6">
          Are you sure you want to reset all data? This action cannot be undone.
          <br><br>
          <strong>This will:</strong>
        </p>
        <ul class="list-disc list-inside text-sm text-gray-700 mb-6 space-y-1">
          <li>Delete all existing accounts</li>
          <li>Delete all transactions</li>
          <li>Delete all budgets</li>
          <li>Create new default accounts (Cash, Bank, Income, Expense)</li>
          <li>Create example transactions</li>
        </ul>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            @click="cancelReset"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            @click="handleFactoryReset"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  </div></AppLayout>
</template>
