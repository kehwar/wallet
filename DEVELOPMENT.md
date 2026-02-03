# Wallet PWA - Development Guide

This guide provides information about the project structure and how to work with the codebase.

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
│   ├── database-schema.md
│   └── implementation-plan.md
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
```

## Testing

The project uses Vitest for unit testing with:
- **happy-dom** for DOM simulation
- **fake-indexeddb** for IndexDB testing
- **@vue/test-utils** for Vue component testing

Current test coverage: **96.09% statements, 85.93% functions** (exceeds 80% requirement)

**Test Suites:**
- Phase 1 (48 tests): validation, accounts, budgets, ledger
- Phase 2 (43 tests): transactions, currency, balance calculations
- Total: 91 tests

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

## Next Steps

See [implementation-plan.md](./docs/implementation-plan.md) for:
- **Phase 3**: PWA Foundation (service worker, offline capabilities) ✅ COMPLETE
- **Phase 4**: Sync Implementation (Firestore BYOB, LWW conflict resolution)
- **Phase 5**: User Interface (transaction forms, reports, dashboards)
- **Phase 6**: Testing & Optimization (E2E tests, performance, accessibility)

## Documentation

- **[Database Schema](./docs/database-schema.md)**: Complete data models and schemas
- **[Implementation Plan](./docs/implementation-plan.md)**: Phased development roadmap
- **[GitHub Copilot Instructions](./.github/copilot-instructions.md)**: Development guidelines

## Contributing

Please follow the existing code style and ensure all tests pass before submitting changes.

1. Run linter: `npm run lint`
2. Run tests: `npm test`
3. Check coverage: `npm run test:coverage`
4. Build project: `npm run build`
