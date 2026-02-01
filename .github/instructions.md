# Wallet PWA - Essential Instructions

**MODE: PLAN** - No actual code should be created yet, only planning documentation.

## Project Overview

A Local-First Progressive Web Application (PWA) implementing a personal finance wallet with:
- **Offline-First Architecture**: IndexDB for local storage with BYOB (Bring Your Own Backend) Firestore sync
- **Strict Double-Entry Accounting**: Every transaction maintains balanced debits and credits
- **Triple Truth Multi-Currency System**: Display, Account, and Budget values with frozen exchange rates
- **Last-Write-Wins (LWW) Conflict Resolution**: Offline-ready with automatic sync when online

## Core Principles

### 1. Local-First
- All data stored in IndexDB (browser local storage)
- App works fully offline
- Optional sync to user's own Firestore instance (BYOB)

### 2. Double-Entry Accounting
- Every transaction has balanced debits and credits
- Maintains accounting equation: Assets = Liabilities + Equity
- Entries can be edited; corrections can be made directly or via reversing entries

### 3. Triple Truth Multi-Currency
- **Display Currency**: What user sees in UI (configurable)
- **Account Currency**: Native currency of each account
- **Budget Currency**: User's home currency for budgeting
- Exchange rates frozen at transaction time for historical accuracy

### 4. Offline Sync Strategy
- Last-Write-Wins (LWW) conflict resolution
- Uses `_lww_timestamp`, `_device_id`, `_version` for conflict detection
- Atomic sync for transaction groups (all ledger entries together)

## Key Design Decisions

### Denormalized Ledger
Each ledger entry is self-contained with full currency context, enabling efficient offline queries without joins.

### Frozen Exchange Rates
Rates captured at transaction-time prevent historical data corruption:
```
{
  displayAmount: 100, displayCurrency: "USD",
  accountAmount: 85, accountCurrency: "EUR",
  budgetAmount: 75, budgetCurrency: "GBP",
  frozenRates: { displayToAccount: 0.85, displayToBudget: 0.75 }
}
```

### UUID-Based Schema
All entities use UUID v4 for:
- Offline-first ID generation (no server coordination)
- Conflict-free merging across devices
- Stable references in distributed system

## Development Guidelines

### Technology Choices
- **Framework**: Nuxt 4.3 with PWA support
- **UI Components**: shadcn-vue
- **Storage**: IndexDB (via Dexie.js)
- **Sync**: Firebase JS SDK (optional, user-configured)
- **Math**: decimal.js (avoid floating point errors)

### Validation Rules
- Debits must equal credits (tolerance: 0.01)
- Amounts can be positive or negative (signed values)
- Valid currency codes (ISO 4217)
- Valid account references
- Valid UUID formats

### Testing Requirements
- Unit tests for accounting logic and currency conversions
- Integration tests for IndexDB operations and sync
- E2E tests for offline/online transitions and conflict resolution
- Performance tests with 1000+ transactions

## Documentation Structure

For detailed specifications, see:
- **[Database Schema](../docs/database-schema.md)** - Complete data models and IndexDB/Firestore schemas
- **[Implementation Plan](../docs/implementation-plan.md)** - Phased development roadmap and technical details

## Quick Reference

**Core Entities:**
- Ledger entries (denormalized, UUID-based, atomic units)
- Accounts (chart of accounts)
- Budgets (budget tracking)
- Exchange rates (historical snapshots)
- Recurring rules (automated transactions)

**Sync Metadata:**
- `updated_at`: ISO8601 timestamp of last modification

**Key Constraints:**
- Zero-sum validation (sum of amounts = 0)
- Editable ledger entries
- Atomic transaction sync (all entries together)

---

**Remember**: This is PLAN mode. Implement these specifications in subsequent development phases.
