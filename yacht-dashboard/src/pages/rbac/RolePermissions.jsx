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
      <div
        className={`rbac-modal ${
          size === "sm" ? "sm" : size === "lg" ? "lg" : ""
        }`}
      >
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

/** 把 permissionRows 轉成「系統大項 -> 細項列表」 */
function buildGroups(permissionRows) {
  const ORDER = [
    "岸電控制系統",
    "船舶識別系統",
    "門禁管制系統",
    "影像監控系統",
    "通訊傳輸系統",
    "支付計費系統",
  ];

  const map = new Map();
  permissionRows.forEach((row) => {
    const g = row.group || "未分類";
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(row);
  });

  const keys = Array.from(map.keys()).sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, "zh-Hant");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return keys.map((k) => ({ key: k, title: k, items: map.get(k) }));
}

export default function RolePermissions() {
  const permissionRows = useMemo(() => buildPermissionRows(), []);
  const permGroups = useMemo(() => buildGroups(permissionRows), [permissionRows]);

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

  // ====== 刪除確認 modal ======
  const [delOpen, setDelOpen] = useState(false);
  const [delTargetId, setDelTargetId] = useState(null);
  const delRoleObj = useMemo(
    () => roles.find((r) => r.id === delTargetId) || null,
    [roles, delTargetId]
  );

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
          ? { ...r, name: roleForm.name.trim(), level: roleForm.level.trim() }
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

  // ====== 刪除確認流程（避免誤刪） ======
  const openDel = (role) => {
    if (!role) return;
    if (role.id === "role_admin") return; // 保守：管理者不可刪
    setDelTargetId(role.id);
    setDelOpen(true);
  };

  const closeDel = () => {
    setDelOpen(false);
    setDelTargetId(null);
  };

  const confirmDel = () => {
    if (!delTargetId) return;
    if (delTargetId === "role_admin") return;

    // 若正在編輯/查看同一角色的 modal，先關閉
    setPermRoleId((prev) => (prev === delTargetId ? null : prev));
    setEditRoleId((prev) => (prev === delTargetId ? null : prev));

    setRoles((prev) => prev.filter((r) => r.id !== delTargetId));
    setRolePermMap((prev) => {
      const next = { ...prev };
      delete next[delTargetId];
      return next;
    });

    closeDel();
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

  // ====== 編輯權限 Modal：左側下拉選系統 / 右側只顯示該系統細項 ======
  const [activeSystemKey, setActiveSystemKey] = useState(
    permGroups?.[0]?.key ?? ""
  );

  // 每次開啟編輯權限 Modal，預設選第一個系統
  useEffect(() => {
    if (!permRole) return;
    setActiveSystemKey(permGroups?.[0]?.key ?? "");
  }, [permRole, permGroups]);

  const activeGroup = useMemo(
    () => permGroups.find((g) => g.key === activeSystemKey) || null,
    [permGroups, activeSystemKey]
  );

  const scrollToRow = (rowKey) => {
    const el = document.getElementById(`perm-row-${rowKey}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="rbac-card">
      {/* 固定顯示 */}
      <div className="rbac-actions">
        <button className="btn btn-yellow" onClick={openAddRole} type="button">
          新增角色
        </button>
      </div>

      {/* 永遠顯示操作欄 */}
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
                    onClick={() => openDel(r)}
                    type="button"
                    disabled={r.id === "role_admin"}
                    title={r.id === "role_admin" ? "管理者不可刪除" : "刪除角色"}
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ====== Modal：刪除確認（避免誤刪） ====== */}
      {delOpen ? (
        <Modal
          title="確認刪除"
          size="sm"
          onClose={closeDel}
          footer={
            <>
              <button
                className="btn"
                style={{ background: "#9ca3af" }}
                onClick={closeDel}
                type="button"
              >
                取消
              </button>
              <button
                className="btn btn-red"
                onClick={confirmDel}
                type="button"
                disabled={!delRoleObj || delRoleObj?.id === "role_admin"}
                title={
                  delRoleObj?.id === "role_admin"
                    ? "管理者不可刪除"
                    : "確定刪除"
                }
              >
                確定刪除
              </button>
            </>
          }
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>
            此操作無法復原，請再次確認是否要刪除以下角色：
          </div>

          <div className="small-muted" style={{ lineHeight: 1.9 }}>
            <div>
              角色：{" "}
              <span style={{ fontWeight: 900, color: "#111827" }}>
                {delRoleObj?.name ?? "-"}
              </span>
            </div>
            <div>
              權限等級：{" "}
              <span style={{ fontWeight: 900, color: "#111827" }}>
                {delRoleObj?.level ?? "自訂"}
              </span>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* ====== Modal: 編輯某角色權限（大 modal） ====== */}
      {permRole ? (
        <Modal
          title={`編輯 ${permRole.name} 權限`}
          size="lg"
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
          <div className="perm-layout">
            {/* Left: 系統下拉 + 細項清單 */}
            <aside className="perm-left">
              <div style={{ marginBottom: 10 }}>
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
              </div>

              <div>
                {(activeGroup?.items || []).map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    className="perm-subitem"
                    onClick={() => scrollToRow(row.key)}
                    title={row.name}
                  >
                    {row.name}
                  </button>
                ))}
              </div>
            </aside>

            {/* Right: 只顯示目前系統的細項權限 */}
            <section className="perm-right">
              <div className="perm-right-head">
                <div className="col-name">權限名稱</div>
                <div className="col-op">操作權限</div>
              </div>

              <div className="perm-right-body">
                {(activeGroup?.items || []).map((row) => {
                  const setVal =
                    rolePermMap?.[permRole.id]?.[row.key] instanceof Set
                      ? rolePermMap[permRole.id][row.key]
                      : new Set([]);

                  return (
                    <div
                      className="perm-row"
                      key={row.key}
                      id={`perm-row-${row.key}`}
                    >
                      <div className="col-name">
                        <div className="perm-name">{row.name}</div>
                        <div className="perm-group-hint">{row.group}</div>
                      </div>
                      <div className="col-op">
                        <MultiSelectOps
                          valueSet={setVal}
                          onChange={(nextSet) =>
                            updateRolePermissionRow(
                              permRole.id,
                              row.key,
                              nextSet
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                })}

                {!activeGroup ? (
                  <div style={{ padding: "10px 0", color: "#6b7280" }}>
                    沒有可顯示的系統或細項。
                  </div>
                ) : null}
              </div>
            </section>
          </div>
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
