/**
 * auth.js
 * Authentication and profile management
 */

// ─── LOGIN & AUTHENTICATION ───────────────────────────────
let selectedLoginUser = null;

async function proceedToPassword() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    document.getElementById('nameInput').focus();
    return;
  }

  selectedLoginUser = name;

  // Check if user has a password set
  try {
    const userCreds = await firestoreGetUserCredentials(name);

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

  try {
    const isValid = await firestoreVerifyPassword(selectedLoginUser, password);

    if (isValid) {
      // Login successful
      currentUser = selectedLoginUser;
      localStorage.setItem('coorg_username', currentUser);
      sessionStorage.setItem('authenticated', 'true');
      hideLoginOverlay();

      if (!dataLoaded) {
        loadFromSheet();
      }
    } else {
      // Invalid password
      showToast('Incorrect password', 'err');
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordInput').focus();
      btn.disabled = false;
      btn.textContent = 'Login →';
    }
  } catch (error) {
    console.error('Error verifying password:', error);
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
