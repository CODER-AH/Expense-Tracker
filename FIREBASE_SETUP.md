# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Project name: **"Coorg Trip Expense Tracker"** (or your choice)
4. **Enable Google Analytics** (recommended)
   - This gives you insights on app usage, performance, and user behavior
5. Select or create a Google Analytics account
6. Click **Create project**

## 2. Add Web App to Firebase

1. In Firebase Console, click the **Web icon** (</>)
2. App nickname: **"Expense Tracker Web"**
3. **Check "Also set up Firebase Hosting"** (optional, for easy deployment)
4. **Check "Also set up Google Analytics for this app"** ✅
5. Click **Register app**
6. Copy the Firebase configuration object (you'll need this)

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1WLpghE_WWEW_XX8QzN46qHeS2duBdVc",
  authDomain: "trip-expense-tracker-d04fe.firebaseapp.com",
  projectId: "trip-expense-tracker-d04fe",
  storageBucket: "trip-expense-tracker-d04fe.firebasestorage.app",
  messagingSenderId: "321319814690",
  appId: "1:321319814690:web:2301031119c354d6bfec7b",
  measurementId: "G-RMRGTVVTHZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

It looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"  // This is for Analytics
};
```

## 3. Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Start in **production mode**
4. Choose location closest to you (e.g., asia-south1 for India)
5. Click **Enable**

## 4. Set Firestore Security Rules

Go to **Firestore Database** → **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read/write expenses (for now)
    // In production, add proper authentication
    match /expenses/{document=**} {
      allow read, write: true;
    }

    match /tripDays/{document=**} {
      allow read, write: true;
    }

    match /budget/{document=**} {
      allow read, write: true;
    }
  }
}
```

Click **Publish**

## 5. Get Your Firebase Config

After completing the above steps, copy your Firebase config and save it. You'll need:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

## Next Steps

Once you have your Firebase config, we'll:
1. Add Firebase SDK to your web app
2. Update the code to use Firestore
3. Set up Sheets backup sync

---

**Ready?** Once you have your Firebase config, share it with me (or let me know you're ready to proceed).
