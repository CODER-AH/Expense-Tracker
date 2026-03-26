/**
 * config.js
 * Configuration and global state management
 */

// ─── CONFIG ───────────────────────────────────────────────
// Config is loaded from config.js
const SCRIPT_URL = window.APP_CONFIG?.googleSheets?.scriptUrl || 'MISSING_CONFIG';

if (SCRIPT_URL === 'MISSING_CONFIG') {
  console.error("⚠️ Google Sheets config not found! Please create webapp/config.js from config.template.js");
}

const CAT_CONFIG = {
  food:      { label: '🍽️ Food',   color: '#f5c842', bg: '#2a2410' },
  fuel:      { label: '⛽ Fuel',   color: '#e87c4e', bg: '#2a1a10' },
  stay:      { label: '🏨 Stay',   color: '#7ec8e3', bg: '#0f2228' },
  transport: { label: '🚙 Transport',  color: '#e86e8a', bg: '#2a1018' },
  entry:     { label: '🎟️ Entry Fees', color: '#b07fe8', bg: '#1e1430' },
  misc:      { label: '🛍️ Miscellaneous',  color: '#5dba8a', bg: '#0e2418' },
};

// ─── STATE ────────────────────────────────────────────────
let expenses = { 1: [], 2: [] };
let archivedExpenses = [];
let currentUser = '';
let editingId = null;
let deleteTarget = null;
let permanentDeleteTarget = null;
let unarchiveTarget = null;
let sortBy = 'time';
let sortOrder = 'desc'; // 'asc' or 'desc'
let filterBy = 'all';
let dayFilterBy = 'all'; // New day filter
let currentPage = 1; // Single page state
let tripBudget = 0; // Trip budget
const ITEMS_PER_PAGE = 10;

// Multi-select state
let selectedExpenses = new Set(); // For active expenses
let selectedArchived = new Set(); // For archived expenses
let isMultiSelectMode = false; // Global multi-select mode
let selectedNotes = new Set(); // For notes
let isNoteMultiSelectMode = false; // Notes multi-select mode

// Notes/Tasks state
let notes = [];
let notesLoaded = false; // Track if notes have been loaded

// Lazy loading state
let archivedLoaded = false; // Track if archived expenses have been loaded
let dataLoaded = false; // Track if initial data has been loaded

// Trip days configuration
let tripDays = [
  { day: 1, name: 'Sat', date: '28 Mar' },
  { day: 2, name: 'Sun', date: '29 Mar' }
];
let maxDay = 2;

// People configuration
const persons = ['Afsar', 'Adham', 'Aakif', 'Sahlaan'];
