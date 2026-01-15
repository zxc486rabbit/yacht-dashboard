// src/page/rbac/accountStorage.js
// Pure UI mock store (in-memory). No localStorage, no persistence across refresh.

let accountsCache = null;

/**
 * Load accounts from in-memory cache.
 * @param {Array<any>} defaultAccounts fallback
 */
export function loadAccounts(defaultAccounts = []) {
  return Array.isArray(accountsCache) ? accountsCache : defaultAccounts;
}

/**
 * Save accounts to in-memory cache (never throws).
 * @param {Array<any>} accounts
 * @returns {{ ok: boolean, reason?: string }}
 */
export function saveAccounts(accounts) {
  accountsCache = Array.isArray(accounts) ? accounts : [];
  return { ok: true, reason: "memory_only" };
}

/**
 * Clear accounts cache.
 */
export function clearAccounts() {
  accountsCache = null;
}
