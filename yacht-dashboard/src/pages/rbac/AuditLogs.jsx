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

  // - 這裡的「時間」先做成時間區段的 dropdown（純 UI）
  const [timeSlot, setTimeSlot] = useState("");
  const [account, setAccount] = useState("");
  const [role, setRole] = useState("");

  // Detail modal (permission tab) — UI only
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  // mock dropdown options (UI only)
  const timeOptions = useMemo(() => ["時間", "全部", "上午(06-12)", "下午(12-18)", "晚間(18-24)", "凌晨(00-06)"], []);
  const accountOptions = useMemo(() => ["帳號", "admin", "engineerA", "captain01", "crew02"], []);
  const roleOptions = useMemo(() => ["角色", "管理者", "工程師", "船長", "船員"], []);

  // Login rows (UI only) — 時間(日期+時間)、帳號、角色、IP
  const loginRows = useMemo(
    () => [
      { id: "l1", occurredAt: "2026/01/16 11:22:33", username: "admin", roleName: "管理者", ip: "203.66.12.34" },
      { id: "l2", occurredAt: "2026/01/16 10:18:05", username: "engineerA", roleName: "工程師", ip: "203.66.12.35" },
      { id: "l3", occurredAt: "2026/01/15 22:41:19", username: "captain01", roleName: "船長", ip: "61.230.88.9" },
      { id: "l4", occurredAt: "2026/01/15 21:03:52", username: "crew02", roleName: "船員", ip: "61.230.88.10" },
      { id: "l5", occurredAt: "2026/01/15 09:12:07", username: "admin", roleName: "管理者", ip: "203.66.12.34" },
      { id: "l6", occurredAt: "2026/01/14 18:55:41", username: "engineerA", roleName: "工程師", ip: "203.66.12.35" },
      { id: "l7", occurredAt: "2026/01/14 08:20:13", username: "captain01", roleName: "船長", ip: "61.230.88.9" },
      { id: "l8", occurredAt: "2026/01/13 16:44:29", username: "crew02", roleName: "船員", ip: "61.230.88.10" },
      { id: "l9", occurredAt: "2026/01/13 12:07:03", username: "engineerB", roleName: "工程師", ip: "203.66.12.36" },
      { id: "l10", occurredAt: "2026/01/12 09:01:44", username: "admin", roleName: "管理者", ip: "203.66.12.34" },
    ],
    []
  );

  // Permission rows (UI only) 
  const permissionRows = useMemo(
    () => [
      {
        id: "p1",
        occurredAt: "2026/01/16 11:22:33",
        username: "admin",
        roleName: "管理者",
        ip: "203.66.12.34",
        target: "角色權限",
        action: "新增",
        dataIndex: "ROLE_ENGINEER",
        remark: "新增工程師角色，預設無刪除權限",
        // 明細視窗有 before/after 可以展示（不影響列表欄位）
        before: { rolesCount: 3 },
        after: { rolesCount: 4 },
      },
      {
        id: "p2",
        occurredAt: "2026/01/16 10:18:05",
        username: "engineerA",
        roleName: "工程師",
        ip: "203.66.12.35",
        target: "帳號",
        action: "修改",
        dataIndex: "user_1024",
        remark: "調整角色：船員 → 船長",
        before: { role: "船員" },
        after: { role: "船長" },
      },
      {
        id: "p3",
        occurredAt: "2026/01/15 22:41:19",
        username: "admin",
        roleName: "管理者",
        ip: "61.230.88.9",
        target: "權限設定",
        action: "修改",
        dataIndex: "PERM_ac_person",
        remark: "門禁管制系統 / 人員授權管理：新增刪除權限",
        before: { ops: ["檢視", "修改"] },
        after: { ops: ["檢視", "修改", "刪除"] },
      },
      {
        id: "p4",
        occurredAt: "2026/01/15 21:03:52",
        username: "admin",
        roleName: "管理者",
        ip: "61.230.88.10",
        target: "帳號",
        action: "鎖定",
        dataIndex: "user_1008",
        remark: "連續登入失敗，系統鎖定",
        before: { locked: false },
        after: { locked: true },
      },
      {
        id: "p5",
        occurredAt: "2026/01/15 09:12:07",
        username: "engineerA",
        roleName: "工程師",
        ip: "203.66.12.35",
        target: "角色權限",
        action: "檢視",
        dataIndex: "ROLE_CREW",
        remark: "檢視船員角色權限配置",
        before: null,
        after: null,
      },
      {
        id: "p6",
        occurredAt: "2026/01/14 18:55:41",
        username: "admin",
        roleName: "管理者",
        ip: "203.66.12.34",
        target: "帳號",
        action: "刪除",
        dataIndex: "user_0999",
        remark: "移除離職帳號",
        before: { exists: true },
        after: { exists: false },
      },
      {
        id: "p7",
        occurredAt: "2026/01/14 08:20:13",
        username: "admin",
        roleName: "管理者",
        ip: "61.230.88.9",
        target: "權限設定",
        action: "新增",
        dataIndex: "PERM_cc_alarm",
        remark: "影像監控系統 / 警示通報：新增檢視權限",
        before: { ops: [] },
        after: { ops: ["檢視"] },
      },
      {
        id: "p8",
        occurredAt: "2026/01/13 16:44:29",
        username: "engineerB",
        roleName: "工程師",
        ip: "61.230.88.10",
        target: "帳號",
        action: "修改",
        dataIndex: "user_1012",
        remark: "更新 Email（UI 示範）",
        before: { email: "old@example.com" },
        after: { email: "new@example.com" },
      },
      {
        id: "p9",
        occurredAt: "2026/01/13 12:07:03",
        username: "admin",
        roleName: "管理者",
        ip: "203.66.12.34",
        target: "角色權限",
        action: "修改",
        dataIndex: "ROLE_CAPTAIN",
        remark: "調整船長可檢視岸電歷史紀錄",
        before: { shorePowerHistory: false },
        after: { shorePowerHistory: true },
      },
      {
        id: "p10",
        occurredAt: "2026/01/12 09:01:44",
        username: "admin",
        roleName: "管理者",
        ip: "203.66.12.34",
        target: "權限設定",
        action: "修改",
        dataIndex: "PERM_bl_project",
        remark: "支付計費系統：移除工程師刪除權限",
        before: { ops: ["檢視", "修改", "刪除"] },
        after: { ops: ["檢視", "修改"] },
      },
    ],
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

      {/* Tabs */}
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
          {/* Filters (UI only) */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>開始日期</span>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>結束日期</span>
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            {/* 時間 / 帳號 / 角色 */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>時間</span>
              <select className="select" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                {timeOptions.map((x) => (
                  <option key={x} value={x === "時間" || x === "全部" ? "" : x}>
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
                    <th style={{ width: "30%" }}>時間</th>
                    <th style={{ width: "25%" }}>帳號</th>
                    <th style={{ width: "25%" }}>角色</th>
                    <th style={{ width: "20%" }}>IP</th>
                  </tr>
                ) : (
                  <tr>
                    <th style={{ width: "16%" }}>時間</th>
                    <th style={{ width: "12%" }}>帳號</th>
                    <th style={{ width: "12%" }}>角色</th>
                    <th style={{ width: "12%" }}>IP</th>
                    <th style={{ width: "12%" }}>目標</th>
                    <th style={{ width: "10%" }}>動作</th>
                    <th style={{ width: "14%" }}>資料索引</th>
                    <th style={{ width: "12%" }}>備註</th>
                  </tr>
                )}
              </thead>

              <tbody>
                {active === "login"
                  ? loginRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.occurredAt}</td>
                        <td>{r.username}</td>
                        <td>{r.roleName}</td>
                        <td>{r.ip}</td>
                      </tr>
                    ))
                  : permissionRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.occurredAt}</td>
                        <td>{r.username}</td>
                        <td>{r.roleName}</td>
                        <td>{r.ip}</td>
                        <td>{r.target}</td>
                        <td>{r.action}</td>
                        <td>{r.dataIndex}</td>
                        <td>
                          <button type="button" className="rbac-audit-link" onClick={() => openDetail(r)}>
                            {r.remark}
                          </button>
                        </td>
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
                    <div className="rbac-audit-detail-k">時間</div>
                    <div className="rbac-audit-detail-v">{detailRow.occurredAt}</div>
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
                    <div className="rbac-audit-detail-k">IP</div>
                    <div className="rbac-audit-detail-v">{detailRow.ip}</div>
                  </div>

                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">目標</div>
                    <div className="rbac-audit-detail-v">{detailRow.target}</div>
                  </div>
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">動作</div>
                    <div className="rbac-audit-detail-v">{detailRow.action}</div>
                  </div>
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">資料索引</div>
                    <div className="rbac-audit-detail-v">{detailRow.dataIndex}</div>
                  </div>
                  <div className="rbac-audit-detail-row">
                    <div className="rbac-audit-detail-k">備註</div>
                    <div className="rbac-audit-detail-v">{detailRow.remark}</div>
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
