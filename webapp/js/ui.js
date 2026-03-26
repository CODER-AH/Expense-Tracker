/**
 * ui.js
 * UI components and helpers - filters, sort, pagination, toasts, etc.
 */

// ─── SECTION TOGGLE ───────────────────────────────────────
function toggleSection(sectionId) {
  const section = document.getElementById(`${sectionId}-section`);
  const icon = document.getElementById(`${sectionId}-icon`);

  if (section.style.display === 'none') {
    section.style.display = 'block';
    icon.textContent = '▼';

    // Lazy load archived expenses when opening archived section
    if (sectionId === 'archived' && !archivedLoaded) {
      loadArchivedExpenses();
    }

    // Lazy load notes when opening notes section
    if (sectionId === 'notes' && !notesLoaded) {
      loadNotes();
    }
  } else {
    section.style.display = 'none';
    icon.textContent = '▶';
  }
}

// ─── UI HELPERS ───────────────────────────────────────────
function setStatus(state, text) {
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot' + (state ? ' ' + state : '');
  document.getElementById('statusText').textContent = text;
}

// ─── LOADING & TOAST ──────────────────────────────────────
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

function getRandomLoadingMessage() {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');

  if (show) {
    // Set a random loading message
    if (loadingText) {
      loadingText.textContent = getRandomLoadingMessage();
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

// ─── SORT & FILTER ────────────────────────────────────────
function sortByColumn(column) {
  // Toggle sort order if clicking same column
  if (sortBy === column) {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy = column;
    sortOrder = 'desc'; // Default to descending for new column
  }

  // Clear old sort indicators
  document.querySelectorAll('thead th.sortable').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
  });

  // Mark current sorted column
  document.querySelectorAll(`thead th.sortable[onclick="sortByColumn('${column}')"]`).forEach(th => {
    th.classList.add(sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
  });

  render();
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
  document.getElementById('dayFilterDropdown').classList.remove('active');

  // Update selected state
  document.querySelectorAll('#dayFilterDropdown .filter-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

  currentPage = 1;
  render();
}

function selectPersonFilter(value, label) {
  filterBy = value;
  document.getElementById('personFilterLabel').textContent = label;
  document.getElementById('personFilterDropdown').classList.remove('active');

  // Update selected state
  document.querySelectorAll('#personFilterDropdown .filter-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.target.classList.add('selected');

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
  if (!e.target.closest('.user-chip') && !e.target.closest('.profile-dropdown')) {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) profileDropdown.style.display = 'none';
  }
});

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

// ─── COLUMN VISIBILITY TOGGLE ──────────────────────────────
let visibleColumns = {
  day: true,
  desc: true,
  cat: true,
  name: false,
  paidBy: false,
  time: false,
  amount: true
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
}
