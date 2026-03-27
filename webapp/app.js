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

// ─── LOADING MESSAGES ─────────────────────────────────────
const loadingMessages = [
  'Loading...',
  'Fetching data...',
  'Getting things ready...',
  'Almost there...',
  'Syncing expenses...',
  'Preparing your data...',
  'Just a moment...',
  'Loading expenses...',
  'Retrieving records...',
  'One sec...'
];

const checkingUserMessages = [
  'Checking user details...',
  'Looking up your account...',
  'Finding your profile...',
  'One moment...',
  'Getting your info...',
  'Just a sec...',
  'Fetching user data...',
  'Almost there...'
];

const authMessages = [
  'Authenticating...',
  'Verifying credentials...',
  'Checking password...',
  'Logging you in...',
  'Securing connection...',
  'Almost there...'
];

const notesLoadingMessages = [
  'Loading notes...',
  'Fetching your tasks...',
  'Getting notes ready...',
  'Retrieving notes...',
  'Loading your reminders...',
  'One moment...'
];

const archivedLoadingMessages = [
  'Loading archived expenses...',
  'Fetching archive...',
  'Getting archived data...',
  'Retrieving old expenses...',
  'Loading history...',
  'One sec...'
];

function getRandomLoadingMessage() {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
}

function getRandomCheckingUserMessage() {
  return checkingUserMessages[Math.floor(Math.random() * checkingUserMessages.length)];
}

function getRandomAuthMessage() {
  return authMessages[Math.floor(Math.random() * authMessages.length)];
}

function getRandomNotesLoadingMessage() {
  return notesLoadingMessages[Math.floor(Math.random() * notesLoadingMessages.length)];
}

function getRandomArchivedLoadingMessage() {
  return archivedLoadingMessages[Math.floor(Math.random() * archivedLoadingMessages.length)];
}

// ─── PASSWORD VISIBILITY TOGGLE ───────────────────────────
function togglePasswordVisibility(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);

  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '👁️‍🗨️';
  } else {
    input.type = 'password';
    toggle.textContent = '👁️';
  }
}

// ─── NAVIGATION ───────────────────────────────────────────
function toggleNav() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('navOverlay');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

function closeNav() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('navOverlay');
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
}

async function navigateTo(section) {
  // Close sidebar
  closeNav();

  // Update current section
  currentSection = section;

  // Save current section to localStorage
  localStorage.setItem('coorg_currentSection', section);

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.textContent.toLowerCase().includes(section)) {
      item.classList.add('active');
    }
  });

  // Hide all sections
  document.querySelectorAll('.app-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Show selected section
  const sectionEl = document.getElementById(section + 'Section');
  if (sectionEl) {
    sectionEl.classList.add('active');
  }

  // Load section data
  // For payments, settlement, and dashboard: always reload for fresh data
  // For others: load only if not already loaded
  if (section === 'payments' || section === 'settlement' || section === 'dashboard') {
    await loadSectionData(section);
  } else if (!sectionsLoaded.has(section)) {
    await loadSectionData(section);
    sectionsLoaded.add(section);
  }
}

async function loadSectionData(section) {
  switch(section) {
    case 'expenses':
      // Expenses are loaded on initial page load
      render();
      break;
    case 'notes':
      // Load notes if not already loaded
      if (!notesLoaded) {
        await loadNotes();
      }
      break;
    case 'archived':
      // Load archived if not already loaded
      if (!archivedLoaded) {
        await loadArchivedExpenses();
      }
      break;
    case 'payments':
      // Always reload payments to get fresh data
      await loadPayments();
      break;
    case 'settlement':
      // Always reload expenses to ensure settlements are up-to-date
      await loadFromDB();
      await updateSettlement();
      break;
    case 'dashboard':
      // Always reload for fresh data
      await loadFromDB();
      calculateTotals();
      await updateSettlement();
      break;
  }
}

// ─── STATE ────────────────────────────────────────────────
let expenses = { 1: [], 2: [] };
let archivedExpenses = [];
let currentUser = '';
let isAdmin = false; // Admin flag for current user
let editingId = null;
let deleteTarget = null;
let permanentDeleteTarget = null;
let unarchiveTarget = null;
let sortBy = 'time';
let sortOrder = 'desc'; // 'asc' or 'desc'
let userHasSorted = false; // Track if user has actively clicked sort
let filterBy = 'all';
let dayFilterBy = 'all'; // New day filter
let archivedDayFilterBy = 'all'; // Archived day filter
let archivedPersonFilterBy = 'all'; // Archived person filter
let currentPage = 1; // Expenses page
let archivedPage = 1; // Archived page
let notesPage = 1; // Notes page
let tripBudget = 0; // Trip budget
const ITEMS_PER_PAGE = 10;

// Multi-select state
let selectedExpenses = new Set(); // For active expenses
let selectedArchived = new Set(); // For archived expenses
let isMultiSelectMode = false; // Global multi-select mode
let selectedNotes = new Set(); // For notes

// Navigation state
let currentSection = 'dashboard';
let sectionsLoaded = new Set(['dashboard']); // Track which sections have been loaded
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

// Load saved trip days from localStorage
function loadTripDays() {
  const saved = localStorage.getItem('coorg_tripDays');
  if (saved) {
    tripDays = JSON.parse(saved);
    maxDay = Math.max(...tripDays.map(d => d.day));
  }
}

// Save trip days to localStorage
function saveTripDays() {
  localStorage.setItem('coorg_tripDays', JSON.stringify(tripDays));
}

// Populate day dropdown with dynamic days
function populateDayDropdown(selectElement) {
  selectElement.innerHTML = '';

  tripDays.forEach(dayObj => {
    const option = document.createElement('option');
    option.value = dayObj.day;
    option.textContent = `Day ${dayObj.day} (${dayObj.name}, ${dayObj.date})`;
    selectElement.appendChild(option);
  });

  // Add "Add New Day" option
  const addOption = document.createElement('option');
  addOption.value = 'add';
  addOption.textContent = '➕ Add New Day';
  selectElement.appendChild(addOption);
}

// Handle day select change
function handleDaySelect(select) {
  if (select.value === 'add') {
    addNewDay();
    // Reset to last actual day
    select.value = maxDay;
    return false;
  }
  return true;
}

// Add a new day to the trip
function addNewDay() {
  const lastDay = tripDays[tripDays.length - 1];
  const newDayNum = maxDay + 1;

  // Calculate next day name and date
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Parse the last date (e.g., "29 Mar")
  const lastDateParts = lastDay.date.split(' ');
  const lastDayOfMonth = parseInt(lastDateParts[0]);
  const lastMonthName = lastDateParts[1];
  const lastMonthIndex = months.indexOf(lastMonthName);

  // Calculate next date (assuming 2026)
  const lastDate = new Date(2026, lastMonthIndex, lastDayOfMonth);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const nextDayName = dayNames[nextDate.getDay()];
  const nextDayOfMonth = nextDate.getDate();
  const nextMonthName = months[nextDate.getMonth()];

  const newDay = {
    day: newDayNum,
    name: nextDayName,
    date: `${nextDayOfMonth} ${nextMonthName}`
  };

  tripDays.push(newDay);
  maxDay = newDayNum;

  // Add to expenses object
  expenses[newDayNum] = [];

  // Save to localStorage
  saveTripDays();
  saveLocal();

  // Update filter dropdown
  updateFilterOptions();

  showToast(`Added Day ${newDayNum} (${nextDayName}, ${nextDayOfMonth} ${nextMonthName})`);
}

// Update filter dropdown options with current trip days
function updateFilterOptions() {
  const dayFilterDropdown = document.getElementById('dayFilterDropdown');
  if (!dayFilterDropdown) return;

  // Clear existing options except "All Days"
  dayFilterDropdown.innerHTML = '<div class="filter-option selected" onclick="selectDayFilter(\'all\', \'All Days\')">All Days</div>';

  // Add options for each trip day
  tripDays.forEach(dayObj => {
    const option = document.createElement('div');
    option.className = 'filter-option';
    option.onclick = () => selectDayFilter(String(dayObj.day), `Day ${dayObj.day} — ${dayObj.name}, ${dayObj.date}`);
    option.textContent = `Day ${dayObj.day} — ${dayObj.name}, ${dayObj.date}`;
    dayFilterDropdown.appendChild(option);
  });

  // Update archived day filter dropdown
  const archivedDayFilterDropdown = document.getElementById('archivedDayFilterDropdown');
  if (archivedDayFilterDropdown) {
    archivedDayFilterDropdown.innerHTML = '<div class="filter-option selected" onclick="selectArchivedDayFilter(\'all\', \'All Days\')">All Days</div>';

    tripDays.forEach(dayObj => {
      const option = document.createElement('div');
      option.className = 'filter-option';
      option.onclick = () => selectArchivedDayFilter(String(dayObj.day), `Day ${dayObj.day} — ${dayObj.name}, ${dayObj.date}`);
      option.textContent = `Day ${dayObj.day} — ${dayObj.name}, ${dayObj.date}`;
      archivedDayFilterDropdown.appendChild(option);
    });
  }
}

// ─── INIT ─────────────────────────────────────────────────
window.onload = () => {
  // Initialize Firebase first
  dbInit();

  showLoading(true);
  loadTripDays();

  const saved = localStorage.getItem('coorg_username');
  const isAuthenticated = sessionStorage.getItem('authenticated') === 'true';

  if (saved && isAuthenticated) {
    // User is logged in and authenticated
    currentUser = saved;
    isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    hideLoginOverlay();
    updateFilterOptions();
    loadFromSheet();

    // Verify admin status from Firebase (async, won't block UI)
    dbIsAdmin(currentUser).then(adminStatus => {
      if (adminStatus !== isAdmin) {
        isAdmin = adminStatus;
        sessionStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
        // Re-render archived if it's loaded to update delete buttons
        if (archivedLoaded) {
          renderArchived();
        }
      }
    }).catch(err => {
      console.error('Failed to verify admin status:', err);
    });

    // Restore last visited section
    const savedSection = localStorage.getItem('coorg_currentSection');
    if (savedSection && savedSection !== 'dashboard') {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        navigateTo(savedSection);
      }, 100);
    }
  } else {
    // Show login screen
    showLoading(false);
    sessionStorage.removeItem('authenticated');
    document.getElementById('loginOverlay').classList.remove('hidden');
  }

  // Hide status bar and menu toggle on scroll down, show on scroll up
  let lastScrollTop = 0;
  window.addEventListener('scroll', function() {
    const statusBar = document.getElementById('statusBar');
    const menuToggle = document.getElementById('menuToggle');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down and past 100px
      statusBar.classList.add('hidden-on-scroll');
      if (menuToggle) menuToggle.classList.add('hidden-on-scroll');
    } else {
      // Scrolling up or at the top
      statusBar.classList.remove('hidden-on-scroll');
      if (menuToggle) menuToggle.classList.remove('hidden-on-scroll');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }, false);
};

// ─── LOGIN & AUTHENTICATION ───────────────────────────────
let selectedLoginUser = null;
let selectedLoginValue = null;

function toggleLoginDropdown() {
  const dropdown = document.getElementById('loginDropdown');
  const isActive = dropdown.classList.contains('active');

  // Close dropdown if it's open
  if (isActive) {
    dropdown.classList.remove('active');
    return;
  }

  // Open dropdown
  dropdown.classList.add('active');

  // Check viewport and adjust position if needed
  setTimeout(() => {
    const dropdownRect = dropdown.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Reset positioning first
    dropdown.style.top = '100%';
    dropdown.style.bottom = 'auto';
    dropdown.style.marginTop = '4px';
    dropdown.style.marginBottom = '0';

    // If dropdown goes below viewport, open it upward
    if (dropdownRect.bottom > viewportHeight - 20) {
      dropdown.style.top = 'auto';
      dropdown.style.bottom = '100%';
      dropdown.style.marginTop = '0';
      dropdown.style.marginBottom = '4px';
    }
  }, 0);
}

function selectLoginName(value, label) {
  selectedLoginValue = value;
  document.getElementById('loginNameLabel').textContent = label;
  document.getElementById('loginNameLabel').style.color = 'var(--text)';
  document.getElementById('loginDropdown').classList.remove('active');
}

async function proceedToPassword() {
  const name = selectedLoginValue?.trim();
  if (!name) {
    document.getElementById('loginNameLabel').style.color = '#e86e8a';
    return;
  }

  selectedLoginUser = name;

  // Show loading overlay with user checking messages
  showLoading(true, 'checkingUser');

  // Check if user has a password set
  try {
    const userCreds = await firestoreGetUserCredentials(name);

    showLoading(false);

    if (!userCreds || !userCreds.passwordHash) {
      // No password set, show set password step
      document.getElementById('loginTitle').textContent = 'Set Your Password';
      document.getElementById('loginSubtitle').textContent = `Welcome ${name}! Let's secure your account`;
      document.getElementById('nameSelectionStep').style.display = 'none';
      document.getElementById('setPasswordStep').style.display = 'block';
    } else {
      // Password exists, show password entry
      document.getElementById('loginTitle').textContent = 'Enter Password';
      document.getElementById('loginSubtitle').textContent = `Welcome back, ${name}!`;
      document.getElementById('nameSelectionStep').style.display = 'none';
      document.getElementById('passwordStep').style.display = 'block';
      setTimeout(() => document.getElementById('passwordInput').focus(), 100);
    }
  } catch (error) {
    console.error('Error checking user credentials:', error);
    showLoading(false);
    showToast('Connection error - check your internet', 'err');
  }
}

