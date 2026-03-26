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

## Project Structure

```
/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styles (1107 lines)
├── app.js             # All JavaScript logic (1731 lines)
└── README.md          # Documentation
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
