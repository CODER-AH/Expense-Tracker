# Security Configuration Guide

## Why Separate Configuration?

Storing API keys and credentials directly in code is a **security risk**:
- ❌ Keys visible in public repositories
- ❌ Keys in version control history
- ❌ Hard to rotate credentials
- ❌ Same keys for dev/prod

## Solution: External Config File

We've moved all sensitive credentials to `config.js` which is:
- ✅ **Not committed to git** (in `.gitignore`)
- ✅ **Easy to update** without touching code
- ✅ **Environment-specific** (dev vs prod)
- ✅ **Template provided** for easy setup

## Setup Instructions

### 1. Create Your Config File

```bash
cd webapp
cp config.template.js config.js
```

### 2. Fill in Your Credentials

Edit `webapp/config.js` with your actual values:

#### Firebase Config
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ Settings → Project Settings
4. Scroll to "Your apps" section
5. Copy the `firebaseConfig` object
6. Paste into `config.js`

#### Google Sheets Config
1. Deploy your Google Apps Script (from `backend/Code.js`)
2. Copy the Web App URL
3. Paste into `config.js` under `googleSheets.scriptUrl`

### 3. Verify Setup

Open your app in browser and check console:
- ✅ No "MISSING_CONFIG" errors
- ✅ Firebase initializes successfully
- ✅ Data loads properly

## File Structure

```
webapp/
├── config.template.js   ✅ Committed (template)
├── config.js           ❌ NOT committed (your credentials)
├── firebase-service.js  ✅ Uses config.js
├── db-layer.js         ✅ Uses config.js
└── app.js              ✅ Uses config.js
```

## Important Security Notes

### ⚠️ Never Commit config.js

The `.gitignore` file already excludes it:
```
# Configuration files with sensitive credentials
webapp/config.js
config.js
```

### ✅ Safe to Share

These files are safe to commit:
- `config.template.js` - No real credentials
- `firebase-service.js` - Reads from config
- All other code files

### 🔄 Rotating Credentials

To change credentials:
1. Update Firebase Console or Google Apps Script
2. Edit `webapp/config.js` locally
3. Reload the app
4. **No code changes needed!**

## Firebase API Key Security

**Note:** Firebase API keys are safe to expose publicly because:
- They identify your Firebase project
- Security rules protect your data
- Authentication controls access

However, Google Apps Script URLs should be kept private as they can be accessed by anyone with the URL.

## Environment-Specific Configs

For different environments, create multiple config files:

```bash
webapp/
├── config.dev.js      # Development
├── config.prod.js     # Production
└── config.js → config.prod.js  # Symlink
```

## Deployment Checklist

Before deploying:
- [ ] `config.js` exists in webapp folder
- [ ] Firebase credentials are valid
- [ ] Google Sheets URL is correct (if using backup)
- [ ] Test locally first
- [ ] Verify `config.js` is in `.gitignore`
- [ ] Never commit `config.js` to git

## Troubleshooting

### Error: "MISSING_CONFIG"

**Problem:** `config.js` not found or not loaded

**Solution:**
1. Verify `config.js` exists in `webapp/`
2. Check browser console for load errors
3. Ensure `index.html` loads config first: `<script src="config.js"></script>`

### Error: Firebase initialization failed

**Problem:** Invalid Firebase credentials

**Solution:**
1. Copy config from Firebase Console again
2. Check for typos in `config.js`
3. Ensure all fields are filled

### Sheets backup not working

**Problem:** Invalid Google Apps Script URL

**Solution:**
1. Redeploy your Apps Script
2. Get new Web App URL
3. Update `config.js`

## Best Practices

1. ✅ **Use config.template.js** as reference
2. ✅ **Keep config.js local** (not in git)
3. ✅ **Document any new secrets** in template
4. ✅ **Test after credential changes**
5. ❌ **Never hardcode credentials** in code
6. ❌ **Never commit config.js**
7. ❌ **Never share config.js publicly**

---

**Security First!** 🔒
