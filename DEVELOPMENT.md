# Wallet PWA - Development Guide

This guide provides information about the project structure and how to work with the codebase.

## Project Structure

```
wallet/
├── composables/          # Vue composables for data access
│   ├── useDatabase.ts    # Dexie database initialization
│   ├── useAccounts.ts    # Account CRUD operations
│   ├── useBudgets.ts     # Budget CRUD operations
│   ├── useLedger.ts      # Ledger entry CRUD operations
│   └── useExchangeRates.ts # Exchange rate management
├── types/                # TypeScript type definitions
│   └── models.ts         # Core data models
├── utils/                # Utility functions
│   └── validation.ts     # Validation helpers
├── tests/                # Unit tests
│   ├── setup.ts          # Test environment setup
│   ├── validation.test.ts
│   ├── ledger.test.ts
│   ├── accounts.test.ts
│   └── budgets.test.ts
├── pages/                # Nuxt pages
│   └── index.vue
├── docs/                 # Documentation
│   ├── database-schema.md
│   └── implementation-plan.md
└── app.vue              # Root component

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

Current test coverage: **91.16% statements, 87.17% functions** (exceeds 80% requirement)

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

## Next Steps

See [implementation-plan.md](./docs/implementation-plan.md) for:
- **Phase 2**: Accounting Engine (transaction creation, balance calculation, multi-currency)
- **Phase 3**: PWA Foundation (service worker, offline capabilities)
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
