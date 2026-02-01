# Database Schema

**MODE: PLAN** - This document specifies the database schema for the wallet PWA.

## Architecture Overview

**Data Plane Specification**
- Architecture: Local-First (IndexDB/Dexie) + Firestore Sync
- Pattern: Denormalized Double-Entry Ledger
- Core Principle: The Ledger Entry is the atomic unit; no separate Transaction documents

The wallet uses a denormalized schema with UUID-based entities for offline-first operation. Data is stored locally in IndexDB and optionally synced to user's Firestore instance.

---

## Core Types

```typescript
type TransactionStatus = 'projected' | 'confirmed';
type AccountType = 'asset' | 'liability' | 'income' | 'expense' | 'equity';
type CurrencyCode = string; // e.g., "USD", "PEN", "EUR"
type UUID = string;         // UUID v4
type ISODate = string;      // "2026-02-01T14:30:00.000Z"
```

---

## Data Models

### Ledger Entry (The Atomic Unit)

**Purpose**: The fundamental building block. Individual splits that share a `transaction_id` form a complete transaction. No separate Transaction document exists.

```typescript
interface LedgerEntry {
  // === Identity & Sequencing ===
  id: UUID;                 // Primary Key
  transaction_id: UUID;     // Foreign Key: Links splits together
  idx: number;              // 0, 1, 2... Preserves visual order of splits

  // === Header Data (Denormalized - repeated on every split) ===
  date: ISODate;            // User-defined date
  description: string;      // e.g., "Grocery Run"
  status: TransactionStatus; // 'projected' | 'confirmed'
  recurring_rule_id?: UUID | null; // Linked if auto-generated
  search_tags?: string[];   // For fuzzy search optimization

  // === The Financial "Triple Truth" ===
  // 1. DISPLAY (The Receipt) - Used for Zero-Sum Validation
  currency_display: CurrencyCode;
  amount_display: number;     // Signed (+/-). Sum of group must be 0.

  // 2. ACCOUNT (The Bank) - Used for Account Balances
  account_id: UUID;
  amount_account: number;     // Converted to Account's currency
  rate_display_to_account: number; // Frozen exchange rate used

  // 3. BUDGET (The Plan) - Used for Budget Availability
  budget_id?: UUID | null;    // Optional "Cost Center"
  amount_budget: number | null; // Converted to Budget's currency
  rate_display_to_budget: number | null; // Frozen exchange rate used

  // === Metadata (Sync logic) ===
  created_at: ISODate;      // Immutable system time
  updated_at: ISODate;      // Used for LWW (Last Write Wins) sync
}
```

**Key Properties:**
- `id`: Globally unique identifier (UUID v4)
- `transaction_id`: Groups multiple splits into a logical transaction
- `idx`: Order index for displaying splits in UI (0, 1, 2...)
- `status`: Distinguishes between projected (forecasted) and confirmed (actual) transactions
- `amount_display`: Signed amount (+/-) where sum of all splits in a transaction must equal 0
- `rate_*`: Frozen exchange rates at transaction time (immutable)
- `updated_at`: Timestamp for Last-Write-Wins conflict resolution

**Validation Rules:**
- All entries with same `transaction_id` must sum to zero: `SUM(amount_display) = 0`
- Amounts can be positive or negative (signed values)
- Exchange rates must be positive numbers
- `account_id` must reference existing account
- `budget_id` is optional (can be null)
- `idx` must be sequential within transaction group (0, 1, 2...)

---

### Account

**Purpose**: Represents financial accounts (bank accounts, credit cards, etc.).

```typescript
interface Account {
  id: UUID;
  name: string;             // e.g., "Chase Sapphire"
  type: AccountType;        // 'asset' | 'liability' | 'income' | 'expense' | 'equity'
  currency: CurrencyCode;   // Immutable after creation
  
  // Logic Flags
  include_in_net_worth: boolean; // False for "Budget Exchange" accounts
  is_system_default: boolean;    // True for "Ready to Assign"
  is_archived: boolean;
  
  updated_at: ISODate;
}
```

