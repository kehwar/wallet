# Implementation Plan

**MODE: PLAN** - This document outlines the phased development plan and technical details for implementing the wallet PWA.

---

## Development Phases

### Phase 1: Core Data Layer

**Goal**: Establish the foundation for data storage and access.

**Tasks:**
- [ ] Design and implement IndexDB schema
- [ ] Create data access layer (DAL) abstraction
- [ ] Implement CRUD operations
- [ ] Add validation for double-entry rules
- [ ] Write unit tests for data layer

**Deliverables:**
- IndexDB database with all object stores
- DAL API for transactions, accounts, ledger entries
- Validation functions
- Unit test suite (>80% coverage)

**Duration**: 2-3 weeks

---

### Phase 2: Accounting Engine

**Goal**: Implement core double-entry accounting logic.

**Tasks:**
- [ ] Implement ledger entry creation
- [ ] Implement balance calculation
- [ ] Add transaction validation
- [ ] Add multi-currency support
- [ ] Add exchange rate management
- [ ] Test double-entry enforcement

**Deliverables:**
- Transaction creation API
- Balance calculation engine
- Currency conversion logic
- Exchange rate management
- Validation rules enforced

**Duration**: 3-4 weeks

---

### Phase 3: PWA Foundation

**Goal**: Transform the app into a Progressive Web App.

**Tasks:**
- [ ] Create Service Worker
- [ ] Implement caching strategy
- [ ] Create manifest.json
- [ ] Add offline detection
- [ ] Test offline functionality

**Deliverables:**
- Installable PWA
- Offline-capable app shell
- Background sync capability
- Network status indicators

**Duration**: 2 weeks

---

### Phase 4: Sync Implementation

**Goal**: Enable multi-device sync with conflict resolution.

**Tasks:**
- [ ] Implement LWW metadata
- [ ] Create sync engine
- [ ] Add Firestore integration (optional)
- [ ] Implement conflict resolution
- [ ] Add sync status UI
- [ ] Test sync scenarios (offline/online/conflict)

**Deliverables:**
- Sync engine with LWW resolution
- Firestore BYOB integration
- Conflict resolution UI
- Sync status indicators

**Duration**: 3-4 weeks

---

### Phase 5: User Interface

**Goal**: Build intuitive, mobile-first UI.

**Tasks:**
- [ ] Design UI/UX (mobile-first)
- [ ] Implement transaction entry forms
- [ ] Create account management
- [ ] Add reports and dashboards
- [ ] Implement budget tracking
- [ ] Add multi-currency displays

**Deliverables:**
- Complete UI for all features
- Transaction entry screens
- Account management screens
- Reporting dashboards
- Budget tracking interface

**Duration**: 4-6 weeks

---

### Phase 6: Testing & Optimization

**Goal**: Ensure quality, performance, and accessibility.

**Tasks:**
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Load testing

**Deliverables:**
- E2E test suite
- Performance benchmarks met
- Security audit report
- Accessibility compliance
- Browser compatibility matrix

**Duration**: 2-3 weeks

---

## Technical Stack

### Frontend

**Framework**: React or Vue.js (with PWA support)
- React: Use Create React App with PWA template or Vite
- Vue: Use Vue CLI with PWA plugin or Vite

**State Management**: Redux or Vuex (for offline state)
- Maintain app state for offline operations
- Persist state to IndexDB

**UI Components**: Material-UI or Vuetify
- Mobile-first responsive design
- Consistent component library

**Charts**: Chart.js or D3.js
- Financial reports and visualizations
- Budget tracking charts

**Date Handling**: date-fns or Luxon
- Timezone-aware date handling
- ISO8601 formatting

### Storage & Sync

**IndexDB Wrapper**: Dexie.js or idb
- Dexie.js: Higher-level API, easier to use
- idb: Lightweight, closer to native API

**Firebase SDK**: Firebase JS SDK (v9+ modular)
- Modular imports for smaller bundle size
- Firestore for cloud sync
- Auth for user identity

**Service Worker**: Workbox
- Pre-caching strategies
- Background sync
- Offline fallbacks

### Build & Development

**Build Tool**: Vite or Webpack
- Vite: Faster dev builds, modern default
- Webpack: More mature, extensive plugins

**Testing**: Jest + Testing Library
- Unit tests: Jest
- Component tests: React Testing Library / Vue Testing Library
- E2E tests: Playwright or Cypress

