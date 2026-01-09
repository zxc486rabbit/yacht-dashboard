import React, { useEffect, useMemo, useState } from "react";
import "./rbac.styles.css";

// ====== 假資料 ======
// 角色改為：管理者 / 工程師 / 船長 / 船員
const ROLE_OPTIONS = ["管理者", "工程師", "船長", "船員"];

// 工務段：只在「管理者 / 工程師」顯示
const SECTION_OPTIONS = ["工務段A", "工務段B", "工務段C", "所有工務段"];

const seed = [
  {
    id: 1,
    name: "管理者1",
    email: "132456@abc.com.tw",
    username: "admin",
    role: "管理者",
    section: "所有工務段",
    locked: false,
  },
  {
    id: 2,
    name: "工程師A",
    email: "engineerA@abc.com.tw",
    username: "engineerA",
    role: "工程師",
    section: "工務段A",
    locked: false,
  },
  {
    id: 3,
    name: "林義貴",
    email: "linyiguei@abc.com.tw",
    username: "linyiguei",
    role: "管理者",
    section: "所有工務段",
    locked: false,
  },
  {
    id: 4,
    name: "Tanya",
    email: "tanya@abc.com.tw",
    username: "tanya",
    role: "管理者",
    section: "所有工務段",
    locked: false,
  },
  {
    id: 5,
    name: "新營工務段",
    email: "section_xy@abc.com.tw",
    username: "section_XY",
    role: "工程師",
    section: "工務段B",
    locked: false,
  },
  {
    id: 6,
    name: "林亞昀",
    email: "asia349@abc.com.tw",
    username: "asia349",
    role: "工程師",
    section: "工務段C",
    locked: false,
  },
  {
    id: 7,
    name: "白河工務段",
    email: "section_bh@abc.com.tw",
    username: "section_BH",
    role: "工程師",
    section: "工務段B",
    locked: false,
  },
  {
    id: 8,
    name: "屏東工務段",
    email: "section_pt@abc.com.tw",
    username: "section_PT",
    role: "工程師",
    section: "工務段A",
    locked: true,
  },

  // 船長 / 船員（不綁工務段）
  {
    id: 9,
    name: "船長A",
    email: "captainA@abc.com.tw",
    username: "captainA",
    role: "船長",
    section: "",
    locked: false,
  },
  {
    id: 10,
    name: "船員A1",
    email: "crewA1@abc.com.tw",
    username: "crewA1",
    role: "船員",
    section: "",
    locked: false,
  },
];

