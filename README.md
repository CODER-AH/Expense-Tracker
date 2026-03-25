# Coorg Trip Expense Tracker

A beautiful expense tracking app for managing trip expenses with real-time Google Sheets sync.

## Features

### Core Functionality
- ✅ **Multi-row expense entry** - Add up to 3 expenses at once with a single save action
- ✅ **Inline editing** - Edit expenses directly in the table without opening forms
- ✅ **Archive system** - Archive expenses instead of deletion, with restore option
- ✅ **Soft delete** - Deleted expenses flagged but never removed from Google Sheets (full audit trail)
- ✅ **Smart confirmations** - Custom dialogs showing full expense details before archive/delete
- ✅ **User tracking** - Track who added each expense with emoji indicators (👨‍💻 for techies, 👨‍⚕️ for doctor)
- ✅ **Real-time sync** - All changes sync to Google Sheets instantly with visual status indicator
- ✅ **Offline support** - Works offline with localStorage, syncs when back online

### Organization & Display
- ✅ **Day-wise tracking** - Organize expenses by trip days (Day 1, Day 2)
- ✅ **Category-based** - Food, Fuel, Stay, Transport, Entry Fees, Miscellaneous
- ✅ **Pagination** - View 10 entries per page with page navigation
- ✅ **Sorting** - Sort by description, category, name, paid by, time, or amount (ascending/descending)
- ✅ **Custom filters** - Beautiful custom filter dropdowns for day and person filtering
- ✅ **Description truncation** - Long descriptions auto-truncate with "Show more" option
- ✅ **Collapsible sections** - All sections (Insights, Settlement, Add Expense, History, Notes, Archived) can be collapsed

### Settlement & Analytics
- ✅ **Budget tracking** - Set trip budget with visual indicators (green/orange/red based on usage)
- ✅ **Dynamic color-coding** - Total spent changes color based on budget (green < 85%, orange 85-100%, red > 100%)
- ✅ **Automatic settlement calculator** - Splits total equally among 4 people
- ✅ **Minimum transactions** - Calculates who owes whom with fewest transfers needed
- ✅ **Category totals** - See spending breakdown by category
- ✅ **Person totals** - Track how much each person paid with emoji indicators
- ✅ **Edit tracking** - Visual badge shows if an expense was edited

### UI & Design
- ✅ **Beautiful dark theme** - Elegant dark green design with custom colors
- ✅ **Floating status bar** - Compact sync indicator at top-right, auto-hides on scroll down
- ✅ **Glass morphism effects** - Modern backdrop blur and transparency
- ✅ **Large focal cards** - Budget and Total Spent prominently displayed as 2x size
- ✅ **Mobile responsive** - Works seamlessly on phones and tablets
- ✅ **Loading states** - Spinner overlay during data fetch
- ✅ **Toast notifications** - User feedback for all actions
- ✅ **Custom UI components** - No browser default dialogs, all custom styled
- ✅ **Improved readability** - Increased font sizes across the app

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
2. Find the line with: `const SCRIPT_URL = '...'` (around line 1120)
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

Open `index.html` directly in your browser to test locally before deploying.

## Configuration

### Update Participant Names

Edit the names in the dropdowns (in `index.html`):

**Login page select (around line 850):**
```html
<option value="Afsar">Afsar</option>
<option value="Adham">Adham</option>
<option value="Aakif">Aakif</option>
<option value="Sahlaan">Sahlaan</option>
```

**Paid by dropdown (around line 950):**
```html
<option value="Afsar">Afsar</option>
<option value="Adham">Adham</option>
<option value="Aakif">Aakif</option>
<option value="Sahlaan">Sahlaan</option>
```

**Update settlement calculator (around line 1787):**
```javascript
const splitAmong = ['Afsar', 'Adham', 'Aakif', 'Sahlaan'];
```

### Customize Trip Details

Edit the header section (around line 862-866):
```html
<div class="route">📍 Your Route</div>
<h1>Your <span>Trip</span> Name</h1>
<div class="dates">Days · Dates</div>
```

## Categories

The app supports the following expense categories:
- ⛽ **Fuel** - Gas station fills
- 🍽️ **Food** - Restaurants, snacks, meals
- 🏨 **Stay** - Hotels, accommodations
- 🎟️ **Entry Fees** - Tickets, admissions
- 🚙 **Transport** - Jeep rentals, cabs, local transport
- 🛍️ **Miscellaneous** - Shopping, other expenses

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (Vanilla JS)
- **Backend**: Google Apps Script (serverless)
- **Storage**: Google Sheets + localStorage
- **Hosting**: GitHub Pages
- **Fonts**: Google Fonts (DM Sans, DM Mono, Playfair Display)

## Repository Structure

```
.
├── index.html                           # Main application file
├── GoogleAppsScript_v2_UPDATE_THIS.gs  # Backend script for Google Sheets
├── README.md                           # Project documentation
├── CHANGES_SUMMARY.md                  # Detailed change log
├── .gitignore                          # Git ignore rules
└── .github/
    └── CODEOWNERS                      # Code ownership configuration
```

## Live Demo

This tracker is deployed at: `https://CODER-AH.github.io/Expense-Tracker/`

## Support & Issues

For bugs or feature requests, please open an issue on GitHub.
