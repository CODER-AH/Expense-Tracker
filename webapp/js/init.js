/**
 * init.js
 * Initialization and event listeners
 */

// ─── INITIALIZATION ───────────────────────────────────────
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
    hideLoginOverlay();
    updateFilterOptions();
    loadFromSheet();
  } else {
    // Show login screen
    showLoading(false);
    sessionStorage.removeItem('authenticated');
    document.getElementById('loginOverlay').classList.removeClass('hidden');
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

// ─── EVENT LISTENERS ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Budget input
  document.getElementById('budgetInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmBudgetEdit();
    if (e.key === 'Escape') cancelBudgetEdit();
  });

  // Password inputs
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

  // Change password inputs
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

  // Name input
  document.getElementById('nameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveName();
  });
  document.getElementById('nameInput').addEventListener('change', e => {
    if (e.target.value) saveName();
  });

  // Note text area
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

  // Load column visibility preferences
  loadColumnVisibility();
});
