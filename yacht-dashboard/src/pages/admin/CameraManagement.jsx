// src/pages/video-surveillance/CameraManage.jsx
import React, { useEffect, useMemo, useState } from "react";

import "../../styles/dashboard/Dashboard.css";
import "../../styles/admin/admin.settings.css";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaVideo,
  FaSearch,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLink,
  FaRegCopy,
} from "react-icons/fa";

// -------------------------
// 假資料
// -------------------------
const seedCameras = [
  {
    id: 1,
    name: "東碼頭入口",
    ip: "192.168.112.201",
    model: "HIK-DS2CD",
    location: "東碼頭 / Gate A",
    status: "online", // online | offline | warning
    protocol: "rtsp",
    port: 554,
    username: "admin",
    password: "••••••••",
    streamPath: "/Streaming/Channels/101",
    note: "主入口車道",
    updatedAt: "2026/01/21 09:12:30",
  },
  {
    id: 2,
    name: "管制室走廊",
    ip: "192.168.112.202",
    model: "DAH-IPC",
    location: "管理中心 / 2F",
    status: "warning",
    protocol: "rtsp",
    port: 554,
    username: "viewer",
    password: "••••••••",
    streamPath: "/cam/realmonitor?channel=1&subtype=0",
    note: "夜間偶發雜訊",
    updatedAt: "2026/01/21 10:05:18",
  },
  {
    id: 3,
    name: "停車場 A 區",
    ip: "192.168.112.203",
    model: "UNV-IPC",
    location: "停車場 / A 區",
    status: "offline",
    protocol: "http",
    port: 80,
    username: "admin",
    password: "••••••••",
    streamPath: "/live",
    note: "待檢修",
    updatedAt: "2026/01/20 18:44:02",
  },
  {
    id: 4,
    name: "西碼頭岸邊",
    ip: "192.168.112.204",
    model: "AXIS-Q",
    location: "西碼頭 / Berth 12",
    status: "online",
    protocol: "rtsp",
    port: 554,
    username: "admin",
    password: "••••••••",
    streamPath: "/axis-media/media.amp",
    note: "",
    updatedAt: "2026/01/21 08:59:10",
  },
];

