
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  buildDefaultRolePermissions,
  buildPermissionRows,
  DEFAULT_ROLES,
  OPS,
  rbacStoreGetRoles,
  rbacStoreSetRoles,
  rbacStoreGetRolePermMap,
  rbacStoreSetRolePermMap,
} from "./rbac.data";
import PermissionEditorModal from "./PermissionEditorModal";
import "./rbac.styles.css";

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
    <div className="rbac-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`rbac-modal ${size === "sm" ? "sm" : size === "lg" ? "lg" : ""}`}>
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
            <div key={o.key} className="ms-item" onClick={() => toggle(o.key)}>
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
        if (group === "支付計費系統") permissions[key] = new Set(["view"]);
        else permissions[key] = new Set(["view", "edit"]);
        break;

      case "一般使用":
        if (group === "岸電控制系統") {
          if (row.name.includes("即時監控") || row.name.includes("歷史紀錄")) permissions[key] = new Set(["view"]);
          else permissions[key] = new Set([]);
        } else if (group === "船舶識別系統") {
          permissions[key] = new Set(["view"]);
        } else if (group === "使用者專區") {
          permissions[key] = new Set(["view", "edit"]);
        } else {
          permissions[key] = new Set([]);
        }
        break;

      case "訪客":
        if (group === "使用者專區") permissions[key] = new Set(["view"]);
        else permissions[key] = new Set([]);
        break;

      default:
        permissions[key] = new Set([]);
    }
  });

  return permissions;
}

