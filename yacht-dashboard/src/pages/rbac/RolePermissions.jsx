// src/page/rbac/RolePermissions.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDefaultRolePermissions,
  buildPermissionRows,
  DEFAULT_ROLES,
  OPS,
} from "./rbac.data";
import {
  loadRoles,
  saveRoles,
  loadRolePermMap,
  saveRolePermMap,
  serializeRolePermMap,
  hydrateRolePermMap,
} from "./roleStorage";

/* =========================================================
   RBAC Hook（UI 層自我約束 / self-dogfooding）
   ========================================================= */
function useRBAC(currentUser) {
  const isAdmin = currentUser.role === "管理者";

  return {
    isAdmin,
    canEditRole: isAdmin,
    canDeleteRole: isAdmin,
    canEditPermission: isAdmin,
  };
}

/* =========================================================
   Modal
   ========================================================= */
function Modal({ title, size = "md", onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="rbac-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`rbac-modal ${
          size === "sm" ? "sm" : size === "lg" ? "lg" : ""
        }`}
      >
        <div className="rbac-modal-head">
          <h3 className="rbac-modal-title">{title}</h3>
          <button className="icon-x" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="rbac-modal-body">{children}</div>
        {footer ? <div className="rbac-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* =========================================================
   MultiSelectOps
   ========================================================= */
function MultiSelectOps({ valueSet, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (k) => {
    const next = new Set(valueSet);
    next.has(k) ? next.delete(k) : next.add(k);
    onChange(next);
  };

  return (
    <div className="ms" ref={wrapRef}>
      <div className="ms-box" onClick={() => setOpen((s) => !s)}>
        {OPS.filter((o) => valueSet.has(o.key)).map((c) => (
          <span key={c.key} className={`chip ${c.key}`}>
            {c.label}
          </span>
        ))}
        {valueSet.size === 0 && <span className="small-muted">未設定</span>}
      </div>
      {open && (
        <div className="ms-menu">
          {OPS.map((o) => (
            <div
              key={o.key}
              className="ms-item"
              onClick={() => toggle(o.key)}
            >
              <input type="checkbox" checked={valueSet.has(o.key)} readOnly />
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Utils
   ========================================================= */
function buildGroups(rows) {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.group]) map[r.group] = [];
    map[r.group].push(r);
  });
  return Object.keys(map).map((k) => ({ key: k, title: k, items: map[k] }));
}

/* =========================================================
   權限配置策略：根據權限等級自動分配預設權限
   ========================================================= */
function buildPermissionsByLevel(level, permissionRows) {
  const permissions = {};

  permissionRows.forEach((row) => {
    const { key, group } = row;

    switch (level) {
      case "最高權限":
        permissions[key] = new Set(["view", "edit", "delete"]);
        break;

      case "工程維運":
        if (group === "支付計費系統") {
          permissions[key] = new Set(["view"]);
        } else {
          permissions[key] = new Set(["view", "edit"]);
        }
        break;

      case "一般使用":
        if (group === "岸電控制系統") {
          if (row.name.includes("即時監控") || row.name.includes("歷史紀錄")) {
            permissions[key] = new Set(["view"]);
          } else {
            permissions[key] = new Set([]);
          }
        } else if (group === "船舶識別系統") {
          permissions[key] = new Set(["view"]);
        } else if (group === "使用者專區") {
          permissions[key] = new Set(["view", "edit"]);
        } else {
          permissions[key] = new Set([]);
        }
        break;

      case "訪客":
        if (group === "使用者專區") {
          permissions[key] = new Set(["view"]);
        } else {
          permissions[key] = new Set([]);
        }
        break;

      default:
        permissions[key] = new Set([]);
    }
  });

  return permissions;
}

/* =========================================================
   Normalize / Validate RolePermMap
   - 確保：
     1) 只保留現存 roles
     2) 每個 role 都有 permissionRows 的每個 key
     3) 每個 permKey 都是 Set
     4) 權限值只允許 OPS 內的 key
   ========================================================= */
function normalizeRolePermMap({ roles, permissionRows, rolePermMap }) {
  const allowedOps = new Set(OPS.map((o) => o.key));

  const next = {};

  roles.forEach((role) => {
    const roleId = role.id;
    const base = rolePermMap?.[roleId] || {};
    next[roleId] = {};

    permissionRows.forEach((row) => {
      const permKey = row.key;
      const raw = base[permKey];

      const setVal =
        raw instanceof Set
          ? raw
          : Array.isArray(raw)
          ? new Set(raw)
          : new Set();

      const cleaned = new Set(
        Array.from(setVal).filter((op) => allowedOps.has(op))
      );

      next[roleId][permKey] = cleaned;
    });
  });

  return next;
}


/* =========================================================
   Main Component
   ========================================================= */
export default function RolePermissions() {
  /* ====== 模擬登入者（之後接 JWT / AuthContext） ====== */
  const currentUser = { role: "管理者" }; // 改成「工程師 / 船長 / 船員」即可驗證

  /* ====== RBAC ====== */
  const rbac = useRBAC(currentUser);

  /* ====== 權限等級選項 ====== */
  const PERMISSION_LEVELS = [
    { value: "最高權限", label: "最高權限" },
    { value: "工程維運", label: "工程維運" },
    { value: "一般使用", label: "一般使用" },
    { value: "訪客", label: "訪客" },
  ];

  const permissionRows = useMemo(() => buildPermissionRows(), []);
  const permGroups = useMemo(() => buildGroups(permissionRows), [permissionRows]);

  /**
   *  roles：從 localStorage 讀回來
   */
  const [roles, setRoles] = useState(() => loadRoles(DEFAULT_ROLES));

  /**
   *  roles 變動即持久化
   */
  useEffect(() => {
    saveRoles(roles);
  }, [roles]);

  /**
   *  rolePermMap：優先從 localStorage 讀回來，沒有才用預設
   * - localStorage 存的是「陣列」，載入時轉回 Set
   */
  const [rolePermMap, setRolePermMap] = useState(() => {
    const stored = loadRolePermMap(); // serialized object or null
    if (stored) {
      const hydrated = hydrateRolePermMap(stored);
      return hydrated;
    }
    return buildDefaultRolePermissions();
  });

  /**
   *  normalize：確保 rolePermMap 與 roles / permissionRows 一致
   * - 角色新增/刪除/權限列變動，都會自動補齊/修剪
   */
  useEffect(() => {
    setRolePermMap((prev) => {
      // 若某角色完全沒有 permMap，依 level 建一份預設，再一起 normalize
      const withMissingFilled = { ...(prev || {}) };

      roles.forEach((role) => {
        if (!withMissingFilled[role.id]) {
          withMissingFilled[role.id] = buildPermissionsByLevel(
            role.level,
            permissionRows
          );
        }
      });

      const normalized = normalizeRolePermMap({
        roles,
        permissionRows,
        rolePermMap: withMissingFilled,
      });

      return normalized;
    });
  }, [roles, permissionRows]);

  /**
   * rolePermMap 變動即持久化（Set 轉陣列）
   */
  useEffect(() => {
    const serializable = serializeRolePermMap(rolePermMap);
    saveRolePermMap(serializable);
  }, [rolePermMap]);

  const [permRoleId, setPermRoleId] = useState(null);
  const permRole = roles.find((r) => r.id === permRoleId) || null;

  const [editRoleId, setEditRoleId] = useState(null);
  const editRole = roles.find((r) => r.id === editRoleId) || null;

  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const deleteRole = roles.find((r) => r.id === deleteRoleId) || null;

  const [showAddRole, setShowAddRole] = useState(false);

  const [activeSystemKey, setActiveSystemKey] = useState(
    permGroups?.[0]?.key ?? ""
  );

  const updateRolePermissionRow = (roleId, permKey, nextSet) => {
    if (!rbac.canEditPermission) return;

    setRolePermMap((prev) => ({
      ...prev,
      [roleId]: { ...prev[roleId], [permKey]: new Set(nextSet) },
    }));
  };

  return (
    <div className="rbac-card">
      {/* ====== Header ====== */}
      <div className="rbac-actions" style={{ justifyContent: "space-between" }}>
        <div>
          {rbac.isAdmin && (
            <button
              className="btn btn-yellow"
              onClick={() => setShowAddRole(true)}
              type="button"
            >
              新增角色
            </button>
          )}
        </div>

        <div className="small-muted">
          目前登入角色：
          <strong style={{ marginLeft: 6 }}>{currentUser.role}</strong>
        </div>
      </div>

      {/* ====== Table ====== */}
      <table className="rbac-table">
        <thead>
          <tr>
            <th style={{ width: "50%" }}>角色</th>
            <th style={{ width: "50%" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="role-name">
                  {r.name}
                  <span className="small-muted" style={{ marginLeft: 10 }}>
                    ({r.level})
                  </span>
                </div>
              </td>
              <td>
                <div className="op-col">
                  {rbac.canEditPermission && (
                    <button
                      className="btn btn-purple"
                      onClick={() => setPermRoleId(r.id)}
                      type="button"
                    >
                      編輯權限
                    </button>
                  )}

                  {rbac.canEditRole && (
                    <button
                      className="btn btn-green"
                      onClick={() => setEditRoleId(r.id)}
                      type="button"
                    >
                      修改
                    </button>
                  )}

                  {rbac.canDeleteRole && r.id !== "role_admin" && (
                    <button
                      className="btn btn-red"
                      onClick={() => setDeleteRoleId(r.id)}
                      type="button"
                    >
                      刪除
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ====== Permission Modal ====== */}
      {permRole && rbac.canEditPermission && (
        <Modal
          title={`編輯 ${permRole.name} 權限`}
          size="lg"
          onClose={() => setPermRoleId(null)}
        >
          <div className="perm-layout">
            <aside className="perm-left">
              <select
                className="select"
                value={activeSystemKey}
                onChange={(e) => setActiveSystemKey(e.target.value)}
              >
                {permGroups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.title}
                  </option>
                ))}
              </select>
            </aside>

            <section className="perm-right">
              {(permGroups.find((g) => g.key === activeSystemKey)?.items || []).map(
                (row) => (
                  <div className="perm-row" key={row.key}>
                    <div>{row.name}</div>
                    <MultiSelectOps
                      valueSet={rolePermMap?.[permRole.id]?.[row.key] ?? new Set()}
                      onChange={(s) =>
                        updateRolePermissionRow(permRole.id, row.key, s)
                      }
                    />
                  </div>
                )
              )}
            </section>
          </div>
        </Modal>
      )}

      {/* ====== Edit Role Modal ====== */}
      {editRole && rbac.canEditRole && (() => {
        const nameRef = React.createRef();
        const levelRef = React.createRef();

        return (
          <Modal
            title={`修改角色：${editRole.name}`}
            size="md"
            onClose={() => setEditRoleId(null)}
            footer={
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setEditRoleId(null)}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="btn btn-green"
                  type="button"
                  onClick={() => {
                    const newName = (nameRef.current?.value || editRole.name).trim();
                    const newLevel = levelRef.current?.value || editRole.level;

                    // 更新角色資訊（roles 變動會自動寫入 localStorage）
                    setRoles((prev) =>
                      prev.map((r) =>
                        r.id === editRole.id
                          ? { ...r, name: newName, level: newLevel }
                          : r
                      )
                    );

                    // 依新的權限等級更新該角色權限（rolePermMap 變動會自動持久化）
                    const newPermissions = buildPermissionsByLevel(newLevel, permissionRows);
                    setRolePermMap((prev) => ({
                      ...prev,
                      [editRole.id]: newPermissions,
                    }));

                    setEditRoleId(null);
                  }}
                >
                  儲存
                </button>
              </div>
            }
          >
            <div style={{ padding: "16px 0" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  角色名稱
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  className="input"
                  defaultValue={editRole.name}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  權限等級
                </label>
                <select
                  ref={levelRef}
                  className="select"
                  defaultValue={editRole.level}
                  style={{ width: "100%" }}
                >
                  {PERMISSION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                  💡 變更權限等級會自動套用該等級的預設權限配置
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ====== Delete Role Modal ====== */}
      {deleteRole && rbac.canDeleteRole && (
        <Modal
          title="確認刪除"
          size="sm"
          onClose={() => setDeleteRoleId(null)}
          footer={
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteRoleId(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="btn btn-red"
                type="button"
                onClick={() => {
                  // 刪除角色（roles 會持久化）
                  setRoles((prev) => prev.filter((r) => r.id !== deleteRole.id));

                  // 同步移除該角色權限（rolePermMap 會持久化）
                  setRolePermMap((prev) => {
                    const next = { ...(prev || {}) };
                    delete next[deleteRole.id];
                    return next;
                  });

                  setDeleteRoleId(null);
                }}
              >
                確認刪除
              </button>
            </div>
          }
        >
          <p>
            確定要刪除角色 <strong>{deleteRole.name}</strong> 嗎？此操作無法復原。
          </p>
        </Modal>
      )}

      {/* ====== Add Role Modal ====== */}
      {showAddRole && rbac.isAdmin && (() => {
        const nameRef = React.createRef();
        const levelRef = React.createRef();

        return (
          <Modal
            title="新增角色"
            size="md"
            onClose={() => setShowAddRole(false)}
            footer={
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowAddRole(false)}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="btn btn-yellow"
                  type="button"
                  onClick={() => {
                    const roleName = (nameRef.current?.value || "新角色").trim();
                    const roleLevel = levelRef.current?.value || "一般使用";

                    const newRoleId = `role_${Date.now()}`;
                    const newRole = {
                      id: newRoleId,
                      name: roleName,
                      level: roleLevel,
                    };

                    // 新增角色（roles 會持久化）
                    setRoles((prev) => [...prev, newRole]);

                    // 新角色預設權限（rolePermMap 會持久化）
                    const newPermissions = buildPermissionsByLevel(roleLevel, permissionRows);
                    setRolePermMap((prev) => ({
                      ...prev,
                      [newRoleId]: newPermissions,
                    }));

                    setShowAddRole(false);
                  }}
                >
                  新增
                </button>
              </div>
            }
          >
            <div style={{ padding: "16px 0" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  角色名稱
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  className="input"
                  placeholder="請輸入角色名稱"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  權限等級
                </label>
                <select
                  ref={levelRef}
                  className="select"
                  defaultValue="一般使用"
                  style={{ width: "100%" }}
                >
                  {PERMISSION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                  💡 系統會根據所選權限等級自動配置對應的預設權限
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
