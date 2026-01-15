import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./rbac.styles.css";
import EyeIcon from "../../components/EyeIcon";
import { rbacStoreGetRoles, rbacStoreOnRolesChanged, rbacStoreOffRolesChanged } from "./rbac.data";

// ====== 假資料 ======
// 角色改為：管理者 / 工程師 / 船長 / 船員
const ROLE_OPTIONS = ["管理者", "工程師", "船長", "船員"];

const seed = [
  {
    id: 1,
    name: "管理者1",
    email: "132456@abc.com.tw",
    username: "admin",
    role: "管理者",
    locked: false,
  },
  {
    id: 2,
    name: "工程師A",
    email: "engineerA@abc.com.tw",
    username: "engineerA",
    role: "工程師",
    locked: false,
  },
  {
    id: 3,
    name: "林義貴",
    email: "linyiguei@abc.com.tw",
    username: "linyiguei",
    role: "管理者",
    locked: false,
  },
  {
    id: 4,
    name: "Tanya",
    email: "tanya@abc.com.tw",
    username: "tanya",
    role: "管理者",
    locked: false,
  },
  {
    id: 5,
    name: "新營工務段",
    email: "section_xy@abc.com.tw",
    username: "section_XY",
    role: "工程師",
    locked: false,
  },
  {
    id: 6,
    name: "林亞昀",
    email: "asia349@abc.com.tw",
    username: "asia349",
    role: "工程師",
    locked: false,
  },
  {
    id: 7,
    name: "白河工務段",
    email: "section_bh@abc.com.tw",
    username: "section_BH",
    role: "工程師",
    locked: false,
  },
  {
    id: 8,
    name: "屏東工務段",
    email: "section_pt@abc.com.tw",
    username: "section_PT",
    role: "工程師",
    locked: true,
  },
  {
    id: 9,
    name: "船長A",
    email: "captainA@abc.com.tw",
    username: "captainA",
    role: "船長",
    locked: false,
  },
  {
    id: 10,
    name: "船員A1",
    email: "crewA1@abc.com.tw",
    username: "crewA1",
    role: "船員",
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
    locked: false,
  };
}

function mkEmptyPwdForm() {
  return {
    newPwd: "",
    confirmPwd: "",
    showNew: false,
    showConfirm: false,
    touched: {
      newPwd: false,
      confirmPwd: false,
    },
  };
}

