# Database Schema

**MODE: PLAN** - This document specifies the database schema for the wallet PWA.

## Overview

The wallet uses a denormalized schema with UUID-based entities for offline-first operation. Data is stored locally in IndexDB and optionally synced to user's Firestore instance.

---

## IndexDB Schema (Local Storage)

### Object Stores

```
Database: wallet_db

Stores:
- ledger: Main ledger entries (denormalized for performance)
- accounts: Chart of accounts
- transactions: Transaction metadata
- exchange_rates: Historical exchange rate snapshots
- sync_metadata: Last-Write-Wins timestamps and sync state
```

### Indexes

**ledger store:**
- Primary key: `id` (UUID)
- Index: `transactionId`
- Index: `accountId`
- Index: `date`
- Index: `_lww_timestamp`

**accounts store:**
- Primary key: `id` (UUID)
- Index: `type`
- Index: `parent_id`
- Index: `_lww_timestamp`

**transactions store:**
- Primary key: `id` (UUID)
- Index: `date`
- Index: `category`
- Index: `_lww_timestamp`

**exchange_rates store:**
- Primary key: `id` (UUID)
- Index: `base_currency`
- Index: `target_currency`
- Index: `valid_from`

**sync_metadata store:**
- Primary key: `id` (UUID)
- Index: `syncedAt`
- Index: `_lww_timestamp`

---

## Firestore Schema (Cloud Sync - BYOB)

### Collections

```
users/{userId}/
  ├── ledger/{entryId}
  ├── accounts/{accountId}
  ├── transactions/{txId}
  ├── rates/{rateId}
  └── sync/{docId}
```

All documents use the same structure as IndexDB, enabling direct sync.

---

## Data Models

### Ledger Entry (Denormalized)

**Purpose**: Core double-entry accounting record with full currency context.

```javascript
{
  // Identity
  id: UUID (v4),
  transactionId: UUID,
  accountId: UUID,
  date: ISO8601 timestamp,
  type: 'debit' | 'credit',
  
  // Triple Truth System - Display Currency
  displayAmount: Number,
  displayCurrency: String,
  
  // Triple Truth System - Account Currency
  accountAmount: Number,
  accountCurrency: String,
  
  // Triple Truth System - Budget Currency
  budgetAmount: Number,
  budgetCurrency: String,
  
  // Frozen Exchange Rates at transaction time
  frozenRates: {
    displayToAccount: Number,
    displayToBudget: Number,
    accountToBudget: Number,
    timestamp: ISO8601
  },
  
  // Descriptive
  description: String,
  metadata: Object,
  
  // LWW Conflict Resolution
  _lww_timestamp: Number (epoch ms),
  _device_id: UUID,
  _version: Number,
  
  // Timestamps
  createdAt: ISO8601,
  updatedAt: ISO8601,
  syncedAt: ISO8601 | null
}
```

**Key Properties:**
- `id`: Globally unique identifier (UUID v4)
- `type`: Either 'debit' or 'credit'
- `*Amount/*Currency`: Three complete currency representations
- `frozenRates`: Exchange rates at transaction time (immutable)
- `_lww_timestamp`: Milliseconds since epoch for conflict resolution
- `_device_id`: Originating device UUID
- `_version`: Monotonically increasing version number

**Validation Rules:**
- All amounts must be positive numbers
- Currency codes must be valid ISO 4217
- `accountId` and `transactionId` must reference existing records
- `type` must be exactly 'debit' or 'credit'
- `_lww_timestamp` must be non-negative integer
- `_version` must be positive integer

---

### Transaction (Parent Record)

**Purpose**: Groups ledger entries and provides metadata.