**Account Types:**
- `asset`: Things owned (cash, bank accounts, investments)
- `liability`: Things owed (credit cards, loans)
- `equity`: Net worth
- `income`: Money earned
- `expense`: Money spent

**Logic Flags:**
- `include_in_net_worth`: When false, account is excluded from net worth calculations (useful for virtual/system accounts)
- `is_system_default`: Marks special system accounts like "Ready to Assign"
- `is_archived`: Soft delete flag; archived accounts hidden from UI but data preserved

**Validation Rules:**
- Account names should be unique (recommended, not enforced)
- `currency` is immutable after creation (prevents data corruption)
- Cannot delete accounts with existing ledger entries (use `is_archived`)
- `type` must be one of the five valid AccountType values

---

### Budget

**Purpose**: Represents budget categories or cost centers for tracking spending against targets.

```typescript
interface Budget {
  id: UUID;
  name: string;             // e.g., "Groceries"
  currency: CurrencyCode;   // Immutable
  period: 'monthly' | 'weekly' | 'yearly' | 'custom';
  target_amount?: number;   // Optional goal
  
  is_archived: boolean;
  updated_at: ISODate;
}
```

**Key Properties:**
- `period`: Defines budget reset frequency
- `target_amount`: Optional spending target/goal for the period
- Budget tracking is done by querying ledger entries with matching `budget_id`

**Validation Rules:**
- `currency` is immutable after creation
- `target_amount` must be positive if provided
- Cannot delete budgets with existing ledger entries (use `is_archived`)

---

### Exchange Rate

**Purpose**: Historical exchange rate tracking with date-based lookup.

```typescript
interface ExchangeRate {
  id: string;               // Composite: "USD_PEN_2026-02-01"
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  date: string;             // YYYY-MM-DD
  source: 'manual' | 'api';
  updated_at: ISODate;
}
```

**Key Properties:**
- `id`: Composite key format ensures uniqueness per currency pair per day
- `rate`: Conversion rate (1 from = rate to)
- `source`: Tracks whether rate was user-entered or API-fetched
- `date`: YYYY-MM-DD format for efficient date-based queries

**Validation Rules:**
- `rate` must be positive number
- Currency codes must be valid ISO 4217 (recommended)
- `from` and `to` must be different currencies
- Composite ID format: `{from}_{to}_{date}`

**Rate Lookup Logic:**
1. Query rates where from/to match and date <= transaction_date
2. Order by date DESC
3. Take most recent rate

---

### Recurring Rule

**Purpose**: Template for automatic transaction generation based on recurring schedules.

```typescript
interface RecurringRule {
  id: UUID;
  title: string;            // e.g., "Monthly Rent"
  rrule: string;            // iCal RRULE string
  template_entries: Partial<LedgerEntry>[]; // JSON template for generation
  generated_up_to: ISODate; // Checkpoint for projection engine
  updated_at: ISODate;
}
```

**Key Properties:**
- `rrule`: Standard iCalendar RRULE format for recurrence patterns
- `template_entries`: Array of partial ledger entry templates (without id, date, created_at)
- `generated_up_to`: Tracks which dates have been projected to avoid duplicates

**Usage:**
- Projection engine reads rules and generates `status: 'projected'` entries
- When user confirms, status changes to `'confirmed'`
- `generated_up_to` updates as projections are created

---

## IndexDB Schema (Local Storage)

### Dexie.js Schema Definition

```typescript
// Defines IndexDB structure and indices for performance
db.version(1).stores({
  ledger_entries: `
    id,
    transaction_id,
    date,
    status,
    updated_at,
    account_id,
    budget_id,
    [account_id+date],     // Index for Account Activity Screens
    [budget_id+date],      // Index for Budget Reports
    [transaction_id+idx]   // Index for Transaction Reconstruction
  `,
  accounts: 'id, updated_at',
  budgets: 'id, updated_at',
  rates: 'id, date, updated_at',
  rules: 'id, updated_at'
});
```