// -------------------------
// Helpers
// -------------------------
function isValidIPv4(ip) {
  const s = String(ip || "").trim();
  const parts = s.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

function nowTaipeiString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function statusMeta(status) {
  // 對應 admin.settings.css 的 badge：as-badge--ok/warn/danger
  switch (status) {
    case "online":
      return { text: "在線", icon: <FaCheckCircle />, badge: "as-badge--ok" };
    case "warning":
      return {
        text: "異常",
        icon: <FaExclamationTriangle />,
        badge: "as-badge--warn",
      };
    default:
      return { text: "離線", icon: <FaTimes />, badge: "as-badge--danger" };
  }
}

function buildStreamUrl(cam, revealPassword = false) {
  const proto = cam.protocol || "rtsp";
  const host = cam.ip || "";
  const port = cam.port ? `:${cam.port}` : "";
  const user = cam.username ? encodeURIComponent(cam.username) : "";

  const hasMasked = cam.password === "••••••••";
  const rawPass =
    !hasMasked && cam.password ? encodeURIComponent(cam.password) : "";
  const shownPass = revealPassword ? rawPass : rawPass ? "******" : "";

  const auth =
    user && shownPass ? `${user}:${shownPass}@` : user ? `${user}@` : "";

  const path = cam.streamPath || "/";
  return `${proto}://${auth}${host}${port}${path}`;
}

function copyToClipboard(text) {
  if (!text) return;
  if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

// -------------------------
// Modal (uses AS UI kit classes)
// -------------------------
function ModalShell({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="as-modal" onMouseDown={onClose}>
      <div
        className="as-modalCard"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="as-modalHead">
          <h3>{title}</h3>
          <button className="as-icon-btn x" onClick={onClose} aria-label="close">
            <FaTimes />
          </button>
        </div>

        <div style={{ padding: "12px 6px 6px 6px" }}>{children}</div>

        {footer ? <div className="as-modalActions">{footer}</div> : null}
      </div>
    </div>
  );
}

// -------------------------
// Main Component
// -------------------------
export default function CameraManage() {
  const [rows, setRows] = useState(seedCameras);

  // Filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|online|warning|offline

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [active, setActive] = useState(null);
  const [revealPass, setRevealPass] = useState(false);

  // Form
  const emptyForm = useMemo(
    () => ({
      id: null,
      name: "",
      ip: "",
      model: "",
      location: "",
      status: "online",
      protocol: "rtsp",
      port: 554,
      username: "",
      password: "",
      streamPath: "/",
      note: "",
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);
  const [formErr, setFormErr] = useState({});

  // Fake heartbeat for status changes
  useEffect(() => {
    const t = setInterval(() => {
      setRows((prev) =>
        prev.map((r) => {
          const roll = Math.random();
          if (roll < 0.03) {
            const next =
              r.status === "online"
                ? "warning"
                : r.status === "warning"
                ? "offline"
                : "online";
            return { ...r, status: next, updatedAt: nowTaipeiString() };
          }
          return r;
        })
      );
    }, 4500);
    return () => clearInterval(t);
  }, []);

  // Filtered rows
  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okStatus = statusFilter === "all" ? true : r.status === statusFilter;
      const okQ =
        !key ||
        String(r.name || "").toLowerCase().includes(key) ||
        String(r.ip || "").toLowerCase().includes(key) ||
        String(r.location || "").toLowerCase().includes(key) ||
        String(r.model || "").toLowerCase().includes(key);
      return okStatus && okQ;
    });
  }, [rows, q, statusFilter]);

  // Pagination
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length]
  );

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);

  // Stats
  const stats = useMemo(() => {
    const total = rows.length;
    const online = rows.filter((r) => r.status === "online").length;
    const warning = rows.filter((r) => r.status === "warning").length;
    const offline = rows.filter((r) => r.status === "offline").length;
    return { total, online, warning, offline };
  }, [rows]);

  // Actions
  function openCreate() {
    setFormErr({});
    setForm({ ...emptyForm, port: 554, protocol: "rtsp", status: "online" });
    setEditOpen(true);
  }

  function openEdit(row) {
    setFormErr({});
    setForm({
      id: row.id,
      name: row.name || "",
      ip: row.ip || "",
      model: row.model || "",
      location: row.location || "",
      status: row.status || "online",
      protocol: row.protocol || "rtsp",
      port: row.port ?? 554,
      username: row.username || "",
      password: row.password && row.password !== "••••••••" ? row.password : "",
      streamPath: row.streamPath || "/",
      note: row.note || "",
    });
    setEditOpen(true);
  }

  function openView(row) {
    setActive(row);
    setRevealPass(false);
    setViewOpen(true);
  }

  function openDelete(row) {
    setActive(row);
    setDeleteOpen(true);
  }

  function validateForm(f) {
    const e = {};
    if (!String(f.name || "").trim()) e.name = "請輸入名稱";
    if (!String(f.ip || "").trim()) e.ip = "請輸入 IP";
    else if (!isValidIPv4(f.ip)) e.ip = "IP 格式不正確";

    const portN = Number(f.port);
    if (!portN || portN < 1 || portN > 65535) e.port = "Port 範圍 1~65535";

    if (!String(f.streamPath || "").trim()) e.streamPath = "請輸入串流路徑";
    return e;
  }

  function upsert() {
    const e = validateForm(form);
    setFormErr(e);
    if (Object.keys(e).length) return;

    const payload = {
      ...form,
      ip: String(form.ip).trim(),
      name: String(form.name).trim(),
      updatedAt: nowTaipeiString(),
      password: form.password ? form.password : "••••••••",
    };

    setRows((prev) => {
      if (!payload.id) {
        const nextId = prev.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        return [{ ...payload, id: nextId }, ...prev];
      }
      return prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r));
    });

    setEditOpen(false);
  }

  function removeActive() {
    if (!active) return;
    setRows((prev) => prev.filter((r) => r.id !== active.id));
    setDeleteOpen(false);
    setViewOpen(false);
    setActive(null);
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="as-page">
      {/* Header */}
      <div className="as-header">
        <div className="as-titleBlock">
          <h1 className="as-title as-title--xl">攝影機管理</h1>
          <div className="as-subtitle">Camera Device List（UI + 假資料）</div>
        </div>

        <div className="as-topActions">
          <button className="as-btn primary" onClick={openCreate}>
            <FaPlus /> 新增攝影機
          </button>
        </div>
      </div>

      {/* Status row */}
      <div className="as-statusRow">
        <div className="as-statusItem">
          <span className="as-statusLabel">總數</span>
          <span className="as-statusValue">{stats.total}</span>
        </div>
        <div className="as-statusItem">
          <span className="as-statusLabel">在線</span>
          <span className="as-statusValue">{stats.online}</span>
        </div>
        <div className="as-statusItem">
          <span className="as-statusLabel">異常</span>
          <span className="as-statusValue">{stats.warning}</span>
        </div>
        <div className="as-statusItem">
          <span className="as-statusLabel">離線</span>
          <span className="as-statusValue">{stats.offline}</span>
        </div>
      </div>

      {/* Toolbar card */}
      <div className="as-card" style={{ marginBottom: 14 }}>
        <div className="as-cardHead">
          <div>
            <div className="as-cardTitle">查詢與篩選</div>
            <div className="as-cardSubtitle">搜尋名稱/IP/位置/型號，並依狀態篩選</div>
          </div>

          <div className="as-rowActions">
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-end",
                flexWrap: "wrap",
              }}
            >
              {/* 搜尋 */}
              <div style={{ minWidth: 320 }}>
                <div className="as-label" style={{ marginBottom: 6 }}>
                  搜尋
                </div>
                <div style={{ position: "relative" }}>
                  <FaSearch
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      opacity: 0.65,
                    }}
                  />
                  <input
                    className="as-input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="名稱 / IP / 位置 / 型號"
                    style={{ paddingLeft: 36 }}
                  />
                  {q ? (
                    <button
                      className="as-icon-btn"
                      onClick={() => setQ("")}
                      style={{ position: "absolute", right: 8, top: 6 }}
                      aria-label="clear"
                    >
                      <FaTimes />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 狀態 */}
              <div style={{ minWidth: 180 }}>
                <div className="as-label" style={{ marginBottom: 6 }}>
                  狀態
                </div>
                <select
                  className="as-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">全部</option>
                  <option value="online">在線</option>
                  <option value="warning">異常</option>
                  <option value="offline">離線</option>
                </select>
              </div>

              {/* 統計（同基準線） */}
              <div style={{ paddingBottom: 8, color: "var(--muted)" }}>
                共 <b style={{ color: "var(--ink)" }}>{filtered.length}</b> 筆
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="as-card">
        <div className="as-tableWrap">
          <table className="as-table as-table--spec-device">
            <thead>
              <tr>
                <th className="col-icon">攝影機</th>
                <th className="col-name">名稱</th>
                <th className="col-ip">IP</th>
                <th className="col-status">狀態</th>
                <th className="col-updated">最後更新</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>

            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="as-empty">
                    無資料
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const meta = statusMeta(r.status);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => openView(r)}
                      style={{ cursor: "pointer" }}
                      title="點擊檢視"
                    >
                      <td className="col-icon">
                        {/* 保留 icon 區塊結構，但避免重複觸發 row click */}
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          title="攝影機"
                          aria-label={`攝影機 ${r.name}`}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            cursor: "inherit",
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              border: "1px solid rgba(229,231,235,.95)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(255,255,255,.9)",
                            }}
                          >
                            <FaVideo />
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>#{r.id}</div>
                        </button>
                      </td>

                      <td className="col-name">
                        <div style={{ color: "var(--ink)", fontWeight: 800 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                          {r.location || "—"}
                        </div>
                      </td>

                      <td className="col-ip">
                        <div className="as-mono">{r.ip}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                          {String(r.protocol || "").toUpperCase()} : {r.port}
                        </div>
                      </td>

                      <td className="col-status">
                        <span className={`as-badge ${meta.badge}`}>
                          {meta.icon} {meta.text}
                        </span>
                      </td>

                      <td className="col-updated">
                        <div className="as-mono" style={{ fontSize: 12 }}>
                          {r.updatedAt || "—"}
                        </div>
                      </td>

                      <td className="col-actions">
                        <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="as-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(r);
                            }}
                          >
                            <FaEdit /> 編輯
                          </button>

                          <button
                            className="as-btn danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDelete(r);
                            }}
                          >
                            <FaTrash /> 刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          <button
            className="as-btn ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            上一頁
          </button>

          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            第 <b style={{ color: "var(--ink)" }}>{page}</b> /{" "}
            <b style={{ color: "var(--ink)" }}>{pageCount}</b> 頁
          </div>

          <button
            className="as-btn ghost"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
          >
            下一頁
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <ModalShell
        open={editOpen}
        title={form.id ? "編輯攝影機" : "新增攝影機"}
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <button className="as-btn ghost" onClick={() => setEditOpen(false)}>
              取消
            </button>
            <button className="as-btn primary" onClick={upsert}>
              儲存
            </button>
          </>
        }
      >
        <div className="as-formGrid">
          <div>
            <div className="as-label">名稱</div>
            <input
              className="as-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例：東碼頭入口"
            />
            {formErr.name ? <div className="as-help danger">{formErr.name}</div> : null}
          </div>

          <div>
            <div className="as-label">IP</div>
            <input
              className="as-input"
              value={form.ip}
              onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
              placeholder="192.168.x.x"
            />
            {formErr.ip ? <div className="as-help danger">{formErr.ip}</div> : null}
          </div>

          <div>
            <div className="as-label">狀態</div>
            <select
              className="as-input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="online">在線</option>
              <option value="warning">異常</option>
              <option value="offline">離線</option>
            </select>
          </div>

          <div>
            <div className="as-label">型號（選填）</div>
            <input
              className="as-input"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="例：HIK-DS2CD"
            />
          </div>

          <div>
            <div className="as-label">位置（選填）</div>
            <input
              className="as-input"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="例：東碼頭 / Gate A"
            />
          </div>

          <div>
            <div className="as-label">備註（選填）</div>
            <input
              className="as-input"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="例：夜間偶發雜訊"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="as-sectionDivider" />
          </div>

          <div>
            <div className="as-label">協定</div>
            <select
              className="as-input"
              value={form.protocol}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  protocol: e.target.value,
                  port: e.target.value === "http" ? 80 : 554,
                }))
              }
            >
              <option value="rtsp">RTSP</option>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>

          <div>
            <div className="as-label">Port</div>
            <input
              className="as-input"
              value={form.port}
              onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
              placeholder="554"
            />
            {formErr.port ? <div className="as-help danger">{formErr.port}</div> : null}
          </div>

          <div>
            <div className="as-label">帳號（選填）</div>
            <input
              className="as-input"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="viewer"
            />
          </div>

          <div>
            <div className="as-label">密碼（選填）</div>
            <input
              className="as-input"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="（先假資料，可留空）"
              type="password"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="as-label">串流路徑</div>
            <input
              className="as-input"
              value={form.streamPath}
              onChange={(e) => setForm((f) => ({ ...f, streamPath: e.target.value }))}
              placeholder="/Streaming/Channels/101"
            />
            {formErr.streamPath ? (
              <div className="as-help danger">{formErr.streamPath}</div>
            ) : (
              <div className="as-help">
                例：<span className="as-mono">/Streaming/Channels/101</span>、{" "}
                <span className="as-mono">/axis-media/media.amp</span>
              </div>
            )}
          </div>
        </div>
      </ModalShell>

      {/* View (Live) Modal */}
      <ModalShell
        open={viewOpen}
        title="攝影機檢視"
        onClose={() => setViewOpen(false)}
        footer={
          <>
            <button className="as-btn ghost" onClick={() => setViewOpen(false)}>
              關閉
            </button>
          </>
        }
      >
        {!active ? (
          <div className="as-empty">未選取攝影機</div>
        ) : (
          <div className="as-monitor">
            {/* Left: preview */}
            <div className="as-panel">
              <div className="as-panelTitle" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <FaVideo /> {active.name}
                </div>
                <span className={`as-badge ${statusMeta(active.status).badge}`}>
                  {statusMeta(active.status).icon} {statusMeta(active.status).text}
                </span>
              </div>

              {/* Fake preview */}
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(229,231,235,.95)",
                  background: "rgba(15,23,42,.92)",
                  color: "#e2e8f0",
                  height: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 2 }}>LIVE</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  目前為假資料預覽（後續可接 RTSP / NVR / WebRTC）
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="as-btn"
                  onClick={() => {
                    const url = buildStreamUrl(active, false);
                    copyToClipboard(url);
                  }}
                >
                  <FaRegCopy /> 複製串流 URL
                </button>

                <button className="as-btn ghost" onClick={() => setRevealPass((v) => !v)}>
                  {revealPass ? "隱藏密碼" : "顯示密碼（UI）"}
                </button>
              </div>
            </div>

            {/* Right: details */}
            <div className="as-panel">
              <div className="as-panelTitle">基本資訊</div>

              <div className="as-panelGrid">
                <div className="as-kv">
                  <div className="as-kv__k">名稱</div>
                  <div className="as-kv__v">{active.name}</div>
                </div>

                <div className="as-kv">
                  <div className="as-kv__k">IP</div>
                  <div className="as-kv__v as-mono">{active.ip}</div>
                </div>

                <div className="as-kv">
                  <div className="as-kv__k">位置</div>
                  <div className="as-kv__v">{active.location || "—"}</div>
                </div>

                <div className="as-kv">
                  <div className="as-kv__k">型號</div>
                  <div className="as-kv__v">{active.model || "—"}</div>
                </div>

                <div className="as-kv" style={{ gridColumn: "1 / -1" }}>
                  <div className="as-kv__k">串流 URL</div>
                  <div
                    className="as-kv__v"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <FaLink />
                    <span className="as-mono" style={{ fontSize: 12, fontWeight: 800 }}>
                      {buildStreamUrl(active, revealPass)}
                    </span>
                  </div>
                  <div className="as-help">
                    目前為 UI 組合字串；正式串流通常會經過 NVR Proxy 或 WebRTC Gateway。
                  </div>
                </div>

                <div className="as-kv" style={{ gridColumn: "1 / -1" }}>
                  <div className="as-kv__k">最後更新</div>
                  <div className="as-kv__v as-mono" style={{ fontSize: 12 }}>
                    {active.updatedAt || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalShell>

      {/* Delete confirm */}
      <ModalShell
        open={deleteOpen}
        title="刪除確認"
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <button className="as-btn ghost" onClick={() => setDeleteOpen(false)}>
              取消
            </button>
            <button className="as-btn danger" onClick={removeActive}>
              確認刪除
            </button>
          </>
        }
      >
        <div style={{ padding: "6px 2px" }}>
          {active ? (
            <>
              <div>
                你確定要刪除攝影機「<b>{active.name}</b>」嗎？
              </div>
              <div className="as-help">IP：{active.ip}</div>
            </>
          ) : (
            <div className="as-empty">未選取項目</div>
          )}
        </div>
      </ModalShell>
    </div>
  );
}
