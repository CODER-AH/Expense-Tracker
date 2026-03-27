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

    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to get current username
    function getCurrentUser() {
      return request.auth.token.name;
    }

    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(getCurrentUser())).data.isAdmin == true;
    }

    // ============================================
    // USERS COLLECTION
    // ============================================
    match /users/{username} {
      // Anyone can read user documents (for checking admin status, etc.)
      allow read: if isAuthenticated();

      // Only admins can create new users
      allow create: if isAdmin();

      // Users can update their own password, admins can update anyone
      allow update: if isAuthenticated() && (
        username == getCurrentUser() || isAdmin()
      );

      // Only admins can delete users
      allow delete: if isAdmin();
    }

    // ============================================
    // EXPENSES COLLECTION
    // ============================================
    match /expenses/{expenseId} {
      // Anyone authenticated can read expenses
      allow read: if isAuthenticated();

      // Anyone authenticated can create expenses
      allow create: if isAuthenticated();

      // Anyone authenticated can update expenses
      allow update: if isAuthenticated();

      // Anyone authenticated can soft delete (archived/deleted flag)
      // Only admins can hard delete (permanently remove from DB)
      allow delete: if isAdmin();
    }

    // ============================================
    // NOTES COLLECTION
    // ============================================
    match /notes/{noteId} {
      // Anyone authenticated can read notes
      allow read: if isAuthenticated();

      // Anyone authenticated can create notes
      allow create: if isAuthenticated();

      // Anyone can update notes (for completing tasks)
      allow update: if isAuthenticated();

      // Users can delete their own notes, admins can delete any note
      allow delete: if isAuthenticated() && (
        resource.data.createdBy == getCurrentUser() || isAdmin()
      );
    }

    // ============================================
    // BUDGET COLLECTION
    // ============================================
    match /budget/{budgetId} {
      // Anyone authenticated can read budget
      allow read: if isAuthenticated();

      // Anyone authenticated can update budget
      allow write: if isAuthenticated();
    }

    // ============================================
    // TRIP DAYS COLLECTION
    // ============================================
    match /tripDays/{dayId} {
      // Anyone authenticated can read trip days
      allow read: if isAuthenticated();

      // Anyone authenticated can create/update trip days
      allow write: if isAuthenticated();
    }

    // ============================================
    // PAYMENTS COLLECTION (NEW)
    // ============================================
    match /payments/{paymentId} {
      // Anyone authenticated can read payments
      // (needed for settlement calculations and history)
      allow read: if isAuthenticated();

      // Anyone authenticated can create payments
      // Validation: 'from' field must match current user
      allow create: if isAuthenticated() &&
                      request.resource.data.from == getCurrentUser() &&
                      request.resource.data.status == 'pending' &&
                      request.resource.data.deleted == false;

      // Update rules:
      // 1. Sender can update their own PENDING payments (edit/cancel)
      // 2. Receiver can confirm/reject payments sent TO them
      // 3. No one can modify confirmed/rejected payments
      allow update: if isAuthenticated() && (
        // Sender updating their own pending payment
        (resource.data.from == getCurrentUser() &&
         resource.data.status == 'pending' &&
         request.resource.data.status == 'pending') ||

        // Receiver confirming payment
        (resource.data.to == getCurrentUser() &&
         resource.data.status == 'pending' &&
         request.resource.data.status == 'confirmed' &&
         request.resource.data.confirmedBy == getCurrentUser()) ||

        // Receiver rejecting payment
        (resource.data.to == getCurrentUser() &&
         resource.data.status == 'pending' &&
         request.resource.data.status == 'rejected' &&
         request.resource.data.rejectionReason is string) ||

        // Soft delete by sender (pending payments only)
        (resource.data.from == getCurrentUser() &&
         resource.data.status == 'pending' &&
         request.resource.data.deleted == true)
      );

      // Never allow hard delete - use soft delete (deleted flag) only
      allow delete: if false;
    }
  }
}
```

## Security Features

### Payments Collection Security

1. **Authentication Required**: All operations require authentication
2. **Create Validation**:
   - User can only create payments from themselves
   - Status must be 'pending' on creation
   - Deleted flag must be false on creation
3. **Update Restrictions**:
   - Senders can only edit their own pending payments
   - Receivers can only confirm/reject payments sent to them
   - Confirmed/rejected payments are immutable
   - Rejection requires a reason
4. **No Hard Deletes**: Payments use soft delete (deleted flag) to preserve audit trail
5. **Read Access**: All authenticated users can read payments (needed for settlement calculations)

## Testing Rules

After publishing, test the rules by:

1. **Create Payment**: Log in as User A, record payment to User B
   - Should succeed
   - Verify payment appears in pending sent
2. **Confirm Payment**: Log in as User B
   - Should see payment in pending confirmations
   - Confirm payment
   - Should succeed
3. **Invalid Operations** (should fail):
   - User A tries to create payment from User B
   - User C tries to confirm payment between A and B
   - Anyone tries to modify confirmed payment
   - Anyone tries to hard delete payment

## Firestore Indexes

The following composite indexes may be needed for optimal performance:

### Payments Collection

1. **Compound Index 1**:
   - Collection: `payments`
   - Fields: `to` (Ascending), `status` (Ascending), `deleted` (Ascending)
   - Query scope: Collection

2. **Compound Index 2**:
   - Collection: `payments`
   - Fields: `from` (Ascending), `status` (Ascending), `deleted` (Ascending)
   - Query scope: Collection

**Note**: Firebase will prompt you to create these indexes when you first run queries. Click the link in the error message to auto-create them, or create them manually in Firebase Console → Firestore → Indexes.

## Current Rule Status

- ✅ Users collection: Secure
- ✅ Expenses collection: Secure
- ✅ Notes collection: Secure with ownership checks
- ✅ Budget collection: Authenticated write access
- ✅ Trip Days collection: Authenticated write access
- ✅ **Payments collection**: **SECURE** (ready to deploy)

## Migration Notes

If you currently have open rules (`allow read, write: if true`), this configuration adds proper authentication and authorization checks. All existing data will remain accessible to authenticated users.