**Linting**: ESLint + Prettier
- Consistent code style
- Catch errors early

**TypeScript**: Recommended for type safety
- Type-safe data models
- Better IDE support
- Catch errors at compile time

### Currency & Math

**Decimal Math**: decimal.js or big.js
- Avoid floating point rounding errors
- Precise financial calculations

**Currency Formatting**: Intl.NumberFormat API
- Native browser API
- Localized currency formatting

**Exchange Rates**: Manual API integration (user configurable)
- Users can choose rate source
- Support manual entry
- Cache rates locally

---

## Offline-First PWA Architecture

### Service Worker Strategy

**Cache First Strategy** (for static assets):
```javascript
// Cache app shell, CSS, JS, images
workbox.routing.registerRoute(
  /\.(?:js|css|png|jpg|svg)$/,
  new workbox.strategies.CacheFirst()
);
```

**Network First Strategy** (for Firestore sync):
```javascript
// Try network first, fall back to cache
workbox.routing.registerRoute(
  /firestore\.googleapis\.com/,
  new workbox.strategies.NetworkFirst()
);
```

**Background Sync**:
```javascript
// Queue failed requests for retry
workbox.backgroundSync.registerQueue('syncQueue');
```

### IndexDB Implementation

**Initialization:**
```javascript
import Dexie from 'dexie';

const db = new Dexie('wallet_db');
db.version(1).stores({
  ledger: 'id, transactionId, accountId, date, _lww_timestamp',
  accounts: 'id, type, parent_id, _lww_timestamp',
  transactions: 'id, date, category, _lww_timestamp',
  exchange_rates: 'id, base_currency, target_currency, valid_from',
  sync_metadata: 'id, entity_type, entity_id, _lww_timestamp'
});
```

**CRUD Operations:**
```javascript
// Create with LWW metadata
async function createLedgerEntry(entry) {
  entry._lww_timestamp = Date.now();
  entry._device_id = getDeviceId();
  entry._version = 1;
  entry.syncedAt = null;
  
  await db.ledger.add(entry);
  queueForSync(entry);
}

// Update with LWW metadata
async function updateLedgerEntry(id, changes) {
  const entry = await db.ledger.get(id);
  
  entry._lww_timestamp = Date.now();
  entry._version += 1;
  entry.syncedAt = null;
  Object.assign(entry, changes);
  
  await db.ledger.put(entry);
  queueForSync(entry);
}
```

### BYOB Firestore Integration

**User Configuration:**
```javascript
// User provides their Firebase config
const firebaseConfig = {
  apiKey: "user-api-key",
  authDomain: "user-project.firebaseapp.com",
  projectId: "user-project",
  storageBucket: "user-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "user-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

**Security Rules Example:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                           && request.auth.uid == userId;
    }
  }
}
```

---

## Last-Write-Wins Sync Strategy

### Conflict Resolution Logic

```javascript
function resolveConflict(local, remote) {
  // Compare timestamps
  if (local._lww_timestamp > remote._lww_timestamp) {
    return 'local';
  } else if (remote._lww_timestamp > local._lww_timestamp) {
    return 'remote';
  }
  
  // Tie-breaker: version
  if (local._version > remote._version) {
    return 'local';
  } else if (remote._version > local._version) {
    return 'remote';
  }
  
  // Tie-breaker: device_id (lexicographic)
  return local._device_id > remote._device_id ? 'local' : 'remote';
}
```

### Sync Flow

**Upload (Local -> Cloud):**
```javascript
async function uploadChanges() {
  const unsynced = await db.ledger
    .where('syncedAt')
    .equals(null)
    .or('syncedAt')
    .below(new Date(entry.updatedAt))
    .toArray();
  
  for (const entry of unsynced) {
    await setDoc(doc(firestore, `users/${userId}/ledger/${entry.id}`), entry);
    entry.syncedAt = new Date().toISOString();
    await db.ledger.put(entry);
  }
}
```

**Download (Cloud -> Local):**
```javascript
async function downloadChanges() {
  const lastSync = await getLastSyncTime();
  const query = query(
    collection(firestore, `users/${userId}/ledger`),
    where('_lww_timestamp', '>', lastSync)
  );
  
  const snapshot = await getDocs(query);
  
  for (const doc of snapshot.docs) {
    const remote = doc.data();
    const local = await db.ledger.get(remote.id);
    
    if (!local || resolveConflict(local, remote) === 'remote') {
      await db.ledger.put(remote);
    } else {
      // Local wins, re-upload
      queueForSync(local);
    }
  }
}
```

