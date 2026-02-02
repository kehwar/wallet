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

The core data layer has been implemented with:
- ✅ Nuxt 4.3 project setup with TypeScript
- ✅ ESLint and Vitest configuration
- ✅ Database schema with Dexie.js
- ✅ CRUD operations for all entities
- ✅ Double-entry validation
- ✅ Unit tests with >90% coverage

See [DEVELOPMENT.md](DEVELOPMENT.md) for development guide and [Implementation Plan](docs/implementation-plan.md) for the complete roadmap.

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]