### Object Stores

**Database Name:** `wallet_db`

**Stores:**
- `ledger_entries`: Main ledger entries (denormalized for performance)
- `accounts`: Chart of accounts
- `budgets`: Budget categories and cost centers
- `rates`: Historical exchange rate snapshots
- `rules`: Recurring transaction templates

### Indexes

**ledger_entries store:**
- Primary key: `id` (UUID)
- Index: `transaction_id` - Groups splits together
- Index: `date` - Date-based queries and reports
- Index: `status` - Filter by projected/confirmed
- Index: `updated_at` - LWW sync logic
- Index: `account_id` - Account-specific queries
- Index: `budget_id` - Budget-specific queries
- Compound index: `[account_id+date]` - Optimized for Account Activity Screens
- Compound index: `[budget_id+date]` - Optimized for Budget Reports
- Compound index: `[transaction_id+idx]` - Transaction reconstruction with ordering

**accounts store:**
- Primary key: `id` (UUID)
- Index: `updated_at` - Sync logic

**budgets store:**
- Primary key: `id` (UUID)
- Index: `updated_at` - Sync logic

**rates store:**
- Primary key: `id` (composite: "USD_PEN_2026-02-01")
- Index: `date` - Date-based lookups
- Index: `updated_at` - Sync logic

**rules store:**
- Primary key: `id` (UUID)
- Index: `updated_at` - Sync logic

---

## Firestore Schema (Cloud Sync - BYOB)

### Collections

```
users/{userId}/
  ├── ledger_entries/{entryId}
  ├── accounts/{accountId}
  ├── budgets/{budgetId}
  ├── rates/{rateId}
  └── rules/{ruleId}
```

All documents use the same structure as IndexDB, enabling direct sync.

**Note**: No separate sync_metadata collection needed. LWW conflict resolution uses the `updated_at` field on each document.

---

## Data Integrity Constraints

### Zero-Sum Validation

For each transaction (group of entries with same `transaction_id`):
```
SUM(amount_display WHERE transaction_id=X) = 0
```

Tolerance: ±0.01 (to handle rounding in multi-currency scenarios)

### Triple Truth Consistency

For each ledger entry:
- `amount_display` is the source of truth for zero-sum validation
- `amount_account = amount_display * rate_display_to_account`
- `amount_budget = amount_display * rate_display_to_budget` (if `budget_id` and `rate_display_to_budget` are present)

### Referential Integrity

- All `ledger_entries.account_id` must reference existing account
- All `ledger_entries.budget_id` must reference existing budget or be null
- All `ledger_entries.recurring_rule_id` must reference existing rule or be null

### Immutability Rules

- `account.currency` cannot be changed after creation
- `budget.currency` cannot be changed after creation
- Exchange rates (`rate_*` fields) in ledger entries cannot be changed
- Use correcting/reversing entries instead of editing confirmed transactions

---

## Query Patterns

### Common Queries

**1. Get Transaction (reconstruct from splits):**
```typescript
const entries = await db.ledger_entries
  .where('[transaction_id+idx]')
  .between([txId, Dexie.minKey], [txId, Dexie.maxKey])
  .toArray();
```

**2. Get Account Activity:**
```typescript
const activity = await db.ledger_entries
  .where('[account_id+date]')
  .between([accountId, startDate], [accountId, endDate])
  .toArray();
```

**3. Get Budget Spending:**
```typescript
const spending = await db.ledger_entries
  .where('[budget_id+date]')
  .between([budgetId, periodStart], [budgetId, periodEnd])
  .toArray();

const total = spending.reduce((sum, e) => sum + e.amount_budget, 0);
```

**4. Calculate Account Balance:**
```typescript
const entries = await db.ledger_entries
  .where('account_id')
  .equals(accountId)
  .toArray();

const balance = entries.reduce((sum, e) => sum + e.amount_account, 0);
```

