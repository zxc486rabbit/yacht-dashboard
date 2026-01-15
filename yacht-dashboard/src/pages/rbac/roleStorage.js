// src/page/rbac/roleStorage.js
// Pure UI mock store (in-memory). No localStorage, no persistence across refresh.

let rolesCache = null;
let rolePermMapCache = null;

/* =========================
   Roles
========================= */
export function loadRoles(defaultRoles) {
  return Array.isArray(rolesCache) ? rolesCache : defaultRoles;
}

export function saveRoles(roles) {
  rolesCache = Array.isArray(roles) ? roles : [];
  // 同分頁通知（AccountManagement 會聽）
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rbac_roles_changed"));
  }
}

export function clearRoles() {
  rolesCache = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rbac_roles_changed"));
  }
}

/* =========================
   Role Permission Map
   shape:
   {
     [roleId]: {
       [permKey]: ["view","edit","delete"]
     }
   }
========================= */
export function loadRolePermMap() {
  return rolePermMapCache && typeof rolePermMapCache === "object" ? rolePermMapCache : null;
}

export function saveRolePermMap(serializableMap) {
  rolePermMapCache = serializableMap && typeof serializableMap === "object" ? serializableMap : {};
}

export function clearRolePermMap() {
  rolePermMapCache = null;
}

/* =========================
   Helpers: Set <-> Array
========================= */
export function serializeRolePermMap(rolePermMap) {
  const out = {};
  if (!rolePermMap || typeof rolePermMap !== "object") return out;

  Object.keys(rolePermMap).forEach((roleId) => {
    out[roleId] = {};
    const permObj = rolePermMap[roleId] || {};
    Object.keys(permObj).forEach((permKey) => {
      const setVal = permObj[permKey];
      out[roleId][permKey] = Array.isArray(setVal) ? setVal : setVal instanceof Set ? Array.from(setVal) : [];
    });
  });

  return out;
}

export function hydrateRolePermMap(serialized) {
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
