// ─── CONFIG ───────────────────────────────────────────────
// Config is loaded from config.js (not committed to git)
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
}

// ─── INIT ─────────────────────────────────────────────────
window.onload = () => {
  // Initialize Firebase first
  dbInit();

  showLoading(true);
  loadTripDays();

  const saved = localStorage.getItem('coorg_username');
  if (saved) {
    currentUser = saved;
    hideNameOverlay();

    // Populate day dropdown and filters before loading data
    populateMainDayDropdown();
    updateFilterOptions();

    loadFromSheet();
  } else {
    showLoading(false);
    document.getElementById('nameOverlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('nameInput').focus(), 100);
  }

  // Hide status bar on scroll down, show on scroll up
  let lastScrollTop = 0;
  window.addEventListener('scroll', function() {
    const statusBar = document.getElementById('statusBar');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down and past 100px
      statusBar.classList.add('hidden-on-scroll');
    } else {
      // Scrolling up or at the top
      statusBar.classList.remove('hidden-on-scroll');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }, false);
};

// ─── NAME HANDLING ────────────────────────────────────────
function saveName() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { document.getElementById('nameInput').focus(); return; }
  currentUser = name;
  localStorage.setItem('coorg_username', name);
  hideNameOverlay();
  loadFromSheet();
}

function hideNameOverlay() {
  document.getElementById('nameOverlay').classList.add('hidden');
  document.getElementById('inp-name').value = currentUser;

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

  // Populate dropdowns after name is set
  populateMainDayDropdown();
  updateFilterOptions();
}

