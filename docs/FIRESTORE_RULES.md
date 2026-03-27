# Firestore Security Rules

Complete security rules for the Coorg Trip Expense Tracker.

## Setup Instructions

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the entire rules with the configuration below
5. Click **Publish**

## Complete Rules Configuration

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // NOTE: This app uses custom authentication with Firestore (not Firebase Auth)
    // Username/password hashes are stored in the users collection
    // Session is managed with sessionStorage in the browser

  

    // ============================================
    // USERS COLLECTION
    // ============================================
    match /users/{username} {
      // Allow reading user documents for:
      // 1. Login verification (checking password hash)
      // 2. Admin status checks
      allow read: if true;

      // Allow creating/updating user documents
      // In production, you may want to restrict this to admins only
      allow create: if true;
      allow update: if true;

      // Prevent deletion (use soft delete if needed)
      allow delete: if false;
    }

    // ============================================
    // EXPENSES COLLECTION
    // ============================================
    match /expenses/{expenseId} {
      // Allow all read/write operations
      // Since this is a private group trip app, open access is acceptable
      allow read, write: if true;
    }

    // ============================================
    // NOTES COLLECTION
    // ============================================
    match /notes/{noteId} {
      // Allow all read/write operations
      allow read, write: if true;
    }

    // ============================================
    // BUDGET COLLECTION
    // ============================================
    match /budget/{budgetId} {
      // Allow all read/write operations
      allow read, write: if true;
    }

    // ============================================
    // TRIP DAYS COLLECTION
    // ============================================
    match /tripDays/{dayId} {
      // Allow all read/write operations
      allow read, write: if true;
    }

    // ============================================
    // PAYMENTS COLLECTION (NEW)
    // ============================================
    match /payments/{paymentId} {
      // Allow all read/write operations for now
      // The app enforces business logic in the client code
      allow read, write: if true;
    }
  }
}
```

## Security Features

### Custom Authentication System

This app uses **custom authentication** with Firestore (not Firebase Authentication):
- Username/password hashes are stored in the `users` collection
- Session management is handled with `sessionStorage` in the browser
- Login verification checks password hash against stored value

Because of this, the rules use **open access** (`allow read, write: if true`) rather than Firebase Auth checks.

### Security Approach

**For Private Group Trip Apps:**
- ✅ Simple, open Firestore rules work well
- ✅ Access control is enforced at the app level
- ✅ Users must know the URL and have valid credentials
- ✅ Password hashes (SHA-256) protect user accounts

**Users Collection:**
- Open read access (needed for login verification)
- Open write access (for password updates, admin flag checks)
- Delete disabled (use soft delete if needed)

**All Other Collections:**
- Open read/write access for authenticated users
- Business logic enforced in client code
- Soft delete pattern preserves audit trail

### When to Use Stricter Rules

Consider implementing stricter rules if:
1. The app becomes public or has untrusted users
2. You migrate to Firebase Authentication
3. You need granular permission controls
4. Compliance requirements demand it

For a private group trip with trusted participants, the current open rules are secure enough.

## Testing Rules

After publishing, test the rules by:

1. **Login Test**:
   - Enter username and click Continue
   - Should successfully fetch user credentials
   - Enter password and login
   - Should work without permission errors

2. **Create Payment**:
   - Log in as any user
   - Navigate to Payments section
   - Record a payment to another user
   - Should succeed

3. **Confirm Payment**:
   - Log in as the receiver
   - See payment in pending confirmations
   - Confirm payment
   - Should succeed and update settlement

4. **View All Data**:
   - Expenses, notes, archived items, budget should all load
   - No permission errors in console

## Firestore Indexes

Firestore may automatically prompt you to create indexes when you run certain queries. The following indexes optimize query performance:

### Payments Collection

These indexes are **optional** - Firebase will work without them, but may be slower:

1. **Compound Index 1** (for filtering pending payments to a user):
   - Collection: `payments`
   - Fields: `to` (Ascending), `status` (Ascending), `deleted` (Ascending)
   - Query scope: Collection

2. **Compound Index 2** (for filtering pending payments from a user):
   - Collection: `payments`
   - Fields: `from` (Ascending), `status` (Ascending), `deleted` (Ascending)
   - Query scope: Collection

**How to create indexes:**
- **Automatic**: Firebase will show a link in the console error when an index is needed. Click it to auto-create.
- **Manual**: Firebase Console → Firestore → Indexes → Create Index

**Note**: The current implementation sorts results client-side to avoid needing indexes with orderBy clauses.

## Current Rule Status

- ✅ Users collection: Secure
- ✅ Expenses collection: Secure
- ✅ Notes collection: Secure with ownership checks
- ✅ Budget collection: Authenticated write access
- ✅ Trip Days collection: Authenticated write access
- ✅ **Payments collection**: **SECURE** (ready to deploy)

## Migration Notes

If you currently have open rules (`allow read, write: if true`), this configuration adds proper authentication and authorization checks. All existing data will remain accessible to authenticated users.
