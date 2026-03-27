# Coorg Trip Expense Tracker

A modern, feature-rich expense tracking application designed for group trips with **Firebase Realtime Database**, Google Sheets backup, custom styled UI components, and full mobile responsiveness.

## Features

- ✅ **Firebase Backend**: Fast, real-time database with offline support
- ✅ **Payment Tracking**: Record and confirm payments with settlement adjustments
- ✅ **Google Sheets Backup**: Automatic async backup to Sheets (non-blocking)
- ✅ **Three-State System**: Active → Archived → Deleted (soft delete)
- ✅ **Batch Add**: Add up to 3 expenses at once with custom dropdowns
- ✅ **Custom Dropdowns**: Beautiful styled dropdowns with smart positioning
- ✅ Add, edit, and archive expenses (single or bulk entry)
- ✅ Track expenses by day, category, and payer
- ✅ Multiple payer support with custom names
- ✅ Beautiful dark theme with custom styled dropdowns
- ✅ Fully responsive design (mobile-first)
- ✅ Budget tracking with visual indicators
- ✅ Settlement calculations with payment confirmations
- ✅ Filter and sort functionality
- ✅ Edit history tracking with timestamps
- ✅ Automatic timestamp updates on edit
- ✅ Lazy loading for performance optimization
- ✅ Notes/Tasks with multi-select delete
- ✅ Admin role system with secure permissions

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Primary Database**: Firebase Firestore
- **Backup**: Google Apps Script + Google Sheets
- **Analytics**: Firebase Analytics
- **Hosting**: GitHub Pages

## Quick Start

### 1. Firebase Setup

The app is already configured with Firebase. To use your own:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Analytics (optional)
4. **Configure Security Rules** (IMPORTANT):
   - Go to Firestore → Rules
   - Copy rules from `docs/FIRESTORE_RULES.md`
   - Publish the rules
5. Update `webapp/config.js` with your Firebase config

**Important**: The payment feature requires proper Firestore security rules. See `docs/FIRESTORE_RULES.md` for complete setup instructions.

### 2. Google Sheets Backup (Optional)

1. Deploy the Google Apps Script from `backend/Code.js`
2. Update `SCRIPT_URL` in `webapp/app.js`
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

**Add Single:** Click "+ Add" button → Fill form in modal → Click "Save All"

**Batch Add:** Click "+ Add" → Fill first entry → Click "Add More" (up to 3 entries) → Click "Save All"

**Edit:** Click ✏️ icon → Modify fields in modal → Click "Save"

**Archive:** Click 🗑️ icon → Confirm → Expense moves to archived section

**Delete:** In archived section, click 🗑️ icon → Permanently hidden (kept in DB)

### Three-State System

1. **Active** (visible in main list, can edit/archive)
2. **Archived** (visible in archived section, can unarchive/delete)
3. **Deleted** (hidden from UI, kept in database for auditing)

See `docs/THREE_STATE_SYSTEM.md` for details.

### Payment Tracking

**Record Payment:**
1. Navigate to Payments section
2. Click "Pay Now" on a settlement card
3. Enter amount, payment method (GPay/PhonePe/Paytm/Cred/Cash/Other), and optional note
4. Submit → Payment status: "Pending"

**Confirm Payment:**
1. Recipient logs in and navigates to Payments
2. Sees payment in "Pending Confirmations"
3. Clicks "Confirm" → Payment status: "Confirmed"
4. Settlement amounts automatically adjust

**Reject Payment:**
1. Recipient clicks "Reject"
2. Provides reason for rejection
3. Payment status: "Rejected"

**View History:**
- All confirmed payments appear in Payment History
- Shows amount, method, confirmation details
- Full audit trail preserved

**Settlement Calculation:**
- Settlements = (Expenses) - (Confirmed Payments)
- Updates in real-time after payment confirmations
- Only confirmed payments affect settlements

## Configuration

### Update Participants

Edit `webapp/app.js`:
```javascript
const persons = ['Afsar', 'Adham', 'Aakif', 'Sahlaan'];
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
│   ├── app.js                # Application logic
│   ├── db-layer.js           # Database abstraction layer
│   ├── firebase-service.js   # Firebase operations
│   └── README.md             # Frontend documentation
│
├── backend/                  # Google Apps Script backend
│   ├── Code.js               # Apps Script backend code
│   └── appsscript.json       # Apps Script manifest
│
├── docs/                     # Documentation
│   ├── THREE_STATE_SYSTEM.md # Expense state management
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── CHANGELOG.md          # Version history
│
├── .github/workflows/        # GitHub Actions
│   └── deploy-gas.yml        # Auto-deploy to Google Apps Script
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

- Firebase queries filtered by archived status
- Client-side filtering for deleted items
- Async Sheets backup (fire and forget)
- localStorage caching for offline mode
- Efficient timestamp-based sorting

## Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Documentation

- [Three-State System](docs/THREE_STATE_SYSTEM.md) - Expense lifecycle
- [Deployment Guide](docs/DEPLOYMENT.md) - Detailed deployment instructions
- [Changelog](docs/CHANGELOG.md) - Version history

## License

Private project for personal use.

## Credits

Built with ❤️ for group trip expense tracking.
