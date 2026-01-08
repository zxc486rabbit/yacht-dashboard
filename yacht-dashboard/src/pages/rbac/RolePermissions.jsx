// src/page/rbac/RolePermissions.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDefaultRolePermissions,
  buildPermissionRows,
  DEFAULT_ROLES,
  OPS,
} from "./rbac.data";

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
      <div className={`rbac-modal ${size === "sm" ? "sm" : ""}`}>
        <div className="rbac-modal-head">
          <h3 className="rbac-modal-title">{title}</h3>
          <button
            className="icon-x"
            onClick={onClose}
            type="button"
            aria-label="close"
          >
            ×
          </button>
        </div>

        <div className="rbac-modal-body">{children}</div>

        {footer ? <div className="rbac-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

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
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onChange(next);
  };

  const chips = OPS.filter((o) => valueSet.has(o.key));

  return (
    <div className="ms" ref={wrapRef}>
      <div
        className="ms-box"
        onClick={() => setOpen((s) => !s)}
        role="button"
        tabIndex={0}
      >
        {chips.length === 0 ? (
          <span className="small-muted">未設定</span>
        ) : (
          chips.map((c) => (
            <span key={c.key} className={`chip ${c.key}`}>
              {c.label}
            </span>
          ))
        )}
      </div>

      <div className="ms-caret">▾</div>

      {open ? (
        <div className="ms-menu">
          {OPS.map((o) => (
            <div
              key={o.key}
              className="ms-item"
              onClick={() => toggle(o.key)}
              role="button"
              tabIndex={0}
            >
              <input type="checkbox" checked={valueSet.has(o.key)} readOnly />
              <span style={{ fontWeight: 900 }}>{o.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function RolePermissions() {
  const permissionRows = useMemo(() => buildPermissionRows(), []);
  const [isEditMode, setIsEditMode] = useState(false);

  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [rolePermMap, setRolePermMap] = useState(() =>
    buildDefaultRolePermissions()
  );

  // ====== Modals state ======
  const [permRoleId, setPermRoleId] = useState(null); // open permission editor
  const permRole = useMemo(
    () => roles.find((r) => r.id === permRoleId) || null,
    [roles, permRoleId]
  );

  const [editRoleId, setEditRoleId] = useState(null);
  const editRole = useMemo(
    () => roles.find((r) => r.id === editRoleId) || null,
    [roles, editRoleId]
  );

  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);

  // forms
  const [roleForm, setRoleForm] = useState({ name: "", level: "" });
  const addNameRef = useRef(null);

  // 權限等級選項
  const LEVEL_OPTIONS = useMemo(
    () => [
      { value: "L1", label: "L1 - 只讀" },
      { value: "L2", label: "L2 - 可新增/修改" },
      { value: "L3", label: "L3 - 全權" },
      { value: "自訂", label: "自訂" },
    ],
    []
  );

  // 開啟新增角色後自動 focus
  useEffect(() => {
    if (!isAddRoleOpen) return;
    setTimeout(() => addNameRef.current?.focus(), 0);
  }, [isAddRoleOpen]);

  // ====== actions ======
  const openEditRole = (role) => {
    setRoleForm({ name: role.name, level: role.level });
    setEditRoleId(role.id);
  };

  const saveEditRole = () => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === editRoleId
          ? {
              ...r,
              name: roleForm.name.trim(),
              level: roleForm.level.trim(),
            }
          : r
      )
    );
    setEditRoleId(null);
  };

  const openAddRole = () => {
    setRoleForm({ name: "", level: "" });
    setIsAddRoleOpen(true);
  };

  const saveAddRole = () => {
    const name = roleForm.name.trim();
    const level = roleForm.level.trim();

    if (!name) return;

    const id = `role_${Date.now()}`;
    setRoles((prev) => [...prev, { id, name, level: level || "自訂" }]);

    // 初始化該角色權限：全部空
    setRolePermMap((prev) => {
      const next = { ...prev };
      const empty = {};
      permissionRows.forEach((row) => (empty[row.key] = new Set([])));
      next[id] = empty;
      return next;
    });

    setIsAddRoleOpen(false);
  };

  const deleteRole = (roleId) => {
    // 保守：管理者不給刪，可自行調整
    if (roleId === "role_admin") return;

    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    setRolePermMap((prev) => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });
  };

  // 權限編輯：單列更新
  const updateRolePermissionRow = (roleId, permKey, nextSet) => {
    setRolePermMap((prev) => {
      const next = { ...prev };
      const roleObj = { ...(next[roleId] || {}) };
      roleObj[permKey] = new Set(nextSet);
      next[roleId] = roleObj;
      return next;
    });
  };

  const closePermModal = () => setPermRoleId(null);

  return (
    <div className="rbac-card">
      <div className="rbac-actions">
        {!isEditMode ? (
          <button
            className="btn btn-green"
            onClick={() => setIsEditMode(true)}
            type="button"
          >
            編輯
          </button>
        ) : (
          <>
            <button
              className="btn btn-yellow"
              onClick={openAddRole}
              type="button"
            >
              新增角色權限
            </button>
            <button
              className="btn btn-green"
              onClick={() => setIsEditMode(false)}
              type="button"
            >
              完成編輯
            </button>
          </>
        )}
      </div>

      {/* 對齊 scoped CSS：rbac-table */}
      <table className="rbac-table">
        <thead>
          <tr>
            <th style={{ width: isEditMode ? "50%" : "100%" }}>角色</th>
            {isEditMode ? <th style={{ width: "50%" }}>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="role-name">{r.name}</div>
              </td>

              {isEditMode ? (
                <td>
                  <div className="op-col">
                    <button
                      className="btn btn-purple"
                      onClick={() => setPermRoleId(r.id)}
                      type="button"
                    >
                      編輯權限
                    </button>
                    <button
                      className="btn btn-green"
                      onClick={() => openEditRole(r)}
                      type="button"
                    >
                      修改
                    </button>
                    <button
                      className="btn btn-red"
                      onClick={() => deleteRole(r.id)}
                      type="button"
                      disabled={r.id === "role_admin"}
                      title={r.id === "role_admin" ? "管理者不可刪除" : "刪除角色"}
                    >
                      刪除
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ====== Modal: 編輯某角色權限（大 modal） ====== */}
      {permRole ? (
        <Modal
          title={`編輯 ${permRole.name} 權限`}
          onClose={closePermModal}
          footer={
            <>
              <button
                className="btn"
                style={{ background: "#9ca3af" }}
                onClick={closePermModal}
                type="button"
              >
                取消
              </button>
              <button
                className="btn btn-green"
                onClick={closePermModal}
                type="button"
              >
                儲存
              </button>
            </>
          }
        >
          <table className="perm-table">
            <thead>
              <tr>
                <th style={{ width: "55%" }}>權限名稱</th>
                <th style={{ width: "45%" }}>操作權限</th>
              </tr>
            </thead>
            <tbody>
              {permissionRows.map((row) => {
                const setVal =
                  rolePermMap?.[permRole.id]?.[row.key] instanceof Set
                    ? rolePermMap[permRole.id][row.key]
                    : new Set([]);

                return (
                  <tr key={row.key}>
                    <td>
                      <div className="perm-name">{row.name}</div>
                      <div className="perm-group">{row.group}</div>
                    </td>
                    <td>
                      <MultiSelectOps
                        valueSet={setVal}
                        onChange={(nextSet) =>
                          updateRolePermissionRow(permRole.id, row.key, nextSet)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Modal>
      ) : null}

      {/* ====== Modal: 修改角色（小 modal） ====== */}
      {editRole ? (
        <Modal
          title="編輯角色"
          size="sm"
          onClose={() => setEditRoleId(null)}
          footer={
            <>
              <button
                className="btn"
                style={{ background: "#9ca3af" }}
                onClick={() => setEditRoleId(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="btn btn-green"
                onClick={saveEditRole}
                type="button"
                disabled={!roleForm.name.trim()}
              >
                修改角色
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="label">角色名稱:</div>
            <input
              className="input"
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="角色名稱"
            />
          </div>

          <div className="form-row">
            <div className="label">權限等級:</div>
            <input
              className="input"
              value={roleForm.level}
              onChange={(e) =>
                setRoleForm((p) => ({ ...p, level: e.target.value }))
              }
              placeholder="權限等級"
            />
          </div>
        </Modal>
      ) : null}

      {/* ====== Modal: 新增角色 ====== */}
      {isAddRoleOpen ? (
        <Modal
          title="新增角色"
          size="sm"
          onClose={() => setIsAddRoleOpen(false)}
          footer={null /* 按鈕在內容區右下 */}
        >
          <div style={{ marginBottom: "20px" }}>
            <div className="label" style={{ marginBottom: "8px" }}>
              角色名稱:
            </div>
            <input
              ref={addNameRef}
              className="input"
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="角色名稱"
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div className="label" style={{ marginBottom: "8px" }}>
              權限等級:
            </div>

            <select
              className="select"
              value={roleForm.level}
              onChange={(e) =>
                setRoleForm((p) => ({ ...p, level: e.target.value }))
              }
            >
              <option value="" disabled>
                權限等級
              </option>
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn btn-green"
              onClick={saveAddRole}
              type="button"
              disabled={!roleForm.name.trim()}
            >
              新增角色
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
