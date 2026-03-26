# Backend - Google Apps Script

This folder contains the Google Apps Script code that runs on Google's servers and manages data in Google Sheets.

## Files

- **Code.js** - Google Apps Script backend (v3)
- **appsscript.json** - Apps Script manifest configuration

## Features

- Handles all expense CRUD operations (Create, Read, Update, Delete)
- Syncs data with Google Sheets in real-time
- Manages budget settings across all users
- Tracks edit history and soft deletes (archive)

## Deployment

### Automatic (via GitHub Actions)
When you push changes to `backend/Code.js` or `backend/appsscript.json` to the `main` branch, GitHub Actions automatically deploys to Google Apps Script using clasp.

### Manual Deployment
```bash
# Make sure you've enabled Apps Script API at:
# https://script.google.com/home/usersettings

# Push code to Google Apps Script
clasp push

# If needed, you can also open the script in browser
clasp open
```

## Configuration

The `.clasp.json` file (in project root) contains:
- Script ID linking to your Google Apps Script project
- Root directory set to `backend` folder

**Note:** `.clasp.json` is gitignored for security. Each developer needs their own local copy.

## Script ID
`1NdYhZkidWxCD3wLzuKlsUySr_LsL-lfGrNA16X7L6gORwg1LjA9SUwCp`

## Creating New Deployment

If you need to create a new deployment:
1. Open script: `clasp open`
2. Click **Deploy** → **New deployment**
3. Choose type: **Web app**
4. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the new Web app URL and update it in `webapp/app.js`
