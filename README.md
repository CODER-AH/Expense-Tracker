# Coorg Trip Expense Tracker

A beautiful expense tracking app for managing trip expenses with real-time Google Sheets sync.

## Features

- ✅ Add, edit, and delete expenses
- ✅ Track expenses by day and category
- ✅ Multiple payer support (Adham, Aakif, Afsar)
- ✅ Real-time sync with Google Sheets
- ✅ Offline support with localStorage
- ✅ Beautiful dark theme UI
- ✅ Mobile responsive

## Deployment Instructions

### 1. Deploy Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Copy the contents of `GoogleAppsScript_v2_UPDATE_THIS.gs` into the script editor
4. Click **Deploy** → **New deployment**
5. Choose type: **Web app**
6. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy**
8. Copy the Web app URL

### 2. Update the HTML File

1. Open `index.html`
2. Find line ~607: `const SCRIPT_URL = '...'`
3. Replace with your Google Apps Script URL
4. Save the file

### 3. Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Initialize and push your code:

```bash
git add .
git commit -m "Initial commit: Coorg trip expense tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

3. Go to your repository settings on GitHub
4. Navigate to **Pages** section
5. Under **Source**, select **main** branch
6. Click **Save**
7. Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### 4. Share with Friends

Share the GitHub Pages URL with your friends. They can:
- Add their name on first visit (saved in browser)
- Add expenses in real-time
- Edit and delete their entries
- View everyone's expenses synced via Google Sheets

## Local Testing

Open `index.html` directly in your browser to test locally before deploying.

## Configuration

Edit the names in the "Paid by" dropdown (line ~556 in index.html):
```html
<option value="Adham">Adham</option>
<option value="Aakif">Aakif</option>
<option value="Afsar">Afsar</option>
```

## Categories

- ⛽ Fuel
- 🍽️ Food
- 🏨 Stay
- 🎟️ Entry
- 🚙 Jeep/Transport
- 🛍️ Misc
