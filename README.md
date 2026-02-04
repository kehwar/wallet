# Wallet PWA

A Local-First Progressive Web Application for personal finance management with offline-first architecture and strict double-entry accounting.

## 🚀 Overview

This wallet application implements a comprehensive personal finance system that:
- **Works Offline**: All data stored locally in IndexedDB, fully functional without internet
- **Maintains Accounting Integrity**: Strict double-entry bookkeeping with balanced debits and credits
- **Handles Multiple Currencies**: Triple truth system (Display, Account, Budget) with frozen exchange rates
- **Syncs Optionally**: BYOB (Bring Your Own Backend) - sync to your own Firestore instance when needed
- **Resolves Conflicts Automatically**: Last-Write-Wins (LWW) strategy for seamless multi-device usage

## ✨ Key Features

### Local-First Architecture
- All data stored in browser's IndexedDB for instant access
- Full functionality offline - no internet required for day-to-day use
- Optional synchronization to user's personal Firestore instance

### Double-Entry Accounting
- Every transaction maintains balanced debits and credits
- Preserves the accounting equation: `Assets = Liabilities + Equity`
- Editable entries with direct corrections or reversing entries

### Multi-Currency Support
- **Display Currency**: What you see in the UI (configurable)
- **Account Currency**: Native currency of each account
- **Budget Currency**: Your home currency for budgeting
- Exchange rates frozen at transaction time for historical accuracy

### Offline Sync Strategy
- Last-Write-Wins (LWW) conflict resolution
- Atomic sync for transaction groups (all ledger entries together)
- Uses `_lww_timestamp`, `_device_id`, `_version` for conflict detection

## 🛠️ Technology Stack

- **Framework**: Nuxt 4.3 with PWA support
- **UI Components**: shadcn-vue
- **Storage**: IndexedDB (via Dexie.js)
- **Sync**: Firebase JS SDK (optional, user-configured)
- **Math**: decimal.js (avoids floating point errors)

## 📁 Project Structure

```
wallet/
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot instructions
├── docs/
│   ├── database-schema.md       # Complete data models and schemas
│   └── implementation-plan.md   # Phased development roadmap
└── README.md                     # This file
```

## 📖 Documentation

- **[GitHub Copilot Instructions](.github/copilot-instructions.md)** - Essential project overview and development guidelines
- **[Database Schema](docs/database-schema.md)** - Complete data models, IndexedDB and Firestore schemas
- **[Implementation Plan](docs/implementation-plan.md)** - Phased development roadmap and technical details

## 🎯 Core Principles

1. **Local-First**: App must work fully offline with optional sync
2. **Double-Entry**: All transactions balanced, maintaining accounting integrity
3. **Denormalized Ledger**: Self-contained entries for efficient offline queries
4. **UUID-Based**: Conflict-free ID generation for distributed systems
5. **Frozen Exchange Rates**: Historical accuracy without data corruption

## 🔧 Development Status

**Phase 1 Complete: Core Data Layer** ✅
**Phase 2 Complete: Accounting Engine** ✅
**Phase 3 Complete: PWA Foundation** ✅
**Phase 4 Complete: Sync Implementation** ✅
**Phase 5 Complete: User Interface** ✅
**Phase 6 In Progress: Testing & Optimization** ⚙️

### Phase 1: Core Data Layer
The core data layer has been implemented with:
- ✅ Nuxt 4.3 project setup with TypeScript
- ✅ ESLint and Vitest configuration
- ✅ Database schema with Dexie.js
- ✅ CRUD operations for all entities
- ✅ Double-entry validation
- ✅ Unit tests with >90% coverage

### Phase 2: Accounting Engine
The accounting engine has been implemented with:
- ✅ High-level transaction API (income, expense, transfer, multi-split)
- ✅ Balance calculation engine (point-in-time, history, net worth)
- ✅ Multi-currency conversion and formatting
- ✅ Currency utilities (34 currencies including PEN, parsing, formatting)
- ✅ 91 total tests with 96% coverage

### Phase 3: PWA Foundation
The PWA capabilities have been implemented with:
- ✅ Service worker with Workbox (auto-update, offline caching)
- ✅ PWA manifest (installable app)
- ✅ Network status detection (online/offline indicators)
- ✅ Update notifications and install prompts
- ✅ App icons and visual assets
- ✅ Production build with 401 KB gzipped bundle

### Phase 4: Sync Implementation
The synchronization engine has been implemented with:
- ✅ Firebase SDK integration (BYOB - Bring Your Own Backend)
- ✅ Last-Write-Wins conflict resolution
- ✅ Bidirectional sync (upload and download)
- ✅ Device tracking with persistent device IDs
- ✅ Sync status UI with real-time indicators
- ✅ Firebase configuration page
- ✅ Firestore security rules documentation
- ✅ 106 total tests with all passing

### Phase 6: Testing & Optimization
The testing and optimization phase is underway:
- ✅ Playwright E2E testing infrastructure
- ✅ Automated accessibility testing (WCAG 2.1 AA)
- ✅ Performance benchmarking tests
- ✅ CI/CD integration for E2E tests
- ✅ Security audit and vulnerability fixes
- ⚙️ Additional E2E test scenarios
- ⏳ Performance optimization
- ⏳ Documentation updates

See [DEVELOPMENT.md](DEVELOPMENT.md) for development guide, [PHASE1_SUMMARY.md](PHASE1_SUMMARY.md) for Phase 1 details, [PHASE2_SUMMARY.md](PHASE2_SUMMARY.md) for Phase 2 details, [PHASE3_SUMMARY.md](PHASE3_SUMMARY.md) for Phase 3 details, [PHASE4_SUMMARY.md](PHASE4_SUMMARY.md) for Phase 4 details, [PHASE5_SUMMARY.md](PHASE5_SUMMARY.md) for Phase 5 details, [PHASE6_SUMMARY.md](PHASE6_SUMMARY.md) for Phase 6 details, and [Implementation Plan](docs/implementation-plan.md) for the complete roadmap.

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]