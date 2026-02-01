# Wallet PWA - Project Instructions

**MODE: PLAN** - This document outlines the architecture and implementation plan. No actual code should be created yet.

## Project Overview

A Local-First Progressive Web Application (PWA) implementing a complete personal finance wallet with:
- **Offline-First Architecture**: IndexDB for local storage with BYOB (Bring Your Own Backend) Firestore sync
- **Strict Double-Entry Accounting**: Every transaction maintains balanced debits and credits
- **Triple Truth Multi-Currency System**: Display, Account, and Budget values with frozen exchange rates
- **Last-Write-Wins (LWW) Conflict Resolution**: Offline-ready with automatic sync when online

---

## Architecture Plan

### 1. Data Layer Architecture

#### 1.1 IndexDB Schema (Local Storage)
```
Stores:
- ledger: Main ledger entries (denormalized for performance)
- accounts: Chart of accounts
- transactions: Transaction metadata
- exchange_rates: Historical exchange rate snapshots
- sync_metadata: Last-Write-Wins timestamps and sync state
```

#### 1.2 Firestore Schema (Cloud Sync - BYOB)
```
Collections:
- users/{userId}/ledger/{entryId}
- users/{userId}/accounts/{accountId}
- users/{userId}/transactions/{txId}
- users/{userId}/rates/{rateId}
- users/{userId}/sync/{docId}
```

#### 1.3 Data Model Design

**Ledger Entry (Denormalized):**
```
{
  id: UUID (v4),
  transactionId: UUID,
  accountId: UUID,
  date: ISO8601 timestamp,
  type: 'debit' | 'credit',
  
  // Triple Truth System
  displayAmount: Number,
  displayCurrency: String,
  
  accountAmount: Number,
  accountCurrency: String,
  
  budgetAmount: Number,
  budgetCurrency: String,
  
  // Frozen Exchange Rates at transaction time
  frozenRates: {
    displayToAccount: Number,
    displayToBudget: Number,
    accountToBudget: Number,
    timestamp: ISO8601
  },
  
  description: String,
  metadata: Object,
  
  // LWW Conflict Resolution
  _lww_timestamp: Number (epoch ms),
  _device_id: UUID,
  _version: Number,
  
  createdAt: ISO8601,
  updatedAt: ISO8601,
  syncedAt: ISO8601 | null
}
```