**Atomic Transaction Sync:**
```javascript
async function syncTransaction(transactionId) {
  const transaction = await db.transactions.get(transactionId);
  const entries = await db.ledger
    .where('transactionId')
    .equals(transactionId)
    .toArray();
  
  // Check if any entry has conflict
  const hasConflict = await checkConflicts(entries);
  
  if (hasConflict) {
    // Resolve entire transaction atomically
    const resolution = await resolveTransactionConflict(transaction, entries);
    
    if (resolution === 'remote') {
      // Replace entire transaction
      await replaceTransaction(transactionId, remoteData);
    } else {
      // Re-upload entire transaction
      await uploadTransaction(transactionId);
    }
  }
}
```

---

## Data Integrity & Validation

### Transaction Validation

```javascript
function validateTransaction(transaction, entries) {
  // Must have at least 2 entries
  if (entries.length < 2) {
    throw new Error('Transaction must have at least 2 ledger entries');
  }
  
  // Calculate sums
  const debits = entries
    .filter(e => e.type === 'debit')
    .reduce((sum, e) => sum.add(new Decimal(e.accountAmount)), new Decimal(0));
  
  const credits = entries
    .filter(e => e.type === 'credit')
    .reduce((sum, e) => sum.add(new Decimal(e.accountAmount)), new Decimal(0));
  
  // Must balance (within tolerance)
  const diff = debits.minus(credits).abs();
  if (diff.greaterThan(0.01)) {
    throw new Error(`Transaction unbalanced: debits=${debits}, credits=${credits}`);
  }
  
  // All accounts must exist
  for (const entry of entries) {
    const account = await db.accounts.get(entry.accountId);
    if (!account) {
      throw new Error(`Account ${entry.accountId} not found`);
    }
  }
  
  return true;
}
```

### Account Validation

```javascript
function validateAccount(account) {
  // Valid type
  const validTypes = ['asset', 'liability', 'equity', 'income', 'expense'];
  if (!validTypes.includes(account.type)) {
    throw new Error(`Invalid account type: ${account.type}`);
  }
  
  // Valid currency
  if (!isValidCurrencyCode(account.currency)) {
    throw new Error(`Invalid currency code: ${account.currency}`);
  }
  
  // Check circular parent reference
  if (account.parent_id) {
    if (hasCircularReference(account.id, account.parent_id)) {
      throw new Error('Circular parent reference detected');
    }
  }
  
  return true;
}
```

---

## Testing Strategy

### Unit Tests

```javascript
// Example: Test double-entry validation
describe('Transaction Validation', () => {
  test('accepts balanced transaction', () => {
    const entries = [
      { type: 'debit', accountAmount: 100, accountCurrency: 'USD' },
      { type: 'credit', accountAmount: 100, accountCurrency: 'USD' }
    ];
    
    expect(validateTransaction({}, entries)).toBe(true);
  });
  
  test('rejects unbalanced transaction', () => {
    const entries = [
      { type: 'debit', accountAmount: 100, accountCurrency: 'USD' },
      { type: 'credit', accountAmount: 50, accountCurrency: 'USD' }
    ];
    
    expect(() => validateTransaction({}, entries)).toThrow('unbalanced');
  });
});
```

### Integration Tests

```javascript
// Example: Test IndexDB operations
describe('IndexDB Operations', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });
  
  test('creates and retrieves ledger entry', async () => {
    const entry = { id: uuid(), type: 'debit', accountAmount: 100 };
    await createLedgerEntry(entry);
    
    const retrieved = await db.ledger.get(entry.id);
    expect(retrieved.accountAmount).toBe(100);
    expect(retrieved._lww_timestamp).toBeDefined();
  });
});
```

### E2E Tests

```javascript
// Example: Test offline transaction creation
test('creates transaction offline and syncs when online', async () => {
  // Go offline
  await page.setOfflineMode(true);
  
  // Create transaction
  await page.fill('#amount', '100');
  await page.select('#account', 'cash');
  await page.click('#submit');
  
  // Verify in IndexDB
  const entries = await page.evaluate(() => 
    db.ledger.where('syncedAt').equals(null).toArray()
  );
  expect(entries.length).toBe(2);
  
  // Go online
  await page.setOfflineMode(false);
  await page.waitForSelector('.sync-complete');
  
  // Verify synced
  const synced = await page.evaluate(() => 
    db.ledger.where('syncedAt').notEqual(null).toArray()
  );
  expect(synced.length).toBe(2);
});
```