```javascript
{
  // Identity
  id: UUID,
  date: ISO8601,
  
  // Descriptive
  description: String,
  category: String,
  tags: String[],
  attachments: String[],
  
  // Status
  status: 'pending' | 'cleared' | 'reconciled',
  
  // LWW Metadata
  _lww_timestamp: Number,
  _device_id: UUID,
  _version: Number,
  
  // Timestamps
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

**Key Properties:**
- `status`: Transaction lifecycle state
  - `pending`: Unconfirmed transaction
  - `cleared`: Confirmed but not reconciled
  - `reconciled`: Verified against bank statement (immutable)
- `tags`: Array of user-defined tags for categorization
- `attachments`: Array of file references (receipts, invoices)

**Validation Rules:**
- Must have at least 2 related ledger entries
- Related ledger entries must balance (debits = credits)
- Once `reconciled`, cannot be modified (create correcting entries)
- `date` cannot be in future for cleared/reconciled transactions

---

### Account

**Purpose**: Chart of accounts entity.

```javascript
{
  // Identity
  id: UUID,
  name: String,
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense',
  currency: String (ISO 4217),
  
  // Hierarchy
  parent_id: UUID | null,
  
  // Status
  is_active: Boolean,
  
  // Balance (calculated, not stored in production)
  opening_balance: Number,
  current_balance: Number, // Runtime only, not persisted
  
  // LWW Metadata
  _lww_timestamp: Number,
  _device_id: UUID,
  _version: Number,
  
  // Timestamps
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

**Account Types:**
- `asset`: Things owned (cash, bank accounts, investments)
- `liability`: Things owed (credit cards, loans)
- `equity`: Net worth
- `income`: Money earned
- `expense`: Money spent

**Hierarchy:**
- Accounts can have parent accounts for categorization
- Example: `Expenses:Groceries` where `Expenses` is parent
- `parent_id` is null for root accounts

**Validation Rules:**
- Account names must be unique within same parent
- `currency` must be valid ISO 4217 code
- Circular parent references not allowed
- Cannot delete accounts with existing ledger entries (soft delete via `is_active`)

---

### Exchange Rate Snapshot

**Purpose**: Historical exchange rate tracking.

```javascript
{
  // Identity
  id: UUID,
  
  // Rate Definition
  base_currency: String,
  target_currency: String,
  rate: Number,
  
  // Metadata
  source: 'manual' | 'api' | 'system',
  valid_from: ISO8601,
  valid_to: ISO8601 | null,
  
  // Timestamp
  createdAt: ISO8601
}
```

**Key Properties:**
- `rate`: Conversion rate (1 base_currency = rate target_currency)
- `source`: How the rate was obtained
  - `manual`: User-entered
  - `api`: Fetched from external service
  - `system`: System-calculated
- `valid_from`: When this rate becomes active
- `valid_to`: When this rate expires (null = current/indefinite)

**Validation Rules:**
- `rate` must be positive number
- Currency codes must be valid ISO 4217
- `valid_from` must be before `valid_to`
- Cannot have overlapping validity periods for same currency pair

**Rate Lookup Logic:**
1. Query rates where base/target match
2. Filter by validity period (valid_from <= transaction_date < valid_to)
3. Order by valid_from DESC
4. Take most recent rate

---

### Sync Metadata

**Purpose**: Track sync state for Last-Write-Wins resolution.

```javascript
{
  id: UUID,
  entity_type: 'ledger' | 'account' | 'transaction' | 'rate',
  entity_id: UUID,
  last_synced_version: Number,
  sync_status: 'pending' | 'syncing' | 'synced' | 'conflict',
  conflict_data: Object | null,
  
  _lww_timestamp: Number,
  updatedAt: ISO8601
}
```

**Sync Status:**
- `pending`: Changes not yet synced
- `syncing`: Sync in progress
- `synced`: Successfully synced
- `conflict`: Conflict detected, needs resolution

---

## Data Integrity Constraints

### Double-Entry Balance

For each transaction:
```
SUM(ledger_entries WHERE type='debit' AND transactionId=X) 
  == 
SUM(ledger_entries WHERE type='credit' AND transactionId=X)
```

Tolerance: ±0.01 (to handle rounding in multi-currency)

### Accounting Equation

Global constraint:
```
SUM(asset_accounts) == SUM(liability_accounts) + SUM(equity_accounts)
```

### Referential Integrity

- All `ledger.transactionId` must reference existing transaction
- All `ledger.accountId` must reference existing account
- All `account.parent_id` must reference existing account or be null
- No circular parent references

### Immutability Rules

- Reconciled transactions cannot be modified
- Frozen exchange rates in ledger entries cannot be changed
- Create correcting/reversing entries instead of modifications

---

## Migration Strategy

When schema changes are needed:

1. **Version the schema**: Use IndexDB version number
2. **Provide migration functions**: Transform old data to new structure
3. **Maintain backwards compatibility**: Support reading old formats
4. **Sync compatibility**: Firestore schema must match IndexDB

Example migration:
```javascript
// Version 1 -> Version 2: Add budget currency
if (oldVersion < 2) {
  const transaction = event.target.transaction;
  const store = transaction.objectStore('ledger');
  
  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const entry = cursor.value;
      entry.budgetAmount = entry.accountAmount;
      entry.budgetCurrency = DEFAULT_BUDGET_CURRENCY;
      cursor.update(entry);
      cursor.continue();
    }
  };
}
```

---

## Performance Considerations

### Denormalization Trade-offs

**Benefits:**
- Fast queries without joins
- Offline-first queries don't need complex logic
- Each ledger entry is self-contained

**Costs:**
- Larger storage footprint
- Currency display changes require recalculation
- Account name changes don't propagate automatically

### Query Optimization

**Common Queries:**
1. Get account balance: Query ledger by accountId, sum amounts
2. Get transaction details: Query ledger by transactionId
3. Date range report: Query ledger by date index
4. Category spending: Query transactions by category, join ledger

**Caching Strategy:**
- Cache account balances in memory
- Invalidate on ledger entry changes
- Lazy recalculation on next read

### Index Strategy

Index frequently queried fields:
- `ledger.transactionId` - For transaction detail view
- `ledger.accountId` - For account balance
- `ledger.date` - For reports and filters
- `transaction.category` - For category reports
- `account.type` - For financial statements

---

## Security Considerations

### Local Storage
- IndexDB is domain-scoped (protected by same-origin policy)
- Consider optional encryption for sensitive fields
- Clear data on logout if multi-user device

### Firestore
- User-configured security rules
- Enforce user can only access own data
- Validate data structure server-side

Example Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## Summary

The database schema implements:
- **UUID-based entities** for offline-first ID generation
- **Denormalized ledger** for performance and offline capability
- **Triple Truth** currency representation in every entry
- **LWW metadata** for conflict resolution
- **Immutable history** with append-only corrections
- **IndexDB + Firestore** dual storage strategy

This schema supports the core requirements of offline-first operation, strict double-entry accounting, and multi-currency handling with historical accuracy.
