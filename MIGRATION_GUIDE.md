# Migration Guide: Google Sheets → Firebase Firestore

## Overview

This migration adds Firebase Firestore as the primary database with Google Sheets as backup.

**Benefits:**
- ⚡ 10-100x faster (< 100ms vs 1-3 seconds)
- 🔄 Real-time sync across all users
- 📱 Offline support
- 💰 Free for your usage
- 📊 Sheets kept as backup

## Migration Steps

### 1. Complete Firebase Setup

Follow `FIREBASE_SETUP.md` to:
- Create Firebase project
- Get Firebase config
- Enable Firestore
- Set security rules

### 2. Update Firebase Config

Open `webapp/firebase-service.js` and replace the config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // Replace with your actual values
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Migrate Existing Data (Optional)

You have two options:

#### Option A: Start Fresh
- Just deploy and start using Firebase
- Old data stays in Sheets (read-only)

#### Option B: Migrate Existing Data
Run this script in browser console on the app:

```javascript
// This will copy all expenses from Sheets to Firestore
async function migrateToFirestore() {
  console.log('Starting migration...');

  // Get all expenses from Sheets
  const sheetData = await fetch(SCRIPT_URL + '?action=getAll').then(r => r.json());

  // Initialize Firebase if not done
  initializeFirebase();

  let count = 0;
  for (const expense of sheetData) {
    try {
      await firestoreAddExpense({
        day: expense.day,
        cat: expense.cat,
        desc: expense.desc,
        amount: expense.amount,
        paidBy: expense.paidBy,
        name: expense.name,
        ts: expense.ts,
        edited: expense.edited || '',
        archived: expense.archived || false
      });
      count++;
      console.log(`Migrated ${count}/${sheetData.length}`);
    } catch (e) {
      console.error('Failed to migrate:', expense, e);
    }
  }

  console.log(`Migration complete! Migrated ${count} expenses.`);
}

// Run migration
migrateToFirestore();
```

### 4. Deploy

```bash
git add .
git commit -m "Add Firebase Firestore for better performance"
git push origin main
```

### 5. Set Up Sheets Backup (Optional)

Create a Cloud Function to backup Firestore → Sheets daily:

1. Go to Firebase Console → Functions
2. Deploy the backup function (see `SHEETS_BACKUP_FUNCTION.md`)
3. Schedule it to run daily/hourly

## Testing

1. Open the app
2. Check browser console for "Firebase initialized"
3. Add an expense - should be instant
4. Open in another device/browser - should sync in real-time
5. Go offline - should still work
6. Come back online - should sync

## Rollback Plan

If something goes wrong:

1. In `app.js`, change `USE_FIREBASE` to `false`
2. It will fall back to Google Sheets
3. No data loss - everything is dual-written

## Performance Comparison

| Operation | Google Sheets | Firebase |
|-----------|---------------|----------|
| Add Expense | 1-3 seconds | 50-100ms |
| Load All | 2-5 seconds | 100-200ms |
| Update | 1-2 seconds | 50-100ms |
| Real-time | ❌ No | ✅ Yes |
| Offline | ❌ No | ✅ Yes |

## Cost

**Firebase Free Tier:**
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage

**Your estimated usage:**
- ~100 writes/day (10 users, 10 expenses each)
- ~500 reads/day
- < 1 MB storage

**Verdict:** Completely free for your use case!

## Need Help?

Check Firebase Console → Firestore → Data tab to see your data.
Check browser console for any errors.
