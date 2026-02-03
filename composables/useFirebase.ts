/**
 * Firebase Composable - BYOB (Bring Your Own Backend)
 * Manages Firebase initialization and connection status
 */

import { ref, computed } from 'vue'
import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore'
import type { FirebaseConfig } from '~/types/models'

// Singleton Firebase instances
let firebaseApp: FirebaseApp | null = null
let firestore: Firestore | null = null

// Reactive state
const isInitialized = ref(false)
const isConnected = ref(false)
const configError = ref<string | null>(null)
const currentConfig = ref<FirebaseConfig | null>(null)

export function useFirebase() {
  /**
   * Initialize Firebase with user's configuration
   */
  async function initialize(config: FirebaseConfig): Promise<boolean> {
    try {
      configError.value = null

      // Validate required fields
      if (!config.apiKey || !config.projectId || !config.appId) {
        throw new Error('Missing required Firebase configuration fields')
      }

      // Convert to Firebase options
      const firebaseOptions: FirebaseOptions = {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      }

      // Initialize Firebase app (or reuse existing)
      if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseOptions)
      }

      // Get Firestore instance
      if (!firestore) {
        firestore = getFirestore(firebaseApp)

        // Enable offline persistence
        try {
          await enableIndexedDbPersistence(firestore)
          console.log('Firestore offline persistence enabled')
        }
        catch (err) {
          const error = err as { code?: string }
          if (error.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.warn('Firestore persistence failed: Multiple tabs open')
          }
          else if (error.code === 'unimplemented') {
            // Browser doesn't support persistence
            console.warn('Firestore persistence not supported in this browser')
          }
          else {
            throw err
          }
        }
      }

      // Store current config
      currentConfig.value = config
      isInitialized.value = true
      isConnected.value = true

      return true
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Firebase'
      configError.value = errorMessage
      isInitialized.value = false
      isConnected.value = false
      console.error('Firebase initialization error:', error)
      return false
    }
  }

  /**
   * Disconnect and cleanup Firebase instances
   */
  function disconnect() {
    firebaseApp = null
    firestore = null
    isInitialized.value = false
    isConnected.value = false
    currentConfig.value = null
    configError.value = null
  }

  /**
   * Get Firestore instance (only if initialized)
   */
  function getFirestoreInstance(): Firestore | null {
    if (!isInitialized.value || !firestore) {
      console.warn('Firestore not initialized. Call initialize() first.')
      return null
    }
    return firestore
  }

  /**
   * Validate Firebase configuration
   */
  function validateConfig(config: Partial<FirebaseConfig>): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    if (!config.apiKey || config.apiKey.length < 20) {
      errors.push('API Key is required and must be valid')
    }

    if (!config.projectId || config.projectId.length < 3) {
      errors.push('Project ID is required')
    }

    if (!config.appId || config.appId.length < 10) {
      errors.push('App ID is required')
    }

    if (!config.authDomain) {
      errors.push('Auth Domain is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Test connection to Firebase
   */
  async function testConnection(): Promise<{ success: boolean, message: string }> {
    if (!isInitialized.value || !firestore) {
      return {
        success: false,
        message: 'Firebase not initialized',
      }
    }

    try {
      // Try to access Firestore (this will verify connection)
      const db = getFirestoreInstance()
      if (db) {
        isConnected.value = true
        return {
          success: true,
          message: 'Successfully connected to Firestore',
        }
      }
      else {
        return {
          success: false,
          message: 'Firestore instance not available',
        }
      }
    }
    catch (error) {
      isConnected.value = false
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed'
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  return {
    // State
    isInitialized: computed(() => isInitialized.value),
    isConnected: computed(() => isConnected.value),
    configError: computed(() => configError.value),
    currentConfig: computed(() => currentConfig.value),

    // Methods
    initialize,
    disconnect,
    getFirestoreInstance,
    validateConfig,
    testConnection,
  }
}
