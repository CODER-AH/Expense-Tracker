# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Project name: **"Coorg Trip Expense Tracker"** (or your choice)
4. Disable Google Analytics (optional for this project)
5. Click **Create project**

## 2. Add Web App to Firebase

1. In Firebase Console, click the **Web icon** (</>)
2. App nickname: **"Expense Tracker Web"**
3. **Enable Firebase Hosting** (optional)
4. Click **Register app**
5. Copy the Firebase configuration object (you'll need this)

It looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
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
