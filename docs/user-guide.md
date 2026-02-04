# Wallet PWA - User Guide

## Welcome to Wallet PWA

Wallet PWA is your personal finance manager that works offline-first, maintaining strict accounting principles while being easy to use.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Managing Accounts](#managing-accounts)
4. [Recording Transactions](#recording-transactions)
5. [Tracking Budgets](#tracking-budgets)
6. [Viewing Reports](#viewing-reports)
7. [Multi-Currency Support](#multi-currency-support)
8. [Offline Usage](#offline-usage)
9. [Data Synchronization](#data-synchronization)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Setup

1. **Open the App**: Navigate to the Wallet PWA in your web browser
2. **Install as App** (Optional): Click the install prompt to add Wallet to your home screen or desktop
3. **Start Fresh**: The app works immediately without any login or signup - all data is stored locally on your device

### Navigation

The app has 6 main sections accessible from the navigation menu:

- **Home**: Dashboard with quick overview
- **Accounts**: Manage your financial accounts
- **Transactions**: Record and view all transactions
- **Budgets**: Track spending and income categories
- **Reports**: View financial summaries and analysis
- **Settings**: Configure Firebase sync (optional)

---

## Core Concepts

### Double-Entry Accounting

Every transaction in Wallet PWA maintains balanced debits and credits. This ensures your financial data remains accurate and consistent.

**Example**: When you record an expense of $50:
- Your bank account is **credited** $50 (money going out)
- Your expense category is **debited** $50 (expense recorded)
- The sum is zero: -$50 + $50 = 0 ✓

### Account Types

- **Asset**: What you own (checking, savings, cash, investments)
- **Liability**: What you owe (credit cards, loans)
- **Equity**: Your net worth (opening balances, retained earnings)
- **Income**: Money coming in (salary, freelance, interest)
- **Expense**: Money going out (groceries, rent, utilities)

### Net Worth Formula

```
Assets - Liabilities = Equity (Net Worth)
```

---

## Managing Accounts

### Creating an Account

1. Navigate to the **Accounts** page
2. Click **+ New Account**
3. Fill in the details:
   - **Name**: Descriptive name (e.g., "Chase Checking")
   - **Type**: Select from asset, liability, equity, income, or expense
   - **Currency**: Choose your account's currency (e.g., USD, EUR, GBP)
   - **Description**: Optional notes about the account
4. Click **Create**

### Account Types Explained

**Assets** - Money you have:
- Checking Account
- Savings Account
- Cash Wallet
- Investment Portfolio

**Liabilities** - Money you owe:
- Credit Card
- Mortgage
- Student Loan
- Car Loan

**Income** - Money sources:
- Salary
- Freelance Work
- Investment Returns
- Gift Income

**Expense** - Spending categories:
- Groceries
- Rent/Mortgage
- Utilities
- Entertainment
- Transportation

### Editing and Deleting Accounts

- Click the **✏️ Edit** button on any account card
- Update the name or description (currency cannot be changed)
- Click **Update** to save

To delete an account:
- Click the **🗑️ Delete** button
- Confirm the deletion (this will remove all associated transactions)

---

## Recording Transactions

### Types of Transactions

#### 1. Expense Transaction

Records money spent from an account.

1. Go to **Transactions** page
2. Click **New Expense**
3. Fill in:
   - **From Account**: Which account is paying (e.g., checking account)
   - **To Account**: Which expense category (e.g., groceries)
   - **Amount**: How much was spent
   - **Date**: When the expense occurred
   - **Description**: What was purchased
4. Click **Create**

**Example**: Bought groceries for $75
- From: Chase Checking (asset)
- To: Groceries (expense)
- Amount: $75

#### 2. Income Transaction

Records money received into an account.

1. Click **New Income**
2. Fill in:
   - **From Account**: Income source (e.g., salary)
   - **To Account**: Receiving account (e.g., checking)
   - **Amount**: How much received
   - **Date**: When received
   - **Description**: Source description
3. Click **Create**

**Example**: Received salary of $3,000
- From: Salary (income)
- To: Chase Checking (asset)
- Amount: $3,000

#### 3. Transfer Transaction

Moves money between your accounts.

1. Click **New Transfer**
2. Fill in:
   - **From Account**: Source account
   - **To Account**: Destination account
   - **Amount**: Amount to transfer
   - **Date**: Transfer date
   - **Description**: Transfer reason
3. Click **Create**

**Example**: Transfer $500 from checking to savings
- From: Chase Checking (asset)
- To: High-Yield Savings (asset)
- Amount: $500

### Transaction List

- View all transactions in chronological order (newest first)
- Each entry shows:
  - Date
  - Description
  - Accounts involved
  - Amount

---

## Tracking Budgets

### Creating a Budget

1. Navigate to **Budgets** page
2. Click **+ New Budget**
3. Fill in:
   - **Name**: Budget category (e.g., "Monthly Groceries")
   - **Category**: Expense or Income
   - **Currency**: Budget currency
   - **Description**: Optional notes
4. Click **Create**

### Budget Categories

Budgets help you track spending and income in specific categories:

**Expense Budgets**:
- Food & Dining
- Transportation
- Entertainment
- Housing
- Healthcare

**Income Budgets**:
- Salary
- Side Business
- Investment Income

### Monitoring Budget Performance

Each budget card shows:
- Budget name and description
- Total amount spent/earned
- Number of transactions
- Currency

Budgets are grouped by category (Expense/Income) for easy viewing.

---

## Viewing Reports

### Available Reports

#### 1. Net Worth

Shows your overall financial position:
- **Total Assets**: Sum of all asset accounts
- **Total Liabilities**: Sum of all liabilities
- **Net Worth**: Assets - Liabilities

#### 2. Income vs Expenses

Compares your earnings and spending:
- **Total Income**: All income received
- **Total Expenses**: All money spent
- **Net**: Income - Expenses (positive is good!)

#### 3. Account Balances

Lists all accounts with current balances:
- Asset accounts (positive balances)
- Liability accounts (amounts owed)
- Grouped by account type

#### 4. Budget Summary

Shows performance of each budget:
- Total spent per budget
- Number of transactions
- Organized by category

---

## Multi-Currency Support

### Triple Truth System

Wallet PWA supports multiple currencies with three currency values:

1. **Display Currency**: What you see in the UI (configurable in settings)
2. **Account Currency**: Native currency of each account
3. **Budget Currency**: Your home currency for budgeting

### Working with Multiple Currencies

**Example Scenario**:
- You live in the US (budget currency: USD)
- You have a Euro savings account (account currency: EUR)
- You prefer viewing everything in USD (display currency: USD)

When you create a transaction:
- The app records it in the account's native currency (EUR)
- Exchange rates are frozen at transaction time
- Historical accuracy is preserved

### Creating Multi-Currency Accounts

Simply select the appropriate currency when creating each account:
- USD for US bank accounts
- EUR for European accounts
- GBP for UK accounts
- And 30+ other currencies

**Note**: Currency cannot be changed after account creation to maintain data integrity.

---

## Offline Usage

### How Offline-First Works

Wallet PWA stores **all your data locally** in your browser's IndexedDB:
- No internet required for day-to-day use
- All features work offline
- Changes sync automatically when online (if configured)

### Using the App Offline

1. **Install the PWA**: Add to home screen for best offline experience
2. **Use Normally**: Create accounts, record transactions, view reports
3. **Data Persistence**: All data is saved immediately to your device
4. **Go Online**: When internet returns, data syncs (if Firebase is configured)

### Offline Indicators

- **Green dot**: Connected to internet
- **Gray dot**: Offline mode (everything still works!)

---

## Data Synchronization

### BYOB (Bring Your Own Backend)

Wallet PWA uses a BYOB architecture - you control your data:
- Data stored locally by default
- **Optional** sync to your own Firebase/Firestore
- You own and control the backend
- No vendor lock-in

### Setting Up Firebase Sync

1. Create a Firebase project (free tier available)
2. Enable Firestore database
3. Get your Firebase configuration
4. Go to **Settings** page in Wallet PWA
5. Enter your Firebase credentials:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
6. Click **Save Configuration**
7. Click **Sync Now** to perform initial sync

### Conflict Resolution

If you edit data on multiple devices while offline:
- **Last-Write-Wins (LWW)** strategy is used
- Most recent change (by timestamp) wins
- Automatic resolution, no user intervention needed
- Device tracking helps trace changes

---

## Troubleshooting

### App Won't Load

**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Uninstall and reinstall PWA

### Transactions Don't Balance

**Problem**: "Transaction must balance (sum must equal 0)"

**Solution**:
- Double-check your amounts
- Ensure debit equals credit
- Use the provided transaction forms (they handle balancing automatically)

### Currency Field is Disabled

**Explanation**: Currency cannot be changed after account/budget creation to preserve data integrity.

**Solution**: Create a new account with the desired currency and transfer funds.

### Data Not Syncing

**Checklist**:
1. Verify internet connection
2. Check Firebase configuration in Settings
3. Ensure Firebase credentials are correct
4. Check browser console for errors
5. Click "Sync Now" manually

### Lost Data After Browser Clear

**Prevention**:
- Set up Firebase sync to back up your data
- Use the PWA installed version (more persistent storage)
- Export data regularly (future feature)

### Can't Install PWA

**Requirements**:
- Use a supported browser (Chrome, Edge, Safari 16.4+)
- Access via HTTPS (not HTTP)
- Look for install prompt in address bar or browser menu

---

## Tips & Best Practices

### 1. Regular Recording
- Record transactions as they happen
- Don't wait until end of month
- Small habit = accurate books

### 2. Descriptive Names
- Use clear account names: "Chase Visa Card" vs "Card 1"
- Add descriptions to transactions
- Future you will thank present you

### 3. Account Structure
- Create separate accounts for different purposes
- Example: "Checking", "Savings", "Emergency Fund"
- Use expense accounts for categories: "Groceries", "Gas", "Dining Out"

### 4. Budget Categories
- Align budgets with your spending categories
- Track high-value categories first
- Add more as you get comfortable

### 5. Multi-Device Usage
- Set up Firebase sync for seamless multi-device access
- Sync regularly to avoid conflicts
- Use one device at a time for data entry (when possible)

### 6. Backup Strategy
- Configure Firebase sync as backup
- Screenshot important reports
- Keep records of major transactions

### 7. Privacy & Security
- All data is local-first
- You control the backend (BYOB)
- No third-party access to your data
- Use secure Firebase rules (see documentation)

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate with Tab | Tab |
| Activate button | Enter or Space |
| Close modal | Escape |
| Submit form | Enter (when in form) |

---

## Getting Help

### Documentation
- [Implementation Plan](implementation/plan.md) - Technical details
- [Database Schema](implementation/database-schema.md) - Data structure
- [Development Guide](implementation/development.md) - Developer setup

### Support
- GitHub Issues: Report bugs or request features
- Discussions: Ask questions or share tips

---

## Appendix: Common Scenarios

### Scenario 1: First Month Setup

**Day 1**: Create accounts
- Checking account
- Savings account  
- Credit card
- Salary income account
- 3-5 expense accounts (Groceries, Rent, Utilities, Entertainment, Transportation)

**Day 2-30**: Record transactions as they occur

**Day 31**: Review reports, adjust budgets

### Scenario 2: Splitting Rent with Roommates

**Option A**: Track your share only
- Record your portion as expense

**Option B**: Track full amount
- Record full rent payment
- Record roommate reimbursements as income

### Scenario 3: Credit Card Payments

**When you make a purchase**:
- From: Credit Card (liability)
- To: Groceries (expense)
- Amount: $50

**When you pay the bill**:
- From: Checking (asset)
- To: Credit Card (liability)
- Amount: $500

### Scenario 4: International Travel

**Before trip**:
- Create asset account: "Travel Cash EUR"
- Record currency exchange as transfer

**During trip**:
- Record expenses from "Travel Cash EUR"
- All recorded in EUR (native currency)

**After trip**:
- Exchange remaining EUR back
- Record as transfer

---

**Version**: 1.0  
**Last Updated**: February 2026  
**App Version**: 0.1.0

---

*This user guide is part of the Wallet PWA project - a local-first, offline-capable personal finance manager with strict double-entry accounting.*