// ====== 共用 Modal ======
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
      role="presentation"
    >
      <div
        className={`rbac-modal ${size === "sm" ? "sm" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="rbac-modal-head">
          <h3 className="rbac-modal-title">{title}</h3>
          <button className="rbac-icon-x" onClick={onClose} type="button" aria-label="close">
            ×
          </button>
        </div>

        <div className="rbac-modal-body">{children}</div>

        {footer ? <div className="rbac-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

function mkEmptyAccount() {
  return {
    name: "",
    email: "",
    username: "",
    password: "",
    role: "",
    section: "",
    locked: false,
  };
}

// ====== Pagination ======
function PageButton({ active, children, onClick, disabled }) {
  return (
    <button className={`pg-btn ${active ? "active" : ""}`} onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
}

// ====== shared form fields ======
const AccountFormFields = ({ withPassword, form, setForm, showPwd, setShowPwd, showSection }) => (
  <>
    <div className="form-row">
      <div className="label">姓名:</div>
      <input
        className="input"
        placeholder="姓名"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
      />
    </div>

    <div className="form-row">
      <div className="label">電子郵箱:</div>
      <input
        className="input"
        placeholder="電子郵箱"
        value={form.email}
        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
      />
    </div>

    <div className="form-row">
      <div className="label">帳號:</div>
      <input
        className="input"
        placeholder="帳號"
        value={form.username}
        onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
      />
    </div>

    {withPassword ? (
      <div className="form-row">
        <div className="label">密碼:</div>
        <div className="pwd-wrap">
          <input
            className="input"
            placeholder="密碼"
            type={showPwd ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
          <button
            type="button"
            className="pwd-eye"
            onClick={() => setShowPwd((s) => !s)}
            aria-label="toggle password"
            title={showPwd ? "隱藏" : "顯示"}
          >
            {showPwd ? "🙈" : "👁"}
          </button>
        </div>
      </div>
    ) : null}

    <div className="form-row">
      <div className="label">角色:</div>
      <select className="select" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
        <option value="">角色選擇</option>
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>

    {/* 工務段：只對 管理者/工程師 顯示 */}
    {showSection ? (
      <div className="form-row">
        <div className="label">工務段:</div>
        <select
          className="select"
          value={form.section}
          onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
        >
          <option value="">工務段選擇</option>
          {SECTION_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    ) : null}

    <div className="form-row" style={{ gridTemplateColumns: "120px 1fr" }}>
      <div className="label">鎖定:</div>
      <label className="lock-row">
        <input type="checkbox" checked={!!form.locked} onChange={(e) => setForm((p) => ({ ...p, locked: e.target.checked }))} />
        <span style={{ fontWeight: 900 }}>{form.locked ? "已鎖定" : "未鎖定"}</span>
      </label>
    </div>
  </>
);

export default function AccountManagement() {
  const [rows, setRows] = useState(seed);

  // 表格列選取
  const [selectedRowId, setSelectedRowId] = useState(null);

  // 搜尋 - 分為三個獨立欄位
  const [searchName, setSearchName] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [searchRole, setSearchRole] = useState("");

  // 分頁
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // modals
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pwdId, setPwdId] = useState(null);

  // 刪除確認 modal
  const [delOpen, setDelOpen] = useState(false);
  const [delTargetId, setDelTargetId] = useState(null);

  // 表單
  const [form, setForm] = useState(mkEmptyAccount());
  const [showPwd, setShowPwd] = useState(false);

  const editRow = useMemo(() => rows.find((r) => r.id === editId) || null, [rows, editId]);
  const pwdRow = useMemo(() => rows.find((r) => r.id === pwdId) || null, [rows, pwdId]);

  // 刪除目標 row（用來顯示資訊）
  const delRowObj = useMemo(() => rows.find((r) => r.id === delTargetId) || null, [rows, delTargetId]);

  // 只有 管理者/工程師 顯示工務段
  const showSection = useMemo(() => ["管理者", "工程師"].includes(form.role), [form.role]);

  // 角色切到 船長/船員 時，自動清空工務段避免殘留
  useEffect(() => {
    if (!showSection && form.section) {
      setForm((p) => ({ ...p, section: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSection]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const nameMatch = searchName.trim() === "" || r.name.toLowerCase().includes(searchName.trim().toLowerCase());
      const usernameMatch =
        searchUsername.trim() === "" || r.username.toLowerCase().includes(searchUsername.trim().toLowerCase());
      const roleMatch = searchRole.trim() === "" || r.role.toLowerCase().includes(searchRole.trim().toLowerCase());

      return nameMatch && usernameMatch && roleMatch;
    });
  }, [rows, searchName, searchUsername, searchRole]);

  const totalPages = useMemo(() => {
    const n = Math.ceil(filtered.length / pageSize);
    return Math.max(1, n);
  }, [filtered.length, pageSize]);

  // 確保 page 不會超出範圍
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, totalPages]);

  // pagination render (1..5 ... last)
  const pageButtons = useMemo(() => {
    const btns = [];

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
  }, [page, totalPages]);

  // ====== handlers ======
  const toggleSelectRow = (rowId) => {
    setSelectedRowId((prev) => (prev === rowId ? null : rowId));
  };

  const stopRowClick = (e) => {
    e.stopPropagation();
  };

  const openAdd = () => {
    setForm(mkEmptyAccount());
    setShowPwd(false);
    setAddOpen(true);
  };

  const saveAdd = () => {
    if (!form.name.trim() || !form.username.trim() || !form.role.trim() || !form.password.trim()) return;

    const newRow = {
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      role: form.role,
      // 船長/船員：不存工務段
      section: ["管理者", "工程師"].includes(form.role) ? form.section || "" : "",
      locked: !!form.locked,
    };

    setRows((prev) => [newRow, ...prev]);
    setAddOpen(false);
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      email: row.email || "",
      username: row.username,
      password: "",
      role: row.role,
      section: row.section || "",
      locked: !!row.locked,
    });
    setEditId(row.id);
  };

  const saveEdit = () => {
    if (!form.name.trim() || !form.username.trim() || !form.role.trim()) return;

    setRows((prev) =>
      prev.map((r) =>
        r.id === editId
          ? {
              ...r,
              name: form.name.trim(),
              email: form.email.trim(),
              username: form.username.trim(),
              role: form.role,
              // 船長/船員：不存工務段
              section: ["管理者", "工程師"].includes(form.role) ? form.section || "" : "",
              locked: !!form.locked,
            }
          : r
      )
    );
    setEditId(null);
  };

  const openPwd = (row) => {
    setForm((p) => ({ ...p, password: "" }));
    setShowPwd(false);
    setPwdId(row.id);
  };

  const savePwd = () => {
    if (!form.password.trim()) return;
    // 之後串 API：PUT /users/{id}/password
    setPwdId(null);
  };

  // 開啟刪除確認 modal
  const openDel = (row) => {
    setDelTargetId(row.id);
    setDelOpen(true);
  };

  // 關閉刪除確認 modal
  const closeDel = () => {
    setDelOpen(false);
    setDelTargetId(null);
  };

  // 真正執行刪除（只有按「確定刪除」才會跑）
  const confirmDel = () => {
    if (delTargetId == null) return;
    setRows((prev) => prev.filter((r) => r.id !== delTargetId));
    // 如果剛好刪的是被選取那列，也一併清掉選取
    setSelectedRowId((prev) => (prev === delTargetId ? null : prev));
    closeDel();
  };

  return (
    <div className="rbac-card">
      {/* Header row: 標題 + 右上按鈕 */}
      <div className="acct-head">
        <div className="acct-left">
          <h2 className="acct-title">帳號管理</h2>
        </div>

        <div className="acct-right">
          <button className="btn btn-yellow" onClick={openAdd} type="button">
            新增帳號
          </button>
        </div>
      </div>

      {/* 搜尋欄位區域 - 對齊表格欄位 */}
      <div style={{ display: "flex", gap: "0", marginBottom: "12px", alignItems: "center" }}>
        <input
          className="input"
          placeholder="搜尋姓名"
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setPage(1);
          }}
          style={{ width: "30%", marginRight: "8px" }}
        />
        <input
          className="input"
          placeholder="搜尋帳號"
          value={searchUsername}
          onChange={(e) => {
            setSearchUsername(e.target.value);
            setPage(1);
          }}
          style={{ width: "25%", marginRight: "8px" }}
        />
        <input
          className="input"
          placeholder="搜尋角色"
          value={searchRole}
          onChange={(e) => {
            setSearchRole(e.target.value);
            setPage(1);
          }}
          style={{ width: "20%", marginRight: "8px" }}
        />

        {/* 全部清除按鈕 */}
        <div style={{ width: "25%", display: "flex", justifyContent: "flex-start" }}>
          {(searchName || searchUsername || searchRole) && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearchName("");
                setSearchUsername("");
                setSearchRole("");
                setPage(1);
              }}
              type="button"
              style={{ whiteSpace: "nowrap" }}
            >
              全部清除
            </button>
          )}
        </div>
      </div>

      {/* 表格 */}
      <table className="table">
        <thead>
          <tr>
            <th className="th-sort" style={{ width: "30%" }}>
              姓名
            </th>
            <th className="th-sort" style={{ width: "25%" }}>
              帳號
            </th>
            <th style={{ width: "20%" }}>角色</th>
            <th style={{ width: "25%" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {paged.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: 28, fontWeight: 900, color: "#6b7280" }}>
                查無資料
              </td>
            </tr>
          ) : (
            paged.map((r) => (
              <tr
                key={r.id}
                className={["tr-row", selectedRowId === r.id ? "is-selected" : "", r.locked ? "is-locked" : ""].join(" ")}
                onClick={() => toggleSelectRow(r.id)}
              >
                <td>
                  <div className="role-name">
                    {r.name}
                    {r.locked ? <span className="lock-badge">鎖</span> : null}
                  </div>
                </td>
                <td style={{ fontWeight: 900, fontSize: 18 }}>{r.username}</td>
                <td style={{ fontWeight: 900, fontSize: 18 }}>{r.role}</td>
                <td>
                  <div className="op-col" onClickCapture={stopRowClick}>
                    <button className="btn btn-green" onClick={() => openPwd(r)} type="button">
                      修改密碼
                    </button>
                    <button className="btn btn-green" onClick={() => openEdit(r)} type="button">
                      修改
                    </button>
                    <button className="btn btn-red" onClick={() => openDel(r)} type="button">
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 分頁列 */}
      <div className="pg-bar">
        <div className="pg-left">
          <PageButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ‹
          </PageButton>

          {pageButtons.map((b, idx) =>
            b === "..." ? (
              <span key={`dots-${idx}`} className="pg-dots">
                …
              </span>
            ) : (
              <PageButton key={b} active={page === b} onClick={() => setPage(b)}>
                {b}
              </PageButton>
            )
          )}

          <PageButton disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            ›
          </PageButton>
        </div>

        <div className="pg-right">
          <select
            className="select pg-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 條/頁</option>
            <option value={20}>20 條/頁</option>
            <option value={50}>50 條/頁</option>
          </select>
        </div>
      </div>

      {/* ====== Modal：新增帳號 ====== */}
      {addOpen ? (
        <Modal
          title="新增帳號"
          size="sm"
          onClose={() => setAddOpen(false)}
          footer={
            <>
              <button className="btn" style={{ background: "#9ca3af" }} onClick={() => setAddOpen(false)} type="button">
                取消
              </button>
              <button
                className="btn btn-green"
                onClick={saveAdd}
                type="button"
                disabled={!form.name.trim() || !form.username.trim() || !form.role.trim() || !form.password.trim()}
              >
                新增
              </button>
            </>
          }
        >
          <AccountFormFields withPassword={true} form={form} setForm={setForm} showPwd={showPwd} setShowPwd={setShowPwd} showSection={showSection} />
        </Modal>
      ) : null}

      {/* ====== Modal：編輯帳號 ====== */}
      {editRow ? (
        <Modal
          title="編輯帳號"
          size="sm"
          onClose={() => setEditId(null)}
          footer={
            <>
              <button className="btn" style={{ background: "#9ca3af" }} onClick={() => setEditId(null)} type="button">
                取消
              </button>
              <button className="btn btn-green" onClick={saveEdit} type="button" disabled={!form.name.trim() || !form.username.trim() || !form.role.trim()}>
                修改
              </button>
            </>
          }
        >
          <AccountFormFields withPassword={false} form={form} setForm={setForm} showPwd={showPwd} setShowPwd={setShowPwd} showSection={showSection} />
        </Modal>
      ) : null}

      {/* ====== Modal：修改密碼 ====== */}
      {pwdRow ? (
        <Modal
          title="修改密碼"
          size="sm"
          onClose={() => setPwdId(null)}
          footer={
            <>
              <button className="btn" style={{ background: "#9ca3af" }} onClick={() => setPwdId(null)} type="button">
                取消
              </button>
              <button className="btn btn-green" onClick={savePwd} type="button" disabled={!form.password.trim()}>
                修改
              </button>
            </>
          }
        >
          <div className="small-muted" style={{ marginBottom: 12 }}>
            帳號：<span style={{ fontWeight: 900, color: "#111827" }}>{pwdRow.username}</span>
          </div>

          <div className="form-row">
            <div className="label">新密碼:</div>
            <div className="pwd-wrap">
              <input
                className="input"
                placeholder="新密碼"
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
              <button
                type="button"
                className="pwd-eye"
                onClick={() => setShowPwd((s) => !s)}
                aria-label="toggle password"
                title={showPwd ? "隱藏" : "顯示"}
              >
                {showPwd ? "🙈" : "👁"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* ====== Modal：刪除確認（避免誤刪） ====== */}
      {delOpen ? (
        <Modal
          title="確認刪除"
          size="sm"
          onClose={closeDel}
          footer={
            <>
              <button className="btn" style={{ background: "#9ca3af" }} onClick={closeDel} type="button">
                取消
              </button>
              <button className="btn btn-red" onClick={confirmDel} type="button" disabled={!delRowObj}>
                確定刪除
              </button>
            </>
          }
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>此操作無法復原，請再次確認是否要刪除以下帳號：</div>

          <div className="small-muted" style={{ lineHeight: 1.9 }}>
            <div>
              姓名：<span style={{ fontWeight: 900, color: "#111827" }}>{delRowObj?.name ?? "-"}</span>
            </div>
            <div>
              帳號：<span style={{ fontWeight: 900, color: "#111827" }}>{delRowObj?.username ?? "-"}</span>
            </div>
            <div>
              角色：<span style={{ fontWeight: 900, color: "#111827" }}>{delRowObj?.role ?? "-"}</span>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
