# Wallet PWA - Development Guide

**Last Updated**: February 4, 2026

This guide provides information about the project structure and how to work with the codebase.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Prepare Nuxt (generate .nuxt directory)
npx nuxi prepare

# Start development server
npm run dev

# Run unit tests
npm test

# Run E2E tests (requires dev server)
npm run test:e2e

# Build for production
npm run build
```

## 📊 Project Status

- **Overall Progress**: 90% Complete (Phases 1-5 complete, Phase 6 nearly complete)
- **Code Base**: ~6,000 lines across 13 composables, 6 pages, 3 components
- **Test Coverage**: 106 unit tests (82% statements, 65% functions, 94% branches), 47 E2E tests across 9 suites (3 skipped)
- **Build Size**: 403 KB gzipped (1.67 MB uncompressed)
- **Status**: Production-ready, comprehensive testing complete

---

## Project Structure

```
wallet/
├── composables/          # Vue composables for data access
│   ├── useDatabase.ts    # Dexie database initialization
│   ├── useAccounts.ts    # Account CRUD operations
│   ├── useBudgets.ts     # Budget CRUD operations
│   ├── useLedger.ts      # Ledger entry CRUD + balance calculations
│   ├── useExchangeRates.ts # Exchange rate management
│   ├── useTransactions.ts  # High-level transaction API (Phase 2)
│   ├── useCurrency.ts      # Currency utilities (Phase 2)
│   └── useNetworkStatus.ts # Network detection and PWA install (Phase 3)
├── components/           # Vue components
│   └── PWABanner.vue     # PWA notifications and install prompt (Phase 3)
├── types/                # TypeScript type definitions
│   └── models.ts         # Core data models
├── utils/                # Utility functions
│   └── validation.ts     # Validation helpers
├── tests/                # Unit tests
│   ├── setup.ts          # Test environment setup
│   ├── validation.test.ts
│   ├── ledger.test.ts
│   ├── accounts.test.ts
│   ├── budgets.test.ts
│   ├── transactions.test.ts        # Phase 2 tests
│   ├── currency.test.ts            # Phase 2 tests
│   └── balance-calculations.test.ts # Phase 2 tests
├── pages/                # Nuxt pages
│   └── index.vue         # Home page with PWA status (Phase 3)
├── public/               # Static assets
│   ├── icon.svg          # App icon source (Phase 3)
│   ├── icon-192x192.png  # PWA icon small (Phase 3)
│   └── icon-512x512.png  # PWA icon large (Phase 3)
├── docs/                 # Documentation
│   ├── implementation/
│   │   ├── database-schema.md
│   │   └── plan.md
│   ├── deployment-guide.md
│   └── user-guide.md
└── app.vue              # Root component with PWA banner (Phase 3)

