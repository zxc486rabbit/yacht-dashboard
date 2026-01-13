// src/page/rbac/RolePermissions.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDefaultRolePermissions,
  buildPermissionRows,
  DEFAULT_ROLES,
  OPS,
} from "./rbac.data";

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
        // 管理者：所有模組的完整權限（檢視、編輯、刪除）
        permissions[key] = new Set(["view", "edit", "delete"]);
        break;
        
      case "工程維運":
        // 工程師：技術維運相關權限
        if (group === "岸電控制系統") {
          permissions[key] = new Set(["view", "edit"]); // 可檢視編輯，刪除受限
        } else if (group === "船舶識別系統") {
          permissions[key] = new Set(["view", "edit"]);
        } else if (group === "門禁管制系統") {
          permissions[key] = new Set(["view", "edit"]);
        } else if (group === "影像監控系統") {
          permissions[key] = new Set(["view", "edit"]);
        } else if (group === "通訊傳輸系統") {
          permissions[key] = new Set(["view", "edit"]);
        } else if (group === "支付計費系統") {
          permissions[key] = new Set(["view"]); // 計費系統僅可檢視
        } else if (group === "使用者專區") {
          permissions[key] = new Set(["view"]);
        } else {
          permissions[key] = new Set(["view"]);
        }
        break;
        
      case "一般使用":
        // 一般用戶（船長及船員）：主要使用自己相關的功能
        if (group === "岸電控制系統") {
          // 僅開放即時監控、歷史紀錄等檢視功能
          if (row.name.includes("即時監控") || row.name.includes("歷史紀錄")) {
            permissions[key] = new Set(["view"]);
          } else {
            permissions[key] = new Set([]);
          }
        } else if (group === "船舶識別系統") {
          permissions[key] = new Set(["view"]);
        } else if (group === "使用者專區") {
          permissions[key] = new Set(["view", "edit"]); // 可管理自己的預約和資料
        } else {
          permissions[key] = new Set([]); // 其他系統無權限
        }
        break;
        
      case "訪客":
        // 訪客：最低權限，僅能查看使用者專區
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
   Main Component
   ========================================================= */
export default function RolePermissions() {
  /* ====== 模擬登入者（之後接 JWT / AuthContext） ====== */
  const currentUser = { role: "管理者" }; // 改成「工程師 / 一般用戶」即可驗證

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

  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [rolePermMap, setRolePermMap] = useState(() =>
    buildDefaultRolePermissions()
  );

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
            >
              新增角色
            </button>
          )}
        </div>

        {/* 目前登入角色顯示 */}
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
                <div className="role-name">{r.name}</div>
              </td>
              <td>
                <div className="op-col">
                  {rbac.canEditPermission && (
                    <button
                      className="btn btn-purple"
                      onClick={() => setPermRoleId(r.id)}
                    >
                      編輯權限
                    </button>
                  )}

                  {rbac.canEditRole && (
                    <button
                      className="btn btn-green"
                      onClick={() => setEditRoleId(r.id)}
                    >
                      修改
                    </button>
                  )}

                  {rbac.canDeleteRole && r.id !== "role_admin" && (
                    <button 
                      className="btn btn-red"
                      onClick={() => setDeleteRoleId(r.id)}
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
              {(permGroups
                .find((g) => g.key === activeSystemKey)
                ?.items || []
              ).map((row) => (
                <div className="perm-row" key={row.key}>
                  <div>{row.name}</div>
                  <MultiSelectOps
                    valueSet={
                      rolePermMap?.[permRole.id]?.[row.key] ?? new Set()
                    }
                    onChange={(s) =>
                      updateRolePermissionRow(permRole.id, row.key, s)
                    }
                  />
                </div>
              ))}
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
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setEditRoleId(null)}>
                  取消
                </button>
                <button 
                  className="btn btn-green"
                  onClick={() => {
                    const newName = nameRef.current?.value || editRole.name;
                    const newLevel = levelRef.current?.value || editRole.level;
                    
                    // 更新角色資訊
                    setRoles(prev => prev.map(r => 
                      r.id === editRole.id 
                        ? { ...r, name: newName, level: newLevel }
                        : r
                    ));
                    
                    // 根據新的權限等級更新權限配置
                    const newPermissions = buildPermissionsByLevel(newLevel, permissionRows);
                    setRolePermMap(prev => ({
                      ...prev,
                      [editRole.id]: newPermissions
                    }));
                    
                    setEditRoleId(null);
                  }}
                >
                  儲存
                </button>
              </div>
            }
          >
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  角色名稱
                </label>
                <input 
                  ref={nameRef}
                  type="text" 
                  className="input" 
                  defaultValue={editRole.name}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  權限等級
                </label>
                <select 
                  ref={levelRef}
                  className="select" 
                  defaultValue={editRole.level}
                  style={{ width: '100%' }}
                >
                  {PERMISSION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
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
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteRoleId(null)}>
                取消
              </button>
              <button 
                className="btn btn-red"
                onClick={() => {
                  setRoles(prev => prev.filter(r => r.id !== deleteRole.id));
                  setDeleteRoleId(null);
                }}
              >
                確認刪除
              </button>
            </div>
          }
        >
          <p>確定要刪除角色 <strong>{deleteRole.name}</strong> 嗎？此操作無法復原。</p>
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
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowAddRole(false)}>
                  取消
                </button>
                <button 
                  className="btn btn-yellow"
                  onClick={() => {
                    const roleName = nameRef.current?.value || '新角色';
                    const roleLevel = levelRef.current?.value || '一般使用';
                    
                    const newRoleId = `role_${Date.now()}`;
                    const newRole = {
                      id: newRoleId,
                      name: roleName,
                      level: roleLevel
                    };
                    
                    // 新增角色
                    setRoles(prev => [...prev, newRole]);
                    
                    // 根據權限等級自動分配預設權限
                    const newPermissions = buildPermissionsByLevel(roleLevel, permissionRows);
                    setRolePermMap(prev => ({
                      ...prev,
                      [newRoleId]: newPermissions
                    }));
                    
                    setShowAddRole(false);
                  }}
                >
                  新增
                </button>
              </div>
            }
          >
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  角色名稱
                </label>
                <input 
                  ref={nameRef}
                  type="text" 
                  className="input" 
                  placeholder="請輸入角色名稱"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  權限等級
                </label>
                <select 
                  ref={levelRef}
                  className="select" 
                  defaultValue="一般使用"
                  style={{ width: '100%' }}
                >
                  {PERMISSION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
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
