// src/page/rbac/rbac.data.js

export const SIDEBAR_MODULES = [
  {
    group: "岸電控制系統",
    items: ["岸電儀表板", "即時監控模組", "船舶基本檔", "遠端控管功能", "用戶資訊綁定", "歷史紀錄查詢"],
  },
  {
    group: "船舶識別系統",
    items: ["AIS整合模組", "船舶影響辨識", "船主船隻管理"],
  },
  {
    group: "門禁管制系統",
    items: ["門閘設備管理", "門禁排程設定", "進出識別紀錄", "人員授權管理", "異常警示事件"],
  },
  {
    group: "影像監控系統",
    items: ["監控畫面管理", "攝影機管理", "影像儲存管理", "警示通報系統"],
  },
  {
    group: "通訊傳輸系統",
    items: ["網路傳輸管理", "有線設備管理", "無線設備管理"],
  },
  {
    group: "支付計費系統",
    items: ["計費項目管理", "邏輯費率管理", "支付方式支援", "帳單通知功能", "後臺管理功能"],
  },
  {
    group: "使用者專區",
    items: ["船位預約", "我的預約/停泊費用"],
  },
];

export function buildPermissionRows() {
  const rows = [];
  SIDEBAR_MODULES.forEach((m) => {
    m.items.forEach((name) => {
      rows.push({
        key: `${m.group}__${name}`,
        group: m.group,
        name,
      });
    });
  });
  return rows;
}

export const OPS = [
  { key: "view", label: "檢視" },
  { key: "edit", label: "編輯" },
  { key: "delete", label: "刪除" },
];

export const DEFAULT_ROLES = [
  { id: "role_admin", name: "管理者", level: "最高權限" },
  { id: "role_engineer", name: "工程師", level: "工程維運" },
  { id: "role_captain", name: "船長", level: "一般使用" },
  { id: "role_crew", name: "船員", level: "一般使用" },
];

export function buildDefaultRolePermissions() {
  const rows = buildPermissionRows();

  const admin = {};
  rows.forEach((r) => (admin[r.key] = new Set(["view", "edit", "delete"])));

  const engineer = {};
  rows.forEach((r) => (engineer[r.key] = new Set(["view", "edit"])));

  const captain = {};
  rows.forEach((r) => {
    const isUserArea = r.group === "使用者專區";
    const isShorepower = r.group === "岸電控制系統";
    if (isUserArea) {
      captain[r.key] = new Set(["view", "edit"]);
    } else if (isShorepower) {
      captain[r.key] = new Set(["view"]);
    } else {
      captain[r.key] = new Set([]);
    }
  });

  const crew = {};
  rows.forEach((r) => {
    const isUserArea = r.group === "使用者專區";
    crew[r.key] = new Set(isUserArea ? ["view"] : []);
  });

  return {
    role_admin: admin,
    role_engineer: engineer,
    role_captain: captain,
    role_crew: crew,
  };
}

/* =========================================================
   Pure UI In-Memory Store
   - 不使用 localStorage
   - 不跨刷新持久化
   - 同一個 SPA 分頁內可同步（新增角色後，帳號頁下拉立即更新）
   ========================================================= */

const ROLES_CHANGED_EVENT = "rbac_roles_changed";
const clone = (v) => {
  // structuredClone 可直接複製 Set / Map（現代瀏覽器）
  try {
    return structuredClone(v);
  } catch {
    // fallback：足夠支援 roles（array/object），rolePermMap 若含 Set 會退化成淺拷貝，但純 UI 仍可用
    if (Array.isArray(v)) return v.map((x) => ({ ...x }));
    if (v && typeof v === "object") return { ...v };
    return v;
  }
};

const RBAC_STORE = {
  roles: clone(DEFAULT_ROLES),
  rolePermMap: buildDefaultRolePermissions(),
};

export function rbacStoreGetRoles() {
  return clone(RBAC_STORE.roles);
}

export function rbacStoreSetRoles(nextRoles) {
  RBAC_STORE.roles = clone(Array.isArray(nextRoles) ? nextRoles : []);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ROLES_CHANGED_EVENT));
  }
}

export function rbacStoreOnRolesChanged(handler) {
  if (typeof window === "undefined" || typeof handler !== "function") return;
  window.addEventListener(ROLES_CHANGED_EVENT, handler);
}

export function rbacStoreOffRolesChanged(handler) {
  if (typeof window === "undefined" || typeof handler !== "function") return;
  window.removeEventListener(ROLES_CHANGED_EVENT, handler);
}

export function rbacStoreGetRolePermMap() {
  return clone(RBAC_STORE.rolePermMap);
}

export function rbacStoreSetRolePermMap(nextMap) {
  RBAC_STORE.rolePermMap = clone(nextMap && typeof nextMap === "object" ? nextMap : {});
}
