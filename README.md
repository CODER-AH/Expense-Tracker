# Coorg Trip Expense Tracker

A modern, feature-rich expense tracking application designed for group trips with real-time Google Sheets synchronization, custom styled UI components, and full mobile responsiveness.

## Features

- ✅ Add, edit, and archive expenses (single or bulk entry)
- ✅ Track expenses by day, category, and payer
- ✅ Multiple payer support with custom names
- ✅ Real-time sync with Google Sheets backend
- ✅ Offline support with localStorage fallback
- ✅ Beautiful dark theme with custom styled dropdowns
- ✅ Fully responsive design (mobile-first)
- ✅ Budget tracking with visual indicators
- ✅ Settlement calculations and summary cards
- ✅ Filter and sort functionality
- ✅ Edit history tracking with timestamps

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

1. Open `webapp/app.js`
2. Find line with: `const SCRIPT_URL = '...'`
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
5. Under **Source**, select **main** branch and **/webapp** folder
6. Click **Save**
7. Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### 4. Share with Friends

Share the GitHub Pages URL with your friends. They can:
- Select their name on first visit (saved in browser)
- Add expenses using multi-row entry or inline editing
- Edit and delete their own entries
- View everyone's expenses synced via Google Sheets
- See settlement calculations showing who owes whom

## Usage

### Adding Expenses

**Multi-row Entry (Recommended for multiple expenses):**
1. Fill in the expense details in the form
2. Click "Add Row" to add it to the batch
3. Repeat to add more expenses
4. Click "Save All" to save all expenses at once
5. Use "Clear All" to discard all rows without saving

**Single Expense:**
1. Fill in the expense details in the form
2. Click "Add Row" once
3. Click "Save All" immediately

### Editing Expenses

- Click the ✏️ icon next to any expense you added
- Edit the fields inline
- Click ✅ to save or ❌ to cancel

### Deleting Expenses

- Click the 🗑️ icon next to any expense you added
- Confirm deletion in the popup dialog

### Viewing & Filtering

- Use the dropdown to filter expenses by person
- Click column headers to sort (click again to reverse)
- Navigate between pages using the pagination buttons
- View settlement calculations showing optimal payment transfers

## Local Testing

Open `webapp/index.html` directly in your browser to test locally before deploying.

## Configuration

### Update Participant Names

Edit the names in the dropdowns (in `webapp/app.js`):

**Find the person arrays and update:**
```javascript
const persons = ['Afsar', 'Adham', 'Aakif', 'Sahlaan'];
const splitAmong = ['Afsar', 'Adham', 'Aakif', 'Sahlaan'];
```

### Customize Trip Details

Edit the header section in `webapp/index.html`:
```html
<div class="route">📍 Your Route</div>
<h1>Your <span>Trip</span> Name</h1>
<div class="dates">Days · Dates</div>
```

## Categories

- ⛽ Fuel
- 🍽️ Food
- 🏨 Stay
- 🎟️ Entry
- 🚙 Jeep/Transport
- 🛍️ Misc

## Project Structure

```
/
├── webapp/                # Frontend application
│   ├── index.html        # Main HTML structure
│   ├── styles.css        # All CSS styles (1107 lines)
│   ├── app.js            # All JavaScript logic (1731 lines)
│   └── README.md         # Frontend documentation
│
├── backend/              # Google Apps Script backend
│   ├── Code.js           # Apps Script backend code (v3)
│   ├── appsscript.json   # Apps Script manifest
│   └── README.md         # Backend documentation
│
├── .github/workflows/    # GitHub Actions
│   └── deploy-gas.yml    # Auto-deploy to Google Apps Script
│
├── README.md            # Main documentation (this file)
├── CHANGELOG.md         # Version history
└── DEPLOYMENT.md        # Deployment setup guide
```

## Recent Updates

### UI/UX Improvements
- **Custom Dropdowns**: Replaced native select elements with styled custom dropdowns matching the filter/sort design
- **Responsive Layout**: Enhanced mobile responsiveness with single-column layout for screens < 640px
- **Section Width**: Increased from 860px to 1000px for better laptop viewing
- **Settlement Cards**: Set to 2x2 grid layout (2 cards per row)
- **Tile Centering**: Centered tiles in summary/settlement grids when fewer items in last row
- **Delete Button**: Fixed overflow issue in add multiple items section (reduced width to 40px)
- **Dropdown Visibility**: Fixed clipping issues by adjusting overflow handling
- **Font**: Added Playfair Display for numbers in tiles, DM Mono and DM Sans for UI

### Code Organization
- Separated monolithic 3271-line HTML file into modular structure:
  - HTML (431 lines) - structure only
  - CSS (1107 lines) - all styles
  - JS (1731 lines) - all logic
- Maintained exact functionality during reorganization

### Mobile Optimization
- Single-column layout for screens < 640px
- Horizontal scroll for medium screens (641-900px)
- Proper dropdown positioning across all screen sizes

### User Experience
- Consistent placeholder text across single and multi-row entry forms
- Better visual feedback for custom dropdown interactions
- Improved touch targets for mobile users
