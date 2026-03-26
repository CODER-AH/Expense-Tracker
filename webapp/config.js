// Configuration file for the expense tracker
//
// SECURITY NOTES:
// - Firebase API keys: SAFE to commit publicly (protected by Firebase Security Rules)
// - Google Sheets URL: KEEP PRIVATE if possible (anyone with URL can access)
//
// For GitHub Pages deployment, this file MUST be committed.
// The Google Sheets URL is the only sensitive part - consider:
// 1. Using Firebase only (set enableSheetsBackup to false), OR
// 2. Restricting Apps Script to specific users/domain

const CONFIG = {
  // Firebase Configuration
  // These are safe to expose publicly - Firebase Security Rules protect your data
  firebase: {
    apiKey: "AIzaSyD1WLpghE_WWEW_XX8QzN46qHeS2duBdVc",
    authDomain: "trip-expense-tracker-d04fe.firebaseapp.com",
    projectId: "trip-expense-tracker-d04fe",
    storageBucket: "trip-expense-tracker-d04fe.firebasestorage.app",
    messagingSenderId: "321319814690",
    appId: "1:321319814690:web:2301031119c354d6bfec7b",
    measurementId: "G-RMRGTVVTHZ"
  },

  // Google Apps Script URL
  // ⚠️ This is semi-sensitive - anyone with this URL can call your script
  // Mitigation options:
  // 1. Set "Who has access" to specific users in Apps Script deployment
  // 2. Add authentication checks in your Apps Script code
  // 3. Use Firebase only and disable Sheets backup (set enableSheetsBackup to false)
  googleSheets: {
    scriptUrl: "https://script.google.com/macros/s/AKfycbxscbDaRJezz07nggUqUvzxk4UGtYoIIvYqnEfhTRNzB8YscjXgsnU008YsN3jcvE8ZQA/exec"
  },

  // Database Configuration
  database: {
    useFirebase: true,           // Set to false to use only Google Sheets
    enableSheetsBackup: true     // Set to false to disable Sheets backup
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.APP_CONFIG = CONFIG;
}
