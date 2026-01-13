// src/page/rbac/accountStorage.js
//
// Account list persistence for AccountManagement.jsx
// Storage key is versioned to allow future migrations.

const ACCOUNTS_KEY = "rbac.accounts.v1";

/**
 * Load accounts from localStorage.
 * @param {Array<any>} defaultAccounts fallback when storage is empty/invalid
 */
export function loadAccounts(defaultAccounts = []) {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return defaultAccounts;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultAccounts;
    return parsed;
  } catch {
    return defaultAccounts;
  }
}

/**
 * Save accounts to localStorage.
 * @param {Array<any>} accounts
 */
export function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/**
 * Clear accounts from localStorage.
 */
export function clearAccounts() {
  localStorage.removeItem(ACCOUNTS_KEY);
}