---

## Security Considerations

### Input Sanitization

```javascript
function sanitizeDescription(input) {
  // Remove HTML tags
  const stripped = input.replace(/<[^>]*>/g, '');
  
  // Limit length
  const truncated = stripped.substring(0, 500);
  
  // Escape special characters
  return escapeHtml(truncated);
}
```

### Data Encryption (Optional)

```javascript
// Encrypt sensitive fields before storing
async function encryptEntry(entry, encryptionKey) {
  const encrypted = { ...entry };
  encrypted.description = await encrypt(entry.description, encryptionKey);
  return encrypted;
}

// Decrypt when reading
async function decryptEntry(entry, encryptionKey) {
  const decrypted = { ...entry };
  decrypted.description = await decrypt(entry.description, encryptionKey);
  return decrypted;
}
```

---

## Performance Optimization

### Balance Calculation Caching

```javascript
class BalanceCache {
  constructor() {
    this.cache = new Map();
  }
  
  async getBalance(accountId) {
    if (this.cache.has(accountId)) {
      return this.cache.get(accountId);
    }
    
    const balance = await this.calculateBalance(accountId);
    this.cache.set(accountId, balance);
    return balance;
  }
  
  invalidate(accountId) {
    this.cache.delete(accountId);
  }
  
  async calculateBalance(accountId) {
    const entries = await db.ledger
      .where('accountId')
      .equals(accountId)
      .toArray();
    
    const debits = entries
      .filter(e => e.type === 'debit')
      .reduce((sum, e) => sum + e.accountAmount, 0);
    
    const credits = entries
      .filter(e => e.type === 'credit')
      .reduce((sum, e) => sum + e.accountAmount, 0);
    
    return debits - credits;
  }
}
```

### Virtual Scrolling for Long Lists

```javascript
// Use react-window or vue-virtual-scroller
import { FixedSizeList } from 'react-window';

function TransactionList({ transactions }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={transactions.length}
      itemSize={80}
    >
      {({ index, style }) => (
        <div style={style}>
          <TransactionItem transaction={transactions[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

## Deployment Checklist

### Pre-Launch
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks met (Lighthouse score > 90)
- [ ] Security audit completed (no critical vulnerabilities)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS Safari, Chrome Android)
- [ ] Documentation complete (user guide, API docs)
- [ ] User feedback incorporated (beta testing)

### Launch
- [ ] Deploy to production hosting (Netlify, Vercel, Firebase Hosting)
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable error tracking
- [ ] Configure analytics (optional, with user consent)
- [ ] Announce to users

### Post-Launch
- [ ] Monitor performance metrics (page load, bundle size)
- [ ] Collect user feedback (surveys, support tickets)
- [ ] Address bugs promptly (hotfix process)
- [ ] Plan iteration 2 (new features, improvements)

---

## Future Enhancements

### Phase 2 Features
- [ ] Recurring transactions (auto-create on schedule)
- [ ] Budget templates (pre-defined budget categories)
- [ ] Receipt scanning (OCR with Tesseract.js)
- [ ] Bank import (OFX, QFX, CSV parsers)
- [ ] Multi-device sync notifications (push notifications)
- [ ] Collaborative accounts (shared wallet with permissions)

### Advanced Features
- [ ] Investment tracking (stocks, bonds, crypto)
- [ ] Tax reporting (generate tax forms)
- [ ] Audit trail (complete history of changes)
- [ ] Advanced reporting (P&L, Balance Sheet, Cash Flow)
- [ ] API for third-party integrations
- [ ] Import from other apps (Mint, YNAB, Quicken)

---

## Summary

This implementation plan provides a structured approach to building the wallet PWA in 6 phases over approximately 16-22 weeks. Each phase builds on the previous one, with clear deliverables and testing requirements.

**Key Milestones:**
1. **Week 3**: Core data layer complete
2. **Week 7**: Accounting engine functional
3. **Week 9**: PWA capabilities enabled
4. **Week 13**: Sync implementation complete
5. **Week 19**: Full UI implemented
6. **Week 22**: Production ready

The plan emphasizes incremental development, testing at each stage, and adherence to the core principles of offline-first operation, strict double-entry accounting, and multi-currency support.
