import React, { useMemo, useState } from "react";
import "./permission-management.css";

/**
 * Permission Management (UI-first)
 * - Left: Role list
 * - Right: Role summary + Tabs
 *   - Matrix
 *   - User Assignment (placeholder UI)
 *   - Role Detail (placeholder UI)
 *   - Audit Log (placeholder UI)
 */

const ACTIONS = ["view", "create", "edit", "delete", "export"];

const seedRoles = [
  { id: "r1", name: "Admin", key: "admin", enabled: true, usersCount: 5, system: true },
  { id: "r2", name: "Manager", key: "manager", enabled: true, usersCount: 12, system: false },
  { id: "r3", name: "Staff", key: "staff", enabled: false, usersCount: 30, system: false },
];

const seedModules = [
  {
    moduleKey: "products",
    moduleName: "商品管理 Products",
    permissions: [
      { code: "products", label: "Products" },
      { code: "product-images", label: "Product Images" },
    ],
  },
  {
    moduleKey: "orders",
    moduleName: "訂單管理 Orders",
    permissions: [
      { code: "orders", label: "Orders" },
      { code: "refunds", label: "Refunds" },
    ],
  },
  {
    moduleKey: "inventory",
    moduleName: "庫存管理 Inventory",
    permissions: [
      { code: "inventory", label: "Inventory" },
      { code: "inventory-adjust", label: "Inventory Adjust" },
    ],
  },
  {
    moduleKey: "members",
    moduleName: "會員管理 Members",
    permissions: [
      { code: "members", label: "Members" },
      { code: "member-tags", label: "Member Tags" },
    ],
  },
  {
    moduleKey: "settings",
    moduleName: "系統設定 Settings",
    permissions: [
      { code: "settings", label: "Settings" },
      { code: "audit-log", label: "Audit Log" },
    ],
  },
];

// 生成完整 permission key： e.g. orders.refunds.view
function buildPermKey(moduleKey, permCode, action) {
  return `${moduleKey}.${permCode}.${action}`;
}

// 先給每個 role 一份初始勾選（假資料）
function seedRoleGrants(roleKey) {
  const grants = {};
  const allowAll = roleKey === "admin";
  const managerDefault = roleKey === "manager";

  for (const m of seedModules) {
    for (const p of m.permissions) {
      for (const a of ACTIONS) {
        const k = buildPermKey(m.moduleKey, p.code, a);

        if (allowAll) {
          grants[k] = true;
        } else if (managerDefault) {
          // manager：大多可 view/edit，少 delete
          grants[k] = a === "view" || a === "edit" || (a === "create" && m.moduleKey !== "settings");
          if (a === "delete" || a === "export") grants[k] = false;
        } else {
          // staff：多 view，少 edit/create
          grants[k] = a === "view";
          if (m.moduleKey === "settings") grants[k] = false;
        }
      }
    }
  }
  return grants;
}

const initialRoleGrantsByKey = {
  admin: seedRoleGrants("admin"),
  manager: seedRoleGrants("manager"),
  staff: seedRoleGrants("staff"),
};

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="pm-modalOverlay" role="dialog" aria-modal="true">
      <div className="pm-modal">
        <div className="pm-modalHeader">
          <div className="pm-modalTitle">{title}</div>
          <button className="pm-iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="pm-modalBody">{children}</div>
      </div>
    </div>
  );
}

