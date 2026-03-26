# Deploy Notes Feature - Instructions

## What's New
Added a dynamic notes/tasks system that stores data in both Firebase and Google Sheets (async backup).

## Steps to Deploy

### 1. Update Firebase Security Rules
Add the `notes` collection to your Firestore rules:

```javascript
match /notes/{document=**} {
  allow read, write: if true;
}
```

**Where:** Firebase Console → Firestore Database → Rules → Publish

### 2. Update Google Apps Script
The `backend/Code.js` file has been updated with notes functionality. Deploy the new version:

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Copy the entire content from `backend/Code.js`
4. Paste it into the Apps Script editor (replace all existing code)
5. Click **Deploy** → **Manage Deployments**
6. Click the ✏️ edit icon on your existing deployment
7. Select **New version** from the dropdown
8. Click **Deploy**

**Important:** You don't need to create a new deployment - just update the existing one with a new version. The URL stays the same!

### 3. What Will Happen

**On First Note Creation:**
- A new "Notes" sheet will be automatically created in your Google Spreadsheet
- The sheet will have columns: ID, Text, Completed, Created, Updated

**Notes Features:**
- ✅ Add new notes/tasks
- ✅ Check/uncheck to mark as completed
- ✅ Delete notes
- ✅ Completed notes show with strikethrough
- ✅ Stored in Firebase (primary)
- ✅ Backed up to Sheets asynchronously

### 4. Enable Sheets Backup (Optional)

By default, Sheets backup is disabled. To enable it:

1. Edit `webapp/config.js`
2. Change:
   ```javascript
   database: {
     useFirebase: true,
     enableSheetsBackup: true  // Change this to true
   }
   ```

### 5. Test It Out

1. Refresh your web app
2. Open the "📝 Notes" section
3. Click "+ Add Note"
4. Add a test note
5. Check Firebase Firestore to see the `notes` collection
6. If Sheets backup is enabled, check the new "Notes" sheet in Google Sheets

## Troubleshooting

**Error: "Missing or insufficient permissions"**
- Make sure you updated the Firebase security rules (Step 1)

**Notes not appearing in Sheets**
- Check if `enableSheetsBackup: true` in config.js
- Check Apps Script was deployed with new version (Step 2)
- Check browser console for any errors

**"Notes" sheet not created**
- The sheet is created automatically on the first note add
- Make sure you deployed the updated Apps Script (Step 2)

## Data Structure

### Firebase (notes collection)
```javascript
{
  text: "Note text",
  completed: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Google Sheets (Notes sheet)
| ID | Text | Completed | Created | Updated |
|----|------|-----------|---------|---------|
| note_1234 | Note text | No | 26/3/2026... | 26/3/2026... |
