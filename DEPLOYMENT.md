# Automated Deployment Setup

This guide explains how to automatically deploy your Google Apps Script whenever you merge to the main branch.

## Prerequisites

1. Node.js installed on your local machine
2. A Google Apps Script project already deployed
3. GitHub repository with push access

## Setup Steps

### 1. Install clasp locally

```bash
npm install -g @google/clasp
```

### 2. Login to clasp

```bash
clasp login
```

This will open a browser for Google authentication and create a `.clasprc.json` file in your home directory.

### 3. Initialize clasp in your project

```bash
cd "/path/to/your/project"
clasp create --title "Coorg Trip Expense Tracker" --type webapp
```

Or if you already have a project, clone it:

```bash
clasp clone <YOUR_SCRIPT_ID>
```

You can find your Script ID in Apps Script: **Project Settings** → **Script ID**

### 4. Create .clasp.json

This file should be created automatically, but if not, create it:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "."
}
```

### 5. Rename your script file

Rename `GoogleAppsScript_v2_UPDATE_THIS.gs` to `Code.gs` (clasp standard):

```bash
mv GoogleAppsScript_v2_UPDATE_THIS.gs Code.gs
```

### 6. Get your clasp credentials

```bash
cat ~/.clasprc.json
```

Copy the entire JSON content.

### 7. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CLASP_CREDENTIALS`
5. Value: Paste the entire `.clasprc.json` content
6. Click **Add secret**

### 8. Update .gitignore

Make sure these are in your `.gitignore`:

```
.clasp.json
.clasprc.json
```

### 9. Commit and push

```bash
git add .github/workflows/deploy-gas.yml
git add .gitignore
git commit -m "Add automatic Google Apps Script deployment"
git push origin main
```

## How it works

- Every time you merge to `main` branch and `Code.gs` file changes
- GitHub Actions automatically runs
- It uses clasp to push your code to Google Apps Script
- Your deployed web app stays up to date

## Manual deployment

You can also deploy manually anytime:

```bash
clasp push
clasp deploy
```

## Troubleshooting

**Error: "Permission denied"**
- Make sure you've enabled the Google Apps Script API: https://script.google.com/home/usersettings

**Error: "No credentials found"**
- Re-run `clasp login` and update the GitHub secret

**Error: "Script ID not found"**
- Check your `.clasp.json` has the correct scriptId
- Get it from Apps Script → Project Settings → Script ID

## Important Notes

- The GitHub Action only pushes code, it doesn't create new deployments
- Your existing deployment URL remains the same
- Users won't see changes until they refresh (or clear cache)
- Test locally with `clasp push` before relying on automation