function PageButton({ active, children, onClick, disabled }) {
  return (
    <button className={`pg-btn ${active ? "active" : ""}`} onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
}

const AUTOFILL_GUARD_PROPS = {
  autoComplete: "off",
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  "data-bwignore": "true",
};

const NEW_PASSWORD_GUARD_PROPS = {
  autoComplete: "new-password",
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  "data-bwignore": "true",
};

const AccountFormFields = ({ withPassword, form, setForm, showPwd, setShowPwd, roleOptions }) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailInvalid = form.email.trim() && !emailRegex.test(form.email.trim());

  return (
    <>
      <div className="form-row">
        <div className="label">姓名:</div>
        <input
          className="input"
          placeholder="姓名"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          name="acct_name"
          {...AUTOFILL_GUARD_PROPS}
        />
      </div>

      <div className="form-row">
        <div className="label">電子郵箱:</div>
        <div style={{ flex: 1 }}>
          <input
            className="input"
            placeholder="電子郵箱"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            name="acct_email"
            {...AUTOFILL_GUARD_PROPS}
            style={{ width: "100%" }}
          />
          {isEmailInvalid && (
            <div style={{ marginTop: "6px", fontSize: "0.8rem", color: "#ef4444" }}>
              ⚠️ 請輸入有效的電子郵箱格式（例：user@example.com）
            </div>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="label">帳號:</div>
        <input
          className="input"
          placeholder="帳號"
          value={form.username}
          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          name="acct_username"
          {...AUTOFILL_GUARD_PROPS}
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
              name="acct_password"
              {...NEW_PASSWORD_GUARD_PROPS}
            />
            <button
              type="button"
              className="pwd-eye"
              onClick={() => setShowPwd((s) => !s)}
              aria-label="toggle password"
              title={showPwd ? "隱藏" : "顯示"}
            >
              <EyeIcon open={showPwd} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="form-row">
        <div className="label">角色:</div>
        <select
          className="select"
          value={form.role}
          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          name="acct_role"
          {...AUTOFILL_GUARD_PROPS}
        >
          <option value="">角色選擇</option>
          {(Array.isArray(roleOptions) && roleOptions.length ? roleOptions : ROLE_OPTIONS).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row" style={{ gridTemplateColumns: "120px 1fr", alignItems: "flex-start" }}>
        <div className="label" style={{ paddingTop: "2px" }}>
          鎖定密碼:
        </div>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "50px" }}>
          <label className="lock-row" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={!!form.locked}
              onChange={(e) => setForm((p) => ({ ...p, locked: e.target.checked }))}
              name="acct_locked"
            />
            <span style={{ fontWeight: 900 }}>{form.locked ? "已鎖定" : "未鎖定"}</span>
          </label>
          <div
            style={{
              marginTop: "6px",
              fontSize: "0.8rem",
              color: "#ef4444",
              lineHeight: "1.4",
              visibility: form.locked ? "visible" : "hidden",
              height: form.locked ? "auto" : "0",
            }}
          >
            ⚠️ 鎖定後不得修改密碼
          </div>
        </div>
      </div>
    </>
  );
};

const pwdRules = {
  minLen: 8,
  hasLower: (s) => /[a-z]/.test(s),
  hasUpper: (s) => /[A-Z]/.test(s),
  hasDigit: (s) => /\d/.test(s),
  hasSymbol: (s) => /[^A-Za-z0-9]/.test(s),
};

function evalPwd(pwd) {
  const okMin = pwd.length >= pwdRules.minLen;
  const okLower = pwdRules.hasLower(pwd);
  const okUpper = pwdRules.hasUpper(pwd);
  const okDigit = pwdRules.hasDigit(pwd);
  const okSymbol = pwdRules.hasSymbol(pwd);

  const score = [okMin, okLower, okUpper, okDigit, okSymbol].filter(Boolean).length;
  const allOk = okMin && okLower && okUpper && okDigit && okSymbol;

  return { okMin, okLower, okUpper, okDigit, okSymbol, score, allOk };
}

function scoreLabel(score) {
  if (score <= 1) return "弱";
  if (score === 2) return "偏弱";
  if (score === 3) return "普通";
  if (score === 4) return "良好";
  return "強";
}

function genStrongPassword(len = 12) {
  const lowers = "abcdefghijklmnopqrstuvwxyz";
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.?/";
  const all = lowers + uppers + digits + symbols;

  const pick = (str) => str[Math.floor(Math.random() * str.length)];
  let base = [pick(lowers), pick(uppers), pick(digits), pick(symbols)];
  while (base.length < len) base.push(pick(all));

  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base.join("");
}

function rolesToOptions(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return ROLE_OPTIONS;
  return roles.map((r) => r.name).filter(Boolean);
}

export default function AccountManagement() {
  const { user } = useAuth();
  const currentUser = user || { role: "管理者" };

  // 帳號資料只存在 component state（F5 不保留）
  const [rows, setRows] = useState(seed);

  // 角色清單：來自 rbac.data.js 的 in-memory store（同一個 SPA 分頁可同步）
  const [roleOptions, setRoleOptions] = useState(() => rolesToOptions(rbacStoreGetRoles()));

  useEffect(() => {
    const refresh = () => setRoleOptions(rolesToOptions(rbacStoreGetRoles()));
    rbacStoreOnRolesChanged(refresh);
    refresh();
    return () => rbacStoreOffRolesChanged(refresh);
  }, []);

  const [selectedRowId, setSelectedRowId] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [searchRole, setSearchRole] = useState("");

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pwdId, setPwdId] = useState(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delTargetId, setDelTargetId] = useState(null);

  const [form, setForm] = useState(mkEmptyAccount());
  const [showPwd, setShowPwd] = useState(false);

  const [pwdForm, setPwdForm] = useState(mkEmptyPwdForm());
  const [pwdCopied, setPwdCopied] = useState(false);

  const editRow = useMemo(() => rows.find((r) => r.id === editId) || null, [rows, editId]);
  const pwdRow = useMemo(() => rows.find((r) => r.id === pwdId) || null, [rows, pwdId]);
  const delRowObj = useMemo(() => rows.find((r) => r.id === delTargetId) || null, [rows, delTargetId]);

  const filtered = useMemo(() => {
    let result = rows.filter((r) => {
      const nameMatch = searchName.trim() === "" || r.name.toLowerCase().includes(searchName.trim().toLowerCase());
      const usernameMatch =
        searchUsername.trim() === "" || r.username.toLowerCase().includes(searchUsername.trim().toLowerCase());
      const roleMatch = searchRole.trim() === "" || r.role.toLowerCase().includes(searchRole.trim().toLowerCase());
      return nameMatch && usernameMatch && roleMatch;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = (a[sortField] || "").toString().toLowerCase();
        const bVal = (b[sortField] || "").toString().toLowerCase();
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [rows, searchName, searchUsername, searchRole, sortField, sortOrder]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, totalPages]);

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

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSelectRow = (rowId) => setSelectedRowId((prev) => (prev === rowId ? null : rowId));
  const stopRowClick = (e) => e.stopPropagation();

  const openAdd = () => {
    setForm(mkEmptyAccount());
    setShowPwd(false);
    setAddOpen(true);
  };

  const saveAdd = () => {
    if (!form.name.trim() || !form.username.trim() || !form.role.trim() || !form.password.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email.trim() && !emailRegex.test(form.email.trim())) return;

    const newRow = {
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      role: form.role,
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
              locked: !!form.locked,
            }
          : r
      )
    );
    setEditId(null);
  };

  const openPwd = (row) => {
    setPwdCopied(false);
    setPwdForm(mkEmptyPwdForm());
    setPwdId(row.id);
  };

  const closePwd = () => {
    setPwdId(null);
    setPwdCopied(false);
    setPwdForm(mkEmptyPwdForm());
  };

  const pwdEval = useMemo(() => evalPwd(pwdForm.newPwd), [pwdForm.newPwd]);
  const pwdMatch = pwdForm.newPwd.length > 0 && pwdForm.newPwd === pwdForm.confirmPwd;

  const pwdErrorNew = useMemo(() => {
    if (!pwdForm.touched.newPwd) return "";
    if (!pwdForm.newPwd) return "請輸入新密碼。";
    if (!pwdEval.allOk) return "新密碼未符合安全規則。";
    return "";
  }, [pwdForm.touched.newPwd, pwdForm.newPwd, pwdEval.allOk]);

  const pwdErrorConfirm = useMemo(() => {
    if (!pwdForm.touched.confirmPwd) return "";
    if (!pwdForm.confirmPwd) return "請再次輸入新密碼。";
    if (!pwdMatch) return "兩次輸入不一致。";
    return "";
  }, [pwdForm.touched.confirmPwd, pwdForm.confirmPwd, pwdMatch]);

  const canSavePwd = useMemo(() => !!pwdRow && !pwdRow.locked && pwdEval.allOk && pwdMatch, [
    pwdRow,
    pwdEval.allOk,
    pwdMatch,
  ]);

  const savePwd = () => {
    if (!canSavePwd) return;

    setRows((prev) =>
      prev.map((r) =>
        r.id === pwdId
          ? {
              ...r,
              passwordUpdatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    closePwd();
  };

  const openDel = (row) => {
    setDelTargetId(row.id);
    setDelOpen(true);
  };

  const closeDel = () => {
    setDelOpen(false);
    setDelTargetId(null);
  };

  const confirmDel = () => {
    if (delTargetId == null) return;
    setRows((prev) => prev.filter((r) => r.id !== delTargetId));
    setSelectedRowId((prev) => (prev === delTargetId ? null : prev));
    closeDel();
  };

  const handleGeneratePwd = () => {
    const s = genStrongPassword(12);
    setPwdCopied(false);
    setPwdForm((p) => ({
      ...p,
      newPwd: s,
      confirmPwd: s,
      touched: { newPwd: true, confirmPwd: true },
    }));
  };

  const handleCopyPwd = async () => {
    try {
      await navigator.clipboard.writeText(pwdForm.newPwd || "");
      setPwdCopied(true);
      window.setTimeout(() => setPwdCopied(false), 1200);
    } catch {
      setPwdCopied(false);
    }
  };

  return (
    <div className="rbac-card">
      <div className="rbac-actions" style={{ justifyContent: "space-between" }}>
        <div>
          <button className="btn btn-yellow" onClick={openAdd} type="button">
            新增帳號
          </button>
        </div>

        <div className="small-muted">
          目前登入角色：<strong style={{ marginLeft: 6 }}>{currentUser?.role || "管理者"}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0", marginTop: "20px", marginBottom: "12px", alignItems: "center" }}>
        <input
          className="input"
          placeholder="搜尋姓名"
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setPage(1);
          }}
          style={{ width: "30%", marginRight: "8px" }}
          name="search_name"
          {...AUTOFILL_GUARD_PROPS}
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
          name="search_username"
          {...AUTOFILL_GUARD_PROPS}
        />
        <select
          className="select"
          value={searchRole}
          onChange={(e) => {
            setSearchRole(e.target.value);
            setPage(1);
          }}
          style={{ width: "20%", marginRight: "8px" }}
          name="search_role"
          {...AUTOFILL_GUARD_PROPS}
        >
          <option value="">全部角色</option>
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

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

      <table className="table">
        <thead>
          <tr>
            <th className="th-sort" style={{ width: "30%", cursor: "pointer" }} onClick={() => handleSort("name")}>
              姓名
              <span style={{ marginLeft: "8px", color: sortField === "name" ? "#3b82f6" : "#9ca3af" }}>
                {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
              </span>
            </th>
            <th
              className="th-sort"
              style={{ width: "25%", cursor: "pointer" }}
              onClick={() => handleSort("username")}
            >
              帳號
              <span style={{ marginLeft: "8px", color: sortField === "username" ? "#3b82f6" : "#9ca3af" }}>
                {sortField === "username" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
              </span>
            </th>
            <th style={{ width: "20%", cursor: "pointer" }} onClick={() => handleSort("role")}>
              角色
              <span style={{ marginLeft: "8px", color: sortField === "role" ? "#3b82f6" : "#9ca3af" }}>
                {sortField === "role" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
              </span>
            </th>
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
                className={["tr-row", selectedRowId === r.id ? "is-selected" : "", r.locked ? "is-locked" : ""].join(
                  " "
                )}
                onClick={() => toggleSelectRow(r.id)}
              >
                <td>
                  <div className="role-name">
                    {r.name}
                    {r.locked ? <span className="lock-badge">鎖</span> : null}
                  </div>
                </td>
                <td style={{ fontSize: 18 }}>{r.username}</td>
                <td style={{ fontSize: 18 }}>{r.role}</td>
                <td>
                  <div className="op-col" onClick={stopRowClick}>
                    <button
                      className="btn btn-green"
                      onClick={() => openPwd(r)}
                      type="button"
                      disabled={r.locked}
                      title={r.locked ? "帳號已鎖定，禁止修改密碼" : "修改密碼"}
                    >
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
            name="page_size"
            {...AUTOFILL_GUARD_PROPS}
          >
            <option value={10}>10 條/頁</option>
            <option value={20}>20 條/頁</option>
            <option value={50}>50 條/頁</option>
          </select>
        </div>
      </div>

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
          <AccountFormFields
            withPassword={true}
            form={form}
            setForm={setForm}
            showPwd={showPwd}
            setShowPwd={setShowPwd}
            roleOptions={roleOptions}
          />
        </Modal>
      ) : null}

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
              <button
                className="btn btn-green"
                onClick={saveEdit}
                type="button"
                disabled={!form.name.trim() || !form.username.trim() || !form.role.trim()}
              >
                修改
              </button>
            </>
          }
        >
          <AccountFormFields
            withPassword={false}
            form={form}
            setForm={setForm}
            showPwd={showPwd}
            setShowPwd={setShowPwd}
            roleOptions={roleOptions}
          />
        </Modal>
      ) : null}

      {pwdRow ? (
        <Modal
          title="修改密碼"
          size="sm"
          onClose={closePwd}
          footer={
            <>
              <button className="btn" style={{ background: "#9ca3af" }} onClick={closePwd} type="button">
                取消
              </button>
              <button
                className="btn btn-green"
                onClick={savePwd}
                type="button"
                disabled={!canSavePwd}
                title={pwdRow.locked ? "帳號已鎖定，禁止修改密碼" : ""}
              >
                修改
              </button>
            </>
          }
        >
          <div className="pwd-meta">
            <div className="pwd-meta-row">
              <span className="pwd-meta-k">帳號</span>
              <span className="pwd-meta-v">{pwdRow.username}</span>
            </div>
            <div className="pwd-meta-row">
              <span className="pwd-meta-k">角色</span>
              <span className="pwd-meta-v">{pwdRow.role}</span>
            </div>
            {pwdRow.locked ? <div className="pwd-warn">此帳號目前為「鎖定」狀態，禁止修改密碼。</div> : null}
          </div>

          <div className="pwd-tools">
            <button className="btn btn-ghost" type="button" onClick={handleGeneratePwd} disabled={pwdRow.locked}>
              產生安全密碼
            </button>
            <button className="btn btn-ghost" type="button" onClick={handleCopyPwd} disabled={!pwdForm.newPwd}>
              {pwdCopied ? "已複製" : "複製密碼"}
            </button>
          </div>

          <div className="pwd-strength">
            <div className="pwd-strength-top">
              <span className="small-muted">強度</span>
              <span className="pwd-strength-label">{scoreLabel(pwdEval.score)}</span>
            </div>
            <div className="pwd-strength-bar" aria-label="password strength">
              <div className={`pwd-strength-fill s${pwdEval.score}`} />
            </div>
          </div>

          <div className="form-row">
            <div className="label">新密碼:</div>
            <div className="pwd-wrap">
              <input
                className={`input ${pwdErrorNew ? "is-invalid" : ""}`}
                placeholder="新密碼"
                type={pwdForm.showNew ? "text" : "password"}
                value={pwdForm.newPwd}
                disabled={pwdRow.locked}
                onBlur={() => setPwdForm((p) => ({ ...p, touched: { ...p.touched, newPwd: true } }))}
                onChange={(e) =>
                  setPwdForm((p) => ({
                    ...p,
                    newPwd: e.target.value,
                    touched: { ...p.touched, newPwd: true },
                  }))
                }
                name="pwd_new"
                {...NEW_PASSWORD_GUARD_PROPS}
              />
              <button
                type="button"
                className="pwd-eye"
                onClick={() => setPwdForm((p) => ({ ...p, showNew: !p.showNew }))}
                aria-label="toggle password"
                title={pwdForm.showNew ? "隱藏" : "顯示"}
              >
                <EyeIcon open={pwdForm.showNew} />
              </button>
            </div>
          </div>
          {pwdErrorNew ? <div className="field-error">{pwdErrorNew}</div> : null}

          <div className="form-row" style={{ marginTop: 10 }}>
            <div className="label">確認新密碼:</div>
            <div className="pwd-wrap">
              <input
                className={`input ${pwdErrorConfirm ? "is-invalid" : ""}`}
                placeholder="確認新密碼"
                type={pwdForm.showConfirm ? "text" : "password"}
                value={pwdForm.confirmPwd}
                disabled={pwdRow.locked}
                onBlur={() => setPwdForm((p) => ({ ...p, touched: { ...p.touched, confirmPwd: true } }))}
                onChange={(e) =>
                  setPwdForm((p) => ({
                    ...p,
                    confirmPwd: e.target.value,
                    touched: { ...p.touched, confirmPwd: true },
                  }))
                }
                name="pwd_confirm"
                {...NEW_PASSWORD_GUARD_PROPS}
              />
              <button
                type="button"
                className="pwd-eye"
                onClick={() => setPwdForm((p) => ({ ...p, showConfirm: !p.showConfirm }))}
                aria-label="toggle password"
                title={pwdForm.showConfirm ? "隱藏" : "顯示"}
              >
                <EyeIcon open={pwdForm.showConfirm} />
              </button>
            </div>
          </div>
          {pwdErrorConfirm ? <div className="field-error">{pwdErrorConfirm}</div> : null}

          <div className="pwd-rules">
            <div className="pwd-rules-title">密碼規則</div>
            <ul className="pwd-rules-list">
              <li className={pwdEval.okMin ? "ok" : ""}>至少 {pwdRules.minLen} 個字元</li>
              <li className={pwdEval.okLower ? "ok" : ""}>包含小寫字母 (a-z)</li>
              <li className={pwdEval.okUpper ? "ok" : ""}>包含大寫字母 (A-Z)</li>
              <li className={pwdEval.okDigit ? "ok" : ""}>包含數字 (0-9)</li>
              <li className={pwdEval.okSymbol ? "ok" : ""}>包含特殊符號（例如 !@#）</li>
            </ul>
          </div>
        </Modal>
      ) : null}

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
