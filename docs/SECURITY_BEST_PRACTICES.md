# Security Best Practices

## Understanding API Key Security

### ✅ Firebase API Keys (Safe to Expose)

**Firebase API keys are NOT secret!** They can be safely committed to public repositories.

**Why?**
- Firebase API keys only **identify** your project
- They don't grant access to data
- Access is controlled by **Firebase Security Rules**
- Authentication determines what users can do

**Example Security Rules** (Firestore):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{document=**} {
      // Allow read/write to all (adjust based on your needs)
      allow read, write: if true;

      // OR: Only allow authenticated users
      // allow read, write: if request.auth != null;

      // OR: More granular rules
      // allow read: if true;
      // allow create: if request.auth != null;
      // allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### ⚠️ Google Apps Script URLs (Semi-Sensitive)

**Problem:** Anyone with the URL can call your script

**Solutions:**

#### Option 1: Restrict Access in Deployment
1. Go to Apps Script → Deploy → Manage deployments
2. Edit deployment
3. "Who has access" → Choose:
   - "Only myself" (most secure, but only you can use the app)
   - "Anyone with Google account"
   - "Anyone" (current setting)

#### Option 2: Add Authentication in Apps Script
```javascript
function doGet(e) {
  // Check for a secret token
  const validToken = "YOUR_SECRET_TOKEN";
  if (e.parameter.token !== validToken) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Unauthorized" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Your existing code...
}
```

Then update your app to send the token with each request.

#### Option 3: Use Firebase Only (Recommended)
```javascript
// In webapp/config.js
database: {
  useFirebase: true,
  enableSheetsBackup: false  // Disable Sheets backup
}
```

This eliminates the Sheets URL exposure entirely!

## Deployment Options

### Option 1: Public Repo + Firebase Only ⭐ **Recommended**

```javascript
// config.js - Safe to commit
{
  firebase: { /* ... Firebase config ... */ },  // ✅ Safe
  googleSheets: { scriptUrl: "" },              // ✅ Empty/unused
  database: {
    useFirebase: true,
    enableSheetsBackup: false  // ✅ Disabled
  }
}
```

**Pros:**
- ✅ No sensitive data exposed
- ✅ Simple deployment
- ✅ Fast performance (Firebase only)

**Cons:**
- ❌ No backup to Sheets

### Option 2: Public Repo + Restricted Sheets Access

```javascript
// config.js - Can commit
{
  firebase: { /* ... */ },                      // ✅ Safe
  googleSheets: { scriptUrl: "YOUR_URL" },     // ⚠️ Semi-public
  database: {
    useFirebase: true,
    enableSheetsBackup: true
  }
}
```

Then restrict Apps Script access to "Only myself" or add token authentication.

**Pros:**
- ✅ Backup to Sheets maintained
- ⚠️ Limited exposure with restrictions

**Cons:**
- ⚠️ URL still visible in repo
- ⚠️ Requires extra setup (restrictions/auth)

### Option 3: Private Repo

Keep repo private on GitHub, then you can commit anything.

**Pros:**
- ✅ Full security
- ✅ No restrictions needed

**Cons:**
- ❌ Repo not public
- ❌ Limits collaboration

## Current Recommendation

For your public GitHub Pages deployment:

### Use Firebase Only (No Sheets Backup)

1. **Update config.js:**
```javascript
database: {
  useFirebase: true,
  enableSheetsBackup: false  // Disable backup
}
```

2. **Commit config.js:**
```bash
git add webapp/config.js
git commit -m "Add Firebase config (no sensitive data)"
git push
```

3. **Deploy to GitHub Pages:**
- Settings → Pages → Source: main, /webapp folder
- Your app will work perfectly!

### If You Want Sheets Backup:

Either:
- Make repo private, OR
- Restrict Apps Script to "Only myself", OR
- Add authentication to your Apps Script

## Security Checklist

- [ ] Firebase Security Rules configured
- [ ] Decide: Firebase only OR Sheets backup?
- [ ] If Sheets backup: Add access restrictions
- [ ] Never commit actual secrets (passwords, tokens)
- [ ] Test deployment before sharing URL
- [ ] Monitor Firebase usage/costs
- [ ] Review security rules periodically

## Firebase Security Rules Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Firestore Database → Rules
4. Set appropriate rules (see examples above)
5. Publish rules

## Summary

| Item | Safe to Commit? | Protection |
|------|----------------|------------|
| Firebase API Key | ✅ Yes | Security Rules |
| Firebase Project ID | ✅ Yes | Security Rules |
| Google Sheets URL | ⚠️ Maybe | Access restrictions |
| Passwords/Tokens | ❌ Never | Keep in secrets |

**Bottom line:** For GitHub Pages, commit `config.js` with Firebase config. Either disable Sheets backup or add restrictions to your Apps Script.
