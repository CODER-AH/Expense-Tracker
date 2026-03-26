# Firebase Security Rules Update Required

## Issue
Getting "Missing or insufficient permissions" errors when trying to access the `notes` collection.

## Solution
Update your Firestore security rules to include the `notes` collection.

## Steps

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Update the rules to include the notes collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Expenses collection
    match /expenses/{document=**} {
      allow read, write: if true;
    }

    // Trip days collection
    match /tripDays/{document=**} {
      allow read, write: if true;
    }

    // Budget collection
    match /budget/{document=**} {
      allow read, write: if true;
    }

    // Notes collection (ADD THIS)
    match /notes/{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish** to deploy the new rules

## Note
These rules allow unrestricted read/write access. For production apps, you should add proper authentication and authorization rules. Since this is a personal/team expense tracker, the simple rules above are sufficient.

## After Updating Rules
- Refresh your web app
- Notes should now load and save without permission errors