**Transaction (Parent Record):**
```
{
  id: UUID,
  date: ISO8601,
  description: String,
  category: String,
  tags: String[],
  attachments: String[],
  status: 'pending' | 'cleared' | 'reconciled',
  
  // LWW Metadata
  _lww_timestamp: Number,
  _device_id: UUID,
  _version: Number,
  
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

**Account:**
```
{
  id: UUID,
  name: String,
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense',
  currency: String (ISO 4217),
  parent_id: UUID | null,
  is_active: Boolean,
  
  // Account Metadata
  opening_balance: Number,
  current_balance: Number, // Calculated, not stored in production
  
  // LWW Metadata
  _lww_timestamp: Number,
  _device_id: UUID,
  _version: Number,
  
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

**Exchange Rate Snapshot:**
```
{
  id: UUID,
  base_currency: String,
  target_currency: String,
  rate: Number,
  source: 'manual' | 'api' | 'system',
  valid_from: ISO8601,
  valid_to: ISO8601 | null,
  
  createdAt: ISO8601
}
```

---

### 2. Double-Entry Accounting System

#### 2.1 Core Principles

**Every transaction MUST:**
1. Have at least two ledger entries (one debit, one credit)
2. Total debits MUST equal total credits (in account currency)
3. Maintain the accounting equation: Assets = Liabilities + Equity
4. Be immutable once reconciled (create correcting entries instead)

#### 2.2 Transaction Types

**Simple Transaction (2 entries):**
```
Example: Cash payment for groceries
- Debit: Expenses:Groceries ($50.00)
- Credit: Assets:Cash ($50.00)
```

**Split Transaction (3+ entries):**
```
Example: Grocery shopping with multiple categories
- Debit: Expenses:Groceries ($30.00)
- Debit: Expenses:Household ($20.00)
- Credit: Assets:Cash ($50.00)
```

**Multi-Currency Transaction:**
```
Example: Foreign purchase with conversion
- Debit: Expenses:Travel (€100.00 EUR -> $120.00 USD account)
- Credit: Assets:CreditCard ($120.00 USD)
+ Store frozen rate: 1 EUR = 1.20 USD at transaction time
```

#### 2.3 Balance Calculation Plan
- Real-time balance aggregation from ledger entries
- Sum all debits minus credits for each account
- Cache results in memory with invalidation strategy
- Periodic reconciliation checks for data integrity

---

### 3. Triple Truth Multi-Currency System

#### 3.1 The Three Truths

**Display Currency (User Preference):**
- What the user sees in the UI
- Can be changed at any time
- Historical data recalculated with frozen rates

**Account Currency (Account Native):**
- Native currency of the account (e.g., EUR for European bank account)
- Used for account balance calculations
- Never changes for existing transactions

**Budget Currency (Budget Tracking):**
- Currency used for budget planning
- Typically user's "home" currency
- Used for budget reports and analysis

#### 3.2 Exchange Rate Management

**Rate Acquisition:**
1. Fetch from external API (when online)
2. Store in local IndexDB
3. Sync to Firestore (if configured)
4. Manual rate entry fallback

**Rate Freezing:**
- At transaction creation, capture current rates for all three currency pairs
- Store rates in the ledger entry itself (denormalized)
- Immutable once transaction is saved
- Enables historical accuracy

**Rate Application:**
```
Transaction Flow:
1. User enters amount in display currency: $100 USD
2. System looks up account currency: EUR
3. System looks up budget currency: GBP
4. System fetches/calculates rates:
   - USD->EUR: 0.85 (account amount: €85)
   - USD->GBP: 0.75 (budget amount: £75)
   - EUR->GBP: 0.88 (for validation)
5. Store all three amounts + frozen rates
```

#### 3.3 Benefits of Triple Truth
- Historical accuracy: Past transactions remain correct even if rates change
- Multi-currency support: Native handling of international accounts
- Budget tracking: Consistent budget analysis in home currency
- User flexibility: Change display currency without data loss

---

### 4. Offline-First PWA Architecture

#### 4.1 Progressive Web App Requirements

**Service Worker:**
- Cache application shell
- Cache static assets (CSS, JS, images)
- Implement background sync
- Handle offline/online state transitions

**Manifest.json:**
- App name and icons
- Theme colors
- Display mode: standalone
- Orientation: any
- Start URL

**Installation:**
- Install prompt
- Add to home screen
- Splash screen

#### 4.2 IndexDB Implementation Plan

**Initialization:**
1. Check IndexDB support
2. Open database with version control
3. Create object stores with indexes
4. Handle upgrade paths

**Operations:**
1. **Create**: Add to IndexDB, mark for sync
2. **Read**: Query IndexDB with indexes
3. **Update**: Modify in IndexDB, update LWW timestamp
4. **Delete**: Soft delete (mark as deleted), sync tombstone

**Indexes:**
- ledger: by transactionId, by accountId, by date
- transactions: by date, by category
- accounts: by type, by parent_id
- sync_metadata: by syncedAt, by _lww_timestamp

#### 4.3 BYOB Firestore Integration

**Bring Your Own Backend:**
- Users configure their own Firestore instance
- Provide Firebase config (apiKey, projectId, etc.)
- Optional: Can run purely offline without Firestore

**Authentication:**
- Firebase Auth integration
- Anonymous auth fallback
- User account linking

**Security Rules (to be defined by user):**
```
Example rules:
- Users can only access their own data
- Validate data structure
- Enforce business rules at database level
```

---

### 5. Last-Write-Wins (LWW) Sync Strategy

#### 5.1 Conflict Resolution Design

**LWW Metadata:**
```
_lww_timestamp: Epoch milliseconds of last modification
_device_id: Unique device identifier (UUID)
_version: Monotonically increasing version number
```

**Resolution Logic:**
1. Compare _lww_timestamp of local vs remote
2. Higher timestamp wins
3. On tie: Use _version (higher wins)
4. On tie: Use _device_id (lexicographically higher wins)
5. Losing version is archived (not lost)

#### 5.2 Sync Flow

**Upload (Local -> Cloud):**
```
1. Query unsynced records from IndexDB (syncedAt is null or < updatedAt)
2. Batch upload to Firestore
3. On success: Update syncedAt timestamp
4. On failure: Retry with exponential backoff
```

**Download (Cloud -> Local):**
```
1. Query Firestore for records newer than last sync
2. For each record:
   a. Check if exists locally
   b. Compare LWW timestamps
   c. If remote wins: Update local
   d. If local wins: Re-upload local (conflict)
3. Update last sync timestamp
```

**Bidirectional Sync:**
```
1. Run download first (get latest from cloud)
2. Run upload (push local changes)
3. Run download again (catch any concurrent changes)
```

#### 5.3 Sync Triggers

**Automatic:**
- On app startup (if online)
- On online event (after being offline)
- Periodic background sync (Service Worker)
- After local modifications (debounced)

**Manual:**
- Pull-to-refresh gesture
- Manual sync button
- Settings sync now option

#### 5.4 Conflict Handling for Double-Entry

**Special Case:** When a transaction is modified:
1. All related ledger entries must sync together (atomic group)
2. Use transaction version as parent version
3. If any entry conflicts, entire transaction conflicts
4. Resolution: Keep entire transaction set from winner

---

### 6. Development Plan

#### 6.1 Phase 1: Core Data Layer
- [ ] Design and implement IndexDB schema
- [ ] Create data access layer (DAL) abstraction
- [ ] Implement CRUD operations
- [ ] Add validation for double-entry rules
- [ ] Write unit tests for data layer

#### 6.2 Phase 2: Accounting Engine
- [ ] Implement ledger entry creation
- [ ] Implement balance calculation
- [ ] Add transaction validation
- [ ] Add multi-currency support
- [ ] Add exchange rate management
- [ ] Test double-entry enforcement

#### 6.3 Phase 3: PWA Foundation
- [ ] Create Service Worker
- [ ] Implement caching strategy
- [ ] Create manifest.json
- [ ] Add offline detection
- [ ] Test offline functionality

#### 6.4 Phase 4: Sync Implementation
- [ ] Implement LWW metadata
- [ ] Create sync engine
- [ ] Add Firestore integration (optional)
- [ ] Implement conflict resolution
- [ ] Add sync status UI
- [ ] Test sync scenarios (offline/online/conflict)

#### 6.5 Phase 5: User Interface
- [ ] Design UI/UX (mobile-first)
- [ ] Implement transaction entry forms
- [ ] Create account management
- [ ] Add reports and dashboards
- [ ] Implement budget tracking
- [ ] Add multi-currency displays

#### 6.6 Phase 6: Testing & Optimization
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Load testing

---

### 7. Technical Stack (Recommendations)

#### 7.1 Frontend
- **Framework**: React or Vue.js (with PWA support)
- **State Management**: Redux or Vuex (for offline state)
- **UI Components**: Material-UI or Vuetify
- **Charts**: Chart.js or D3.js
- **Date Handling**: date-fns or Luxon

#### 7.2 Storage & Sync
- **IndexDB Wrapper**: Dexie.js or idb
- **Firebase SDK**: Firebase JS SDK (v9+ modular)
- **Service Worker**: Workbox

#### 7.3 Build & Development
- **Build Tool**: Vite or Webpack
- **Testing**: Jest + Testing Library
- **Linting**: ESLint + Prettier
- **TypeScript**: Recommended for type safety

#### 7.4 Currency & Math
- **Decimal Math**: decimal.js or big.js (avoid floating point errors)
- **Currency Formatting**: Intl.NumberFormat API
- **Exchange Rates**: Manual API integration (user configurable)

---

### 8. Data Integrity & Validation

#### 8.1 Client-Side Validation

**Transaction Validation:**
- All ledger entries must reference valid accounts
- Debits must equal credits (within tolerance: 0.01)
- Amounts must be positive numbers
- Dates must be valid and not in future (unless pending)
- Required fields must be present

**Account Validation:**
- Unique account names within parent
- Valid account type
- Valid currency code (ISO 4217)
- Circular parent reference prevention

**Sync Validation:**
- Valid UUID formats
- LWW timestamp monotonicity
- Device ID consistency

#### 8.2 Reconciliation Process

**Daily Reconciliation:**
1. Sum all debits by account
2. Sum all credits by account
3. Calculate net balance
4. Compare with expected balance
5. Flag discrepancies for review

**Global Integrity Check:**
1. Verify accounting equation: Assets = Liabilities + Equity
2. Verify orphaned ledger entries (missing transaction)
3. Verify orphaned transactions (no ledger entries)
4. Check for unbalanced transactions

---

### 9. Security Considerations

#### 9.1 Data Security

**Local Storage:**
- Consider IndexDB encryption (optional)
- Secure device with PIN/biometric
- Auto-lock after inactivity

**Cloud Storage:**
- User-controlled Firestore instance
- Firebase Auth for user identity
- Firestore security rules (user-defined)

**Data Privacy:**
- No telemetry without consent
- No third-party analytics by default
- User owns all data
- Export functionality (JSON, CSV)

#### 9.2 Input Sanitization
- Validate all user inputs
- Prevent XSS attacks
- Sanitize description fields
- Limit file upload sizes

---

### 10. User Experience Guidelines

#### 10.1 Offline Experience

**Clear Status Indicators:**
- Online/offline badge
- Sync status (syncing, synced, pending)
- Last sync timestamp
- Conflict indicators

**Optimistic UI:**
- Immediate feedback on actions
- Visual pending state
- Background sync without blocking

**Error Handling:**
- User-friendly error messages
- Retry mechanisms
- Help documentation links

#### 10.2 Mobile-First Design

**Touch Targets:**
- Minimum 44x44px tap targets
- Swipe gestures for common actions
- Pull-to-refresh for sync

**Performance:**
- Lazy load reports/charts
- Virtual scrolling for long lists
- Debounce search inputs
- Optimize bundle size

**Accessibility:**
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode

---

### 11. Monitoring & Debugging

#### 11.1 Client-Side Logging

**Log Levels:**
- ERROR: Critical failures
- WARN: Recoverable issues
- INFO: Important events (sync, transactions)
- DEBUG: Detailed troubleshooting

**Log Storage:**
- In-memory circular buffer
- Optional IndexDB persistence
- Export logs for support

#### 11.2 Sync Debugging

**Sync Metrics:**
- Sync duration
- Records uploaded/downloaded
- Conflicts detected/resolved
- Error rates

**Debug UI:**
- View sync history
- Inspect pending changes
- Force sync operations
- Reset sync state (advanced)

---

### 12. Future Enhancements

#### 12.1 Phase 2 Features
- [ ] Recurring transactions
- [ ] Budget templates
- [ ] Receipt scanning (OCR)
- [ ] Bank import (OFX, QFX, CSV)
- [ ] Multi-device sync notifications
- [ ] Collaborative accounts (shared wallets)

#### 12.2 Advanced Features
- [ ] Investment tracking
- [ ] Tax reporting
- [ ] Audit trail
- [ ] Advanced reporting (P&L, Balance Sheet)
- [ ] API for third-party integrations
- [ ] Import from other apps (Mint, YNAB, etc.)

---

### 13. Documentation Plan

#### 13.1 User Documentation
- Getting Started guide
- Transaction entry tutorial
- Multi-currency guide
- Sync configuration
- Troubleshooting guide
- FAQ

#### 13.2 Developer Documentation
- Architecture overview
- API documentation
- Data model reference
- Contributing guidelines
- Testing guide
- Deployment guide

---

### 14. Testing Strategy

#### 14.1 Unit Tests
- Data layer functions
- Accounting logic
- Currency conversions
- LWW conflict resolution
- Validation functions

#### 14.2 Integration Tests
- IndexDB operations
- Firestore sync
- Service Worker caching
- Offline/online transitions

#### 14.3 End-to-End Tests
- Complete user flows
- Multi-device sync scenarios
- Offline mode operations
- Conflict resolution scenarios

#### 14.4 Test Scenarios

**Critical Test Cases:**
1. Create transaction while offline, sync when online
2. Modify same transaction on two devices (conflict)
3. Create 1000+ transactions (performance)
4. Rapid online/offline switching
5. Currency conversion accuracy (edge cases)
6. Double-entry balance verification
7. Account deletion with existing transactions
8. Data export/import integrity

---

### 15. Deployment Checklist

#### 15.1 Pre-Launch
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS, Android)
- [ ] Documentation complete
- [ ] User feedback incorporated

#### 15.2 Launch
- [ ] Deploy to production hosting
- [ ] Configure CDN
- [ ] Set up monitoring
- [ ] Enable error tracking
- [ ] Announce to users

#### 15.3 Post-Launch
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Address bugs promptly
- [ ] Plan iteration 2

---

## Summary

This Local-First PWA Wallet implements a sophisticated financial management system with:

1. **Robust Data Architecture**: Denormalized ledger schema with UUID-based entities
2. **Strict Accounting**: Double-entry bookkeeping with validation
3. **Multi-Currency Excellence**: Triple Truth system with frozen exchange rates
4. **Offline-First**: IndexDB for local data, BYOB Firestore for optional sync
5. **Conflict Resolution**: Last-Write-Wins with comprehensive metadata
6. **Progressive Enhancement**: Works offline, syncs when online

The system is designed to be reliable, performant, and user-centric, giving users full control over their financial data while providing modern PWA conveniences.

---

**REMEMBER: This is PLAN MODE - implement these specifications in subsequent development phases.**
