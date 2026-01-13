// src/page/rbac/roleStorage.js

const ROLES_KEY = "rbac.roles.v1";
const PERM_KEY = "rbac.rolePermMap.v1";

/* =========================
   Roles
========================= */
export function loadRoles(defaultRoles) {
  const raw = localStorage.getItem(ROLES_KEY);
  if (!raw) return defaultRoles;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultRoles;
    return parsed;
  } catch {
    return defaultRoles;
  }
}

export function saveRoles(roles) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  // 同分頁通知：storage event 不會在同一個 tab 觸發
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rbac_roles_changed"));
  }
}

export function clearRoles() {
  localStorage.removeItem(ROLES_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rbac_roles_changed"));
  }
}

/* =========================
   Role Permission Map
   shape in storage:
   {
     [roleId]: {
       [permKey]: ["view","edit","delete"]
     }
   }
========================= */
export function loadRolePermMap() {
  const raw = localStorage.getItem(PERM_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRolePermMap(serializableMap) {
  localStorage.setItem(PERM_KEY, JSON.stringify(serializableMap));
}

export function clearRolePermMap() {
  localStorage.removeItem(PERM_KEY);
}

/* =========================
   Helpers: Set <-> Array
========================= */
export function serializeRolePermMap(rolePermMap) {
  // rolePermMap: { [roleId]: { [permKey]: Set<string> } }
  const out = {};
  if (!rolePermMap || typeof rolePermMap !== "object") return out;

  Object.keys(rolePermMap).forEach((roleId) => {
    out[roleId] = {};
    const permObj = rolePermMap[roleId] || {};
    Object.keys(permObj).forEach((permKey) => {
      const setVal = permObj[permKey];
      out[roleId][permKey] = Array.isArray(setVal)
        ? setVal
        : setVal instanceof Set
        ? Array.from(setVal)
        : [];
    });
  });

  return out;
}

export function hydrateRolePermMap(serialized) {
  // serialized: { [roleId]: { [permKey]: string[] } }
  const out = {};
  if (!serialized || typeof serialized !== "object") return out;

  Object.keys(serialized).forEach((roleId) => {
    out[roleId] = {};
    const permObj = serialized[roleId] || {};
    Object.keys(permObj).forEach((permKey) => {
      const arr = permObj[permKey];
      out[roleId][permKey] = new Set(Array.isArray(arr) ? arr : []);
    });
  });

  return out;
}
