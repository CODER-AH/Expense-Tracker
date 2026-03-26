# Firebase Security Rules Setup

## Required Firestore Security Rules

To enable the login system and user authentication, you need to update your Firestore security rules in the Firebase Console.

### How to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the existing rules with the rules below
5. Click **Publish**

### Security Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Expenses collection - anyone can read/write
    match /expenses/{document=**} {
      allow read, write: if true;
    }

    // Archived expenses collection - anyone can read/write
    match /archivedExpenses/{document=**} {
      allow read, write: if true;
    }

    // Notes collection - anyone can read/write
    match /notes/{document=**} {
      allow read, write: if true;
    }

    // Budget collection - anyone can read/write
    match /budget/{document=**} {
      allow read, write: if true;
    }

    // Trip days collection - anyone can read/write
    match /tripDays/{document=**} {
      allow read, write: if true;
    }

    // Users collection - for authentication
    // Anyone can read to check if user exists
    // Anyone can create/update their own user document (for password setup)
    match /users/{username} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if false;  // Prevent deletion
    }
  }
}
```

### Security Notes

**Current Setup**: Open access for all collections
- This is suitable for a private trip expense tracker with a small group
- All users can read/write all data (shared expense tracking)
- Passwords are hashed (SHA-256) before storage

**For Production**: If you want more security, you could:
1. Add Firebase Authentication and require users to be signed in
2. Restrict writes to authenticated users only
3. Add field-level validation
4. Implement role-based access control

### Example: More Restrictive Rules (Optional)

If you want to require Firebase Authentication in the future:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }

    // All collections require authentication
    match /{document=**} {
      allow read, write: if isSignedIn();
    }

    // Users can only read their own user document
    match /users/{username} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.token.name == username;
    }
  }
}
```

### Testing the Rules

After publishing the rules:
1. Open your app
2. Try to login with a name
3. If it's your first time, you should be able to set a password
4. The password will be stored in the `users` collection
5. Next time you login, your password will be verified

### Troubleshooting

**"Missing or insufficient permissions" error**:
- Make sure you published the rules in Firebase Console
- Wait 1-2 minutes for rules to propagate
- Clear browser cache and reload the app
- Check the Rules tab shows your updated rules

**Rules not updating**:
- Make sure you clicked "Publish" not just "Save"
- Check for syntax errors in the rules editor
- Try using the Firebase Console's "Rules Playground" to test