```

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Generate static site
npm run generate

# Preview production build
npm run preview

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run unit tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires dev server)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

## Testing

The project uses Vitest for unit testing and Playwright for E2E testing:

### Unit Testing
- **happy-dom** for DOM simulation
- **fake-indexeddb** for IndexDB testing
- **@vue/test-utils** for Vue component testing

### E2E Testing
- **Playwright** for browser automation
- **@axe-core/playwright** for accessibility testing

### Test Coverage
- **Unit Tests**: 82.34% statements, 94.45% branches (65.21% functions - UI integration code not fully tested)
- **Total Tests**: 106 unit tests + 47 active E2E tests = 153 tests

**Test Suites:**

**Unit Tests (106 total):**
- Phase 1 (48 tests): validation, accounts, budgets, ledger
- Phase 2 (43 tests): transactions, currency, balance calculations
- Phase 4 (15 tests): sync engine, LWW conflict resolution

**E2E Tests (47 active, 3 skipped):**
- Phase 6: basic navigation, account/transaction management, offline functionality, accessibility, performance, budgets, reports, multi-currency

## Code Quality

- **ESLint**: Configured with @nuxt/eslint for consistent code style
- **TypeScript**: Strict mode enabled for type safety
- **Coverage Thresholds**: 80% for lines, functions, branches, and statements

## Continuous Integration

The project includes a GitHub Actions CI workflow (`.github/workflows/ci.yml`) that:

- **Runs automatically** on every pull request
- **Can be triggered manually** via GitHub Actions UI (workflow_dispatch)
- **Executes linting** with `npm run lint`
- **Runs all tests** with `npm test`
- **Uses Node.js 20.x** with npm caching for optimal performance

All pull requests must pass CI checks before merging.

## Core Data Layer (Phase 1)

The core data layer implements:

### Database Schema
- **Ledger Entries**: Denormalized double-entry accounting with triple-truth currency system
- **Accounts**: Chart of accounts (asset, liability, income, expense, equity)
- **Budgets**: Budget categories and cost centers
- **Exchange Rates**: Historical exchange rate snapshots
- **Recurring Rules**: Templates for automatic transaction generation

### Key Features
- **Offline-First**: All data stored in IndexDB using Dexie.js
- **Double-Entry Validation**: Ensures all transactions balance to zero
- **UUID-Based**: Conflict-free ID generation for distributed systems
- **Frozen Exchange Rates**: Historical accuracy with immutable rates
- **CRUD Operations**: Complete data access layer for all entities

### Validation Rules
- Transactions must balance (sum of amounts = 0, tolerance: ±0.01)
- Accounts and budgets have immutable currencies
- Exchange rates must be positive
- Valid account types: asset, liability, income, expense, equity

## Accounting Engine (Phase 2)

The accounting engine provides high-level transaction APIs and calculations:

### Transaction API
- **Income Transactions**: Record income with automatic double-entry (salary, freelance, etc.)
- **Expense Transactions**: Record expenses with automatic double-entry (groceries, utilities, etc.)
- **Transfer Transactions**: Move money between accounts
- **Multi-Split Transactions**: Complex transactions with multiple splits
- **Multi-Currency Support**: Automatic exchange rate lookup and conversion

### Balance Calculations
- **Point-in-Time Balance**: Calculate account balance at any date
- **Balance History**: Get balance over a date range
- **Net Worth Calculation**: Sum of assets minus liabilities across all currencies
- **Account Activity**: Query transactions for an account

### Currency Utilities
- **Formatting**: Locale-aware and custom currency formatting
- **Parsing**: Parse user input with currency symbols and thousand separators
- **Conversion**: Convert between currencies using exchange rates
- **34 Currencies**: Support for major world currencies with symbols (including PEN)

## PWA Foundation (Phase 3)

The PWA capabilities enable offline-first operation and app installation:

### Service Worker
- **Auto-Update**: Service worker updates automatically with user notification
- **Offline Caching**: All static assets (JS, CSS, HTML, images) cached for offline use
- **Font Caching**: Google Fonts cached with long-term expiration
- **Background Sync**: Ready for offline operation queuing

### Network Detection
- **Online/Offline Status**: Real-time network state detection
- **User Feedback**: Visual indicators when offline
- **Automatic Reconnection**: Detects when network is restored

### Installation
- **Installable**: Add to home screen on mobile and desktop
- **Install Prompt**: Customizable install banner
- **Standalone Mode**: Runs as separate app without browser UI
- **App Icons**: Multiple sizes (192x192, 512x512) for different devices

### Components
- **PWABanner**: Displays offline indicators, update notifications, and install prompts
- **Network Status**: Real-time online/offline detection with visual feedback

## Sync Implementation (Phase 4)

The sync engine enables optional cloud synchronization with user's own Firebase backend:

### Firebase Integration
- **BYOB Architecture**: Bring Your Own Backend - users configure their own Firebase
- **useFirebase Composable**: Firebase initialization and connection management
- **Configuration UI**: User-friendly setup page for Firebase credentials
- **Security Documentation**: Complete guide for Firestore security rules

### Sync Engine
- **useSync Composable**: Bidirectional sync with Firestore
- **Upload/Download**: Efficient sync of ledger entries, accounts, budgets
- **LWW Conflict Resolution**: Last-Write-Wins based on `updated_at` timestamps
- **Device Tracking**: Persistent device ID for multi-device scenarios
- **Auto-Sync**: Automatic sync on network reconnection

### Sync Status
- **SyncStatus Component**: Real-time visual indicators
- **Manual Sync**: On-demand sync button
- **Error Handling**: Clear error messages and recovery
- **Last Sync Time**: Human-readable timestamps

### Data Model Enhancements
- **Sync Metadata**: All entities include `_device_id`, `_version`, `updated_at`
- **Conflict Detection**: Version tracking for optimistic concurrency
- **Audit Trail**: Track which device made changes

## User Interface (Phase 5)

The user interface provides a complete, production-ready interface for all wallet features:

### Navigation & Layout
- **AppLayout Component**: Consistent navigation across all pages
- **Responsive Menu**: Mobile-friendly collapsible navigation
- **Quick Actions**: Dashboard with cards for common tasks
- **Sync Status**: Always-visible sync indicator

### Account Management
- **Account List**: Grouped by type (Asset, Liability, Equity, Income, Expense)
- **Account CRUD**: Create, edit, and delete accounts
- **Balance Display**: Real-time balance calculation per account
- **Transaction Count**: Show number of transactions per account
- **Currency Lock**: Currency immutable after creation

### Transaction Management
- **Transaction List**: Chronological view with search and filters
- **Transaction Forms**: Unified modal for Expense, Income, Transfer
- **Smart Fields**: Dynamic form fields based on transaction type
- **Currency Support**: 10 common currencies in selector
- **Account/Budget Assignment**: Dropdown selectors with validation

### Budget Management
- **Budget List**: Grouped by category (Income/Expense)
- **Budget CRUD**: Create, edit, and delete budgets
- **Spending Totals**: Automatic calculation from transactions
- **Transaction Count**: Show usage per budget

### Financial Reports
- **Net Worth**: Assets - Liabilities calculation
- **Income vs Expenses**: All-time comparison with net
- **Account Balances**: List of all accounts with balances
- **Budget Summary**: Total spending/income per budget
- **Recent Transactions**: Last 10 with quick link to full list

### Vue Composable Wrappers
All data access now follows Vue 3 composable patterns:
- **useAccounts()**: Returns reactive accounts + all account functions
- **useBudgets()**: Returns reactive budgets + all budget functions
- **useLedger()**: Returns reactive entries + all ledger functions
- **useCurrency()**: Returns all currency utilities
- **useTransactions()**: Returns transaction creation functions

## Testing & Optimization (Phase 6)

The testing and optimization phase ensures production-ready quality:

### E2E Testing Infrastructure
- **Playwright**: Browser automation for E2E tests
- **Test Suites**: Navigation, CRUD operations, offline functionality
- **CI Integration**: Automated E2E tests on every PR
- **Visual Regression**: Screenshots on test failure
- **Trace Files**: Debug failed tests with Playwright traces

### Accessibility Testing
- **Axe-core**: Automated WCAG 2.1 AA compliance scanning
- **Keyboard Navigation**: Tab order and focus management tests
- **Screen Reader**: ARIA labels and semantic HTML verification
- **Color Contrast**: WCAG AA contrast ratio compliance

### Performance Testing
- **Load Time**: < 3 seconds page load target
- **Bundle Size**: 403 KB gzipped (1.67 MB uncompressed)
- **Memory Leaks**: Navigation stress testing
- **Large Lists**: 50+ item rendering performance

### Security Audit
- **npm audit**: Critical vulnerabilities fixed
- **Input Validation**: XSS protection review
- **Dependencies**: Production dependencies clean
- **BYOB Architecture**: User-controlled data storage

## Next Steps

See [plan.md](plan.md) for:
- **Phase 1**: Core Data Layer (validation, accounts, budgets, ledger) ✅ COMPLETE
- **Phase 2**: Accounting Engine (transactions, currency, balance calculations) ✅ COMPLETE
- **Phase 3**: PWA Foundation (service worker, offline capabilities) ✅ COMPLETE
- **Phase 4**: Sync Implementation (Firestore BYOB, LWW conflict resolution) ✅ COMPLETE
- **Phase 5**: User Interface (transaction forms, reports, dashboards) ✅ COMPLETE
- **Phase 6**: Testing & Optimization (E2E tests, performance, accessibility) ✅ NEARLY COMPLETE

### Phase 6 Status
- ✅ E2E test infrastructure (Playwright)
- ✅ 47 active E2E tests across 9 test suites (3 skipped)
- ✅ Accessibility testing (WCAG 2.1 AA)
- ✅ Performance benchmarking
- ✅ CI/CD integration
- ✅ User and deployment documentation
- ⏳ Optional: Advanced performance optimizations (lazy loading, virtual scrolling)

**Test Suites**:
1. Basic navigation (3 tests)
2. Account management (4 tests)
3. Transaction creation (4 tests)
4. Offline functionality (1 test, 2 skipped)
5. Accessibility (6 tests, 1 skipped)
6. Performance (5 tests)
7. Budget management (6 tests)
8. Reports page (9 tests)
9. Multi-currency (8 tests)

## Documentation

- **[Database Schema](database-schema.md)**: Complete data models and schemas
- **[Implementation Plan](plan.md)**: Phased development roadmap
- **[User Guide](../user-guide.md)**: End-user documentation
- **[Deployment Guide](../deployment-guide.md)**: Hosting and deployment instructions
- **[GitHub Copilot Instructions](./.github/copilot-instructions.md)**: Development guidelines

## Contributing

Please follow the existing code style and ensure all tests pass before submitting changes.

1. Run linter: `npm run lint`
2. Run tests: `npm test`
3. Check coverage: `npm run test:coverage`
4. Build project: `npm run build`