function changeName() {
  document.getElementById('nameInput').value = currentUser;
  document.getElementById('nameOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('nameInput').focus(), 100);
}

document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveName();
});
document.getElementById('nameInput').addEventListener('change', e => {
  if (e.target.value) saveName();
});

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
  showLoading(true);
  setStatus('syncing', 'Loading…');
  try {
    // Load active expenses from Firebase
    const data = await dbGetAllExpenses();
    console.log('Loaded active expenses from Firebase:', data);

    // Load archived expenses from Firebase
    const archivedData = await dbGetArchivedExpenses();
    console.log('Loaded archived expenses from Firebase:', archivedData);

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

    // Process archived expenses
    archivedExpenses = [];
    (archivedData || []).forEach(e => {
      archivedExpenses.push({ ...e, archivedDay: e.day });
    });

    // Load budget from Firebase
    tripBudget = await dbGetBudget();
    console.log('Loaded budget from Firebase:', tripBudget);
    if (tripBudget) {
      localStorage.setItem('coorg_budget', tripBudget);
    }

    saveLocal();
    render();
    setStatus('ok', 'Synced ✓');
  } catch(e) {
    console.error('Error loading from Firebase:', e);
    setStatus('err', 'Offline — showing local data');
    loadFromLocal();
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
async function saveExpense() {
  if (isBusy) return;
  const day    = parseInt(document.getElementById('inp-day').value);
  const desc   = document.getElementById('inp-desc').value.trim();
  const cat    = document.getElementById('inp-cat').value;
  const amount = parseFloat(document.getElementById('inp-amount').value) || 0;
  const paidBy = document.getElementById('inp-paidby').value;
  const name   = currentUser;

  // Validation
  if (!desc) {
    showToast('Please enter a description', 'err');
    document.getElementById('inp-desc').focus();
    return;
  }
  if (amount <= 0) {
    showToast('Please enter a valid amount', 'err');
    document.getElementById('inp-amount').focus();
    return;
  }
  if (!paidBy) {
    showToast('Please select who paid', 'err');
    document.getElementById('inp-paidby').focus();
    return;
  }

  setBusy(true);
  showLoading(true);
  setStatus('syncing', 'Saving…');

  try {
    // Don't pass a local ID - let Firebase generate it
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const exp = { day, name, desc, cat, amount, paidBy, archived: false, ts: timestamp, edited: "" };
    const newId = await dbAddExpense(exp);
    exp.id = newId; // Use the Firebase-generated ID
    expenses[day].push(exp);

    setStatus('ok', 'Synced ✓');
    showToast('Expense added!', 'ok');
  } catch(e) {
    // If offline, create local ID and mark it
    const localExp = {
      id: 'local_' + Date.now(),
      day, name, desc, cat, amount, paidBy, archived: false,
      ts: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      edited: ""
    };
    expenses[day].push(localExp);
    setStatus('err', 'Saved locally only');
    showToast('No internet — saved locally', 'err');
  }

  saveLocal();
  clearForm();
  setBusy(false);
  showLoading(false);
  render();
}

function clearForm() {
  document.getElementById('inp-desc').value = '';
  document.getElementById('inp-amount').value = '';
  document.getElementById('inp-paidby').value = '';
  document.getElementById('inp-day').value = '1';
  document.getElementById('inp-cat').value = 'food';
  editingId = null;
  document.getElementById('addBtnText').textContent = '+ Add';
}

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

// ─── MULTI-ROW ADD ────────────────────────────────────────
let multiRowCount = 0;

function addExpenseRow() {
  // Get current row count from DOM
  const entriesDiv = document.getElementById('multiRowEntries');
  const currentRows = entriesDiv.querySelectorAll('.multi-row-entry');
  const currentRowCount = currentRows.length;

  // Limit to 3 rows max
  if (currentRowCount >= 3) {
    showToast('Maximum 3 rows allowed', 'err');
    return;
  }

  // Show the multi-row container if hidden
  const container = document.getElementById('multiRowContainer');
  container.classList.add('active');

  // Generate unique ID for this row
  multiRowCount++;
  const rowDiv = document.createElement('div');
  rowDiv.className = 'multi-row-entry';
  rowDiv.id = `multi-row-${multiRowCount}`;

  // Get current form values from inputs/selects
  const day = document.getElementById('inp-day').value;
  const cat = document.getElementById('inp-cat').value;
  const desc = document.getElementById('inp-desc').value.trim();
  const amount = document.getElementById('inp-amount').value;
  const paidBy = document.getElementById('inp-paidby').value;

  // Build day dropdown HTML
  // Build day dropdown options
  let dayOptionsHTML = '';
  tripDays.forEach(dayObj => {
    const selected = String(dayObj.day) === String(day) ? 'selected' : '';
    dayOptionsHTML += `<option value="${dayObj.day}" ${selected}>Day ${dayObj.day} (${dayObj.name}, ${dayObj.date})</option>`;
  });
  dayOptionsHTML += `<option value="add">➕ Add New Day</option>`;

  // Build category dropdown options
  const catOptions = [
    {value: 'food', label: '🍽️ Food'},
    {value: 'fuel', label: '⛽ Fuel'},
    {value: 'stay', label: '🏨 Stay'},
    {value: 'transport', label: '🚙 Transport'},
    {value: 'entry', label: '🎟️ Entry'},
    {value: 'misc', label: '🛍️ Misc'}
  ];
  let catOptionsHTML = '';
  catOptions.forEach(opt => {
    const selected = opt.value === cat ? 'selected' : '';
    catOptionsHTML += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
  });

  // Build paid by dropdown options
  const paidByOptions = [
    {value: '', label: 'Select...'},
    {value: 'Afsar', label: '👨‍💻 Afsar'},
    {value: 'Adham', label: '👨‍💻 Adham'},
    {value: 'Aakif', label: '👨‍💻 Aakif'},
    {value: 'Sahlaan', label: '👨‍⚕️ Sahlaan'}
  ];
  let paidByOptionsHTML = '';
  paidByOptions.forEach(opt => {
    const selected = opt.value === paidBy ? 'selected' : '';
    paidByOptionsHTML += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
  });

  rowDiv.innerHTML = `
    <div>
      <label>Day</label>
      <select id="mr-day-${multiRowCount}" onchange="handleMultiRowDayChange(${multiRowCount}, this.value)">
        ${dayOptionsHTML}
      </select>
    </div>
    <div>
      <label>Category</label>
      <select id="multi-cat-${multiRowCount}">
        ${catOptionsHTML}
      </select>
    </div>
    <div>
      <label>Description</label>
      <input type="text" id="multi-desc-${multiRowCount}" value="${desc}" placeholder="e.g. Masala Dosa at Mylari" />
    </div>
    <div>
      <label>Amount (₹)</label>
      <input type="number" id="multi-amount-${multiRowCount}" value="${amount}" placeholder="0" min="0" />
    </div>
    <div>
      <label>Paid by</label>
      <select id="multi-paidby-${multiRowCount}">
        ${paidByOptionsHTML}
      </select>
    </div>
    <div style="visibility:hidden">
      <label>Added</label>
      <input type="text" readonly value="${currentUser}" />
    </div>
    <div style="display:flex;align-items:center;justify-content:center">
      <button class="del-btn" onclick="removeMultiRow(${multiRowCount})" title="Remove" style="padding:4px 6px;font-size:14px">🗑️</button>
    </div>
  `;

  entriesDiv.appendChild(rowDiv);

  // Clear the main form
  document.getElementById('inp-desc').value = '';
  document.getElementById('inp-amount').value = '';
  document.getElementById('inp-paidby').value = '';
}

function removeMultiRow(id) {
  const row = document.getElementById(`multi-row-${id}`);
  if (row) row.remove();

  // Hide container if no rows left
  const entriesDiv = document.getElementById('multiRowEntries');
  if (entriesDiv.querySelectorAll('.multi-row-entry').length === 0) {
    clearAllRows();
  }
}

// Handle multi-row day change
function handleMultiRowDayChange(rowId, value) {
  if (value === 'add') {
    const dayName = prompt('Enter day name (e.g., Saturday):');
    const dayDate = prompt('Enter date (e.g., 28 March):');
    if (dayName && dayDate) {
      const newDay = tripDays.length + 1;
      tripDays.push({ day: newDay, name: dayName, date: dayDate });

      // Repopulate all day dropdowns
      populateMainDayDropdown();

      // Update this specific multi-row dropdown
      const select = document.getElementById(`mr-day-${rowId}`);
      select.innerHTML = '';
      tripDays.forEach(dayObj => {
        const option = document.createElement('option');
        option.value = String(dayObj.day);
        option.textContent = `Day ${dayObj.day} (${dayObj.name}, ${dayObj.date})`;
        select.appendChild(option);
      });
      const addOption = document.createElement('option');
      addOption.value = 'add';
      addOption.textContent = '➕ Add New Day';
      select.appendChild(addOption);
      select.value = String(newDay);
    } else {
      document.getElementById(`mr-day-${rowId}`).value = '1';
    }
  }
}

function clearAllRows() {
  document.getElementById('multiRowContainer').classList.remove('active');
  document.getElementById('multiRowEntries').innerHTML = '';
  multiRowCount = 0;
}

async function saveMultipleExpenses() {
  const entries = [];
  const entriesDiv = document.getElementById('multiRowEntries');
  const rows = entriesDiv.querySelectorAll('.multi-row-entry');

  // Collect and validate all entries
  for (let row of rows) {
    const id = row.id.split('-')[2];
    const day = parseInt(document.getElementById(`mr-day-${id}`)?.value || '1');
    const cat = document.getElementById(`multi-cat-${id}`)?.value || 'food';
    const desc = document.getElementById(`multi-desc-${id}`)?.value.trim();
    const amount = parseFloat(document.getElementById(`multi-amount-${id}`)?.value) || 0;
    const paidBy = document.getElementById(`multi-paidby-${id}`)?.value || '';

    if (!desc || amount <= 0 || !paidBy) {
      showToast('Please fill all fields in each row', 'err');
      return;
    }

    entries.push({ day, cat, desc, amount, paidBy, name: currentUser });
  }

  if (entries.length === 0) {
    showToast('No entries to save', 'err');
    return;
  }

  // Save all entries
  showLoading(true);
  document.getElementById('multiSpinner').style.display = 'block';

  let savedCount = 0;
  for (let entry of entries) {
    try {
      // Don't pass local ID - let Firebase generate it
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const exp = { ...entry, archived: false, ts: timestamp, edited: "" };
      const newId = await dbAddExpense(exp);
      exp.id = newId; // Use the Firebase-generated ID
      expenses[entry.day].push(exp);
      savedCount++;
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    } catch(e) {
      console.error('Failed to save entry:', e);
    }
  }

  saveLocal();
  showLoading(false);
  document.getElementById('multiSpinner').style.display = 'none';

  showToast(`${savedCount} expense${savedCount > 1 ? 's' : ''} added!`, 'ok');
  clearAllRows();
  render();
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
  'notes': true,      // Default collapsed
  'archived': true    // Default collapsed
};

function toggleSection(sectionId) {
  const section = document.getElementById(`${sectionId}-section`);
  const icon = document.getElementById(`${sectionId}-icon`);

  if (!section || !icon) return;

  const isCollapsed = collapsedSections[sectionId];

  if (isCollapsed) {
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


function renderArchived() {
  const tbody = document.getElementById('archived-body');
  tbody.innerHTML = '';

  const count = archivedExpenses.length;

  // Update count in button
  const countSpan = document.getElementById('archivedCount');
  if (countSpan) countSpan.textContent = count;

  if (archivedExpenses.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="9">No archived expenses</td>`;
    tbody.appendChild(tr);
    return;
  }

  archivedExpenses.forEach((exp, idx) => {
    const cfg = CAT_CONFIG[exp.cat] || CAT_CONFIG.misc;

    const tr = document.createElement('tr');
    tr.style.opacity = '0.7';
    tr.innerHTML = `
      <td class="num-col">${idx + 1}</td>
      <td style="font-size:13px">${exp.desc}</td>
      <td style="white-space:nowrap"><span class="cat-badge" style="color:${cfg.color};background:${cfg.bg}">${cfg.label}</span></td>
      <td style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${exp.name || '—'}</td>
      <td style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${exp.paidBy || '—'}</td>
      <td class="amount-col" style="white-space:nowrap">₹${Number(exp.amount).toLocaleString('en-IN')}</td>
      <td style="font-size:11px;color:var(--muted)">Day ${exp.archivedDay}</td>
      <td><button class="del-btn" onclick="showUnarchiveConfirm('${exp.id}')" title="Unarchive" style="background:var(--accent);color:#0e1412">↩️</button></td>
      <td><button class="del-btn" onclick="showPermanentDeleteConfirm('${exp.id}')" title="Delete Permanently">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
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
        // Use createdAt timestamp if available, otherwise parse ts string
        if (a.createdAt && b.createdAt) {
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

      tr.innerHTML = `
        <td class="num-col">${startIdx + idx + 1}</td>
        <td style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">Day ${exp.day}</td>
        <td>
          ${editedBadge ? `<div style="margin-bottom:4px">${editedBadge}</div>` : ''}
          <div id="${descId}" class="${showTruncated ? 'desc-truncated' : 'desc-full'}">
            ${exp.desc}
          </div>
          ${showTruncated ? `<span class="show-more-btn" onclick="toggleDesc('${descId}')">Show more...</span>` : ''}
        </td>
        <td style="white-space:nowrap"><span class="cat-badge" style="color:${cfg.color};background:${cfg.bg}">${cfg.label}</span></td>
        <td style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${exp.name || '—'}</td>
        <td style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${exp.paidBy || '—'}</td>
        <td style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);white-space:nowrap">${timeStr}</td>
        <td class="amount-col" style="white-space:nowrap">${exp.amount > 0 ? '₹' + Number(exp.amount).toLocaleString('en-IN') : '<span style="color:#3a5545">—</span>'}</td>
        <td>${canEdit ? `<button class="del-btn edit-btn" onclick="startInlineEdit(${exp.day}, '${exp.id}')" title="Edit">${editIcon}</button>` : ''}</td>
        <td><button class="del-btn" onclick="showDeleteConfirm(${exp.day}, '${exp.id}')" title="Archive">🗃️</button></td>
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
    totalRow.innerHTML = `
      <td colspan="7" style="text-align:right;padding-right:12px">Total ${dayFilterBy !== 'all' ? `(Day ${dayFilterBy})` : ''}:</td>
      <td class="amount-col" style="white-space:nowrap;color:var(--accent)">₹${filteredTotal.toLocaleString('en-IN')}</td>
      <td colspan="2"></td>
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
function updateSettlement() {
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

  // Generate settlement instructions
  const settlements = calculateSettlements(balance);

  // Render settlement cards
  const grid = document.getElementById('settlement-section');
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
          actionHTML += `<div class="action owes">Pay ₹${s.amount.toLocaleString('en-IN')} to ${s.to}</div>`;
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
  document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('active'));

  // Toggle the clicked dropdown
  if (!isActive) {
    dropdown.classList.add('active');
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

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.filter-btn') && !e.target.closest('.filter-dropdown')) {
    document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('active'));
  }
  if (!e.target.closest('.custom-select')) {
    document.querySelectorAll('.custom-select-dropdown').forEach(d => d.classList.remove('active'));
  }
});

// ─── CUSTOM SELECT FOR ADD FORMS ──────────────────────────
// Store selected values for custom selects
let customSelectValues = {
  'inp-day': '1',
  'inp-cat': 'food',
  'inp-paidby': ''
};

function toggleCustomSelect(selectId) {
  const dropdown = document.getElementById(`${selectId}-dropdown`);
  const isActive = dropdown.classList.contains('active');

  // Close all custom select dropdowns first
  document.querySelectorAll('.custom-select-dropdown').forEach(d => d.classList.remove('active'));

  // Toggle the clicked dropdown
  if (!isActive) {
    dropdown.classList.add('active');
  }
}

function selectCustomOption(selectId, value, label) {
  // Update stored value
  customSelectValues[selectId] = value;

  // Update button label
  document.getElementById(`${selectId}-label`).textContent = label;

  // Update selected state in dropdown
  const dropdown = document.getElementById(`${selectId}-dropdown`);
  dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

  // Close dropdown
  dropdown.classList.remove('active');

  // Handle special case for day selection (add new day)
  if (selectId === 'inp-day' && value === 'add') {
    addNewDay();
    // After adding new day, update the dropdown and select the new day
    setTimeout(() => {
      populateMainDayDropdown();
      selectCustomOption('inp-day', String(maxDay), `Day ${maxDay}`);
    }, 100);
  }
}

// Get value from custom select
function getCustomSelectValue(selectId) {
  return customSelectValues[selectId] || '';
}

// Populate main form day dropdown
function populateMainDayDropdown() {
  const dropdown = document.getElementById('inp-day');
  dropdown.innerHTML = '';

  tripDays.forEach(dayObj => {
    const option = document.createElement('option');
    option.value = String(dayObj.day);
    option.textContent = `Day ${dayObj.day} (${dayObj.name}, ${dayObj.date})`;
    dropdown.appendChild(option);
  });

  // Add "Add New Day" option
  const addOption = document.createElement('option');
  addOption.value = 'add';
  addOption.textContent = '➕ Add New Day';
  dropdown.appendChild(addOption);

  // Handle "Add New Day" selection
  dropdown.addEventListener('change', function() {
    if (this.value === 'add') {
      const dayName = prompt('Enter day name (e.g., Saturday):');
      const dayDate = prompt('Enter date (e.g., 28 March):');
      if (dayName && dayDate) {
        const newDay = tripDays.length + 1;
        tripDays.push({ day: newDay, name: dayName, date: dayDate });
        populateMainDayDropdown();
        this.value = String(newDay);
      } else {
        this.value = '1';
      }
    }
  });
}

// Select option in multi-row custom select
function selectMultiRowOption(selectId, value, label) {
  // Update stored value
  customSelectValues[selectId] = value;

  // Update button label
  document.getElementById(`${selectId}-label`).textContent = label;

  // Update selected state in dropdown
  const dropdown = document.getElementById(`${selectId}-dropdown`);
  dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

  // Close dropdown
  dropdown.classList.remove('active');
}

// Handle add new day in multi-row
function handleMultiRowAddDay(selectId) {
  addNewDay();
  // After adding new day, update all day dropdowns
  setTimeout(() => {
    populateMainDayDropdown();
    // Update all multi-row day dropdowns
    document.querySelectorAll('[id^="mr-day-"][id$="-dropdown"]').forEach(dropdown => {
      const dropdownId = dropdown.id.replace('-dropdown', '');
      const currentValue = customSelectValues[dropdownId];

      dropdown.innerHTML = '';
      tripDays.forEach(dayObj => {
        const selected = String(dayObj.day) === String(currentValue) || String(dayObj.day) === String(maxDay);
        const option = document.createElement('div');
        option.className = 'custom-select-option' + (selected ? ' selected' : '');
        const label = `Day ${dayObj.day} (${dayObj.name}, ${dayObj.date})`;
        option.onclick = () => selectMultiRowOption(dropdownId, String(dayObj.day), label);
        option.textContent = label;
        dropdown.appendChild(option);
      });

      const addOpt = document.createElement('div');
      addOpt.className = 'custom-select-option';
      addOpt.onclick = () => handleMultiRowAddDay(dropdownId);
      addOpt.textContent = '➕ Add New Day';
      dropdown.appendChild(addOpt);
    });

    // Select the new day in the dropdown that triggered this
    selectMultiRowOption(selectId, String(maxDay), `Day ${maxDay}`);
  }, 100);
}

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
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
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

document.getElementById('inp-amount').addEventListener('keydown', e => {
  if (e.key === 'Enter') addExpenseRow();
});
document.getElementById('inp-paidby').addEventListener('keydown', e => {
  if (e.key === 'Enter') addExpenseRow();
});