async function handlePasswordSubmit() {
  const password = document.getElementById('passwordInput').value;
  if (!password) {
    document.getElementById('passwordInput').focus();
    return;
  }

  const btn = document.getElementById('passwordBtn');
  btn.disabled = true;
  btn.textContent = 'Verifying...';

  // Show loading overlay with auth messages
  showLoading(true, 'auth');

  try {
    const isValid = await firestoreVerifyPassword(selectedLoginUser, password);

    if (isValid) {
      // Login successful - hide auth loader immediately
      showLoading(false);
      currentUser = selectedLoginUser;
      localStorage.setItem('coorg_username', currentUser);
      sessionStorage.setItem('authenticated', 'true');

      // Check if user is admin
      isAdmin = await dbIsAdmin(currentUser);
      sessionStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

      hideLoginOverlay();

      if (!dataLoaded) {
        // loadFromSheet will show its own loading overlay
        loadFromSheet();
      }
    } else {
      // Invalid password
      showLoading(false);
      showToast('Incorrect password', 'err');
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
      btn.disabled = false;
      btn.textContent = 'Login →';
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    showLoading(false);
    showToast('Login failed - check your connection', 'err');
    btn.disabled = false;
    btn.textContent = 'Login →';
  }
}

async function handleSetPassword() {
  const newPassword = document.getElementById('newPasswordInput').value;
  const confirmPassword = document.getElementById('confirmPasswordInput').value;
  const errorDiv = document.getElementById('passwordError');

  errorDiv.style.display = 'none';

  if (!newPassword || !confirmPassword) {
    errorDiv.textContent = 'Please fill in both fields';
    errorDiv.style.display = 'block';
    return;
  }

  if (newPassword.length < 6) {
    errorDiv.textContent = 'Password must be at least 6 characters';
    errorDiv.style.display = 'block';
    return;
  }

  if (newPassword !== confirmPassword) {
    errorDiv.textContent = 'Passwords do not match';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    await firestoreSetUserPassword(selectedLoginUser, newPassword);

    // Password set successfully, log in
    currentUser = selectedLoginUser;
    localStorage.setItem('coorg_username', currentUser);
    sessionStorage.setItem('authenticated', 'true');

    // Check if user is admin
    isAdmin = await dbIsAdmin(currentUser);
    sessionStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

    hideLoginOverlay();

    showToast('Password set successfully!', 'ok');

    if (!dataLoaded) {
      loadFromSheet();
    }
  } catch (error) {
    console.error('Error setting password:', error);
    errorDiv.textContent = 'Failed to set password - check your connection';
    errorDiv.style.display = 'block';
  }
}

function backToNameSelection() {
  document.getElementById('nameSelectionStep').style.display = 'block';
  document.getElementById('passwordStep').style.display = 'none';
  document.getElementById('setPasswordStep').style.display = 'none';
  document.getElementById('passwordInput').value = '';
  document.getElementById('newPasswordInput').value = '';
  document.getElementById('confirmPasswordInput').value = '';
  document.getElementById('passwordError').style.display = 'none';
  document.getElementById('loginTitle').textContent = 'Welcome Back!';
  document.getElementById('loginSubtitle').textContent = 'Select your name to continue';
  selectedLoginUser = null;
  selectedLoginValue = null;
  document.getElementById('loginNameLabel').textContent = 'Select your name...';
  document.getElementById('loginNameLabel').style.color = 'var(--muted)';

  // Reset password button state
  const passwordBtn = document.getElementById('passwordBtn');
  if (passwordBtn) {
    passwordBtn.disabled = false;
    passwordBtn.textContent = 'Login →';
  }
}

function hideLoginOverlay() {
  document.getElementById('loginOverlay').classList.add('hidden');

  // Map names to emojis
  const emojiMap = {
    'Afsar': '👨‍💻',
    'Adham': '👨‍💻',
    'Aakif': '👨‍💻',
    'Sahlaan': '👨‍⚕️'
  };

  const emoji = emojiMap[currentUser] || '👤';
  document.getElementById('userAvatar').textContent = emoji;
  document.getElementById('userChipName').textContent = currentUser;
}

// For backward compatibility - keep old saveName function but redirect to new flow
function saveName() {
  proceedToPassword();
}

function changeName() {
  // Clear authentication
  sessionStorage.removeItem('authenticated');
  currentUser = null;
  localStorage.removeItem('coorg_username');

  // Reset to name selection
  backToNameSelection();

  // Show login overlay
  document.getElementById('loginOverlay').classList.remove('hidden');
}

// ─── PROFILE MENU ──────────────────────────────────────────
function toggleProfileMenu() {
  const dropdown = document.getElementById('profileDropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function handleLogout() {
  // Close profile menu
  document.getElementById('profileDropdown').style.display = 'none';

  // Show logout confirmation
  document.getElementById('logoutOverlay').classList.remove('hidden');
}

function cancelLogout() {
  document.getElementById('logoutOverlay').classList.add('hidden');
}

function confirmLogout() {
  // Hide confirmation dialog
  document.getElementById('logoutOverlay').classList.add('hidden');

  // Clear authentication
  sessionStorage.removeItem('authenticated');
  currentUser = null;
  localStorage.removeItem('coorg_username');

  // Reset to name selection
  backToNameSelection();

  // Show login overlay
  document.getElementById('loginOverlay').classList.remove('hidden');
}

function showChangePasswordDialog() {
  // Close profile menu
  document.getElementById('profileDropdown').style.display = 'none';

  // Show change password overlay
  document.getElementById('changePasswordOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('currentPasswordInput').focus(), 100);
}

function cancelChangePassword() {
  document.getElementById('changePasswordOverlay').style.display = 'none';
  document.getElementById('currentPasswordInput').value = '';
  document.getElementById('newPasswordChange').value = '';
  document.getElementById('confirmPasswordChange').value = '';
  document.getElementById('changePasswordError').style.display = 'none';
}

async function handleChangePassword() {
  const currentPassword = document.getElementById('currentPasswordInput').value;
  const newPassword = document.getElementById('newPasswordChange').value;
  const confirmPassword = document.getElementById('confirmPasswordChange').value;
  const errorDiv = document.getElementById('changePasswordError');
  const btn = document.getElementById('changePasswordBtn');

  errorDiv.style.display = 'none';

  if (!currentPassword || !newPassword || !confirmPassword) {
    errorDiv.textContent = 'Please fill in all fields';
    errorDiv.style.display = 'block';
    return;
  }

  if (newPassword.length < 6) {
    errorDiv.textContent = 'New password must be at least 6 characters';
    errorDiv.style.display = 'block';
    return;
  }

  if (newPassword !== confirmPassword) {
    errorDiv.textContent = 'New passwords do not match';
    errorDiv.style.display = 'block';
    return;
  }

  if (currentPassword === newPassword) {
    errorDiv.textContent = 'New password must be different from current password';
    errorDiv.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    // Verify current password
    const isValid = await firestoreVerifyPassword(currentUser, currentPassword);

    if (!isValid) {
      errorDiv.textContent = 'Current password is incorrect';
      errorDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Update Password →';
      return;
    }

    // Update to new password
    await firestoreSetUserPassword(currentUser, newPassword);

    // Success
    cancelChangePassword();
    showToast('Password changed successfully!', 'ok');
    btn.disabled = false;
    btn.textContent = 'Update Password →';
  } catch (error) {
    console.error('Error changing password:', error);
    errorDiv.textContent = 'Failed to change password - check your connection';
    errorDiv.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Update Password →';
  }
}

// Close profile dropdown when clicking outside

// OLD function - now replaced
/*
function saveName() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { document.getElementById('nameInput').focus(); return; }

  currentUser = name;
  localStorage.setItem('coorg_username', name);
  hideNameOverlay();

  // Only load data if it's the first time or if we don't have data loaded yet
  // Changing user doesn't require reloading data since it's the same shared data
  if (!dataLoaded) {
    loadFromSheet();
  }
}

function hideNameOverlay() {
  document.getElementById('nameOverlay').classList.add('hidden');

  // Map names to emojis
  const emojiMap = {
    'Afsar': '👨‍💻',
    'Adham': '👨‍💻',
    'Aakif': '👨‍💻',
    'Sahlaan': '👨‍⚕️'
  };

  const emoji = emojiMap[currentUser] || currentUser.charAt(0).toUpperCase();
  document.getElementById('userAvatar').textContent = emoji;
  document.getElementById('userChipName').textContent = currentUser;

  updateFilterOptions();
}

function changeName() {
  document.getElementById('nameInput').value = currentUser;
  document.getElementById('nameOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('nameInput').focus(), 100);
}
*/

// ─── LOCAL STORAGE FALLBACK ───────────────────────────────
function saveLocal() {
  localStorage.setItem('coorg_expenses', JSON.stringify(expenses));
  localStorage.setItem('coorg_archived', JSON.stringify(archivedExpenses));
}
function loadFromLocal() {
  const saved = localStorage.getItem('coorg_expenses');
  if (saved) {
    expenses = JSON.parse(saved);
  } else {
    // Initialize expenses object for all trip days
    expenses = {};
    tripDays.forEach(dayObj => {
      expenses[dayObj.day] = [];
    });
  }

  const savedArchived = localStorage.getItem('coorg_archived');
  archivedExpenses = savedArchived ? JSON.parse(savedArchived) : [];
}

// ─── GOOGLE SHEETS ────────────────────────────────────────
async function loadFromSheet() {
  showLoading(true, 'default', 'Loading expenses...');
  setStatus('syncing', 'Loading…');
  try {
    // Load active expenses from Firebase
    const data = await dbGetAllExpenses();

    // Initialize expenses object for all trip days
    expenses = {};
    tripDays.forEach(dayObj => {
      expenses[dayObj.day] = [];
    });

    // Process active expenses
    (data || []).forEach(e => {
      // Ensure the day exists in our expenses object
      if (!expenses[e.day]) {
        expenses[e.day] = [];
      }
      expenses[e.day].push(e);
    });

    // Load budget from Firebase
    tripBudget = await dbGetBudget();
    if (tripBudget) {
      localStorage.setItem('coorg_budget', tripBudget);
    }

    // Don't load archived expenses or notes on initial load
    // They will be loaded when user expands those sections

    dataLoaded = true; // Mark that initial data has been loaded
    saveLocal();
    render();
    setStatus('ok', 'Synced ✓');
  } catch(e) {
    console.error('Error loading from Firebase:', e);
    setStatus('err', 'Offline — showing local data');
    loadFromLocal();
    dataLoaded = true; // Mark as loaded even on error (using cached data)
    render();
  } finally {
    showLoading(false);
  }
}

async function sheetAdd(exp) {
  const params = new URLSearchParams({
    action: 'add',
    day: exp.day,
    name: exp.name,
    desc: exp.desc,
    cat: exp.cat,
    amount: exp.amount,
    paidBy: exp.paidBy
  });
  const res = await fetch(`${SCRIPT_URL}?${params}`);
  const data = await res.json();
  return data.id;
}

async function sheetUpdate(exp) {
  const params = new URLSearchParams({
    action: 'update',
    id: exp.id,
    day: exp.day,
    name: exp.name,
    desc: exp.desc,
    cat: exp.cat,
    amount: exp.amount,
    paidBy: exp.paidBy
  });
  const res = await fetch(`${SCRIPT_URL}?${params}`);
  return await res.json();
}

async function sheetDelete(id) {
  const params = new URLSearchParams({ action: 'delete', id });
  await fetch(`${SCRIPT_URL}?${params}`);
}

async function sheetArchive(id) {
  const params = new URLSearchParams({ action: 'archive', id });
  await fetch(`${SCRIPT_URL}?${params}`);
}

async function sheetUnarchive(id) {
  const params = new URLSearchParams({ action: 'unarchive', id });
  await fetch(`${SCRIPT_URL}?${params}`);
}

// ─── ADD/EDIT EXPENSE ─────────────────────────────────────
// Old form-based saveExpense function - no longer used
// Batch add modal handles new expense entry now

// ─── INLINE EDIT ──────────────────────────────────────────
// Store current edit context
let currentEditDay = null;
let currentEditId = null;

function startInlineEdit(day, id) {
  const exp = expenses[day].find(e => String(e.id) === String(id));
  if (!exp || exp.name !== currentUser) {
    showToast('You can only edit your own expenses', 'err');
    return;
  }

  // Store context
  currentEditDay = day;
  currentEditId = id;

  // Populate edit dialog
  document.getElementById('editDesc').value = exp.desc;
  document.getElementById('editCat').value = exp.cat;
  document.getElementById('editAmount').value = exp.amount;
  document.getElementById('editPaidBy').value = exp.paidBy;

  // Show dialog
  document.getElementById('editOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('editDesc').focus(), 100);
}

function cancelEdit() {
  document.getElementById('editOverlay').classList.add('hidden');
  currentEditDay = null;
  currentEditId = null;
}

async function saveEdit() {
  if (!currentEditDay || !currentEditId) return;

  const desc = document.getElementById('editDesc').value.trim();
  const cat = document.getElementById('editCat').value;
  const amount = parseFloat(document.getElementById('editAmount').value) || 0;
  const paidBy = document.getElementById('editPaidBy').value;

  if (!desc || amount <= 0 || !paidBy) {
    showToast('Please fill all fields', 'err');
    return;
  }

  const exp = expenses[currentEditDay].find(e => String(e.id) === String(currentEditId));
  if (!exp) {
    showToast('Expense not found', 'err');
    return;
  }

  // Close dialog immediately
  document.getElementById('editOverlay').classList.add('hidden');

  // Show loading and start sync
  showLoading(true);
  setStatus('syncing', 'Saving…');

  // Update local data
  const newTimestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  exp.desc = desc;
  exp.cat = cat;
  exp.amount = amount;
  exp.paidBy = paidBy;
  exp.edited = "Yes";
  exp.ts = newTimestamp; // Update timestamp on edit

  // Update via db layer (Firebase + Sheets backup)
  try {
    await dbUpdateExpense(exp.id, {
      day: currentEditDay,
      name: exp.name,
      desc: desc,
      cat: cat,
      amount: amount,
      paidBy: paidBy,
      edited: "Yes",
      ts: newTimestamp
    });
    saveLocal();
    render();
    setStatus('ok', 'Synced ✓');
    showToast('Expense updated!', 'ok');
  } catch(e) {
    setStatus('err', 'Update failed');
    showToast('Failed to update', 'err');
  } finally {
    showLoading(false);
    currentEditDay = null;
    currentEditId = null;
  }
}

// ─── DELETE EXPENSE ───────────────────────────────────────
function showDeleteConfirm(day, id) {
  const exp = expenses[day].find(e => String(e.id) === String(id));
  if (!exp) return;

  deleteTarget = { day, id };

  const detailsEl = document.getElementById('confirmDetails');
  detailsEl.querySelector('.desc').textContent = exp.desc;
  detailsEl.querySelector('.amount').textContent = `₹${exp.amount.toLocaleString('en-IN')}`;
  detailsEl.querySelector('.added-by').textContent = `Added by: ${exp.name || '—'}`;
  detailsEl.querySelector('.paid-by').textContent = `Paid by: ${exp.paidBy || '—'}`;

  document.getElementById('confirmOverlay').classList.remove('hidden');
}

function cancelDelete() {
  deleteTarget = null;
  document.getElementById('confirmOverlay').classList.add('hidden');
}

async function confirmDelete() {
  if (!deleteTarget) return;

  const { day, id } = deleteTarget;

  document.getElementById('confirmOverlay').classList.add('hidden');
  showLoading(true);
  setStatus('syncing', 'Archiving…');

  try {
    // Use dbUpdateExpense to set archived flag (works for both Firebase and Sheets)
    await dbUpdateExpense(id, { archived: true });
    setStatus('ok', 'Synced ✓');
    showToast('Expense archived', 'ok');
  } catch(e) {
    setStatus('err', 'Archive failed');
    showToast('Archive failed — check connection', 'err');
    showLoading(false);
    return;
  }

  // Move to archived
  const expense = expenses[day].find(e => String(e.id) === String(id));
  if (expense) {
    archivedExpenses.push({ ...expense, archivedDay: day, archived: "Yes" });
  }

  expenses[day] = expenses[day].filter(e => String(e.id) !== String(id));

  saveLocal();
  showLoading(false);
  deleteTarget = null;
  render();
  renderArchived();
}

// ─── TOGGLE COLLAPSIBLE SECTIONS ──────────────────────────
const collapsedSections = {
  'insights': false,        // Default expanded
  'whoPaid': false,         // Default expanded
  'settlement': false,      // Default expanded (in dashboard)
  'expenseHistory': false,  // Default expanded
  'notes': true,            // Default collapsed
  'archived': true,         // Default collapsed
  'settlementCards': false  // Default expanded (in settlement section)
};

function toggleSection(sectionId) {
  const section = document.getElementById(`${sectionId}-section`);
  const icon = document.getElementById(`${sectionId}-icon`);

  if (!section || !icon) return;

  // Get current state, default to true (collapsed) if not set
  const isCollapsed = collapsedSections[sectionId] !== false;

  if (isCollapsed) {
    // Lazy load data on first expansion
    if (sectionId === 'archived' && !archivedLoaded) {
      loadArchivedExpenses();
    } else if (sectionId === 'notes' && !notesLoaded) {
      loadNotes();
    }

    // Determine display type based on section
    if (sectionId === 'addExpense' || sectionId === 'expenseHistory' || sectionId === 'notes' || sectionId === 'archived') {
      section.style.display = 'block';
    } else if (sectionId === 'insights' || sectionId === 'whoPaid' || sectionId === 'settlement') {
      section.style.display = 'flex';
    } else {
      section.style.display = 'grid';
    }
    icon.textContent = '▼';
    collapsedSections[sectionId] = false;

    // Show filters for expense history
    if (sectionId === 'expenseHistory') {
      const filters = document.getElementById('expenseHistory-filters');
      if (filters) filters.style.display = 'flex';
    }
  } else {
    section.style.display = 'none';
    icon.textContent = '▶';
    collapsedSections[sectionId] = true;

    // Hide filters for expense history
    if (sectionId === 'expenseHistory') {
      const filters = document.getElementById('expenseHistory-filters');
      if (filters) filters.style.display = 'none';
    }
  }
}


// ─── LAZY LOADING FUNCTIONS ──────────────────────────────
async function loadArchivedExpenses() {
  if (archivedLoaded) return; // Already loaded

  try {
    // Show loading overlay
    showLoading(true, 'default', getRandomArchivedLoadingMessage());

    const archivedData = await dbGetArchivedExpenses();

    archivedExpenses = [];
    (archivedData || []).forEach(e => {
      archivedExpenses.push({ ...e, archivedDay: e.day });
    });

    archivedLoaded = true;
    renderArchived();
  } catch (error) {
    console.error('Error loading archived expenses:', error);
    showToast('Failed to load archived expenses', 'err');
  } finally {
    // Hide loader
    showLoading(false);
  }
}

async function loadNotes() {
  if (notesLoaded) return; // Already loaded

  try {
    // Show loading overlay
    showLoading(true, 'default', getRandomNotesLoadingMessage());

    notes = await dbGetAllNotes();
    notesLoaded = true;
    renderNotes();
  } catch (error) {
    console.error('Error loading notes:', error);
    showToast('Failed to load notes', 'err');
  } finally {
    // Hide loader
    showLoading(false);
  }
}


function renderArchived() {
  const tbody = document.getElementById('archived-body');
  tbody.innerHTML = '';

  // Apply filters
  let filteredArchived = archivedExpenses;

  // Filter by day
  if (archivedDayFilterBy !== 'all') {
    filteredArchived = filteredArchived.filter(e => e.archivedDay === parseInt(archivedDayFilterBy));
  }

  // Filter by person
  if (archivedPersonFilterBy !== 'all') {
    filteredArchived = filteredArchived.filter(e => e.name === archivedPersonFilterBy);
  }

  const count = filteredArchived.length;

  // Update count in button
  const countSpan = document.getElementById('archivedCount');
  if (countSpan) countSpan.textContent = archivedExpenses.length; // Show total, not filtered

  const archiveMultiSelectMode = document.getElementById('archiveMultiSelectBtn')?.dataset.active === 'true';

  if (filteredArchived.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="${archiveMultiSelectMode ? 9 : 8}">No archived expenses${archivedDayFilterBy !== 'all' || archivedPersonFilterBy !== 'all' ? ' (filters active)' : ''}</td>`;
    tbody.appendChild(tr);
    renderArchivedPagination(0);
    return;
  }

  // Apply pagination
  const totalPages = Math.ceil(filteredArchived.length / ITEMS_PER_PAGE);
  const page = archivedPage || 1;
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedArchived = filteredArchived.slice(startIdx, endIdx);

  paginatedArchived.forEach((exp, idx) => {
    const cfg = CAT_CONFIG[exp.cat] || CAT_CONFIG.misc;

    // Checkbox for multi-select
    const checkboxHtml = archiveMultiSelectMode
      ? `<input type="checkbox" id="check-archived-${exp.id}" ${selectedArchived.has(exp.id) ? 'checked' : ''} onchange="toggleArchivedSelection('${exp.id}')">`
      : '';

    const tr = document.createElement('tr');
    tr.style.opacity = '0.7';
    tr.innerHTML = `
      ${archiveMultiSelectMode ? `<td style="text-align:center">${checkboxHtml}</td>` : ''}
      <td class="num-col">${startIdx + idx + 1}</td>
      <td data-column="desc" style="font-size:13px">${exp.desc}</td>
      <td data-column="cat" style="white-space:nowrap"><span class="cat-badge" style="color:${cfg.color};background:${cfg.bg}">${cfg.label}</span></td>
      <td data-column="name" style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${exp.name || '—'}</td>
      <td data-column="paidBy" style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${exp.paidBy || '—'}</td>
      <td data-column="amount" class="amount-col" style="white-space:nowrap;text-align:right">₹${Number(exp.amount).toLocaleString('en-IN')}</td>
      <td data-column="day" style="font-size:11px;color:var(--muted);white-space:nowrap">Day ${exp.archivedDay}</td>
      ${!archiveMultiSelectMode ? `<td style="text-align:center;white-space:nowrap">
        <button class="del-btn" onclick="showUnarchiveConfirm('${exp.id}')" title="Unarchive" style="background:var(--accent);color:#0e1412;margin-right:${isAdmin ? '4px' : '0'}">↩️</button>${isAdmin ? `<button class="del-btn" onclick="showPermanentDeleteConfirm('${exp.id}')" title="Delete Permanently">🗑️</button>` : ''}
      </td>` : ''}
    `;
    tbody.appendChild(tr);
  });

  // Render pagination
  renderArchivedPagination(totalPages);
}

// Render archived pagination
function renderArchivedPagination(totalPages) {
  const container = document.getElementById('archived-pagination');
  if (!container) return;

  if (totalPages <= 1) {
    // Show a simple message when there's only one page
    container.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12px;padding:8px">Page 1 of 1</div>`;
    return;
  }

  const page = archivedPage || 1;
  let html = '';

  // Previous button
  html += `<button class="page-btn" onclick="goToArchivedPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>`;

  // Page numbers
  const maxVisible = 7;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="goToArchivedPage(1)">1</button>`;
    if (startPage > 2) {
      html += `<span style="color:var(--muted);padding:0 4px">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToArchivedPage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span style="color:var(--muted);padding:0 4px">...</span>`;
    }
    html += `<button class="page-btn" onclick="goToArchivedPage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="page-btn" onclick="goToArchivedPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next ›</button>`;

  container.innerHTML = html;
}

function goToArchivedPage(page) {
  archivedPage = page;
  renderArchived();
  // Scroll to top of archived section
  const archivedSection = document.getElementById('archived-section');
  if (archivedSection) {
    archivedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function unarchiveExpense(id) {
  const expense = archivedExpenses.find(e => String(e.id) === String(id));
  if (!expense) return;

  showLoading(true);
  setStatus('syncing', 'Unarchiving…');

  try {
    // Use dbUpdateExpense to clear archived flag (works for both Firebase and Sheets)
    await dbUpdateExpense(id, { archived: false });
    setStatus('ok', 'Synced ✓');
    showToast('Expense unarchived', 'ok');
  } catch(e) {
    setStatus('err', 'Unarchive failed');
    showToast('Unarchive failed — check connection', 'err');
    showLoading(false);
    return;
  }

  const day = expense.archivedDay;
  delete expense.archivedDay;
  delete expense.archived;

  expenses[day].push(expense);
  archivedExpenses = archivedExpenses.filter(e => String(e.id) !== String(id));

  saveLocal();
  showLoading(false);
  unarchiveTarget = null;
  render();
  renderArchived();
}

function showPermanentDeleteConfirm(id) {
  const exp = archivedExpenses.find(e => String(e.id) === String(id));
  if (!exp) return;

  permanentDeleteTarget = id;

  const detailsEl = document.getElementById('permanentDeleteDetails');
  detailsEl.querySelector('.desc').textContent = exp.desc;
  detailsEl.querySelector('.amount').textContent = `₹${exp.amount.toLocaleString('en-IN')}`;
  detailsEl.querySelector('.added-by').textContent = `Added by: ${exp.name || '—'}`;
  detailsEl.querySelector('.paid-by').textContent = `Paid by: ${exp.paidBy || '—'}`;

  document.getElementById('permanentDeleteOverlay').classList.remove('hidden');
}

function cancelPermanentDelete() {
  permanentDeleteTarget = null;
  document.getElementById('permanentDeleteOverlay').classList.add('hidden');
}

function showUnarchiveConfirm(id) {
  const exp = archivedExpenses.find(e => String(e.id) === String(id));
  if (!exp) return;

  unarchiveTarget = id;

  const detailsEl = document.getElementById('unarchiveDetails');
  detailsEl.querySelector('.desc').textContent = exp.desc;
  detailsEl.querySelector('.amount').textContent = `₹${exp.amount.toLocaleString('en-IN')}`;
  detailsEl.querySelector('.added-by').textContent = `Added by: ${exp.name || '—'}`;
  detailsEl.querySelector('.paid-by').textContent = `Paid by: ${exp.paidBy || '—'}`;

  document.getElementById('unarchiveOverlay').classList.remove('hidden');
}

function cancelUnarchive() {
  unarchiveTarget = null;
  document.getElementById('unarchiveOverlay').classList.add('hidden');
}

async function confirmUnarchive() {
  if (!unarchiveTarget) return;

  const id = unarchiveTarget;

  document.getElementById('unarchiveOverlay').classList.add('hidden');

  await unarchiveExpense(id);
}

async function confirmPermanentDelete() {
  if (!permanentDeleteTarget) return;

  const id = permanentDeleteTarget;

  document.getElementById('permanentDeleteOverlay').classList.add('hidden');
  showLoading(true);
  setStatus('syncing', 'Deleting permanently…');

  try {
    await dbDeleteExpense(null, id);
    setStatus('ok', 'Synced ✓');
    showToast('Expense deleted permanently', 'ok');
  } catch(e) {
    setStatus('err', 'Delete failed');
    showToast('Delete failed — check connection', 'err');
  }

  archivedExpenses = archivedExpenses.filter(e => String(e.id) !== String(id));
  saveLocal();
  showLoading(false);
  permanentDeleteTarget = null;
  renderArchived();
}

// ─── RENDER ───────────────────────────────────────────────
function render() {
  const tbody = document.getElementById('expenses-body');
  tbody.innerHTML = '';

  // Combine all expenses from all days
  let allExpenses = [];
  tripDays.forEach(dayObj => {
    if (expenses[dayObj.day]) {
      expenses[dayObj.day].forEach(exp => {
        allExpenses.push({ ...exp, day: dayObj.day });
      });
    }
  });

  // Update expense count in section header
  const expensesCountSpan = document.getElementById('expensesCount');
  if (expensesCountSpan) expensesCountSpan.textContent = allExpenses.length;

  // Filter by day
  if (dayFilterBy !== 'all') {
    allExpenses = allExpenses.filter(e => e.day === parseInt(dayFilterBy));
  }

  // Filter by person
  if (filterBy !== 'all') {
    allExpenses = allExpenses.filter(e => e.name === filterBy);
  }

  // Sort expenses
  allExpenses.sort((a, b) => {
    let valA, valB;

    switch(sortBy) {
      case 'desc':
        valA = (a.desc || '').toLowerCase();
        valB = (b.desc || '').toLowerCase();
        break;
      case 'cat':
        valA = (a.cat || '').toLowerCase();
        valB = (b.cat || '').toLowerCase();
        break;
      case 'name':
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
        break;
      case 'paidBy':
        valA = (a.paidBy || '').toLowerCase();
        valB = (b.paidBy || '').toLowerCase();
        break;
      case 'amount':
        valA = a.amount || 0;
        valB = b.amount || 0;
        break;
      case 'time':
      default:
        // For time sorting:
        // - If user hasn't actively sorted yet (initial load), sort purely by timestamp
        // - If user has clicked sort, consider day first then timestamp within day
        if (userHasSorted) {
          const dayA = a.day || 0;
          const dayB = b.day || 0;

          // If different days, sort by day
          if (dayA !== dayB) {
            return sortOrder === 'asc' ? dayA - dayB : dayB - dayA;
          }
        }

        // Same day or user hasn't sorted yet - sort by timestamp
        if (a.createdAt && b.createdAt) {
          // Firebase Timestamp objects - these are absolute timestamps
          valA = a.createdAt.seconds || 0;
          valB = b.createdAt.seconds || 0;
        } else if (a.ts && b.ts) {
          // Parse timestamp string to Date for comparison
          valA = new Date(a.ts).getTime() || 0;
          valB = new Date(b.ts).getTime() || 0;
        } else {
          // Fallback to ID-based sorting (for old entries)
          valA = parseInt((a.id || 'exp_0').split('_')[1]) || 0;
          valB = parseInt((b.id || 'exp_0').split('_')[1]) || 0;
        }
        break;
    }

    if (sortBy === 'amount' || sortBy === 'time') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    } else {
      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });

  if (allExpenses.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    const msg = filterBy !== 'all'
      ? `No expenses from ${filterBy}`
      : dayFilterBy !== 'all'
      ? `No expenses for Day ${dayFilterBy}`
      : `No expenses yet — add one above!`;
    tr.innerHTML = `<td colspan="10">${msg}</td>`;
    tbody.appendChild(tr);
    renderPagination(0);
  } else {
    // Pagination
    const totalPages = Math.ceil(allExpenses.length / ITEMS_PER_PAGE);
    const page = currentPage || 1;
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const paginatedExpenses = allExpenses.slice(startIdx, endIdx);

    paginatedExpenses.forEach((exp, idx) => {
      const cfg = CAT_CONFIG[exp.cat] || CAT_CONFIG.misc;

      // Format time without seconds
      let timeStr = '—';
      if (exp.ts) {
        try {
          const parts = exp.ts.split(',');
          if (parts.length >= 2) {
            const timePart = parts[1].trim();
            const timeMatch = timePart.match(/(\d{1,2}:\d{2})/);
            if (timeMatch) {
              timeStr = timeMatch[1];
              if (timePart.toLowerCase().includes('am')) timeStr += ' AM';
              else if (timePart.toLowerCase().includes('pm')) timeStr += ' PM';
            }
          }
        } catch(e) {
          timeStr = '—';
        }
      }

      const tr = document.createElement('tr');
      tr.id = `row-${exp.id}`;

      // Check if user can edit
      const canEdit = currentUser === exp.name;
      const editIcon = canEdit ? '✏️' : '';

      // Edited badge
      const editedBadge = exp.edited === 'Yes' ? '<span class="edited-badge">EDITED</span>' : '';

      // Description with truncation
      const descId = `desc-${exp.id}`;
      const showTruncated = exp.desc.length > 100;

      // Checkbox for multi-select
      const checkboxHtml = isMultiSelectMode
        ? `<input type="checkbox" id="check-${exp.id}" ${selectedExpenses.has(`${exp.day}:${exp.id}`) ? 'checked' : ''} onchange="toggleExpenseSelection(${exp.day}, '${exp.id}')">`
        : '';

      tr.innerHTML = `
        ${isMultiSelectMode ? `<td style="text-align:center">${checkboxHtml}</td>` : ''}
        <td class="num-col">${startIdx + idx + 1}</td>
        <td data-column="day" style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">Day ${exp.day}</td>
        <td data-column="desc">
          ${editedBadge ? `<div style="margin-bottom:4px">${editedBadge}</div>` : ''}
          <div id="${descId}" class="${showTruncated ? 'desc-truncated' : 'desc-full'}">
            ${exp.desc}
          </div>
          ${showTruncated ? `<span class="show-more-btn" onclick="toggleDesc('${descId}')">Show more...</span>` : ''}
        </td>
        <td data-column="cat" style="white-space:nowrap"><span class="cat-badge" style="color:${cfg.color};background:${cfg.bg}">${cfg.label}</span></td>
        <td data-column="name" style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${exp.name || '—'}</td>
        <td data-column="paidBy" style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${exp.paidBy || '—'}</td>
        <td data-column="time" style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${timeStr}</td>
        <td data-column="amount" class="amount-col" style="white-space:nowrap">${exp.amount > 0 ? '₹' + Number(exp.amount).toLocaleString('en-IN') : '<span style="color:#3a5545">—</span>'}</td>
        ${!isMultiSelectMode ? `<td>${canEdit ? `<button class="del-btn edit-btn" onclick="startInlineEdit(${exp.day}, '${exp.id}')" title="Edit">${editIcon}</button>` : ''}</td>` : ''}
        ${!isMultiSelectMode ? `<td><button class="del-btn" onclick="showDeleteConfirm(${exp.day}, '${exp.id}')" title="Archive">🗃️</button></td>` : ''}
      `;
      tbody.appendChild(tr);
    });

    // Add total row for filtered expenses
    const filteredTotal = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.style.fontWeight = 'bold';
    totalRow.style.backgroundColor = 'rgba(72, 126, 98, 0.15)';
    totalRow.style.borderTop = '2px solid var(--accent)';
    const colspanOffset = isMultiSelectMode ? 1 : 0;
    totalRow.innerHTML = `
      ${isMultiSelectMode ? '<td></td>' : ''}
      <td colspan="${7 + colspanOffset}" style="text-align:right;padding-right:12px">Total ${dayFilterBy !== 'all' ? `(Day ${dayFilterBy})` : ''}:</td>
      <td class="amount-col" style="white-space:nowrap;color:var(--accent)">₹${filteredTotal.toLocaleString('en-IN')}</td>
      ${!isMultiSelectMode ? '<td colspan="2"></td>' : ''}
    `;
    tbody.appendChild(totalRow);

    renderPagination(totalPages);
  }
  updateSummary();
  updateSettlement();
  renderArchived();
}

function updateSummary() {
  // Collect all expenses from all days
  let all = [];
  tripDays.forEach(dayObj => {
    if (expenses[dayObj.day]) {
      all = all.concat(expenses[dayObj.day]);
    }
  });

  const total = all.reduce((s, e) => s + (e.amount || 0), 0);
  const cats = { food: 0, fuel: 0, stay: 0, transport: 0, entry: 0, misc: 0 };
  all.forEach(e => { if (cats[e.cat] !== undefined) cats[e.cat] += (e.amount || 0); });

  // Calculate paid-by totals
  const paidBy = { Afsar: 0, Adham: 0, Aakif: 0, Sahlaan: 0 };
  all.forEach(e => {
    if (paidBy[e.paidBy] !== undefined) {
      paidBy[e.paidBy] += (e.amount || 0);
    }
  });

  document.getElementById('totalAll').textContent = total.toLocaleString('en-IN');
  document.getElementById('totalFood').textContent = cats.food.toLocaleString('en-IN');
  document.getElementById('totalFuel').textContent = cats.fuel.toLocaleString('en-IN');
  document.getElementById('totalStay').textContent = cats.stay.toLocaleString('en-IN');
  document.getElementById('totalTransport').textContent = cats.transport.toLocaleString('en-IN');
  document.getElementById('totalEntry').textContent = cats.entry.toLocaleString('en-IN');
  document.getElementById('totalMisc').textContent = cats.misc.toLocaleString('en-IN');

  document.getElementById('paidAfsar').textContent = paidBy.Afsar.toLocaleString('en-IN');
  document.getElementById('paidAdham').textContent = paidBy.Adham.toLocaleString('en-IN');
  document.getElementById('paidAakif').textContent = paidBy.Aakif.toLocaleString('en-IN');
  document.getElementById('paidSahlaan').textContent = paidBy.Sahlaan.toLocaleString('en-IN');

  // Update budget card
  updateBudgetDisplay(total);
}

// ─── SETTLEMENT ───────────────────────────────────────────
async function updateSettlement() {
  // Collect all expenses from all days
  let all = [];
  tripDays.forEach(dayObj => {
    if (expenses[dayObj.day]) {
      all = all.concat(expenses[dayObj.day]);
    }
  });

  const total = all.reduce((s, e) => s + (e.amount || 0), 0);

  // Split among all 4 people
  const splitAmong = ['Afsar', 'Adham', 'Aakif', 'Sahlaan'];
  const sharePerPerson = total / splitAmong.length;

  // Calculate how much each person paid
  const paidBy = { Afsar: 0, Adham: 0, Aakif: 0, Sahlaan: 0 };
  all.forEach(e => {
    if (paidBy[e.paidBy] !== undefined) {
      paidBy[e.paidBy] += (e.amount || 0);
    }
  });

  // Calculate balance (positive = gets money, negative = owes money)
  const balance = {};
  splitAmong.forEach(person => {
    balance[person] = paidBy[person] - sharePerPerson;
  });

  // Adjust for confirmed payments
  try {
    const confirmedPayments = await dbGetConfirmedPayments();
    confirmedPayments.forEach(payment => {
      // Person who sent payment loses money (negative adjustment)
      if (balance[payment.from] !== undefined) {
        balance[payment.from] -= payment.amount;
      }
      // Person who received payment gains money (positive adjustment)
      if (balance[payment.to] !== undefined) {
        balance[payment.to] += payment.amount;
      }
    });
  } catch (error) {
    console.error('Error loading confirmed payments for settlement:', error);
    // Continue with unadjusted balance if payment loading fails
  }

  // Generate settlement instructions
  const settlements = calculateSettlements(balance);

  // Render settlement cards
  const grid = document.getElementById('settlementCards-section') || document.getElementById('settlement-section');
  grid.innerHTML = '';

  splitAmong.forEach(person => {
    const card = document.createElement('div');
    const isBalanced = Math.abs(balance[person]) < 1;

    card.className = `settlement-card${isBalanced ? ' balanced' : ''}`;

    let actionHTML = '';
    const personSettlements = settlements.filter(s => s.from === person || s.to === person);

    if (isBalanced) {
      actionHTML = '<div class="action settled">✅ All settled up!</div>';
    } else if (personSettlements.length > 0) {
      personSettlements.forEach(s => {
        if (s.from === person) {
          actionHTML += `
            <div class="action owes">
              Pay ₹${s.amount.toLocaleString('en-IN')} to ${s.to}
              ${person === currentUser ? `<button class="go-to-payments-btn" onclick="navigateTo('payments')" style="margin-top:8px;width:100%;padding:8px;background:var(--surface);color:var(--accent);border:1px solid var(--accent);border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;transition:all 0.2s" onmouseover="this.style.background='rgba(93,186,138,0.15)'" onmouseout="this.style.background='var(--surface)'">Go to Payments →</button>` : ''}
            </div>
          `;
        } else {
          actionHTML += `<div class="action gets">Gets ₹${s.amount.toLocaleString('en-IN')} from ${s.from}</div>`;
        }
      });
    }

    const emojiMap = { 'Afsar': '👨‍💻', 'Adham': '👨‍💻', 'Aakif': '👨‍💻', 'Sahlaan': '👨‍⚕️' };

    card.innerHTML = `
      <div class="person-name">
        <span class="emoji">${emojiMap[person] || '👤'}</span>
        ${person}
      </div>
      <div class="stat-row">
        <span class="label">Paid</span>
        <span class="value">₹${paidBy[person].toLocaleString('en-IN')}</span>
      </div>
      <div class="stat-row">
        <span class="label">Share</span>
        <span class="value">₹${Math.round(sharePerPerson).toLocaleString('en-IN')}</span>
      </div>
      <div class="divider"></div>
      <div class="stat-row">
        <span class="label">Balance</span>
        <span class="value" style="color:${balance[person] >= 0 ? 'var(--accent)' : 'var(--accent3)'}">
          ${balance[person] >= 0 ? '+₹' : '−₹'}${Math.abs(Math.round(balance[person])).toLocaleString('en-IN')}
        </span>
      </div>
      ${actionHTML}
    `;

    grid.appendChild(card);
  });
}

function calculateSettlements(balance) {
  // Create arrays of people who owe and who should receive
  const owes = [];
  const gets = [];

  Object.keys(balance).forEach(person => {
    const amount = Math.round(balance[person]);
    if (amount < -0.5) {
      owes.push({ person, amount: Math.abs(amount) });
    } else if (amount > 0.5) {
      gets.push({ person, amount });
    }
  });

  // Calculate minimum transactions
  const settlements = [];
  let i = 0, j = 0;

  while (i < owes.length && j < gets.length) {
    const ower = owes[i];
    const receiver = gets[j];
    const amount = Math.min(ower.amount, receiver.amount);

    settlements.push({
      from: ower.person,
      to: receiver.person,
      amount: amount
    });

    ower.amount -= amount;
    receiver.amount -= amount;

    if (ower.amount === 0) i++;
    if (receiver.amount === 0) j++;
  }

  return settlements;
}

// ─── SORT & FILTER ────────────────────────────────────────
function sortByColumn(column) {
  userHasSorted = true; // Mark that user has actively sorted

  if (sortBy === column) {
    // Toggle sort order
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    // New column, default to ascending
    sortBy = column;
    sortOrder = 'asc';
  }

  // Update all table headers
  document.querySelectorAll('thead th.sortable').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
  });

  // Mark current sorted column
  document.querySelectorAll(`thead th.sortable[onclick="sortByColumn('${column}')"]`).forEach(th => {
    th.classList.add(sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
  });

  render();
}

// ─── CUSTOM FILTER DROPDOWNS ──────────────────────────────
function toggleFilterDropdown(type) {
  const dropdown = document.getElementById(`${type}FilterDropdown`);
  const isActive = dropdown.classList.contains('active');

  // Close all dropdowns first
  document.querySelectorAll('.filter-dropdown').forEach(d => {
    d.classList.remove('active');
    // Reset positioning
    d.style.top = '';
    d.style.bottom = '';
    d.style.marginTop = '';
    d.style.marginBottom = '';
  });

  // Toggle the clicked dropdown
  if (!isActive) {
    dropdown.classList.add('active');

    // Check viewport and adjust position if needed
    setTimeout(() => {
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // If dropdown goes below viewport, open it upward
      if (dropdownRect.bottom > viewportHeight - 20) {
        dropdown.style.top = 'auto';
        dropdown.style.bottom = '100%';
        dropdown.style.marginTop = '0';
        dropdown.style.marginBottom = '4px';
      }
    }, 0);
  }
}

function selectDayFilter(value, label) {
  dayFilterBy = value;
  document.getElementById('dayFilterLabel').textContent = label;

  // Update selected state
  document.querySelectorAll('#dayFilterDropdown .filter-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

  // Close dropdown
  document.getElementById('dayFilterDropdown').classList.remove('active');

  currentPage = 1;
  render();
}

function selectPersonFilter(value, label) {
  filterBy = value;
  document.getElementById('personFilterLabel').textContent = label;

  // Update selected state
  document.querySelectorAll('#personFilterDropdown .filter-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

  // Close dropdown
  document.getElementById('personFilterDropdown').classList.remove('active');

  currentPage = 1;
  render();
}

// Archived filters
function selectArchivedDayFilter(value, label) {
  archivedDayFilterBy = value;
  document.getElementById('archivedDayFilterLabel').textContent = label;

  // Update selected state
  document.querySelectorAll('#archivedDayFilterDropdown .filter-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

  // Close dropdown
  document.getElementById('archivedDayFilterDropdown').classList.remove('active');

  // Reset to first page when filter changes
  archivedPage = 1;
  renderArchived();
}

function selectArchivedPersonFilter(value, label) {
  archivedPersonFilterBy = value;
  document.getElementById('archivedPersonFilterLabel').textContent = label;

  // Update selected state
  document.querySelectorAll('#archivedPersonFilterDropdown .filter-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

  // Close dropdown
  document.getElementById('archivedPersonFilterDropdown').classList.remove('active');

  // Reset to first page when filter changes
  archivedPage = 1;
  renderArchived();
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.filter-btn') && !e.target.closest('.filter-dropdown')) {
    document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('active'));
  }
  if (!e.target.closest('.custom-select')) {
    document.querySelectorAll('.custom-select-dropdown').forEach(d => d.classList.remove('active'));
  }
  if (!e.target.closest('.user-chip') && !e.target.closest('.profile-dropdown')) {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) profileDropdown.style.display = 'none';
  }
});

function filterExpenses() {
  filterBy = document.getElementById('filterSelect')?.value || filterBy;
  currentPage = 1; // Reset to first page
  render();
}

function filterByDay() {
  dayFilterBy = document.getElementById('dayFilter')?.value || dayFilterBy;
  currentPage = 1; // Reset to first page
  render();
}

function toggleDesc(descId) {
  const el = document.getElementById(descId);
  const btn = el.nextElementSibling;

  if (el.classList.contains('desc-truncated')) {
    el.classList.remove('desc-truncated');
    el.classList.add('desc-full');
    if (btn) btn.textContent = 'Show less';
  } else {
    el.classList.remove('desc-full');
    el.classList.add('desc-truncated');
    if (btn) btn.textContent = 'Show more...';
  }
}

// ─── PAGINATION ───────────────────────────────────────────
function renderPagination(totalPages) {
  const container = document.getElementById('expenses-pagination');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const page = currentPage || 1;
  let html = '';

  // Previous button
  html += `<button class="page-btn" onclick="goToPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>`;

  // Page numbers
  const maxVisible = 7;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) {
      html += `<span style="color:var(--muted);padding:0 4px">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span style="color:var(--muted);padding:0 4px">...</span>`;
    }
    html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="page-btn" onclick="goToPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next ›</button>`;

  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  render();
  // Scroll to top of table
  document.getElementById('expenses-body').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── UI HELPERS ───────────────────────────────────────────
function setStatus(state, text) {
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot' + (state ? ' ' + state : '');
  document.getElementById('statusText').textContent = text;
}
// ─── LOADING & TOAST ──────────────────────────────────────
function showLoading(show, type = 'default', customMessage = null) {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');

  if (show) {
    // Set a random loading message based on type or use custom message
    if (loadingText) {
      if (customMessage) {
        loadingText.textContent = customMessage;
      } else if (type === 'auth') {
        loadingText.textContent = getRandomAuthMessage();
      } else if (type === 'checkingUser') {
        loadingText.textContent = getRandomCheckingUserMessage();
      } else {
        loadingText.textContent = getRandomLoadingMessage();
      }
    }
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

let toastTimer;
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 2800);
}

// ─── BUDGET MANAGEMENT ────────────────────────────────────
function editBudget() {
  const currentBudget = tripBudget || 0;
  document.getElementById('budgetInput').value = currentBudget > 0 ? currentBudget : '';
  document.getElementById('budgetOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('budgetInput').focus(), 100);
}

function cancelBudgetEdit() {
  document.getElementById('budgetOverlay').classList.add('hidden');
  document.getElementById('budgetInput').value = '';
}

async function confirmBudgetEdit() {
  const budgetInput = document.getElementById('budgetInput');
  const newBudget = budgetInput.value.trim();

  if (!newBudget) {
    showToast('Please enter a budget amount', 'err');
    return;
  }

  const budgetAmount = parseFloat(newBudget);
  if (isNaN(budgetAmount) || budgetAmount < 0) {
    showToast('Invalid budget amount', 'err');
    return;
  }

  // Close dialog immediately
  document.getElementById('budgetOverlay').classList.add('hidden');
  document.getElementById('budgetInput').value = '';

  // Show loading
  showLoading(true);
  setStatus('syncing', 'Saving budget…');

  tripBudget = budgetAmount;
  localStorage.setItem('coorg_budget', tripBudget);

  // Save budget to Firebase (and optionally to Sheets as backup)
  try {
    await dbSetBudget(budgetAmount);
    setStatus('ok', 'Synced ✓');
  } catch(e) {
    console.error('Failed to save budget:', e);
    setStatus('err', 'Saved locally only');
    // Continue anyway - saved locally
  }

  // Collect all expenses from all days
  let all = [];
  tripDays.forEach(dayObj => {
    if (expenses[dayObj.day]) {
      all = all.concat(expenses[dayObj.day]);
    }
  });
  const total = all.reduce((s, e) => s + (e.amount || 0), 0);
  updateBudgetDisplay(total);

  showLoading(false);
  showToast('Budget updated!', 'ok');
}

function updateBudgetDisplay(totalSpent) {
  const budgetCard = document.getElementById('budgetCard');
  const totalCard = document.getElementById('totalCard');
  const budgetAmountEl = document.getElementById('budgetAmount');
  const budgetRemainingEl = document.getElementById('budgetRemaining');

  if (tripBudget === 0) {
    budgetAmountEl.textContent = '0';
    budgetRemainingEl.textContent = 'Set budget';
    budgetRemainingEl.style.color = 'var(--muted)';
    budgetCard.classList.remove('over-budget', 'within-budget');
    totalCard.classList.remove('near-budget', 'over-budget');
    return;
  }

  budgetAmountEl.textContent = tripBudget.toLocaleString('en-IN');

  const remaining = tripBudget - totalSpent;
  const percentageUsed = (totalSpent / tripBudget) * 100;

  // Update budget card
  if (remaining < 0) {
    budgetCard.classList.add('over-budget');
    budgetCard.classList.remove('within-budget');
    budgetRemainingEl.textContent = `Over by ₹${Math.abs(remaining).toLocaleString('en-IN')}`;
  } else {
    budgetCard.classList.add('within-budget');
    budgetCard.classList.remove('over-budget');
    budgetRemainingEl.textContent = `₹${remaining.toLocaleString('en-IN')} left`;
  }

  // Update total card color based on budget
  totalCard.classList.remove('near-budget', 'over-budget');
  if (percentageUsed > 100) {
    totalCard.classList.add('over-budget'); // Red - over budget
  } else if (percentageUsed >= 85) {
    totalCard.classList.add('near-budget'); // Orange - near budget (85%+)
  }
  // else: stays green (default)
}

// Handle Enter key in budget input
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('budgetInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmBudgetEdit();
    if (e.key === 'Escape') cancelBudgetEdit();
  });

  // Handle Enter key in password inputs
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handlePasswordSubmit();
      if (e.key === 'Escape') backToNameSelection();
    });
  }

  const confirmPasswordInput = document.getElementById('confirmPasswordInput');
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSetPassword();
      if (e.key === 'Escape') backToNameSelection();
    });
  }

  // Handle Enter key in change password inputs
  const currentPasswordInput = document.getElementById('currentPasswordInput');
  const newPasswordChange = document.getElementById('newPasswordChange');
  const confirmPasswordChange = document.getElementById('confirmPasswordChange');

  if (currentPasswordInput) {
    currentPasswordInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        newPasswordChange.focus();
      }
      if (e.key === 'Escape') cancelChangePassword();
    });
  }

  if (newPasswordChange) {
    newPasswordChange.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmPasswordChange.focus();
      }
      if (e.key === 'Escape') cancelChangePassword();
    });
  }

  if (confirmPasswordChange) {
    confirmPasswordChange.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleChangePassword();
      if (e.key === 'Escape') cancelChangePassword();
    });
  }

  // Load column visibility preferences
  loadColumnVisibility();

  // Edit dialog keyboard shortcuts
  document.getElementById('editAmount').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  });
});

