// src/pages/rbac/AuditLogs.jsx
import React, { useMemo, useState } from "react";
import "./rbac.styles.css";

export default function AuditLogs() {
  // UI tabs (no persistence)
  const tabs = useMemo(
    () => [
      { key: "login", label: "登入紀錄" },
      { key: "permission", label: "權限操作" },
    ],
    []
  );

  const [active, setActive] = useState("login");

  // UI form states (no query behavior)
  const [startDate, setStartDate] = useState("2026-01-12");
  const [endDate, setEndDate] = useState("2026-01-16");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [role, setRole] = useState("");

  // Detail modal (permission tab)
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  // mock dropdown options (UI only)
  const nameOptions = useMemo(() => ["姓名", "王小明", "陳美玲", "林工程師"], []);
  const accountOptions = useMemo(() => ["帳號", "admin", "engineerA", "captain01"], []);
  const roleOptions = useMemo(() => ["角色", "管理者", "工程師", "船長", "船員"], []);

  // mock rows (UI only)
  const loginRows = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: `login-${i + 1}`,
        displayName: "Lorem",
        username: "Lorem123",
        roleName: "Lorem",
        date: "2026/01/16",
        time: "11:22:33",
      })),
    []
  );

  const permissionRows = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: `perm-${i + 1}`,
        displayName: "Lorem",
        username: "Lorem123",
        roleName: "Lorem",
        action: "UPDATE",
        targetName: "角色權限",
        summary: "調整「門禁管制系統 / 人員授權管理」的權限",
        occurredAt: "2026/01/16 11:22:33",
        // mock before/after (for modal UI)
        before: {
          role: "工程師",
          permission: ["檢視", "修改"],
        },
        after: {
          role: "工程師",
          permission: ["檢視", "修改", "刪除"],
        },
      })),
    []
  );

  const openDetail = (row) => {
    setDetailRow(row);
    setDetailOpen(true);
  };

  return (
    <div className="rbac-page">
      <div className="rbac-top">
        <h1 className="rbac-title">稽核紀錄</h1>
      </div>

      {/* Tabs (same style language as PermissionManagement) */}
      <div className="rbac-tabs" role="tablist" aria-label="稽核紀錄分頁">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`rbac-tab ${isActive ? "active" : ""}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rbac-content">
        <div className="rbac-card">
          {/* Filters area (UI only) */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>開始日期</span>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>結束日期</span>
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>姓名</span>
              <select className="select" value={name} onChange={(e) => setName(e.target.value)}>
                {nameOptions.map((x) => (
                  <option key={x} value={x === "姓名" ? "" : x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>帳號</span>
              <select className="select" value={account} onChange={(e) => setAccount(e.target.value)}>
                {accountOptions.map((x) => (
                  <option key={x} value={x === "帳號" ? "" : x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>角色</span>
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                {roleOptions.map((x) => (
                  <option key={x} value={x === "角色" ? "" : x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <button className="btn btn-purple" type="button" onClick={() => {}}>
                查詢
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => {}}>
                匯出
              </button>
            </div>
          </div>

          <div className="small-muted" style={{ marginTop: 10 }}>
            預設查詢近一週 (開始:{startDate}，結束:{endDate})
          </div>

          {/* Table */}
          <div style={{ marginTop: 14 }}>
            <table className="rbac-table">
              <thead>
                {active === "login" ? (
                  <tr>
                    <th style={{ width: "20%" }}>姓名</th>
                    <th style={{ width: "20%" }}>帳號</th>
                    <th style={{ width: "20%" }}>角色</th>
                    <th style={{ width: "20%" }}>日期</th>
                    <th style={{ width: "20%" }}>時間</th>
                  </tr>
                ) : (
                  <tr>
                    <th style={{ width: "16%" }}>姓名</th>
                    <th style={{ width: "16%" }}>帳號</th>
                    <th style={{ width: "16%" }}>角色</th>
                    <th style={{ width: "16%" }}>操作類型</th>
                    <th style={{ width: "20%" }}>摘要 / 操作項目</th>
                    <th style={{ width: "16%" }}>時間</th>
                  </tr>
                )}
              </thead>

              <tbody>
                {active === "login"
                  ? loginRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.displayName}</td>
                        <td>{r.username}</td>
                        <td>{r.roleName}</td>
                        <td>{r.date}</td>
                        <td>{r.time}</td>
                      </tr>
                    ))
                  : permissionRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.displayName}</td>
                        <td>{r.username}</td>
                        <td>{r.roleName}</td>
                        <td>{r.action}</td>
                        <td>
                          <button type="button" className="rbac-audit-link" onClick={() => openDetail(r)}>
                            {r.summary || r.targetName}
                          </button>
                          <div className="small-muted" style={{ marginTop: 4 }}>
                            {r.targetName}
                          </div>
                        </td>
                        <td>{r.occurredAt}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Detail Modal (UI only) */}
          {detailOpen && detailRow ? (
            <div className="rbac-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDetailOpen(false)}>
              <div className="rbac-modal lg">
                <div className="rbac-modal-head">
                  <h3 className="rbac-modal-title">權限操作明細</h3>
                  <button className="rbac-icon-x" type="button" onClick={() => setDetailOpen(false)}>
                    ×
                  </button>
                </div>

                <div className="rbac-modal-body">
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">姓名</div>
                    <div className="rbac-audit-detail-v">{detailRow.displayName}</div>
                  </div>
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">帳號</div>
                    <div className="rbac-audit-detail-v">{detailRow.username}</div>
                  </div>
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">角色</div>
                    <div className="rbac-audit-detail-v">{detailRow.roleName}</div>
                  </div>
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">操作類型</div>
                    <div className="rbac-audit-detail-v">{detailRow.action}</div>
                  </div>
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">操作項目</div>
                    <div className="rbac-audit-detail-v">{detailRow.targetName}</div>
                  </div>
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">摘要</div>
                    <div className="rbac-audit-detail-v">{detailRow.summary}</div>
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, marginBottom: 8 }}>Before</div>
                      <pre className="rbac-audit-code">{JSON.stringify(detailRow.before, null, 2)}</pre>
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, marginBottom: 8 }}>After</div>
                      <pre className="rbac-audit-code">{JSON.stringify(detailRow.after, null, 2)}</pre>
                    </div>
                  </div>
                </div>

                <div className="rbac-modal-foot">
                  <button className="btn btn-ghost" type="button" onClick={() => setDetailOpen(false)}>
                    關閉
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
