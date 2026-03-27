# Coorg Trip Expense Tracker

A modern, feature-rich expense tracking application designed for group trips with **Firebase Firestore**, Google Sheets backup, payment confirmations, and full mobile responsiveness.

## Features

- ✅ **Firebase Backend**: Fast, real-time database with offline support
- ✅ **Payment Tracking**: Record and confirm payments with settlement adjustments
- ✅ **Google Sheets Backup**: Automatic async backup to Sheets (non-blocking)
- ✅ **Three-State System**: Active → Archived → Deleted (soft delete)
- ✅ **Batch Add**: Add up to 3 expenses at once
- ✅ **Custom Authentication**: Username/password with SHA-256 hashing
- ✅ Add, edit, and archive expenses (single or bulk entry)
- ✅ Track expenses by day, category, and payer
- ✅ Beautiful dark theme with responsive design
- ✅ Budget tracking with visual indicators
- ✅ Settlement calculations with minimal transactions algorithm
- ✅ Filter and sort functionality
- ✅ Edit history tracking with timestamps
- ✅ Notes/Tasks with multi-select operations
- ✅ Admin role system with secure permissions

## Navigation

The app has 6 main sections:

1. **Dashboard** - Overview of total expenses, budget, and breakdowns
2. **Expenses** - View, add, edit, and filter all active expenses
3. **Settlements** - See who owes whom with optimal transaction suggestions
4. **Payments** - Record payments, confirm received payments, view history
5. **Notes** - Add and manage trip notes/tasks
6. **Archived Expenses** - View and restore archived expenses

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Primary Database**: Firebase Firestore
- **Backup**: Google Apps Script + Google Sheets
- **Analytics**: Firebase Analytics
- **Hosting**: GitHub Pages / Local

## Quick Start

### 1. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Analytics (optional)
4. **Configure Security Rules** (IMPORTANT):
   - Go to Firestore → Rules
   - Copy rules from `docs/FIRESTORE_RULES.md`
   - Publish the rules
5. Update `webapp/config.js` with your Firebase config

**Important**: See `docs/FIRESTORE_RULES.md` for complete security setup instructions.

### 2. Google Sheets Backup (Optional)

1. Deploy the Google Apps Script from `backend/Code.js`
2. Update `SCRIPT_URL` in `webapp/config.js`
3. Set `ENABLE_SHEETS_BACKUP = true` in `webapp/db-layer.js`

### 3. Deploy

**GitHub Pages:**
```bash
git push origin main
```
Enable GitHub Pages: Settings → Pages → Source: main branch, /webapp folder

**Local Testing:**
Open `webapp/index.html` in your browser

## Usage

### Managing Expenses

**Add Single:** Click "+ Add" button → Fill form → Click "Save All"

**Batch Add:** Click "+ Add" → Fill first entry → Click "Add More" (up to 3) → Click "Save All"

**Edit:** Click ✏️ icon → Modify fields → Click "Save"

**Archive:** Click 🗑️ icon → Confirm → Moves to Archived Expenses section

**Delete:** In Archived Expenses, click 🗑️ icon → Permanently hidden (kept in DB for audit)

### Three-State System

1. **Active** (visible in Expenses, can edit/archive)
2. **Archived** (visible in Archived Expenses, can unarchive/delete)
3. **Deleted** (hidden from UI, kept in database for auditing)

See `docs/THREE_STATE_SYSTEM.md` for details.

### Payment Tracking

**Record Payment:**
1. Navigate to Payments or Settlements section
2. Click "Pay Now" or "Go to Payments →"
3. Enter amount, payment method (GPay/PhonePe/Paytm/Cred/Cash/Other), and optional note
4. Submit → Status: "Pending"

**Confirm Payment:**
1. Recipient logs in and navigates to Payments
2. Sees payment in "Pending Confirmations"
3. Clicks "Confirm" → Status: "Confirmed"
4. Settlements automatically adjust

**Reject Payment:**
1. Recipient clicks "Reject"
2. Provides reason for rejection
3. Status: "Rejected"

**Settlement Calculation:**
- Uses greedy algorithm for minimal transactions
- Settlements = (Expenses) - (Confirmed Payments)
- Pending payments show remaining amounts
- Updates in real-time after confirmations

## Configuration

### Update Participants

Edit both `webapp/app.js` and `webapp/payments.js`:
```javascript
const PARTICIPANTS = ['Afsar', 'Adham', 'Aakif', 'Sahlaan'];
```

### Firebase Toggle

Edit `webapp/db-layer.js`:
```javascript
const USE_FIREBASE = true;  // false to use only Sheets
const ENABLE_SHEETS_BACKUP = true;  // false to disable backup
```

## Project Structure

```
/
├── webapp/                    # Frontend application
│   ├── index.html            # Main HTML structure
│   ├── styles.css            # All CSS styles
│   ├── app.js                # Main application logic
│   ├── payments.js           # Payment tracking logic
│   ├── db-layer.js           # Database abstraction layer
│   ├── firebase-service.js   # Firebase operations
│   ├── firebase-payments.js  # Firebase payment operations
│   ├── multi-select.js       # Multi-select functionality
│   └── config.js             # Configuration file
│
├── backend/                  # Google Apps Script backend
│   ├── Code.js               # Apps Script backend code
│   └── appsscript.json       # Apps Script manifest
│
├── docs/                     # Documentation
│   ├── THREE_STATE_SYSTEM.md # Expense state management
│   ├── FIRESTORE_RULES.md    # Security rules setup
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── CHANGELOG.md          # Version history
│
└── README.md                 # This file
```

## Key Features

### Database Abstraction Layer

The `db-layer.js` provides a unified API that works with both Firebase and Google Sheets:

- **Firebase Primary**: Fast reads/writes with real-time updates
- **Sheets Backup**: Async background sync (non-blocking)
- **Seamless Switch**: Toggle between backends with a single flag

### Soft Delete Architecture

Never lose data - everything is preserved:
- Archive for temporary removal
- Delete to hide permanently (still in DB)
- Full audit trail maintained

### Performance Optimizations

- Firebase queries filtered by archived/deleted status
- Client-side filtering for additional states
- Async Sheets backup (fire and forget)
- localStorage caching for session data
- Lazy loading for archived items and notes
- Efficient timestamp-based sorting

## Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Documentation

- [Firestore Security Rules](docs/FIRESTORE_RULES.md) - Complete security setup
- [Three-State System](docs/THREE_STATE_SYSTEM.md) - Expense lifecycle
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions
- [Changelog](docs/CHANGELOG.md) - Version history

## License

Private project for personal use.

## Credits

Built with ❤️ for group trip expense tracking.