// Load budget from localStorage on init
window.addEventListener('load', function() {
  const savedBudget = localStorage.getItem('coorg_budget');
  if (savedBudget) {
    tripBudget = parseFloat(savedBudget);
  }
});

// ============================================
// NOTES/TASKS MANAGEMENT
// ============================================

// Render notes list
function renderNotes() {
  const notesList = document.getElementById('notesList');
  if (!notesList) return;

  // Update notes count
  const notesCountEl = document.getElementById('notesCount');
  if (notesCountEl) {
    notesCountEl.textContent = notes.length;
  }

  if (notes.length === 0) {
    notesList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:14px">No notes yet. Click "Add Note" to create one.</div>';
    renderNotesPagination(0);
    return;
  }

  // Apply person filter
  let filteredNotes = notes;
  if (notePersonFilterBy !== 'all') {
    filteredNotes = notes.filter(note => note.createdBy === notePersonFilterBy);
  }

  if (filteredNotes.length === 0) {
    notesList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:14px">No notes match the filter.</div>';
    renderNotesPagination(0);
    return;
  }

  // Sort notes by creation time (newest first)
  filteredNotes.sort((a, b) => {
    let timeA = 0, timeB = 0;

    // Get timestamp from createdAt
    if (a.createdAt) {
      if (a.createdAt.seconds) {
        timeA = a.createdAt.seconds;
      } else if (typeof a.createdAt === 'string') {
        timeA = new Date(a.createdAt).getTime() / 1000;
      }
    }

    if (b.createdAt) {
      if (b.createdAt.seconds) {
        timeB = b.createdAt.seconds;
      } else if (typeof b.createdAt === 'string') {
        timeB = new Date(b.createdAt).getTime() / 1000;
      }
    }

    // Sort descending (newest first)
    return timeB - timeA;
  });

  // Apply pagination
  const totalPages = Math.ceil(filteredNotes.length / ITEMS_PER_PAGE);
  const page = notesPage || 1;
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedNotes = filteredNotes.slice(startIdx, endIdx);

  notesList.innerHTML = paginatedNotes.map((note, idx) => {
    const isCompleted = note.completed || false;
    const textStyle = isCompleted ? 'text-decoration:line-through;color:#8a9d92' : '';
    const createdBy = note.createdBy || '—';
    const isOwner = note.createdBy === currentUser;
    const isEdited = note.edited || false;
    const noteTextId = `note-text-${note.id}`;
    const toggleId = `note-toggle-${note.id}`;

    // Handle timestamp - prefer createdAtLocal (formatted string), fallback to Firebase timestamp
    let createdAt = '—';
    if (note.createdAtLocal && typeof note.createdAtLocal === 'string') {
      createdAt = note.createdAtLocal;
    } else if (note.createdAt) {
      if (typeof note.createdAt === 'string') {
        createdAt = note.createdAt;
      } else if (note.createdAt.toDate) {
        // Firebase Timestamp object
        createdAt = note.createdAt.toDate().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    }

    // Edited badge
    const editedBadge = isEdited ? '<span style="display:inline-block;font-size:10px;padding:2px 6px;background:#2a2410;border:1px solid #f5c842;color:#f5c842;border-radius:4px;font-family:\'DM Mono\',monospace;margin-bottom:4px">edited</span>' : '';

    // Completed badge with who completed it
    const completedInfo = isCompleted && note.completedBy ? `<div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;margin-top:4px">✓ Completed by ${note.completedBy}${note.completedAt ? ` • ${note.completedAt}` : ''}</div>` : '';

    return `
      <div class="note-item" style="display:flex;gap:12px;padding:12px;background:rgba(72, 126, 98, 0.1);border-radius:8px;margin-bottom:8px;align-items:center">
        ${isNoteMultiSelectMode && !isCompleted ? `
          <input
            type="checkbox"
            id="check-note-${note.id}"
            ${selectedNotes.has(note.id) ? 'checked' : ''}
            onchange="event.stopPropagation();toggleNoteSelection('${note.id}')"
            onclick="event.stopPropagation()"
            style="flex-shrink:0"
          />
        ` : isNoteMultiSelectMode && isCompleted ? `
          <div style="width:20px;flex-shrink:0"></div>
        ` : `
          <input
            type="radio"
            class="note-radio"
            ${isCompleted ? 'checked' : ''}
            onchange="event.stopPropagation();showMarkCompleteDialog('${note.id}')"
            onclick="event.stopPropagation()"
            ${isCompleted ? 'disabled' : ''}
          />
        `}
        <div style="flex:1">
          ${editedBadge ? `<div>${editedBadge}</div>` : ''}
          <div id="${noteTextId}" style="font-size:14px;line-height:1.5;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--text);${textStyle}"></div>
          <button id="${toggleId}" onclick="toggleNoteExpand('${noteTextId}', '${toggleId}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:12px;padding:0;margin-top:4px;font-family:'DM Sans',sans-serif;display:none">Show more</button>
          <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;margin-top:8px">
            👤 ${createdBy} • 🕐 ${createdAt}
          </div>
          ${completedInfo}
        </div>
        ${!isNoteMultiSelectMode && isOwner && !isCompleted ? `
          <button
            onclick="event.stopPropagation();showEditNoteDialog('${note.id}')"
            style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0 4px;margin-right:4px"
            title="Edit note"
          >✏️</button>
          <button
            onclick="event.stopPropagation();showDeleteNoteDialog('${note.id}')"
            style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0 4px"
            title="Delete note"
          >🗑️</button>
        ` : !isNoteMultiSelectMode && !isOwner ? '' : isCompleted ? `
          <div style="width:44px;flex-shrink:0"></div>
        ` : ''}
      </div>
    `;
  }).join('');

  // After rendering, set text content and check if truncation is needed
  // Use setTimeout to ensure DOM has been painted and heights are calculated
  setTimeout(() => {
    paginatedNotes.forEach(note => {
      const textEl = document.getElementById(`note-text-${note.id}`);
      const toggleEl = document.getElementById(`note-toggle-${note.id}`);
      if (textEl && toggleEl) {
        textEl.textContent = note.text;
        // Check if text is truncated (scrollHeight > clientHeight)
        if (textEl.scrollHeight > textEl.clientHeight) {
          toggleEl.style.display = 'inline-block';
        }
      }
    });
  }, 0);

  // Render pagination
  renderNotesPagination(totalPages);
}

// Render notes pagination
function renderNotesPagination(totalPages) {
  const container = document.getElementById('notes-pagination');
  if (!container) return;

  if (totalPages <= 1) {
    // Show a simple message when there's only one page
    container.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12px;padding:8px">Page 1 of 1</div>`;
    return;
  }

  const page = notesPage || 1;
  let html = '';

  // Previous button
  html += `<button class="page-btn" onclick="goToNotesPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>`;

  // Page numbers
  const maxVisible = 7;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="goToNotesPage(1)">1</button>`;
    if (startPage > 2) {
      html += `<span style="color:var(--muted);padding:0 4px">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToNotesPage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span style="color:var(--muted);padding:0 4px">...</span>`;
    }
    html += `<button class="page-btn" onclick="goToNotesPage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="page-btn" onclick="goToNotesPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next ›</button>`;

  container.innerHTML = html;
}

function goToNotesPage(page) {
  notesPage = page;
  renderNotes();
  // Scroll to top of notes section
  const notesSection = document.getElementById('notes-section');
  if (notesSection) {
    notesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Show add note dialog
function showAddNoteDialog() {
  document.getElementById('addNoteOverlay').classList.remove('hidden');
  document.getElementById('noteText').value = '';
  document.getElementById('noteText').focus();
}

// Cancel add note
function cancelAddNote() {
  document.getElementById('addNoteOverlay').classList.add('hidden');
}

// Add new note
async function addNote() {
  const text = document.getElementById('noteText').value.trim();

  if (!text) {
    showToast('Please enter note text', 'err');
    return;
  }

  // Close popup and show loading immediately
  cancelAddNote();
  showLoading(true);
  setStatus('syncing', 'Adding note...');

  try {
    const ts = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const note = {
      text: text,
      completed: false,
      createdBy: currentUser,
      createdAt: firebase.firestore.Timestamp.now(), // Use Firebase Timestamp for proper sorting
      createdAtLocal: ts
    };

    const id = await dbAddNote(note);
    notes.push({ id, ...note });

    renderNotes();
    setStatus('ok', 'Synced ✓');
    showToast('Note added!', 'ok');
  } catch (error) {
    console.error('Error adding note:', error);
    setStatus('err', 'Failed');
    showToast('Failed to add note', 'err');
  } finally {
    showLoading(false);
  }
}

// Toggle note completion
let markCompleteTargetId = null;
let editNoteTargetId = null;

function showMarkCompleteDialog(id) {
  markCompleteTargetId = id;
  document.getElementById('markCompleteOverlay').classList.remove('hidden');
}

function cancelMarkComplete() {
  markCompleteTargetId = null;
  document.getElementById('markCompleteOverlay').classList.add('hidden');
  // Re-render notes to reset radio button state
  renderNotes();
}

async function confirmMarkComplete() {
  if (!markCompleteTargetId) return;

  document.getElementById('markCompleteOverlay').classList.add('hidden');
  showLoading(true);

  try {
    const note = notes.find(n => n.id === markCompleteTargetId);
    if (!note) return;

    const completedTimestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    note.completed = true;
    note.completedBy = currentUser;
    note.completedAt = completedTimestamp;

    await dbUpdateNote(markCompleteTargetId, {
      completed: true,
      completedBy: currentUser,
      completedAt: completedTimestamp
    });

    renderNotes();
    showToast('Note marked as complete', 'ok');
  } catch (error) {
    console.error('Error marking note complete:', error);
    showToast('Failed to mark note complete', 'err');
  } finally {
    showLoading(false);
    markCompleteTargetId = null;
  }
}

// Edit note functions
function showEditNoteDialog(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  editNoteTargetId = id;
  document.getElementById('editNoteText').value = note.text;
  document.getElementById('editNoteOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('editNoteText').focus(), 100);
}

function cancelEditNote() {
  editNoteTargetId = null;
  document.getElementById('editNoteText').value = '';
  document.getElementById('editNoteOverlay').classList.add('hidden');
}

async function saveEditNote() {
  if (!editNoteTargetId) return;

  const newText = document.getElementById('editNoteText').value.trim();
  if (!newText) {
    showToast('Note cannot be empty', 'err');
    return;
  }

  document.getElementById('editNoteOverlay').classList.add('hidden');
  showLoading(true);

  try {
    const note = notes.find(n => n.id === editNoteTargetId);
    if (!note) return;

    note.text = newText;
    note.edited = true;
    await dbUpdateNote(editNoteTargetId, { text: newText, edited: true });

    renderNotes();
    showToast('Note updated', 'ok');
  } catch (error) {
    console.error('Error updating note:', error);
    showToast('Failed to update note', 'err');
  } finally {
    showLoading(false);
    editNoteTargetId = null;
  }
}

async function toggleNoteComplete(id) {
  showLoading(true);

  try {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    note.completed = !note.completed;
    await dbUpdateNote(id, { completed: note.completed });

    renderNotes();
    showLoading(false);
  } catch (error) {
    console.error('Error toggling note:', error);
    // Revert on error
    const note = notes.find(n => n.id === id);
    if (note) note.completed = !note.completed;
    renderNotes();
    showLoading(false);
    showToast('Failed to update note', 'err');
  }
}

// Delete note
let deleteNoteTarget = null;

function showDeleteNoteDialog(id) {
  deleteNoteTarget = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;

  document.getElementById('deleteNoteText').textContent = note.text;

  // Show creator and time info
  const createdBy = note.createdBy || '—';
  let createdAt = '—';
  if (note.createdAtLocal && typeof note.createdAtLocal === 'string') {
    createdAt = note.createdAtLocal;
  } else if (note.createdAt && note.createdAt.toDate) {
    createdAt = note.createdAt.toDate().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  document.getElementById('deleteNoteInfo').textContent = `👤 ${createdBy} • 🕐 ${createdAt}`;

  document.getElementById('deleteNoteOverlay').classList.remove('hidden');
}

function cancelDeleteNote() {
  deleteNoteTarget = null;
  document.getElementById('deleteNoteOverlay').classList.add('hidden');
}

async function confirmDeleteNote() {
  if (!deleteNoteTarget) return;

  document.getElementById('deleteNoteOverlay').classList.add('hidden');
  showLoading(true);
  setStatus('syncing', 'Deleting note...');

  try {
    await dbDeleteNote(deleteNoteTarget);
    notes = notes.filter(n => n.id !== deleteNoteTarget);

    renderNotes();
    setStatus('ok', 'Synced ✓');
    showToast('Note deleted', 'ok');
  } catch (error) {
    console.error('Error deleting note:', error);
    setStatus('err', 'Failed');
    showToast('Failed to delete note', 'err');
  } finally {
    showLoading(false);
    deleteNoteTarget = null;
  }
}

// ============================================
// NOTES MULTI-SELECT FUNCTIONS
// ============================================

function toggleNoteMultiSelect() {
  isNoteMultiSelectMode = !isNoteMultiSelectMode;
  selectedNotes.clear();

  const btn = document.getElementById('noteMultiSelectBtn');
  const addBtn = document.getElementById('addNoteBtn');

  if (isNoteMultiSelectMode) {
    btn.textContent = 'Cancel Selection';
    btn.style.background = 'rgba(232, 110, 138, 0.2)';
    if (addBtn) addBtn.style.display = 'none';
    updateNoteBulkActions(); // Update which actions to show
  } else {
    btn.textContent = '☑️ Select Multiple';
    btn.style.background = 'rgba(72, 126, 98, 0.2)';
    if (addBtn) addBtn.style.display = 'inline-block';
    const bulkActions = document.getElementById('noteBulkActions');
    if (bulkActions) bulkActions.style.display = 'none';
  }

  renderNotes();
}

// Toggle note selection
function toggleNoteSelection(id) {
  if (selectedNotes.has(id)) {
    selectedNotes.delete(id);
  } else {
    selectedNotes.add(id);
  }

  // Update checkbox visual state
  const checkbox = document.getElementById(`check-note-${id}`);
  if (checkbox) {
    checkbox.checked = selectedNotes.has(id);
  }

  // Update bulk action buttons
  updateNoteBulkActions();
}

// Update note bulk action buttons based on selection
function updateNoteBulkActions() {
  const bulkActions = document.getElementById('noteBulkActions');
  const completeBtn = document.getElementById('bulkCompleteNotesBtn');
  const deleteBtn = document.getElementById('bulkDeleteNotesBtn');

  if (selectedNotes.size === 0) {
    // No selection - hide entire bulk actions container
    if (bulkActions) bulkActions.style.display = 'none';
    return;
  }

  // Show bulk actions container when there's selection
  if (bulkActions) bulkActions.style.display = 'flex';

  // Check if selection includes any completed notes and check ownership
  let hasCompleted = false;
  let hasIncomplete = false;
  let allOwnedByCurrentUser = true;

  selectedNotes.forEach(id => {
    const note = notes.find(n => n.id === id);
    if (note) {
      if (note.completed) {
        hasCompleted = true;
      } else {
        hasIncomplete = true;
      }
      // Check if note is owned by current user
      if (note.createdBy !== currentUser) {
        allOwnedByCurrentUser = false;
      }
    }
  });

  // Show/hide buttons based on selection and ownership
  if (hasCompleted && hasIncomplete) {
    // Mixed selection - show complete and delete (if owned)
    if (completeBtn) {
      completeBtn.style.display = 'inline-block';
      completeBtn.disabled = false;
      completeBtn.textContent = `Complete Selected (${selectedNotes.size})`;
    }
    if (deleteBtn) {
      if (allOwnedByCurrentUser) {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.disabled = false;
        deleteBtn.textContent = `Delete Selected (${selectedNotes.size})`;
      } else {
        deleteBtn.style.display = 'none';
      }
    }
  } else if (hasCompleted) {
    // Only completed notes - only show delete if all owned by current user
    if (completeBtn) completeBtn.style.display = 'none';
    if (deleteBtn) {
      if (allOwnedByCurrentUser) {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.disabled = false;
        deleteBtn.textContent = `Delete Selected (${selectedNotes.size})`;
      } else {
        deleteBtn.style.display = 'none';
      }
    }
  } else {
    // Only incomplete notes - show complete always, delete only if all owned
    if (completeBtn) {
      completeBtn.style.display = 'inline-block';
      completeBtn.disabled = false;
      completeBtn.textContent = `Mark as Complete (${selectedNotes.size})`;
    }
    if (deleteBtn) {
      if (allOwnedByCurrentUser) {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.disabled = false;
        deleteBtn.textContent = `Delete Selected (${selectedNotes.size})`;
      } else {
        deleteBtn.style.display = 'none';
      }
    }
  }
}


function toggleNoteSelection(id) {
  if (selectedNotes.has(id)) {
    selectedNotes.delete(id);
  } else {
    selectedNotes.add(id);
  }

  // Update checkbox visual state
  const checkbox = document.getElementById(`check-note-${id}`);
  if (checkbox) {
    checkbox.checked = selectedNotes.has(id);
  }

  // Update bulk action buttons
  updateNoteBulkActions();
}

function bulkCompleteNotes() {
  if (selectedNotes.size === 0) return;

  // Get note details for confirmation
  const notesToComplete = [];
  selectedNotes.forEach(id => {
    const note = notes.find(n => n.id === id);
    if (note && !note.completed) {
      notesToComplete.push(note);
    }
  });

  if (notesToComplete.length === 0) {
    showToast('No incomplete notes selected', 'err');
    return;
  }

  // Show confirmation dialog
  showBulkCompleteNotesConfirm(notesToComplete);
}

function showBulkCompleteNotesConfirm(notesArray) {
  const overlay = document.getElementById('bulkCompleteNotesOverlay');
  const detailsEl = document.getElementById('bulkCompleteNotesDetails');

  let html = `<div style="max-height:300px;overflow-y:auto;margin:16px 0;padding:4px">`;
  notesArray.forEach((note, idx) => {
    html += `<div style="padding:12px 14px;background:rgba(72, 126, 98, 0.15);margin-bottom:8px;border-radius:8px;border-left:3px solid var(--accent)">
      <div style="font-weight:500;margin-bottom:6px;color:var(--text);font-size:14px">${idx + 1}. ${note.text}</div>
      <div style="font-size:11px;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap;font-family:'DM Sans',sans-serif">
        <span style="display:flex;align-items:center;gap:4px">👤 ${note.createdBy || '—'}</span>
      </div>
    </div>`;
  });
  html += `</div>`;

  detailsEl.innerHTML = html;
  overlay.classList.remove('hidden');
}

function cancelBulkCompleteNotes() {
  document.getElementById('bulkCompleteNotesOverlay').classList.add('hidden');
}

async function confirmBulkCompleteNotes() {
  document.getElementById('bulkCompleteNotesOverlay').classList.add('hidden');
  showLoading(true);

  try {
    const updatePromises = [];
    selectedNotes.forEach(id => {
      const note = notes.find(n => n.id === id);
      if (note && !note.completed) {
        note.completed = true;
        note.completedBy = currentUser;
        note.completedAt = new Date().toISOString();
        updatePromises.push(dbUpdateNote(id, {
          completed: true,
          completedBy: currentUser,
          completedAt: note.completedAt
        }));
      }
    });

    await Promise.all(updatePromises);

    // Clear selection and exit multi-select mode
    selectedNotes.clear();
    toggleNoteMultiSelect();

    renderNotes();
    showToast('Notes marked as complete', 'ok');
  } catch (error) {
    console.error('Error marking notes complete:', error);
    showToast('Failed to complete notes', 'err');
  } finally {
    showLoading(false);
  }
}

function bulkDeleteNotes() {
  if (selectedNotes.size === 0) return;

  // Get note details for confirmation
  const notesToDelete = [];
  selectedNotes.forEach(id => {
    const note = notes.find(n => n.id === id);
    if (note) {
      notesToDelete.push(note);
    }
  });

  // Show confirmation dialog
  showBulkDeleteNotesConfirm(notesToDelete);
}

function showBulkDeleteNotesConfirm(notesArray) {
  const overlay = document.getElementById('bulkDeleteNotesOverlay');
  const detailsEl = document.getElementById('bulkDeleteNotesDetails');

  let html = `<div style="max-height:300px;overflow-y:auto;margin:16px 0;padding:4px">`;
  notesArray.forEach((note, idx) => {
    const createdBy = note.createdBy || '—';
    let createdAt = '—';
    if (note.createdAtLocal && typeof note.createdAtLocal === 'string') {
      createdAt = note.createdAtLocal;
    } else if (note.createdAt && note.createdAt.toDate) {
      createdAt = note.createdAt.toDate().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    html += `<div style="padding:12px 14px;background:rgba(232, 110, 138, 0.15);margin-bottom:8px;border-radius:8px;border-left:3px solid #e86e8a">
      <div style="font-weight:500;margin-bottom:6px;color:var(--text);font-size:14px">${idx + 1}. ${note.text}</div>
      <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">
        👤 ${createdBy} • 🕐 ${createdAt}
      </div>
    </div>`;
  });
  html += `</div>`;

  detailsEl.innerHTML = html;
  overlay.classList.remove('hidden');
}

function cancelBulkDeleteNotes() {
  document.getElementById('bulkDeleteNotesOverlay').classList.add('hidden');
}

async function confirmBulkDeleteNotes() {
  document.getElementById('bulkDeleteNotesOverlay').classList.add('hidden');
  showLoading(true);
  setStatus('syncing', 'Deleting notes...');

  let successCount = 0;
  let failCount = 0;

  // Process in parallel for better performance
  const promises = Array.from(selectedNotes).map(async (id) => {
    try {
      await dbDeleteNote(id);
      return { success: true, id };
    } catch (e) {
      console.error('Failed to delete note:', id, e);
      return { success: false, id };
    }
  });

  // Wait for all operations to complete
  const results = await Promise.all(promises);

  // Count successes and failures
  results.forEach(result => {
    if (result.success) {
      successCount++;
      notes = notes.filter(n => n.id !== result.id);
    } else {
      failCount++;
    }
  });

  showLoading(false);
  selectedNotes.clear();
  isNoteMultiSelectMode = false;
  document.getElementById('noteMultiSelectBtn').textContent = '☑️ Select Multiple';
  document.getElementById('noteMultiSelectBtn').style.background = 'rgba(72, 126, 98, 0.2)';
  document.getElementById('noteBulkActions').style.display = 'none';

  if (failCount === 0) {
    setStatus('ok', 'Synced ✓');
    showToast(`${successCount} note${successCount > 1 ? 's' : ''} deleted!`, 'ok');
  } else {
    setStatus('err', 'Some failed');
    showToast(`Deleted ${successCount}, failed ${failCount}`, 'err');
  }

  renderNotes();
}

// ============================================
// BATCH ADD EXPENSES
// ============================================

let batchExpenseRows = [];

function showBatchAddDialog() {
  batchExpenseRows = [{}]; // Start with one empty row
  renderBatchAddRows();
  document.getElementById('batchAddOverlay').classList.remove('hidden');
}

function renderBatchAddRows() {
  const container = document.getElementById('batchAddEntries');

  container.innerHTML = batchExpenseRows.map((row, index) => {
    // Get selected values or defaults
    const selectedDay = row.day || tripDays[0].day;
    const selectedCat = row.cat || 'food';
    const selectedPaidBy = row.paidBy || '';

    // Get display labels
    const dayLabel = tripDays.find(d => d.day == selectedDay)?.name || `Day ${selectedDay}`;
    const catLabels = {
      food: '🍽️ Food',
      fuel: '⛽ Fuel',
      stay: '🏨 Stay',
      transport: '🚙 Transport',
      entry: '🎟️ Entry Fees',
      misc: '🛍️ Miscellaneous'
    };
    const catLabel = catLabels[selectedCat] || '🍽️ Food';
    const paidByLabel = selectedPaidBy ? `${selectedPaidBy === 'Afsar' ? '👨‍💻' : selectedPaidBy === 'Sahlaan' ? '👨‍⚕️' : '👨‍💻'} ${selectedPaidBy}` : 'Select...';

    return `
    <div style="padding:16px;background:rgba(72, 126, 98, 0.05);border-radius:8px;margin-bottom:12px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-weight:500;color:var(--accent);font-family:'DM Mono',monospace">Entry ${index + 1}</div>
        ${batchExpenseRows.length > 1 ? `
          <button onclick="removeBatchRow(${index})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px">×</button>
        ` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
        <div style="position:relative">
          <label style="display:block;margin-bottom:4px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">Day</label>
          <div class="batch-select-btn" id="batch-day-btn-${index}" onclick="toggleBatchDropdown('day', ${index})" style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:10px;padding-right:35px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;position:relative;background-image:url(&quot;data:image/svg+xml,%3Csvg fill='%236b8a78' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 10px center;">
            <span id="batch-day-label-${index}">Day ${selectedDay} (${dayLabel})</span>
          </div>
          <div class="batch-dropdown" id="batch-day-dropdown-${index}" style="position:absolute;top:100%;left:0;margin-top:4px;background:var(--card);border:1px solid var(--accent);border-radius:8px;padding:6px;min-width:100%;width:max-content;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:1000;display:none">
            ${tripDays.map(d => `<div class="batch-option ${d.day == selectedDay ? 'selected' : ''}" onclick="selectBatchDay(${index}, ${d.day}, 'Day ${d.day} (${d.name})')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">Day ${d.day} (${d.name})</div>`).join('')}
            <div class="batch-option" onclick="handleBatchAddNewDay(${index})" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">➕ Add New Day</div>
          </div>
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">Description</label>
          <input type="text" id="batch-desc-${index}" value="${row.desc || ''}" onchange="updateBatchRow(${index}, 'desc', this.value)" placeholder="e.g. Lunch at restaurant" style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:10px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;">
        </div>
        <div style="position:relative">
          <label style="display:block;margin-bottom:4px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">Category</label>
          <div class="batch-select-btn" id="batch-cat-btn-${index}" onclick="toggleBatchDropdown('cat', ${index})" style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:10px;padding-right:35px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;position:relative;background-image:url(&quot;data:image/svg+xml,%3Csvg fill='%236b8a78' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 10px center;">
            <span id="batch-cat-label-${index}">${catLabel}</span>
          </div>
          <div class="batch-dropdown" id="batch-cat-dropdown-${index}" style="position:absolute;top:100%;left:0;margin-top:4px;background:var(--card);border:1px solid var(--accent);border-radius:8px;padding:6px;min-width:100%;width:max-content;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:1000;display:none">
            <div class="batch-option ${selectedCat === 'food' ? 'selected' : ''}" onclick="selectBatchCat(${index}, 'food', '🍽️ Food')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">🍽️ Food</div>
            <div class="batch-option ${selectedCat === 'fuel' ? 'selected' : ''}" onclick="selectBatchCat(${index}, 'fuel', '⛽ Fuel')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">⛽ Fuel</div>
            <div class="batch-option ${selectedCat === 'stay' ? 'selected' : ''}" onclick="selectBatchCat(${index}, 'stay', '🏨 Stay')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">🏨 Stay</div>
            <div class="batch-option ${selectedCat === 'transport' ? 'selected' : ''}" onclick="selectBatchCat(${index}, 'transport', '🚙 Transport')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">🚙 Transport</div>
            <div class="batch-option ${selectedCat === 'entry' ? 'selected' : ''}" onclick="selectBatchCat(${index}, 'entry', '🎟️ Entry Fees')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">🎟️ Entry Fees</div>
            <div class="batch-option ${selectedCat === 'misc' ? 'selected' : ''}" onclick="selectBatchCat(${index}, 'misc', '🛍️ Miscellaneous')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">🛍️ Miscellaneous</div>
          </div>
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">Amount (₹)</label>
          <input type="number" id="batch-amount-${index}" value="${row.amount || ''}" onchange="updateBatchRow(${index}, 'amount', this.value)" placeholder="0" min="0" style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:10px;font-family:'DM Mono',monospace;font-size:14px;outline:none;">
        </div>
        <div style="position:relative">
          <label style="display:block;margin-bottom:4px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">Paid By</label>
          <div class="batch-select-btn" id="batch-paidby-btn-${index}" onclick="toggleBatchDropdown('paidby', ${index})" style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:10px;padding-right:35px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;position:relative;background-image:url(&quot;data:image/svg+xml,%3Csvg fill='%236b8a78' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 10px center;">
            <span id="batch-paidby-label-${index}">${paidByLabel}</span>
          </div>
          <div class="batch-dropdown" id="batch-paidby-dropdown-${index}" style="position:absolute;top:100%;left:0;margin-top:4px;background:var(--card);border:1px solid var(--accent);border-radius:8px;padding:6px;min-width:100%;width:max-content;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:1000;display:none">
            <div class="batch-option ${selectedPaidBy === '' ? 'selected' : ''}" onclick="selectBatchPaidBy(${index}, '', 'Select...')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--muted);cursor:pointer;white-space:nowrap">Select...</div>
            <div class="batch-option ${selectedPaidBy === 'Afsar' ? 'selected' : ''}" onclick="selectBatchPaidBy(${index}, 'Afsar', '👨‍💻 Afsar')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">👨‍💻 Afsar</div>
            <div class="batch-option ${selectedPaidBy === 'Adham' ? 'selected' : ''}" onclick="selectBatchPaidBy(${index}, 'Adham', '👨‍💻 Adham')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">👨‍💻 Adham</div>
            <div class="batch-option ${selectedPaidBy === 'Aakif' ? 'selected' : ''}" onclick="selectBatchPaidBy(${index}, 'Aakif', '👨‍💻 Aakif')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">👨‍💻 Aakif</div>
            <div class="batch-option ${selectedPaidBy === 'Sahlaan' ? 'selected' : ''}" onclick="selectBatchPaidBy(${index}, 'Sahlaan', '👨‍⚕️ Sahlaan')" style="padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);cursor:pointer;white-space:nowrap">👨‍⚕️ Sahlaan</div>
          </div>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

// Toggle batch dropdown
function toggleBatchDropdown(type, index) {
  const dropdown = document.getElementById(`batch-${type}-dropdown-${index}`);
  const isActive = dropdown.style.display === 'block';

  // Close all batch dropdowns
  document.querySelectorAll('.batch-dropdown').forEach(d => {
    d.style.display = 'none';
    // Reset positioning
    d.style.top = '100%';
    d.style.bottom = 'auto';
    d.style.marginTop = '4px';
    d.style.marginBottom = '0';
  });

  // Toggle clicked dropdown
  if (!isActive) {
    // First set display to block but invisible to measure
    dropdown.style.display = 'block';
    dropdown.style.visibility = 'hidden';

    // Force a reflow to ensure dropdown is rendered
    dropdown.offsetHeight;

    // Check if dropdown will overflow the modal
    const modalOverlay = document.getElementById('batchAddOverlay');
    const modalBox = modalOverlay.querySelector('.confirm-box');
    const dropdownRect = dropdown.getBoundingClientRect();
    const modalRect = modalBox.getBoundingClientRect();

    // If dropdown goes below modal bottom, open it upward
    if (dropdownRect.bottom > modalRect.bottom - 20) {
      dropdown.style.top = 'auto';
      dropdown.style.bottom = '100%';
      dropdown.style.marginTop = '0';
      dropdown.style.marginBottom = '4px';
    }

    // Make it visible
    dropdown.style.visibility = 'visible';
  }
}

// Select batch day
function selectBatchDay(index, value, label) {
  updateBatchRow(index, 'day', value);
  document.getElementById(`batch-day-label-${index}`).textContent = label;
  document.getElementById(`batch-day-dropdown-${index}`).style.display = 'none';

  // Update selected state
  document.querySelectorAll(`#batch-day-dropdown-${index} .batch-option`).forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');
}

// Select batch category
function selectBatchCat(index, value, label) {
  updateBatchRow(index, 'cat', value);
  document.getElementById(`batch-cat-label-${index}`).textContent = label;
  document.getElementById(`batch-cat-dropdown-${index}`).style.display = 'none';

  // Update selected state
  document.querySelectorAll(`#batch-cat-dropdown-${index} .batch-option`).forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');
}

// Select batch paid by
function selectBatchPaidBy(index, value, label) {
  updateBatchRow(index, 'paidBy', value);
  document.getElementById(`batch-paidby-label-${index}`).textContent = label;
  document.getElementById(`batch-paidby-dropdown-${index}`).style.display = 'none';

  // Update selected state
  document.querySelectorAll(`#batch-paidby-dropdown-${index} .batch-option`).forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');
}

// Handle add new day from batch dropdown
function handleBatchAddNewDay(index) {
  document.getElementById(`batch-day-dropdown-${index}`).style.display = 'none';

  const dayName = prompt('Enter day name (e.g., Monday):');
  const dayDate = prompt('Enter date (e.g., 30 March):');

  if (dayName && dayDate) {
    const newDayNumber = tripDays.length + 1;
    tripDays.push({ day: newDayNumber, name: dayName, date: dayDate });

    // Update this row to the new day
    batchExpenseRows[index].day = newDayNumber;

    // Re-render to show updated dropdowns
    renderBatchAddRows();
    updateFilterOptions();
  }
}

// Close batch dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.batch-select-btn') && !e.target.closest('.batch-dropdown')) {
    document.querySelectorAll('.batch-dropdown').forEach(d => d.style.display = 'none');
  }
});

function handleBatchDayChange(index, value) {
  if (value === 'add') {
    const dayName = prompt('Enter day name (e.g., Monday):');
    const dayDate = prompt('Enter date (e.g., 30 March):');

    if (dayName && dayDate) {
      const newDayNumber = tripDays.length + 1;
      tripDays.push({ day: newDayNumber, name: dayName, date: dayDate });

      // Update this row to the new day
      batchExpenseRows[index].day = newDayNumber;

      // Re-render to show updated dropdowns
      renderBatchAddRows();
      updateFilterOptions();
    } else {
      // User cancelled, reset to first day
      batchExpenseRows[index].day = tripDays[0].day;
      document.getElementById(`batch-day-${index}`).value = tripDays[0].day;
    }
  } else {
    updateBatchRow(index, 'day', value);
  }
}

function updateBatchRow(index, field, value) {
  batchExpenseRows[index][field] = value;
}

function addAnotherBatchRow() {
  if (batchExpenseRows.length >= 3) {
    showToast('Maximum 3 entries allowed', 'err');
    return;
  }
  batchExpenseRows.push({});
  renderBatchAddRows();
}

function removeBatchRow(index) {
  batchExpenseRows.splice(index, 1);
  renderBatchAddRows();
}

function cancelBatchAdd() {
  batchExpenseRows = [];
  document.getElementById('batchAddOverlay').classList.add('hidden');
}

async function saveBatchExpenses() {
  // Validate all rows
  const validRows = [];
  for (let i = 0; i < batchExpenseRows.length; i++) {
    const row = batchExpenseRows[i];
    if (!row.amount || !row.paidBy) {
      showToast(`Entry ${i + 1}: Amount and Paid By are required`, 'err');
      return;
    }
    validRows.push({
      day: parseInt(row.day) || tripDays[0].day,
      name: currentUser,
      desc: row.desc || '—',
      cat: row.cat || 'misc',
      amount: parseFloat(row.amount),
      paidBy: row.paidBy,
      ts: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      createdAt: firebase.firestore.Timestamp.now(), // Add Firebase timestamp for proper sorting
      archived: false
    });
  }

  // Close dialog and show loading
  cancelBatchAdd();
  showLoading(true);
  setStatus('syncing', 'Saving expenses...');

  let successCount = 0;
  let failCount = 0;

  // Save all expenses in parallel
  const promises = validRows.map(async (expense) => {
    try {
      const id = await dbAddExpense(expense);
      expenses[expense.day].push({ ...expense, id });
      return { success: true };
    } catch (e) {
      console.error('Failed to add expense:', e);
      return { success: false };
    }
  });

  const results = await Promise.all(promises);

  results.forEach(result => {
    if (result.success) successCount++;
    else failCount++;
  });

  saveLocal();
  render();
  showLoading(false);

  if (failCount === 0) {
    setStatus('ok', 'Synced ✓');
    showToast(`${successCount} expense${successCount > 1 ? 's' : ''} added!`, 'ok');
  } else {
    setStatus('err', 'Some failed');
    showToast(`Added ${successCount}, failed ${failCount}`, 'err');
  }
}

// ─── COLUMN VISIBILITY TOGGLE ──────────────────────────────
let visibleColumns = {
  day: true,
  desc: true,
  cat: true,
  name: true,
  paidBy: true,
  time: true,
  amount: true
};

let archivedVisibleColumns = {
  desc: true,
  cat: true,
  name: true,
  paidBy: true,
  amount: true,
  day: true
};

function toggleColumn(column) {
  visibleColumns[column] = !visibleColumns[column];

  // Update checkbox state
  const checkbox = document.getElementById(`col-${column}`);
  if (checkbox) checkbox.checked = visibleColumns[column];

  // Update table columns visibility
  const headers = document.querySelectorAll(`th[data-column="${column}"]`);
  const cells = document.querySelectorAll(`td[data-column="${column}"]`);

  headers.forEach(th => {
    th.style.display = visibleColumns[column] ? '' : 'none';
  });
  cells.forEach(td => {
    td.style.display = visibleColumns[column] ? '' : 'none';
  });

  // Save preference to localStorage
  localStorage.setItem('columnVisibility', JSON.stringify(visibleColumns));

  // Re-render to apply changes
  render();
}

function toggleArchivedColumn(column) {
  archivedVisibleColumns[column] = !archivedVisibleColumns[column];

  // Update checkbox state
  const checkbox = document.getElementById(`archived-col-${column}`);
  if (checkbox) checkbox.checked = archivedVisibleColumns[column];

  // Update header visibility
  const archivedTable = document.querySelector('#archived-section table');
  if (archivedTable) {
    const headers = archivedTable.querySelectorAll(`thead th[data-column="${column}"]`);
    headers.forEach(th => {
      th.style.display = archivedVisibleColumns[column] ? '' : 'none';
    });
  }

  // Save preference to localStorage
  localStorage.setItem('archivedColumnVisibility', JSON.stringify(archivedVisibleColumns));

  // Re-render archived table
  renderArchived();
}

// Load column visibility preferences on init
function loadColumnVisibility() {
  const saved = localStorage.getItem('columnVisibility');
  if (saved) {
    visibleColumns = JSON.parse(saved);
  }

  // Apply visibility to all columns
  Object.keys(visibleColumns).forEach(column => {
    const checkbox = document.getElementById(`col-${column}`);
    if (checkbox) checkbox.checked = visibleColumns[column];

    const headers = document.querySelectorAll(`th[data-column="${column}"]`);
    const cells = document.querySelectorAll(`td[data-column="${column}"]`);

    headers.forEach(th => {
      th.style.display = visibleColumns[column] ? '' : 'none';
    });
    cells.forEach(td => {
      td.style.display = visibleColumns[column] ? '' : 'none';
    });
  });

  // Load archived column visibility
  const archivedSaved = localStorage.getItem('archivedColumnVisibility');
  if (archivedSaved) {
    archivedVisibleColumns = JSON.parse(archivedSaved);
  }

  // Apply archived column visibility to checkboxes
  Object.keys(archivedVisibleColumns).forEach(column => {
    const checkbox = document.getElementById(`archived-col-${column}`);
    if (checkbox) checkbox.checked = archivedVisibleColumns[column];
  });
}

// Handle Enter key in note text area
document.addEventListener('DOMContentLoaded', function() {
  const noteTextArea = document.getElementById('noteText');
  if (noteTextArea) {
    noteTextArea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addNote();
      }
      if (e.key === 'Escape') cancelAddNote();
    });
  }
});

