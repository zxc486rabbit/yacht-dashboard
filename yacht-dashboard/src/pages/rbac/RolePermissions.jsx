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
            <button className="btn btn-yellow">新增角色權限</button>
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

                  {rbac.canDeleteRole && (
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
      {editRole && rbac.canEditRole && (
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
                  // TODO: 儲存角色變更
                  alert('儲存角色變更');
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
                type="text" 
                className="input" 
                defaultValue={editRole.name}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                權限等級
              </label>
              <select 
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
            </div>
          </div>
        </Modal>
      )}

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
    </div>
  );
}