export default function PermissionManagement() {
  const [roles] = useState(seedRoles);
  const [selectedRoleId, setSelectedRoleId] = useState(seedRoles[1].id); // default: Manager
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || roles[0],
    [roles, selectedRoleId]
  );

  // 左側搜尋/篩選
  const [roleKeyword, setRoleKeyword] = useState("");
  const [roleStatus, setRoleStatus] = useState("all"); // all | enabled | disabled

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const matchKeyword =
        !roleKeyword ||
        r.name.toLowerCase().includes(roleKeyword.toLowerCase()) ||
        r.key.toLowerCase().includes(roleKeyword.toLowerCase());
      const matchStatus =
        roleStatus === "all" ||
        (roleStatus === "enabled" && r.enabled) ||
        (roleStatus === "disabled" && !r.enabled);
      return matchKeyword && matchStatus;
    });
  }, [roles, roleKeyword, roleStatus]);

  // 右側：tab
  const [tab, setTab] = useState("matrix"); // matrix | users | role | audit

  // 右側：矩陣搜尋/收合
  const [permKeyword, setPermKeyword] = useState("");
  const [expandedModules, setExpandedModules] = useState(() => new Set(seedModules.map((m) => m.moduleKey)));

  // grants 草稿（UI-only）
  const [grantsDraftByRoleKey, setGrantsDraftByRoleKey] = useState(() => structuredClone(initialRoleGrantsByKey));
  const [dirtyByRoleKey, setDirtyByRoleKey] = useState({ admin: false, manager: false, staff: false });

  const grants = grantsDraftByRoleKey[selectedRole.key] || {};
  const isDirty = !!dirtyByRoleKey[selectedRole.key];

  // Modal
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [openPermModal, setOpenPermModal] = useState(false);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);

  const selectedCount = useMemo(() => Object.values(grants).filter(Boolean).length, [grants]);
  const totalCount = useMemo(() => Object.keys(grants).length, [grants]);

  function markDirty(roleKey) {
    setDirtyByRoleKey((prev) => ({ ...prev, [roleKey]: true }));
  }

  function toggleModule(moduleKey) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
  }

  function setGrant(roleKey, permKey, value) {
    setGrantsDraftByRoleKey((prev) => {
      const next = { ...prev };
      next[roleKey] = { ...(next[roleKey] || {}), [permKey]: value };
      return next;
    });
    markDirty(roleKey);
  }

  function selectAll(roleKey, value) {
    setGrantsDraftByRoleKey((prev) => {
      const next = { ...prev };
      const roleGrants = { ...(next[roleKey] || {}) };
      for (const k of Object.keys(roleGrants)) roleGrants[k] = value;
      next[roleKey] = roleGrants;
      return next;
    });
    markDirty(roleKey);
  }

  function selectModule(roleKey, moduleKey, value) {
    setGrantsDraftByRoleKey((prev) => {
      const next = { ...prev };
      const roleGrants = { ...(next[roleKey] || {}) };

      for (const m of seedModules) {
        if (m.moduleKey !== moduleKey) continue;
        for (const p of m.permissions) {
          for (const a of ACTIONS) {
            const k = buildPermKey(m.moduleKey, p.code, a);
            roleGrants[k] = value;
          }
        }
      }

      next[roleKey] = roleGrants;
      return next;
    });
    markDirty(roleKey);
  }

  const visibleModules = useMemo(() => {
    if (!permKeyword) return seedModules;

    const kw = permKeyword.toLowerCase();
    return seedModules
      .map((m) => {
        const perms = m.permissions.filter((p) => {
          const base = `${m.moduleKey}.${p.code}`.toLowerCase();
          return base.includes(kw) || p.label.toLowerCase().includes(kw) || m.moduleName.toLowerCase().includes(kw);
        });
        return { ...m, permissions: perms };
      })
      .filter((m) => m.permissions.length > 0);
  }, [permKeyword]);

  function saveChangesUIOnly() {
    // 目前只做 UI：儲存後清除 dirty
    setDirtyByRoleKey((prev) => ({ ...prev, [selectedRole.key]: false }));
  }

  return (
    <div className="pm-page">
      {/* Header */}
      <div className="pm-header">
        <div>
          <div className="pm-title">權限管理</div>
          <div className="pm-breadcrumb">系統管理 / RBAC / 權限管理</div>
        </div>
        <div className="pm-headerActions">
          <button className="pm-btn" onClick={() => setOpenRoleModal(true)}>新增角色</button>
          <button className="pm-btn" onClick={() => setOpenPermModal(true)}>新增權限項目</button>
          <button className="pm-btn">匯出設定</button>
          <button className="pm-btn pm-btnPrimary" onClick={saveChangesUIOnly} disabled={!isDirty}>
            儲存變更
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pm-grid">
        {/* Left: Role list */}
        <aside className="pm-panel">
          <div className="pm-panelHeader">
            <div className="pm-panelTitle">角色 Roles</div>
            <div className="pm-panelSubtitle">選擇角色以編輯權限</div>
          </div>

          <div className="pm-roleToolbar">
            <input
              className="pm-input"
              value={roleKeyword}
              onChange={(e) => setRoleKeyword(e.target.value)}
              placeholder="搜尋角色名稱 / key"
            />
            <select className="pm-select" value={roleStatus} onChange={(e) => setRoleStatus(e.target.value)}>
              <option value="all">全部狀態</option>
              <option value="enabled">啟用</option>
              <option value="disabled">停用</option>
            </select>
          </div>

          <div className="pm-roleList">
            {filteredRoles.map((r) => {
              const selected = r.id === selectedRoleId;
              const roleDirty = !!dirtyByRoleKey[r.key];
              return (
                <button
                  key={r.id}
                  className={`pm-roleItem ${selected ? "is-selected" : ""}`}
                  onClick={() => setSelectedRoleId(r.id)}
                  type="button"
                >
                  <div className="pm-roleTop">
                    <div className="pm-roleName">
                      {r.name} {r.system ? <span className="pm-lock" title="系統角色">🔒</span> : null}
                    </div>
                    <div className={`pm-tag ${r.enabled ? "is-on" : "is-off"}`}>{r.enabled ? "啟用" : "停用"}</div>
                  </div>
                  <div className="pm-roleMeta">
                    <span className="pm-mono">{r.key}</span>
                    <span className="pm-dot">•</span>
                    <span>{r.usersCount} users</span>
                    {roleDirty ? <span className="pm-dirtyBadge">尚未儲存</span> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pm-panelFooter">
            <button className="pm-btn" onClick={() => setOpenRoleModal(true)}>新增角色</button>
            <button className="pm-btn pm-btnDanger" disabled={selectedRole.system}>
              刪除角色
            </button>
          </div>
        </aside>

        {/* Right: Editor */}
        <main className="pm-panel">
          <div className="pm-editorHeader">
            <div>
              <div className="pm-editorRole">
                角色：<span className="pm-strong">{selectedRole.name}</span>{" "}
                <span className="pm-muted">({selectedRole.key})</span>
              </div>
              <div className="pm-editorMeta">
                狀態：{selectedRole.enabled ? "啟用" : "停用"}
                <span className="pm-dot">•</span>
                最後修改：—（UI 佔位）
              </div>
            </div>

            <div className="pm-editorRight">
              {isDirty ? <div className="pm-warning">尚未儲存變更</div> : <div className="pm-ok">已同步（UI）</div>}
            </div>
          </div>

          {/* Tabs */}
          <div className="pm-tabs">
            <button className={`pm-tab ${tab === "matrix" ? "is-active" : ""}`} onClick={() => setTab("matrix")}>
              權限矩陣
            </button>
            <button className={`pm-tab ${tab === "users" ? "is-active" : ""}`} onClick={() => setTab("users")}>
              使用者指派
            </button>
            <button className={`pm-tab ${tab === "role" ? "is-active" : ""}`} onClick={() => setTab("role")}>
              角色資訊
            </button>
            <button className={`pm-tab ${tab === "audit" ? "is-active" : ""}`} onClick={() => setTab("audit")}>
              變更紀錄
            </button>
          </div>

          {/* Tab Content */}
          <div className="pm-tabBody">
            {tab === "matrix" && (
              <>
                <div className="pm-matrixToolbar">
                  <input
                    className="pm-input"
                    value={permKeyword}
                    onChange={(e) => setPermKeyword(e.target.value)}
                    placeholder="搜尋權限（例如 order / inventory / settings）"
                  />
                  <div className="pm-matrixActions">
                    <div className="pm-counter">
                      已勾選 <span className="pm-strong">{selectedCount}</span> / {totalCount}
                    </div>
                    <button className="pm-btn" onClick={() => selectAll(selectedRole.key, true)}>全選</button>
                    <button className="pm-btn" onClick={() => selectAll(selectedRole.key, false)}>全取消</button>
                    <button className="pm-btn" onClick={() => setOpenTemplateModal(true)}>套用範本</button>
                  </div>
                </div>

                <div className="pm-matrixTableWrap">
                  <div className="pm-matrixTableHeader">
                    <div className="pm-colPerm">權限項目</div>
                    {ACTIONS.map((a) => (
                      <div key={a} className="pm-colAction">{a.toUpperCase()}</div>
                    ))}
                  </div>

                  {visibleModules.map((m) => {
                    const expanded = expandedModules.has(m.moduleKey);

                    return (
                      <div key={m.moduleKey} className="pm-module">
                        <div className="pm-moduleHeader">
                          <button className="pm-moduleToggle" onClick={() => toggleModule(m.moduleKey)} type="button">
                            <span className="pm-caret">{expanded ? "▾" : "▸"}</span>
                            <span className="pm-moduleTitle">{m.moduleName}</span>
                          </button>

                          <div className="pm-moduleActions">
                            <button className="pm-btn pm-btnSmall" onClick={() => selectModule(selectedRole.key, m.moduleKey, true)}>
                              本模組全選
                            </button>
                            <button className="pm-btn pm-btnSmall" onClick={() => selectModule(selectedRole.key, m.moduleKey, false)}>
                              本模組全取消
                            </button>
                          </div>
                        </div>

                        {expanded && (
                          <div className="pm-moduleBody">
                            {m.permissions.map((p) => (
                              <div key={p.code} className="pm-row">
                                <div className="pm-colPerm">
                                  <div className="pm-permLabel">{p.label}</div>
                                  <div className="pm-permCode pm-mono">
                                    {m.moduleKey}.{p.code}
                                  </div>
                                </div>

                                {ACTIONS.map((a) => {
                                  const k = buildPermKey(m.moduleKey, p.code, a);
                                  const checked = !!grants[k];
                                  return (
                                    <div key={k} className="pm-colAction">
                                      <label className="pm-check">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => setGrant(selectedRole.key, k, e.target.checked)}
                                        />
                                        <span className="pm-checkMark" />
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {visibleModules.length === 0 && (
                    <div className="pm-empty">
                      找不到符合的權限項目（請調整搜尋關鍵字）
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "users" && (
              <div className="pm-placeholder">
                <div className="pm-placeholderTitle">使用者指派（UI 佔位）</div>
                <div className="pm-placeholderText">
                  建議用 Dual List（左右穿梭框）：左側可加入、右側已指派。此區先保留版位即可。
                </div>
                <div className="pm-dual">
                  <div className="pm-dualBox">可加入使用者（列表）</div>
                  <div className="pm-dualCtrl">
                    <button className="pm-btn pm-btnSmall">{">"}</button>
                    <button className="pm-btn pm-btnSmall">{">>"}</button>
                    <button className="pm-btn pm-btnSmall">{"<"}</button>
                    <button className="pm-btn pm-btnSmall">{"<<"}</button>
                  </div>
                  <div className="pm-dualBox">已指派使用者（列表）</div>
                </div>
              </div>
            )}

            {tab === "role" && (
              <div className="pm-form">
                <div className="pm-formRow">
                  <div className="pm-formLabel">角色名稱</div>
                  <input className="pm-input" defaultValue={selectedRole.name} />
                </div>
                <div className="pm-formRow">
                  <div className="pm-formLabel">Key</div>
                  <input className="pm-input" defaultValue={selectedRole.key} readOnly />
                </div>
                <div className="pm-formRow">
                  <div className="pm-formLabel">狀態</div>
                  <div className="pm-inline">
                    <label className="pm-switch">
                      <input type="checkbox" defaultChecked={selectedRole.enabled} />
                      <span className="pm-slider" />
                    </label>
                    <span className="pm-muted">{selectedRole.enabled ? "啟用" : "停用"}</span>
                  </div>
                </div>
                <div className="pm-formRow">
                  <div className="pm-formLabel">說明</div>
                  <textarea className="pm-textarea" placeholder="輸入角色說明（UI）" />
                </div>

                <div className="pm-formActions">
                  <button className="pm-btn">儲存角色資訊（UI）</button>
                  <button className="pm-btn pm-btnDanger" disabled={selectedRole.system}>
                    刪除角色
                  </button>
                </div>
              </div>
            )}

            {tab === "audit" && (
              <div className="pm-placeholder">
                <div className="pm-placeholderTitle">變更紀錄（UI 佔位）</div>
                <div className="pm-placeholderText">
                  後續可接入審計紀錄 API。此處先以表格占位：時間、操作者、變更內容、IP。
                </div>

                <div className="pm-auditFilters">
                  <input className="pm-input" placeholder="搜尋操作者 / 關鍵字" />
                  <input className="pm-input" type="date" />
                  <input className="pm-input" type="date" />
                </div>

                <div className="pm-auditTable">
                  <div className="pm-auditRow pm-auditHeader">
                    <div>時間</div>
                    <div>操作者</div>
                    <div>變更內容</div>
                    <div>IP</div>
                  </div>
                  <div className="pm-auditRow">
                    <div className="pm-muted">—</div>
                    <div className="pm-muted">—</div>
                    <div className="pm-muted">—</div>
                    <div className="pm-muted">—</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals (UI only) */}
      <Modal open={openRoleModal} title="新增角色（UI）" onClose={() => setOpenRoleModal(false)}>
        <div className="pm-form">
          <div className="pm-formRow">
            <div className="pm-formLabel">角色名稱</div>
            <input className="pm-input" placeholder="例如：Operator" />
          </div>
          <div className="pm-formRow">
            <div className="pm-formLabel">Key</div>
            <input className="pm-input" placeholder="例如：operator" />
          </div>
          <div className="pm-formRow">
            <div className="pm-formLabel">狀態</div>
            <div className="pm-inline">
              <label className="pm-switch">
                <input type="checkbox" defaultChecked />
                <span className="pm-slider" />
              </label>
              <span className="pm-muted">啟用</span>
            </div>
          </div>
          <div className="pm-formRow">
            <div className="pm-formLabel">說明</div>
            <textarea className="pm-textarea" placeholder="角色用途說明（UI）" />
          </div>

          <div className="pm-formActions">
            <button className="pm-btn" onClick={() => setOpenRoleModal(false)}>取消</button>
            <button className="pm-btn pm-btnPrimary" onClick={() => setOpenRoleModal(false)}>建立（UI）</button>
          </div>
        </div>
      </Modal>

      <Modal open={openPermModal} title="新增權限項目（UI）" onClose={() => setOpenPermModal(false)}>
        <div className="pm-form">
          <div className="pm-formRow">
            <div className="pm-formLabel">模組</div>
            <input className="pm-input" placeholder="例如：orders" />
          </div>
          <div className="pm-formRow">
            <div className="pm-formLabel">權限代碼</div>
            <input className="pm-input" placeholder="例如：refunds" />
          </div>
          <div className="pm-formRow">
            <div className="pm-formLabel">Actions</div>
            <div className="pm-chipRow">
              {ACTIONS.map((a) => (
                <label key={a} className="pm-chip">
                  <input type="checkbox" defaultChecked={a === "view" || a === "edit"} />
                  <span>{a.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pm-formActions">
            <button className="pm-btn" onClick={() => setOpenPermModal(false)}>取消</button>
            <button className="pm-btn pm-btnPrimary" onClick={() => setOpenPermModal(false)}>新增（UI）</button>
          </div>
        </div>
      </Modal>

      <Modal open={openTemplateModal} title="套用範本（UI）" onClose={() => setOpenTemplateModal(false)}>
        <div className="pm-template">
          <div className="pm-templateHint">
            套用範本會覆蓋目前角色的勾選狀態（此為 UI 行為示意）。
          </div>

          <div className="pm-formRow">
            <div className="pm-formLabel">範本</div>
            <select className="pm-select" defaultValue="manager">
              <option value="admin">Admin（全開）</option>
              <option value="manager">Manager（預設）</option>
              <option value="staff">Staff（偏只讀）</option>
            </select>
          </div>

          <div className="pm-formActions">
            <button className="pm-btn" onClick={() => setOpenTemplateModal(false)}>取消</button>
            <button
              className="pm-btn pm-btnPrimary"
              onClick={() => {
                // UI-only：直接複製範本到目前角色
                setGrantsDraftByRoleKey((prev) => ({
                  ...prev,
                  [selectedRole.key]: structuredClone(initialRoleGrantsByKey["manager"]),
                }));
                markDirty(selectedRole.key);
                setOpenTemplateModal(false);
              }}
            >
              確認套用（UI）
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
