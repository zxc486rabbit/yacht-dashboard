// src/page/rbac/rbac.data.js

export const SIDEBAR_MODULES = [
  {
    group: "岸電控制系統",
    items: [
      "岸電儀表板",
      "即時監控模組",
      "船舶基本檔",
      "遠端控管功能",
      "用戶資訊綁定",
      "歷史紀錄查詢",
    ],
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

// 將「側欄每個子項目」攤平成權限列（每列會呈現在「編輯權限」大 Modal 表格中）
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

// 操作權限定義（顯示：檢視/編輯/刪除）
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

// 建立每個角色的預設權限（可依需求調整）
export function buildDefaultRolePermissions() {
  const rows = buildPermissionRows();

  // 管理者：全勾
  const admin = {};
  rows.forEach((r) => (admin[r.key] = new Set(["view", "edit", "delete"])));

  // 工程師：多數可檢視/編輯，刪除保守（此處示範：全部 view+edit）
  const engineer = {};
  rows.forEach((r) => (engineer[r.key] = new Set(["view", "edit"])));

  // 船長：主要使用者專區及部分檢視功能
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

  // 船員：僅使用者專區檢視
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
