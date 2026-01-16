import React, { useEffect, useMemo, useState } from "react";
import "./rbac.styles.css";

function parseOccurredAt(occurredAt) {
  // format: YYYY/MM/DD HH:mm:ss
  if (!occurredAt) return null;
  const [datePart, timePart] = String(occurredAt).split(" ");
  if (!datePart || !timePart) return null;
  const [y, m, d] = datePart.split("/").map((x) => Number(x));
  const [hh, mm, ss] = timePart.split(":").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
}

// ====== Pagination Component ======
function PageButton({ active, children, onClick, disabled }) {
  return (
    <button className={`pg-btn ${active ? "active" : ""}`} onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
}

export default function AuditLogs() {
  const tabs = useMemo(
    () => [
      { key: "login", label: "登入紀錄" },
      { key: "permission", label: "權限操作" },
    ],
    []
  );

  const [active, setActive] = useState("login");

  // filters (UI only)
  const DEFAULT_START = "2026-01-12";
  const DEFAULT_END = "2026-01-16";
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);

  // 時間/帳號/角色/目標/動作
  const [timeSlot, setTimeSlot] = useState(""); // 僅登入紀錄使用
  const [account, setAccount] = useState("");
  const [role, setRole] = useState("");
  const [target, setTarget] = useState("");
  const [action, setAction] = useState("");

  // permission row expand (UI only)
  const [expandedPermissionId, setExpandedPermissionId] = useState(null);

  // pagination (分頁)
  const [loginPage, setLoginPage] = useState(1);
  const [permissionPage, setPermissionPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const timeOptions = useMemo(() => ["時間", "全部", "上午(06-12)", "下午(12-18)", "晚間(18-24)", "凌晨(00-06)"], []);
  const accountOptions = useMemo(() => ["帳號", "admin", "engineerA", "engineerB", "captain01", "crew02"], []);
  const roleOptions = useMemo(() => ["角色", "管理者", "工程師", "船長", "船員"], []);
  const targetOptions = useMemo(() => ["目標", "帳號權限", "角色權限", "權限設定"], []);
  const actionOptions = useMemo(() => ["動作", "新增", "修改", "刪除", "鎖定", "檢視"], []);

  // mock login rows (UI only)
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

  // mock permission rows (UI only) —— Before/After 已移除
  const permissionRows = useMemo(
    () => [
      { id: "p1", occurredAt: "2026/01/16 11:22:33", username: "admin", roleName: "管理者", ip: "203.66.12.34", target: "角色權限", action: "新增", remark: "" },
      { id: "p2", occurredAt: "2026/01/16 10:18:05", username: "engineerA", roleName: "工程師", ip: "203.66.12.35", target: "帳號權限", action: "修改", remark: "" },
      { id: "p3", occurredAt: "2026/01/15 22:41:19", username: "admin", roleName: "管理者", ip: "61.230.88.9", target: "權限設定", action: "修改", remark: "" },
      { id: "p4", occurredAt: "2026/01/15 21:03:52", username: "admin", roleName: "管理者", ip: "61.230.88.10", target: "帳號權限", action: "鎖定", remark: "" },
      { id: "p5", occurredAt: "2026/01/15 09:12:07", username: "engineerA", roleName: "工程師", ip: "203.66.12.35", target: "角色權限", action: "檢視", remark: "" },
      { id: "p6", occurredAt: "2026/01/14 18:55:41", username: "admin", roleName: "管理者", ip: "203.66.12.34", target: "帳號權限", action: "刪除", remark: "" },
      { id: "p7", occurredAt: "2026/01/14 08:20:13", username: "admin", roleName: "管理者", ip: "61.230.88.9", target: "權限設定", action: "新增", remark: "" },
      { id: "p8", occurredAt: "2026/01/13 16:44:29", username: "engineerB", roleName: "工程師", ip: "61.230.88.10", target: "帳號權限", action: "修改", remark: "" },
      { id: "p9", occurredAt: "2026/01/13 12:07:03", username: "admin", roleName: "管理者", ip: "203.66.12.34", target: "角色權限", action: "修改", remark: "" },
      { id: "p10", occurredAt: "2026/01/12 09:01:44", username: "admin", roleName: "管理者", ip: "203.66.12.34", target: "權限設定", action: "修改", remark: "" },
    ],
    []
  );

  // Badge class mapping (UI only)
  const getTargetBadgeTone = (target) => {
    if (target === "帳號權限" || target === "帳號") return "tone-blue";
    if (target === "角色權限") return "tone-purple";
    if (target === "權限設定") return "tone-teal";
    return "tone-gray";
  };

  const getActionBadgeTone = (action) => {
    if (action === "新增") return "tone-green";
    if (action === "修改") return "tone-yellow";
    if (action === "刪除") return "tone-red";
    if (action === "鎖定") return "tone-red";
    if (action === "檢視") return "tone-gray";
    return "tone-gray";
  };

  const onClearFilters = () => {
    setStartDate(DEFAULT_START);
    setEndDate(DEFAULT_END);
    setTimeSlot("");
    setAccount("");
    setRole("");
    setTarget("");
    setAction("");
    setExpandedPermissionId(null);
  };

  const filteredLoginRows = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return loginRows.filter((r) => {
      const dt = parseOccurredAt(r.occurredAt);
      if (!dt) return false;
      if (start && dt < start) return false;
      if (end && dt > end) return false;

      if (timeSlot) {
        const hour = dt.getHours();
        if (timeSlot === "上午(06-12)" && !(hour >= 6 && hour < 12)) return false;
        if (timeSlot === "下午(12-18)" && !(hour >= 12 && hour < 18)) return false;
        if (timeSlot === "晚間(18-24)" && !(hour >= 18 && hour < 24)) return false;
        if (timeSlot === "凌晨(00-06)" && !(hour >= 0 && hour < 6)) return false;
      }

      if (account && r.username !== account) return false;
      if (role && r.roleName !== role) return false;
      return true;
    });
  }, [loginRows, startDate, endDate, timeSlot, account, role]);

  const filteredPermissionRows = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return permissionRows.filter((r) => {
      const dt = parseOccurredAt(r.occurredAt);
      if (!dt) return false;
      if (start && dt < start) return false;
      if (end && dt > end) return false;
      if (account && r.username !== account) return false;
      if (role && r.roleName !== role) return false;
      if (target && r.target !== target) return false;
      if (action && r.action !== action) return false;
      return true;
    });
  }, [permissionRows, startDate, endDate, account, role, target, action]);

  // ====== Pagination Logic ======
  const loginTotalPages = useMemo(() => {
    const n = Math.ceil(filteredLoginRows.length / pageSize);
    return Math.max(1, n);
  }, [filteredLoginRows.length, pageSize]);

  const permissionTotalPages = useMemo(() => {
    const n = Math.ceil(filteredPermissionRows.length / pageSize);
    return Math.max(1, n);
  }, [filteredPermissionRows.length, pageSize]);

  // 確保頁碼不超出範圍
  useEffect(() => {
    if (loginPage > loginTotalPages) setLoginPage(loginTotalPages);
  }, [loginPage, loginTotalPages]);

  useEffect(() => {
    if (permissionPage > permissionTotalPages) setPermissionPage(permissionTotalPages);
  }, [permissionPage, permissionTotalPages]);

  // tab 切換時，關閉展開行並重置分頁（避免狀態殘留）
  useEffect(() => {
    setExpandedPermissionId(null);
    if (active === "login") setLoginPage(1);
    if (active === "permission") setPermissionPage(1);
  }, [active]);

  const pagedLoginRows = useMemo(() => {
    const safePage = Math.min(loginPage, loginTotalPages);
    const start = (safePage - 1) * pageSize;
    return filteredLoginRows.slice(start, start + pageSize);
  }, [filteredLoginRows, loginPage, pageSize, loginTotalPages]);

  const pagedPermissionRows = useMemo(() => {
    const safePage = Math.min(permissionPage, permissionTotalPages);
    const start = (safePage - 1) * pageSize;
    return filteredPermissionRows.slice(start, start + pageSize);
  }, [filteredPermissionRows, permissionPage, pageSize, permissionTotalPages]);

  // 分頁按鈕渲染 (1..5 ... last)
  const loginPageButtons = useMemo(() => {
    const btns = [];
    const totalPages = loginTotalPages;
    const page = loginPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) btns.push(i);
      return btns;
    }

    btns.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) btns.push("...");
    for (let i = start; i <= end; i++) btns.push(i);
    if (end < totalPages - 1) btns.push("...");
    btns.push(totalPages);
    return btns;
  }, [loginPage, loginTotalPages]);

  const permissionPageButtons = useMemo(() => {
    const btns = [];
    const totalPages = permissionTotalPages;
    const page = permissionPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) btns.push(i);
      return btns;
    }

    btns.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) btns.push("...");
    for (let i = start; i <= end; i++) btns.push(i);
    if (end < totalPages - 1) btns.push("...");
    btns.push(totalPages);
    return btns;
  }, [permissionPage, permissionTotalPages]);

  const togglePermissionExpand = (rowId) => {
    setExpandedPermissionId((cur) => (cur === rowId ? null : rowId));
  };

  const onPermissionRowKeyDown = (e, rowId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePermissionExpand(rowId);
    }
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
          <div className="rbac-audit-filters">
            <div className="rbac-audit-filter">
              <span className="rbac-audit-filter-label">開始日期</span>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="rbac-audit-filter">
              <span className="rbac-audit-filter-label">結束日期</span>
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            {/* 時間（僅登入紀錄）/ 帳號 / 角色 / 目標 / 動作 */}
            {active === "login" ? (
              <div className="rbac-audit-filter">
                <span className="rbac-audit-filter-label">時間</span>
                <select className="select" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                  {timeOptions.map((x) => (
                    <option key={x} value={x === "時間" || x === "全部" ? "" : x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="rbac-audit-filter">
              <span className="rbac-audit-filter-label">帳號</span>
              <select className="select" value={account} onChange={(e) => setAccount(e.target.value)}>
                {accountOptions.map((x) => (
                  <option key={x} value={x === "帳號" ? "" : x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="rbac-audit-filter">
              <span className="rbac-audit-filter-label">角色</span>
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                {roleOptions.map((x) => (
                  <option key={x} value={x === "角色" ? "" : x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            {active === "permission" ? (
              <>
                <div className="rbac-audit-filter">
                  <span className="rbac-audit-filter-label">目標</span>
                  <select className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
                    {targetOptions.map((x) => (
                      <option key={x} value={x === "目標" ? "" : x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rbac-audit-filter">
                  <span className="rbac-audit-filter-label">動作</span>
                  <select className="select" value={action} onChange={(e) => setAction(e.target.value)}>
                    {actionOptions.map((x) => (
                      <option key={x} value={x === "動作" ? "" : x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            <div className="rbac-audit-filter-actions">
              <button className="btn btn-purple" type="button" onClick={() => {}}>
                查詢
              </button>
              <button className="btn btn-ghost" type="button" onClick={onClearFilters}>
                清空
              </button>
            </div>
          </div>

          <div className="small-muted" style={{ marginTop: 10 }}>
            預設查詢近一週 (開始:{startDate}，結束:{endDate})
          </div>

          {/* Table */}
          <div style={{ marginTop: 14 }}>
            <table className="rbac-table rbac-table-fixed">
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
                    <th style={{ width: "20%" }}>時間</th>
                    <th style={{ width: "15%" }}>帳號</th>
                    <th style={{ width: "15%" }}>角色</th>
                    <th style={{ width: "18%" }}>IP</th>
                    <th style={{ width: "16%" }}>目標</th>
                    <th style={{ width: "16%" }}>動作</th>
                  </tr>
                )}
              </thead>

              <tbody>
                {active === "login"
                  ? pagedLoginRows.map((r) => (
                      <tr key={r.id}>
                        <td className="rbac-td-ellipsis" title={r.occurredAt}>
                          {r.occurredAt}
                        </td>
                        <td className="rbac-td-ellipsis" title={r.username}>
                          {r.username}
                        </td>
                        <td className="rbac-td-ellipsis" title={r.roleName}>
                          {r.roleName}
                        </td>
                        <td className="rbac-td-ellipsis" title={r.ip}>
                          {r.ip}
                        </td>
                      </tr>
                    ))
                  : pagedPermissionRows.flatMap((r) => {
                      const expanded = expandedPermissionId === r.id;
                      return [
                        <tr
                          key={r.id}
                          className={`rbac-clickable-row ${expanded ? "is-expanded" : ""}`}
                          role="button"
                          tabIndex={0}
                          aria-expanded={expanded}
                          onClick={() => togglePermissionExpand(r.id)}
                          onKeyDown={(e) => onPermissionRowKeyDown(e, r.id)}
                          title="點擊展開明細"
                        >
                          <td className="rbac-td-ellipsis" title={r.occurredAt}>
                            {r.occurredAt}
                          </td>
                          <td className="rbac-td-ellipsis" title={r.username}>
                            {r.username}
                          </td>
                          <td className="rbac-td-ellipsis" title={r.roleName}>
                            {r.roleName}
                          </td>
                          <td className="rbac-td-ellipsis" title={r.ip}>
                            {r.ip}
                          </td>
                          <td className="rbac-td-ellipsis" title={r.target}>
                            <span className={`rbac-badge ${getTargetBadgeTone(r.target)}`}>{r.target}</span>
                          </td>
                          <td className="rbac-td-ellipsis" title={r.action}>
                            <span className={`rbac-badge ${getActionBadgeTone(r.action)}`}>{r.action}</span>
                          </td>
                        </tr>,
                        expanded ? (
                          <tr key={`${r.id}-detail`} className="rbac-audit-expand-row is-open">
                            <td colSpan={6}>
                              <div className="rbac-audit-expand">
                                <div className="rbac-audit-expand-inner">
                                  <div className="rbac-audit-expand-head">
                                    <div className="rbac-audit-expand-title">明細</div>
                                    <button
                                      type="button"
                                      className="btn btn-ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedPermissionId(null);
                                      }}
                                    >
                                      收合
                                    </button>
                                  </div>

                                  <div>
                                    <div className="rbac-audit-detail-row">
                                      <div className="rbac-audit-detail-k">時間</div>
                                      <div className="rbac-audit-detail-v">{r.occurredAt}</div>
                                    </div>
                                    <div className="rbac-audit-detail-row">
                                      <div className="rbac-audit-detail-k">帳號</div>
                                      <div className="rbac-audit-detail-v">{r.username}</div>
                                    </div>
                                    <div className="rbac-audit-detail-row">
                                      <div className="rbac-audit-detail-k">角色</div>
                                      <div className="rbac-audit-detail-v">{r.roleName}</div>
                                    </div>
                                    <div className="rbac-audit-detail-row">
                                      <div className="rbac-audit-detail-k">IP</div>
                                      <div className="rbac-audit-detail-v">{r.ip}</div>
                                    </div>
                                    <div className="rbac-audit-detail-row">
                                      <div className="rbac-audit-detail-k">目標</div>
                                      <div className="rbac-audit-detail-v">
                                        <span className={`rbac-badge ${getTargetBadgeTone(r.target)}`}>{r.target}</span>
                                      </div>
                                    </div>
                                    <div className="rbac-audit-detail-row">
                                      <div className="rbac-audit-detail-k">動作</div>
                                      <div className="rbac-audit-detail-v">
                                        <span className={`rbac-badge ${getActionBadgeTone(r.action)}`}>{r.action}</span>
                                      </div>
                                    </div>
                                    <div className="rbac-audit-detail-row">
                                      <div className="rbac-audit-detail-k">備註</div>
                                      <div className="rbac-audit-detail-v">{r.remark}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null,
                      ];
                    })}
              </tbody>
            </table>
          </div>

          {/* 分頁列 */}
          <div className="pg-bar">
            <div className="pg-left">
              {active === "login" ? (
                <>
                  <PageButton disabled={loginPage <= 1} onClick={() => setLoginPage((p) => Math.max(1, p - 1))}>
                    ‹
                  </PageButton>

                  {loginPageButtons.map((b, idx) =>
                    b === "..." ? (
                      <span key={`dots-${idx}`} className="pg-dots">
                        …
                      </span>
                    ) : (
                      <PageButton key={b} active={loginPage === b} onClick={() => setLoginPage(b)}>
                        {b}
                      </PageButton>
                    )
                  )}

                  <PageButton disabled={loginPage >= loginTotalPages} onClick={() => setLoginPage((p) => Math.min(loginTotalPages, p + 1))}>
                    ›
                  </PageButton>
                </>
              ) : (
                <>
                  <PageButton disabled={permissionPage <= 1} onClick={() => setPermissionPage((p) => Math.max(1, p - 1))}>
                    ‹
                  </PageButton>

                  {permissionPageButtons.map((b, idx) =>
                    b === "..." ? (
                      <span key={`dots-${idx}`} className="pg-dots">
                        …
                      </span>
                    ) : (
                      <PageButton key={b} active={permissionPage === b} onClick={() => setPermissionPage(b)}>
                        {b}
                      </PageButton>
                    )
                  )}

                  <PageButton
                    disabled={permissionPage >= permissionTotalPages}
                    onClick={() => setPermissionPage((p) => Math.min(permissionTotalPages, p + 1))}
                  >
                    ›
                  </PageButton>
                </>
              )}
            </div>

            <div className="pg-right">
              <select
                className="select pg-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setLoginPage(1);
                  setPermissionPage(1);
                  setExpandedPermissionId(null);
                }}
              >
                <option value={10}>10 條/頁</option>
                <option value={20}>20 條/頁</option>
                <option value={50}>50 條/頁</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