// ─── FILTER PANEL TOGGLES ─────────────────────────────────
function toggleExpenseFilters() {
  const panel = document.getElementById('expenseFiltersPanel');
  if (panel) {
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      setTimeout(() => positionFilterPanel('expenseFiltersPanel', 'expenseFilterBtn'), 10);
    }
  }
}

function toggleArchivedFilters() {
  const panel = document.getElementById('archivedFiltersPanel');
  if (panel) {
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      setTimeout(() => positionFilterPanel('archivedFiltersPanel', 'archivedFilterBtn'), 10);
    }
  }
}

function toggleNoteFilters() {
  const panel = document.getElementById('noteFiltersPanel');
  if (panel) {
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      setTimeout(() => positionFilterPanel('noteFiltersPanel', 'noteFilterBtn'), 10);
    }
  }
}

// Close filter panels when clicking outside
document.addEventListener('click', (e) => {
  const expenseFilterBtn = document.getElementById('expenseFilterBtn');
  const expensePanel = document.getElementById('expenseFiltersPanel');
  const archivedFilterBtn = document.getElementById('archivedFilterBtn');
  const archivedPanel = document.getElementById('archivedFiltersPanel');
  const noteFilterBtn = document.getElementById('noteFilterBtn');
  const notePanel = document.getElementById('noteFiltersPanel');

  if (expensePanel && !expenseFilterBtn?.contains(e.target) && !expensePanel.contains(e.target)) {
    expensePanel.style.display = 'none';
  }
  if (archivedPanel && !archivedFilterBtn?.contains(e.target) && !archivedPanel.contains(e.target)) {
    archivedPanel.style.display = 'none';
  }
  if (notePanel && !noteFilterBtn?.contains(e.target) && !notePanel.contains(e.target)) {
    notePanel.style.display = 'none';
  }
});