**5. Filter Projected vs Confirmed:**
```typescript
const confirmed = await db.ledger_entries
  .where('status')
  .equals('confirmed')
  .toArray();
```

---

## Performance Considerations

### Denormalization Trade-offs

**Benefits:**
- Fast queries without joins
- Offline-first queries don't need complex logic
- Each ledger entry is self-contained
- Header data (date, description) instantly available without reconstruction

**Costs:**
- Larger storage footprint (header repeated on every split)
- Updating transaction description requires updating all splits
- Search tags need to be maintained across all splits

### Caching Strategy

**Account Balances:**
- Cache in memory with Map<account_id, balance>
- Invalidate on any ledger entry change for that account
- Lazy recalculation on next read

**Budget Availability:**
- Cache per budget per period
- Invalidate when period changes or entries added/modified
- Recalculate on demand

### Indexing Strategy

**Compound Indexes:**
- `[account_id+date]` enables efficient date-range queries per account
- `[budget_id+date]` enables efficient period queries per budget
- `[transaction_id+idx]` ensures split order is maintained efficiently

**Query Optimization:**
- Use compound indexes for common filter patterns
- Avoid full table scans by always querying with indexed fields
- Use Dexie's `.where()` with compound keys for best performance

---

## Sync Strategy

### Last-Write-Wins (LWW) Conflict Resolution

**Metadata Used:**
- `updated_at`: ISO8601 timestamp of last modification

**Resolution Logic:**
1. Compare `updated_at` of local vs remote
2. More recent timestamp wins
3. On exact tie: Accept remote (rare edge case)

**Sync Flow:**
1. Query Firestore for documents where `updated_at > last_sync_time`
2. For each document:
   - If doesn't exist locally: Insert
   - If exists and remote is newer: Update local
   - If exists and local is newer: Re-upload to Firestore
3. Query local documents where `updated_at > last_sync_time`
4. Upload to Firestore
5. Update `last_sync_time` checkpoint

**Transaction Atomicity:**
When syncing ledger entries, entries with the same `transaction_id` should be synced together as a logical group to maintain zero-sum invariant.

---

## Migration Strategy

When schema changes are needed:

1. **Version the schema**: Use IndexDB version number
2. **Provide migration functions**: Transform old data to new structure
3. **Maintain backwards compatibility**: Support reading old formats during transition
4. **Sync compatibility**: Firestore schema must match IndexDB

Example migration:
```typescript
// Version 1 -> Version 2: Add status field
db.version(2).stores({
  ledger_entries: `id, transaction_id, date, status, updated_at, account_id, budget_id, [account_id+date], [budget_id+date], [transaction_id+idx]`,
  accounts: 'id, updated_at',
  budgets: 'id, updated_at',
  rates: 'id, date, updated_at',
  rules: 'id, updated_at'
}).upgrade(trans => {
  return trans.ledger_entries.toCollection().modify(entry => {
    if (!entry.status) {
      entry.status = 'confirmed'; // Default old entries to confirmed
    }
  });
});
```

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
    match /users/{userId}/{collection}/{document} {
      allow read, write: if request.auth.uid == userId;
      
      // Additional validation
      allow write: if request.auth.uid == userId 
                   && request.resource.data.updated_at is timestamp
                   && request.resource.data.id is string;
    }
  }
}
```

---

## Summary

The database schema implements:
- **Denormalized Ledger Entries** as atomic units (no separate Transaction documents)
- **Signed Amounts** (+/-) with zero-sum validation per transaction group
- **Triple Truth** currency representation (display, account, budget)
- **Frozen Exchange Rates** for historical accuracy
- **Status-based Workflow** (projected vs confirmed transactions)
- **Recurring Rules** for automatic transaction generation
- **Budget Tracking** as first-class entities
- **Compound Indexes** for optimized queries
- **LWW Sync Strategy** using `updated_at` timestamps

This schema supports the core requirements of offline-first operation, double-entry accounting (via zero-sum validation), multi-currency handling with historical accuracy, and budget tracking.
