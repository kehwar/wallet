/**
 * Unit tests for sync functionality
 * Tests LWW conflict resolution and sync engine
 */

import { describe, it, expect } from 'vitest'
import { useSync } from '../composables/useSync'
import type { LedgerEntry, Account, Budget } from '../types/models'

describe('Sync Engine', () => {
  describe('LWW Conflict Resolution', () => {
    it('should prefer local when local is newer', () => {
      const { resolveConflict } = useSync()

      const local: LedgerEntry = {
        id: '1',
        transaction_id: 'tx1',
        idx: 0,
        date: '2026-02-01',
        description: 'Test',
        status: 'confirmed',
        currency_display: 'USD',
        amount_display: 100,
        account_id: 'acc1',
        amount_account: 100,
        rate_display_to_account: 1,
        amount_budget: null,
        rate_display_to_budget: null,
        created_at: '2026-02-01T10:00:00.000Z',
        updated_at: '2026-02-01T12:00:00.000Z', // Newer
      }

      const remote: LedgerEntry = {
        ...local,
        updated_at: '2026-02-01T11:00:00.000Z', // Older
      }

      const winner = resolveConflict(local, remote)
      expect(winner).toBe('local')
    })

    it('should prefer remote when remote is newer', () => {
      const { resolveConflict } = useSync()

      const local: LedgerEntry = {
        id: '1',
        transaction_id: 'tx1',
        idx: 0,
        date: '2026-02-01',
        description: 'Test',
        status: 'confirmed',
        currency_display: 'USD',
        amount_display: 100,
        account_id: 'acc1',
        amount_account: 100,
        rate_display_to_account: 1,
        amount_budget: null,
        rate_display_to_budget: null,
        created_at: '2026-02-01T10:00:00.000Z',
        updated_at: '2026-02-01T11:00:00.000Z', // Older
      }

      const remote: LedgerEntry = {
        ...local,
        updated_at: '2026-02-01T12:00:00.000Z', // Newer
      }

      const winner = resolveConflict(local, remote)
      expect(winner).toBe('remote')
    })

    it('should prefer remote when timestamps are identical', () => {
      const { resolveConflict } = useSync()

      const local: Account = {
        id: '1',
        name: 'Test Account',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false,
        updated_at: '2026-02-01T12:00:00.000Z', // Same
      }

      const remote: Account = {
        ...local,
        updated_at: '2026-02-01T12:00:00.000Z', // Same
      }

      const winner = resolveConflict(local, remote)
      expect(winner).toBe('remote')
    })

    it('should work with different entity types', () => {
      const { resolveConflict } = useSync()

      // Test with Budget
      const localBudget: Budget = {
        id: '1',
        name: 'Groceries',
        currency: 'USD',
        is_archived: false,
        updated_at: '2026-02-01T12:00:00.000Z',
      }

      const remoteBudget: Budget = {
        ...localBudget,
        updated_at: '2026-02-01T13:00:00.000Z', // Newer
      }

      const budgetWinner = resolveConflict(localBudget, remoteBudget)
      expect(budgetWinner).toBe('remote')

      // Test with Account
      const localAccount: Account = {
        id: '1',
        name: 'Checking',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false,
        updated_at: '2026-02-01T14:00:00.000Z', // Newer
      }

      const remoteAccount: Account = {
        ...localAccount,
        updated_at: '2026-02-01T13:00:00.000Z', // Older
      }

      const accountWinner = resolveConflict(localAccount, remoteAccount)
      expect(accountWinner).toBe('local')
    })
  })

  describe('Sync Metadata', () => {
    it('should add device_id to entity', () => {
      const { addSyncMetadata, deviceId } = useSync()

      const entity = {
        id: '1',
        name: 'Test',
        updated_at: '2026-02-01T10:00:00.000Z',
      }

      const withMetadata = addSyncMetadata(entity)

      expect(withMetadata._device_id).toBe(deviceId.value)
      expect(withMetadata._version).toBe(1)
      expect(withMetadata.updated_at).toBeDefined()
      expect(new Date(withMetadata.updated_at).getTime()).toBeGreaterThan(
        new Date('2026-02-01T10:00:00.000Z').getTime(),
      )
    })

    it('should increment version number', () => {
      const { addSyncMetadata } = useSync()

      const entity = {
        id: '1',
        name: 'Test',
        updated_at: '2026-02-01T10:00:00.000Z',
        _version: 5,
      }

      const withMetadata = addSyncMetadata(entity)

      expect(withMetadata._version).toBe(6)
    })

    it('should handle missing version', () => {
      const { addSyncMetadata } = useSync()

      const entity = {
        id: '1',
        name: 'Test',
        updated_at: '2026-02-01T10:00:00.000Z',
      }

      const withMetadata = addSyncMetadata(entity)

      expect(withMetadata._version).toBe(1)
    })
  })

  describe('Device ID', () => {
    it('should generate persistent device ID', () => {
      const { deviceId } = useSync()

      const firstId = deviceId.value
      expect(firstId).toBeDefined()
      expect(firstId.length).toBeGreaterThan(0)

      // Should be same on second call
      const secondId = deviceId.value
      expect(secondId).toBe(firstId)
    })

    it('should be a valid UUID', () => {
      const { deviceId } = useSync()

      const id = deviceId.value
      const uuidRegex
        = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(uuidRegex.test(id)).toBe(true)
    })
  })

  describe('Sync Status', () => {
    it('should start with idle status', () => {
      const { syncStatus } = useSync()

      expect(syncStatus.value).toBe('idle')
    })

    it('should track syncing state', () => {
      const { isSyncing } = useSync()

      expect(isSyncing.value).toBe(false)
    })

    it('should have no errors initially', () => {
      const { syncError } = useSync()

      expect(syncError.value).toBeNull()
    })
  })

  describe('Timestamp Comparison', () => {
    it('should correctly compare ISO8601 timestamps as strings', () => {
      const { resolveConflict } = useSync()

      // String comparison should work for ISO8601
      const older = '2026-02-01T10:00:00.000Z'
      const newer = '2026-02-01T11:00:00.000Z'

      expect(newer > older).toBe(true)
      expect(older < newer).toBe(true)

      // Test with actual conflict resolution
      const local: Account = {
        id: '1',
        name: 'Test',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false,
        updated_at: older,
      }

      const remote: Account = {
        ...local,
        updated_at: newer,
      }

      expect(resolveConflict(local, remote)).toBe('remote')
    })

    it('should handle millisecond differences', () => {
      const { resolveConflict } = useSync()

      const local: Budget = {
        id: '1',
        name: 'Test',
        currency: 'USD',
        is_archived: false,
        updated_at: '2026-02-01T10:00:00.123Z',
      }

      const remote: Budget = {
        ...local,
        updated_at: '2026-02-01T10:00:00.456Z', // 333ms later
      }

      expect(resolveConflict(local, remote)).toBe('remote')
    })

    it('should handle different dates', () => {
      const { resolveConflict } = useSync()

      const local: Account = {
        id: '1',
        name: 'Test',
        type: 'asset',
        currency: 'USD',
        include_in_net_worth: true,
        is_system_default: false,
        is_archived: false,
        updated_at: '2026-02-03T10:00:00.000Z', // February 3
      }

      const remote: Account = {
        ...local,
        updated_at: '2026-02-01T10:00:00.000Z', // February 1
      }

      expect(resolveConflict(local, remote)).toBe('local')
    })
  })
})