/* =========================================================
   Normalize / Validate RolePermMap
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

      const setVal = raw instanceof Set ? raw : Array.isArray(raw) ? new Set(raw) : new Set();
      const cleaned = new Set(Array.from(setVal).filter((op) => allowedOps.has(op)));

      next[roleId][permKey] = cleaned;
    });
  });

  return next;
}

export default function RolePermissions() {
  const { user } = useAuth();
  const currentUser = user || { role: "管理者" };
  const rbac = useRBAC(currentUser);

  const PERMISSION_LEVELS = [
    { value: "最高權限", label: "最高權限" },
    { value: "工程維運", label: "工程維運" },
    { value: "一般使用", label: "一般使用" },
    { value: "訪客", label: "訪客" },
  ];

  const permissionRows = useMemo(() => buildPermissionRows(), []);
  const permGroups = useMemo(() => buildGroups(permissionRows), [permissionRows]);

  // 從 rbac.data store 初始化（同 SPA 分頁共享）
  const [roles, setRoles] = useState(() => rbacStoreGetRoles() || DEFAULT_ROLES);

  const [rolePermMap, setRolePermMap] = useState(() => {
    const stored = rbacStoreGetRolePermMap();
    if (stored) return stored;
    return buildDefaultRolePermissions();
  });

  // 任一變動 -> 回寫 store（讓 AccountManagement 下拉同步）
  useEffect(() => {
    rbacStoreSetRoles(roles);
  }, [roles]);

  useEffect(() => {
    rbacStoreSetRolePermMap(rolePermMap);
  }, [rolePermMap]);

  // roles 變動時：補齊/正規化權限 map
  useEffect(() => {
    setRolePermMap((prev) => {
      const withMissingFilled = { ...(prev || {}) };

      roles.forEach((role) => {
        if (!withMissingFilled[role.id]) {
          withMissingFilled[role.id] = buildPermissionsByLevel(role.level, permissionRows);
        }
      });

      return normalizeRolePermMap({
        roles,
        permissionRows,
        rolePermMap: withMissingFilled,
      });
    });
  }, [roles, permissionRows]);

  const [permRoleId, setPermRoleId] = useState(null);
  const permRole = roles.find((r) => r.id === permRoleId) || null;

  const [editRoleId, setEditRoleId] = useState(null);
  const editRole = roles.find((r) => r.id === editRoleId) || null;

  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const deleteRole = roles.find((r) => r.id === deleteRoleId) || null;

  const [showAddRole, setShowAddRole] = useState(false);

  // 轉換數據格式：Set 格式轉為 PermissionEditorModal 所需的 { view: true, edit: false, ... } 格式
  const convertSetToPermObject = (roleId) => {
    const rolePerm = rolePermMap?.[roleId] || {};
    const result = {};
    
    Object.keys(rolePerm).forEach((permKey) => {
      const opsSet = rolePerm[permKey];
      result[permKey] = {
        view: opsSet.has("view"),
        edit: opsSet.has("edit"),
        delete: opsSet.has("delete"),
      };
    });
    
    return result;
  };

  // 轉換數據格式：PermissionEditorModal 返回的格式轉回 Set 格式
  const convertPermObjectToSet = (permObject) => {
    const result = {};
    
    Object.keys(permObject).forEach((permKey) => {
      const ops = permObject[permKey];
      const opsSet = new Set();
      
      if (ops.view) opsSet.add("view");
      if (ops.edit) opsSet.add("edit");
      if (ops.delete) opsSet.add("delete");
      
      result[permKey] = opsSet;
    });
    
    return result;
  };

  const handleSavePermissions = (roleId, permData) => {
    if (!rbac.canEditPermission) return;
    
    const convertedData = convertPermObjectToSet(permData);
    setRolePermMap((prev) => ({
      ...prev,
      [roleId]: convertedData,
    }));
    
    setPermRoleId(null);
  };

  return (
    <div className="rbac-card">
      <div className="rbac-actions" style={{ justifyContent: "space-between" }}>
        <div>
          {rbac.isAdmin && (
            <button className="btn btn-yellow" onClick={() => setShowAddRole(true)} type="button">
              新增角色
            </button>
          )}
        </div>

        <div className="small-muted">
          目前登入角色：<strong style={{ marginLeft: 6 }}>{currentUser.role}</strong>
        </div>
      </div>

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
                    <button className="btn btn-purple" onClick={() => setPermRoleId(r.id)} type="button">
                      編輯權限
                    </button>
                  )}

                  {rbac.canEditRole && (
                    <button className="btn btn-green" onClick={() => setEditRoleId(r.id)} type="button">
                      修改
                    </button>
                  )}

                  {rbac.canDeleteRole && r.id !== "role_admin" && (
                    <button className="btn btn-red" onClick={() => setDeleteRoleId(r.id)} type="button">
                      刪除
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {permRole && rbac.canEditPermission && (
        <PermissionEditorModal
          open={!!permRole}
          title={`編輯 ${permRole.name} 權限`}
          groups={permGroups}
          initial={convertSetToPermObject(permRole.id)}
          onClose={() => setPermRoleId(null)}
          onSave={(permData) => handleSavePermissions(permRole.id, permData)}
        />
      )}

      {editRole &&
        rbac.canEditRole &&
        (() => {
          const nameRef = React.createRef();
          const levelRef = React.createRef();

          return (
            <Modal
              title={`修改角色：${editRole.name}`}
              size="md"
              onClose={() => setEditRoleId(null)}
              footer={
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost" onClick={() => setEditRoleId(null)} type="button">
                    取消
                  </button>
                  <button
                    className="btn btn-green"
                    type="button"
                    onClick={() => {
                      const newName = (nameRef.current?.value || editRole.name).trim();
                      const newLevel = levelRef.current?.value || editRole.level;

                      setRoles((prev) => prev.map((r) => (r.id === editRole.id ? { ...r, name: newName, level: newLevel } : r)));

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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>角色名稱</label>
                  <input ref={nameRef} type="text" className="input" defaultValue={editRole.name} style={{ width: "100%" }} />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>權限等級</label>
                  <select ref={levelRef} className="select" defaultValue={editRole.level} style={{ width: "100%" }}>
                    {PERMISSION_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>💡 變更權限等級會自動套用該等級的預設權限配置</div>
                </div>
              </div>
            </Modal>
          );
        })()}

      {deleteRole && rbac.canDeleteRole && (
        <Modal
          title="確認刪除"
          size="sm"
          onClose={() => setDeleteRoleId(null)}
          footer={
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setDeleteRoleId(null)} type="button">
                取消
              </button>
              <button
                className="btn btn-red"
                type="button"
                onClick={() => {
                  setRoles((prev) => prev.filter((r) => r.id !== deleteRole.id));

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

      {showAddRole &&
        rbac.isAdmin &&
        (() => {
          const nameRef = React.createRef();
          const levelRef = React.createRef();

          return (
            <Modal
              title="新增角色"
              size="md"
              onClose={() => setShowAddRole(false)}
              footer={
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost" onClick={() => setShowAddRole(false)} type="button">
                    取消
                  </button>
                  <button
                    className="btn btn-yellow"
                    type="button"
                    onClick={() => {
                      const roleName = (nameRef.current?.value || "新角色").trim();
                      const roleLevel = levelRef.current?.value || "一般使用";

                      const newRoleId = `role_${Date.now()}`;
                      const newRole = { id: newRoleId, name: roleName, level: roleLevel };

                      setRoles((prev) => [...prev, newRole]);

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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>角色名稱</label>
                  <input ref={nameRef} type="text" className="input" placeholder="請輸入角色名稱" style={{ width: "100%" }} />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>權限等級</label>
                  <select ref={levelRef} className="select" defaultValue="一般使用" style={{ width: "100%" }}>
                    {PERMISSION_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>💡 系統會根據所選權限等級自動配置對應的預設權限</div>
                </div>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
}
