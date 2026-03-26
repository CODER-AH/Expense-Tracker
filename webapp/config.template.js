// Template for config.js
// Copy this to config.js and fill in your actual credentials
// NEVER commit config.js to git!

const CONFIG = {
  // Firebase Configuration
  // Get this from: Firebase Console → Project Settings → General → Your apps
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },

  // Google Apps Script URL
  // Deploy your Apps Script and paste the web app URL here
  googleSheets: {
    scriptUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
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
