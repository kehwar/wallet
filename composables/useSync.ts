/**
 * Sync Composable - Bidirectional sync with Firestore
 * Implements Last-Write-Wins (LWW) conflict resolution
 */

import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  type Firestore,
} from 'firebase/firestore'
import type {
  LedgerEntry,
  Account,
  Budget,
  SyncStatus,
} from '~/types/models'
import { useDatabase } from './useDatabase'
import { useFirebase } from './useFirebase'

// Reactive state
const syncStatus = ref<SyncStatus>('idle')
const lastSyncTime = ref<string | null>(null)
const syncError = ref<string | null>(null)
const isSyncing = ref(false)

// Device ID - persistent identifier for this device
const DEVICE_ID_KEY = 'wallet_device_id'
let deviceId: string | null = null

/**
 * Get or create persistent device ID
 */
function getDeviceId(): string {
  if (deviceId) return deviceId

  // Try to load from localStorage
  const stored = localStorage.getItem(DEVICE_ID_KEY)
  if (stored) {
    deviceId = stored
    return deviceId
  }

  // Create new device ID
  deviceId = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, deviceId)
  return deviceId
}

export function useSync() {
  const { getFirestoreInstance } = useFirebase()
  const db = useDatabase()

  /**
   * Last-Write-Wins conflict resolution
   * Compares updated_at timestamps to determine winner
   */
  function resolveConflict<T extends { updated_at: string }>(
    local: T,
    remote: T,
  ): 'local' | 'remote' {
    // Compare ISO8601 timestamps (string comparison works correctly)
    if (local.updated_at > remote.updated_at) {
      return 'local'
    }
    else if (remote.updated_at > local.updated_at) {
      return 'remote'
    }

    // Exact tie (rare): Accept remote
    return 'remote'
  }

  /**
   * Add sync metadata to entity before saving
   */
  function addSyncMetadata<T extends Record<string, unknown>>(entity: T): T {
    return {
      ...entity,
      _device_id: getDeviceId(),
      _version: (entity._version || 0) + 1,
      updated_at: new Date().toISOString(),
    }
  }

  /**
   * Upload ledger entries to Firestore
   */
  async function uploadLedgerEntries(
    firestore: Firestore,
    lastSync: string,
  ): Promise<{ uploaded: number, errors: number }> {
    try {
      // Get all entries modified since last sync
      const entries = await db.ledger_entries
        .where('updated_at')
        .above(lastSync)
        .toArray()

      let uploaded = 0
      let errors = 0

      for (const entry of entries) {
        try {
          const docRef = doc(firestore, 'ledger_entries', entry.id)
          await setDoc(docRef, entry)
          uploaded++
        }
        catch (error) {
          console.error(`Failed to upload entry ${entry.id}:`, error)
          errors++
        }
      }

      return { uploaded, errors }
    }
    catch (error) {
      console.error('Upload ledger entries error:', error)
      throw error
    }
  }

  /**
   * Download ledger entries from Firestore
   */
  async function downloadLedgerEntries(
    firestore: Firestore,
    lastSync: string,
  ): Promise<{ downloaded: number, conflicts: number, errors: number }> {
    try {
      const q = query(
        collection(firestore, 'ledger_entries'),
        where('updated_at', '>', lastSync),
      )

      const snapshot = await getDocs(q)
      let downloaded = 0
      let conflicts = 0
      let errors = 0

      for (const docSnap of snapshot.docs) {
        try {
          const remote = docSnap.data() as LedgerEntry

          // Check if we have a local copy
          const local = await db.ledger_entries.get(remote.id)

          if (!local) {
            // New entry from remote - just save it
            await db.ledger_entries.add(remote)
            downloaded++
          }
          else {
            // Conflict - use LWW resolution
            const winner = resolveConflict(local, remote)

            if (winner === 'remote') {
              // Remote wins - update local
              await db.ledger_entries.put(remote)
              downloaded++
              conflicts++
            }
            else {
              // Local wins - re-upload to remote
              const docRef = doc(firestore, 'ledger_entries', local.id)
              await setDoc(docRef, local)
              conflicts++
            }
          }
        }
        catch (error) {
          console.error('Failed to process entry:', error)
          errors++
        }
      }

      return { downloaded, conflicts, errors }
    }
    catch (error) {
      console.error('Download ledger entries error:', error)
      throw error
    }
  }

  /**
   * Upload accounts to Firestore
   */
  async function uploadAccounts(
    firestore: Firestore,
    lastSync: string,
  ): Promise<{ uploaded: number, errors: number }> {
    try {
      const accounts = await db.accounts
        .where('updated_at')
        .above(lastSync)
        .toArray()

      let uploaded = 0
      let errors = 0

      for (const account of accounts) {
        try {
          const docRef = doc(firestore, 'accounts', account.id)
          await setDoc(docRef, account)
          uploaded++
        }
        catch (error) {
          console.error(`Failed to upload account ${account.id}:`, error)
          errors++
        }
      }

      return { uploaded, errors }
    }
    catch (error) {
      console.error('Upload accounts error:', error)
      throw error
    }
  }

  /**
   * Download accounts from Firestore
   */
  async function downloadAccounts(
    firestore: Firestore,
    lastSync: string,
  ): Promise<{ downloaded: number, conflicts: number, errors: number }> {
    try {
      const q = query(
        collection(firestore, 'accounts'),
        where('updated_at', '>', lastSync),
      )

      const snapshot = await getDocs(q)
      let downloaded = 0
      let conflicts = 0
      let errors = 0

      for (const docSnap of snapshot.docs) {
        try {
          const remote = docSnap.data() as Account

          const local = await db.accounts.get(remote.id)

          if (!local) {
            await db.accounts.add(remote)
            downloaded++
          }
          else {
            const winner = resolveConflict(local, remote)

            if (winner === 'remote') {
              await db.accounts.put(remote)
              downloaded++
              conflicts++
            }
            else {
              const docRef = doc(firestore, 'accounts', local.id)
              await setDoc(docRef, local)
              conflicts++
            }
          }
        }
        catch (error) {
          console.error('Failed to process account:', error)
          errors++
        }
      }

      return { downloaded, conflicts, errors }
    }
    catch (error) {
      console.error('Download accounts error:', error)
      throw error
    }
  }

  /**
   * Upload budgets to Firestore
   */
  async function uploadBudgets(
    firestore: Firestore,
    lastSync: string,
  ): Promise<{ uploaded: number, errors: number }> {
    try {
      const budgets = await db.budgets
        .where('updated_at')
        .above(lastSync)
        .toArray()

      let uploaded = 0
      let errors = 0

      for (const budget of budgets) {
        try {
          const docRef = doc(firestore, 'budgets', budget.id)
          await setDoc(docRef, budget)
          uploaded++
        }
        catch (error) {
          console.error(`Failed to upload budget ${budget.id}:`, error)
          errors++
        }
      }

      return { uploaded, errors }
    }
    catch (error) {
      console.error('Upload budgets error:', error)
      throw error
    }
  }

  /**
   * Download budgets from Firestore
   */
  async function downloadBudgets(
    firestore: Firestore,
    lastSync: string,
  ): Promise<{ downloaded: number, conflicts: number, errors: number }> {
    try {
      const q = query(
        collection(firestore, 'budgets'),
        where('updated_at', '>', lastSync),
      )

      const snapshot = await getDocs(q)
      let downloaded = 0
      let conflicts = 0
      let errors = 0

      for (const docSnap of snapshot.docs) {
        try {
          const remote = docSnap.data() as Budget

          const local = await db.budgets.get(remote.id)

          if (!local) {
            await db.budgets.add(remote)
            downloaded++
          }
          else {
            const winner = resolveConflict(local, remote)

            if (winner === 'remote') {
              await db.budgets.put(remote)
              downloaded++
              conflicts++
            }
            else {
              const docRef = doc(firestore, 'budgets', local.id)
              await setDoc(docRef, local)
              conflicts++
            }
          }
        }
        catch (error) {
          console.error('Failed to process budget:', error)
          errors++
        }
      }

      return { downloaded, conflicts, errors }
    }
    catch (error) {
      console.error('Download budgets error:', error)
      throw error
    }
  }

  /**
   * Perform full bidirectional sync
   */
  async function sync(): Promise<{
    success: boolean
    stats: {
      uploaded: number
      downloaded: number
      conflicts: number
      errors: number
    }
  }> {
    if (isSyncing.value) {
      return {
        success: false,
        stats: { uploaded: 0, downloaded: 0, conflicts: 0, errors: 0 },
      }
    }

    try {
      isSyncing.value = true
      syncStatus.value = 'syncing'
      syncError.value = null

      // Get Firestore instance
      const firestore = getFirestoreInstance()
      if (!firestore) {
        throw new Error('Firestore not initialized')
      }

      // Get last sync time (or use epoch if first sync)
      const lastSync = lastSyncTime.value || '1970-01-01T00:00:00.000Z'

      // Upload changes
      const uploadLedger = await uploadLedgerEntries(firestore, lastSync)
      const uploadAccts = await uploadAccounts(firestore, lastSync)
      const uploadBuds = await uploadBudgets(firestore, lastSync)

      // Download changes
      const downloadLedger = await downloadLedgerEntries(firestore, lastSync)
      const downloadAccts = await downloadAccounts(firestore, lastSync)
      const downloadBuds = await downloadBudgets(firestore, lastSync)

      // Calculate totals
      const stats = {
        uploaded:
          uploadLedger.uploaded + uploadAccts.uploaded + uploadBuds.uploaded,
        downloaded:
          downloadLedger.downloaded
          + downloadAccts.downloaded
          + downloadBuds.downloaded,
        conflicts:
          downloadLedger.conflicts
          + downloadAccts.conflicts
          + downloadBuds.conflicts,
        errors:
          uploadLedger.errors
          + uploadAccts.errors
          + uploadBuds.errors
          + downloadLedger.errors
          + downloadAccts.errors
          + downloadBuds.errors,
      }

      // Update last sync time
      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = stats.errors > 0 ? 'error' : 'synced'

      return {
        success: true,
        stats,
      }
    }
    catch (error) {
      console.error('Sync error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      syncError.value = errorMessage
      syncStatus.value = 'error'

      return {
        success: false,
        stats: { uploaded: 0, downloaded: 0, conflicts: 0, errors: 1 },
      }
    }
    finally {
      isSyncing.value = false
    }
  }

  /**
   * Enable auto-sync on network reconnection
   */
  function enableAutoSync() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      console.log('Network reconnected, triggering sync...')
      sync()
    })
  }

  return {
    // State
    syncStatus: computed(() => syncStatus.value),
    lastSyncTime: computed(() => lastSyncTime.value),
    syncError: computed(() => syncError.value),
    isSyncing: computed(() => isSyncing.value),
    deviceId: computed(() => getDeviceId()),

    // Methods
    sync,
    enableAutoSync,
    addSyncMetadata,
    resolveConflict,
  }
}