// ─── NOTE PERSON FILTER ───────────────────────────────────
let notePersonFilterBy = 'all';

function selectNotePersonFilter(person, label) {
  notePersonFilterBy = person;
  document.getElementById('notePersonFilterLabel').textContent = label;

  // Update selected state
  document.querySelectorAll('#notePersonFilterDropdown .filter-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

  // Reset to first page when filter changes
  notesPage = 1;
  renderNotes();
  toggleFilterDropdown('notePerson');
}

// Toggle note text expansion
function toggleNoteExpand(textId, toggleId) {
  const textEl = document.getElementById(textId);
  const toggleEl = document.getElementById(toggleId);
  if (!textEl || !toggleEl) return;

  const isExpanded = textEl.style.webkitLineClamp === 'unset';
  if (isExpanded) {
    textEl.style.webkitLineClamp = '2';
    toggleEl.textContent = 'Show more';
  } else {
    textEl.style.webkitLineClamp = 'unset';
    toggleEl.textContent = 'Show less';
  }
}

// Position filter panel within viewport
function positionFilterPanel(panelId, buttonId) {
  const panel = document.getElementById(panelId);
  const button = document.getElementById(buttonId);
  if (!panel || !button) return;

  const buttonRect = button.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Reset position
  panel.style.top = '100%';
  panel.style.bottom = 'auto';
  panel.style.left = '0';
  panel.style.right = 'auto';

  // Check vertical space
  const spaceBelow = viewportHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;
  
  if (spaceBelow < panelRect.height && spaceAbove > spaceBelow) {
    // Not enough space below, show above
    panel.style.top = 'auto';
    panel.style.bottom = '100%';
    panel.style.marginTop = '0';
    panel.style.marginBottom = '4px';
  }

  // Check horizontal space
  const spaceRight = viewportWidth - buttonRect.left;
  if (spaceRight < panelRect.width) {
    // Not enough space on right, align to right edge
    panel.style.left = 'auto';
    panel.style.right = '0';
  }
}
