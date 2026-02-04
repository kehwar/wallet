# Firestore Security Rules

This document provides example security rules for users who want to sync their Wallet PWA data to their own Firestore instance (BYOB - Bring Your Own Backend).

## Overview

Firestore security rules control who can read and write data in your database. Since this is a personal finance app with sensitive data, it's critical to secure your Firestore instance properly.

## Basic Rules (Single User)

If you're the only user and want simple protection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // All collections - allow read/write only for authenticated users
    match /{collection}/{document} {
      allow read, write: if isSignedIn();
    }
  }
}
```

## Recommended Rules (User-Specific Data)

For better security, ensure users can only access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the data
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Ledger entries - user-specific
    match /ledger_entries/{entryId} {
      allow read, write: if isSignedIn() && isOwner(resource.data.user_id);
    }
    
    // Accounts - user-specific
    match /accounts/{accountId} {
      allow read, write: if isSignedIn() && isOwner(resource.data.user_id);
    }
    
    // Budgets - user-specific
    match /budgets/{budgetId} {
      allow read, write: if isSignedIn() && isOwner(resource.data.user_id);
    }
    
    // Exchange rates - user-specific
    match /exchange_rates/{rateId} {
      allow read, write: if isSignedIn() && isOwner(resource.data.user_id);
    }
    
    // Recurring rules - user-specific
    match /recurring_rules/{ruleId} {
      allow read, write: if isSignedIn() && isOwner(resource.data.user_id);
    }
  }
}
```

**Note**: To use user-specific rules, you need to add a `user_id` field to all documents when syncing. This is not currently implemented in the base sync engine.

## Advanced Rules (Data Validation)

Add validation to ensure data integrity:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Ledger entries with validation
    match /ledger_entries/{entryId} {
      allow read: if isSignedIn();
      
      allow create, update: if isSignedIn()
        && request.resource.data.keys().hasAll([
          'id', 'transaction_id', 'date', 'description',
          'currency_display', 'amount_display',
          'account_id', 'amount_account',
          'created_at', 'updated_at'
        ])
        && request.resource.data.amount_display is number
        && request.resource.data.amount_account is number
        && request.resource.data.currency_display is string
        && request.resource.data.currency_display.size() == 3;
      
      allow delete: if isSignedIn();
    }
    
    // Accounts with validation
    match /accounts/{accountId} {
      allow read: if isSignedIn();
      
      allow create, update: if isSignedIn()
        && request.resource.data.keys().hasAll([
          'id', 'name', 'type', 'currency', 'updated_at'
        ])
        && request.resource.data.type in [
          'asset', 'liability', 'income', 'expense', 'equity'
        ]
        && request.resource.data.currency is string
        && request.resource.data.currency.size() == 3;
      
      allow delete: if isSignedIn();
    }
    
    // Budgets with validation
    match /budgets/{budgetId} {
      allow read: if isSignedIn();
      
      allow create, update: if isSignedIn()
        && request.resource.data.keys().hasAll([
          'id', 'name', 'currency', 'updated_at'
        ])
        && request.resource.data.currency is string
        && request.resource.data.currency.size() == 3;
      
      allow delete: if isSignedIn();
    }
    
    // Exchange rates
    match /exchange_rates/{rateId} {
      allow read, write: if isSignedIn();
    }
    
    // Recurring rules
    match /recurring_rules/{ruleId} {
      allow read, write: if isSignedIn();
    }
  }
}
```

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable Firestore Database

### 2. Configure Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click on **Rules** tab
3. Paste your chosen security rules
4. Click **Publish**

### 3. Enable Authentication (Recommended)

For user-specific rules, enable Firebase Authentication:

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Choose a sign-in method (Email/Password recommended)
4. Enable it

### 4. Get Your Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **</>** (Web) icon
4. Copy your Firebase configuration:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

5. Enter this configuration in the Wallet PWA settings

## Testing Your Rules

### Using Firebase Console

1. Go to **Firestore Database** > **Rules**
2. Click **Rules Playground**
3. Test read/write operations with different auth states

### Using Firestore Emulator

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize emulators
firebase init emulators

# Start emulator
firebase emulators:start
```

## Security Best Practices

1. **Never allow public read/write access** - Always require authentication
2. **Use user-specific rules** - Ensure users can only access their own data
3. **Validate data types** - Check that fields have correct types
4. **Validate required fields** - Ensure critical fields are present
5. **Limit document size** - Add size limits to prevent abuse
6. **Use indexes** - Create indexes for frequently queried fields
7. **Monitor usage** - Set up alerts for unusual activity
8. **Regular audits** - Review security rules periodically

## Common Issues

### "Missing or insufficient permissions"

- Check that you're authenticated
- Verify your security rules allow the operation
- Ensure the document path matches your rules

### "PERMISSION_DENIED"

- Your security rules rejected the request
- Check the Rules Playground to debug
- Verify authentication state

### "Resource already exists"

- Trying to create a document that already exists
- Use `set()` instead of `add()` for updates
- Check for duplicate IDs

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Reference](https://firebase.google.com/docs/rules/rules-language)
- [Common Patterns](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Testing Rules](https://firebase.google.com/docs/rules/unit-tests)

## Support

For issues with Firestore setup:
1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Visit [Firebase Support](https://firebase.google.com/support)
3. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase) with the `firebase` tag
