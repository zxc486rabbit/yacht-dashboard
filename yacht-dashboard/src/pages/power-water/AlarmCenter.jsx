// pages/power-water/AlarmCenter.jsx
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

/** ===== 小工具 ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) => d.toISOString().split("T")[0];
const todayISO = () => isoDate(new Date());
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - Number(n || 0));
  return isoDate(d);
};

const fmtDT = (dt) => {
  if (!dt) return "-";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleString();
};

const severityMeta = (sev) => {
  // sev: 3=高, 2=中, 1=低
  if (sev === 3) return { text: "高", badge: "bg-danger" };
  if (sev === 2) return { text: "中", badge: "bg-warning text-dark" };
  return { text: "低", badge: "bg-secondary" };
};

const statusMeta = (st) => {
  // st: OPEN | ACK | CLOSED
  if (st === "ACK") return { text: "已確認", badge: "bg-primary" };
  if (st === "CLOSED") return { text: "已結案", badge: "bg-success" };
  return { text: "未確認", badge: "bg-danger" };
};

const typeMeta = (code) => {
  const map = {
    TRIP: { name: "岸電跳脫", badge: "bg-danger" },
    OVERLOAD: { name: "過載", badge: "bg-danger" },
    OVERVOLT: { name: "過電壓", badge: "bg-warning text-dark" },
    UNDERVOLT: { name: "欠電壓", badge: "bg-warning text-dark" },
    FREQ_DEV: { name: "頻率偏移", badge: "bg-secondary" },
    OFFLINE: { name: "設備離線", badge: "bg-dark" },
    AUTH_FAIL: { name: "授權失敗", badge: "bg-secondary" },
    CMD_FAIL: { name: "遠控命令失敗", badge: "bg-secondary" },
  };
  return map[code] || { name: code || "未知", badge: "bg-secondary" };
};

const randi = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;

function genId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function randomDateTimeBetween(startISO, endISO) {
  const s = new Date(`${startISO}T00:00:00`);
  const e = new Date(`${endISO}T23:59:59`);
  const t = s.getTime() + Math.random() * (e.getTime() - s.getTime());
  return new Date(t).toISOString();
}

/** ===== 假資料（後續可換 API） ===== */
function genAlarms({ start, end }) {
  const types = ["TRIP", "OVERLOAD", "OVERVOLT", "UNDERVOLT", "FREQ_DEV", "OFFLINE", "AUTH_FAIL", "CMD_FAIL"];
  const count = randi(18, 55);

  return Array.from({ length: count }, (_, i) => {
    const berthNo = randi(1, 11);
    const type = types[randi(0, types.length - 1)];
    const sev =
      type === "TRIP" || type === "OVERLOAD" || type === "OFFLINE"
        ? 3
        : type === "OVERVOLT" || type === "UNDERVOLT"
        ? 2
        : 1;

    const time = randomDateTimeBetween(start, end);
    const statusRand = Math.random();
    const status = statusRand > 0.82 ? "CLOSED" : statusRand > 0.45 ? "ACK" : "OPEN";

    const hasAck = status !== "OPEN";
    const ackBy = hasAck ? ["值班員 A", "值班員 B", "維運主管", "系統自動"][randi(0, 3)] : "";
    const ackAt = hasAck ? new Date(new Date(time).getTime() + randi(2, 240) * 60 * 1000).toISOString() : "";

    // 模擬監看數據（用來對應「電流、電壓、功率、頻率監看」與異常門檻）
    const v = rand(205, 238);
    const a = rand(0, 22);
    const kw = rand(0.5, 16);
    const hz = rand(49.1, 60.9);

    const detail =
      type === "OVERLOAD"
        ? `負載 ${randi(95, 140)}%（持續 ${randi(10, 240)} 秒）`
        : type === "TRIP"
        ? `跳脫原因：${["瞬間過載", "漏電保護", "短路保護", "過溫保護"][randi(0, 3)]}`
        : type === "OVERVOLT"
        ? `電壓過高：${v.toFixed(1)}V（門檻 235V）`
        : type === "UNDERVOLT"
        ? `電壓過低：${v.toFixed(1)}V（門檻 210V）`
        : type === "FREQ_DEV"
        ? `頻率偏移：${hz.toFixed(2)}Hz（容許 ±0.5Hz）`
        : type === "OFFLINE"
        ? `設備離線（最後心跳：${randi(1, 25)} 分鐘前）`
        : type === "AUTH_FAIL"
        ? `授權失敗（Token/權限不符）`
        : `遠控命令回應逾時（Timeout）`;

    return {
      id: genId(),
      seq: i + 1,
      time,
      berthNo,
      device: `岸電樁 ${berthNo <= 6 ? "A" : "B"}-${pad2(berthNo)}`,
      type,
      severity: sev,
      status,
      title: `${typeMeta(type).name} - 船席 ${berthNo}`,
      detail,
      metrics: { voltageV: v, currentA: a, powerKW: kw, freqHz: hz },
      ackBy,
      ackAt,
      closedBy: status === "CLOSED" ? ["值班員 A", "維運主管", "系統自動"][randi(0, 2)] : "",
      closedAt: status === "CLOSED" ? new Date(new Date(time).getTime() + randi(60, 720) * 60 * 1000).toISOString() : "",
    };
  }).sort((a, b) => String(b.time).localeCompare(String(a.time)));
}

export default function AlarmCenter() {
  /** ✅ 日期預設近一週 */
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  /** 篩選條件 */
  const [qBerth, setQBerth] = useState(""); // "" = all
  const [qSeverity, setQSeverity] = useState(""); // "" | "3" | "2" | "1"
  const [qStatus, setQStatus] = useState(""); // "" | OPEN | ACK | CLOSED
  const [qType, setQType] = useState(""); // "" | code
  const [qKeyword, setQKeyword] = useState("");

  /** 資料 */
  const [alarms, setAlarms] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);

  /** UI：選取與檢視 */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    setDateRange({ start: daysAgoISO(6), end: todayISO() });
  }, []);

  const runQuery = () => {
    if (!dateRange.start || !dateRange.end) {
      Swal.fire("缺少日期", "請選擇開始與結束日期。", "warning");
      return;
    }
    setHasQueried(true);
    setSelectedIds(new Set());
    setViewing(null);
    setAlarms(genAlarms({ start: dateRange.start, end: dateRange.end }));
  };

  // 初次：日期設定好後自動查一次
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;
    runQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start, dateRange.end]);

  const filtered = useMemo(() => {
    const kw = qKeyword.trim();
    return alarms.filter((a) => {
      if (qBerth && Number(a.berthNo) !== Number(qBerth)) return false;
      if (qSeverity && Number(a.severity) !== Number(qSeverity)) return false;
      if (qStatus && a.status !== qStatus) return false;
      if (qType && a.type !== qType) return false;
      if (kw) {
        const hay = `${a.title} ${a.detail} ${a.device} ${a.type}`.toLowerCase();
        if (!hay.includes(kw.toLowerCase())) return false;
      }
      return true;
    });
  }, [alarms, qBerth, qSeverity, qStatus, qType, qKeyword]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const open = filtered.filter((x) => x.status === "OPEN").length;
    const ack = filtered.filter((x) => x.status === "ACK").length;
    const closed = filtered.filter((x) => x.status === "CLOSED").length;
    const high = filtered.filter((x) => x.severity === 3).length;
    return { total, open, ack, closed, high };
  }, [filtered]);

  const handleDateChange = (e) => setDateRange((p) => ({ ...p, [e.target.name]: e.target.value }));

  const resetFilters = () => {
    setQBerth("");
    setQSeverity("");
    setQStatus("");
    setQType("");
    setQKeyword("");
  };

  /** ===== 批次選取 ===== */
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filtered.map((x) => x.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  /** ===== 狀態操作（示意） ===== */
  const ackOne = async (row) => {
    if (row.status !== "OPEN") {
      Swal.fire("無需確認", "此告警已確認或已結案。", "info");
      return;
    }
    const ok = await Swal.fire({
      title: "確認告警",
      text: `確定要將「${row.title}」標記為已確認嗎？`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "確認",
      cancelButtonText: "取消",
    }).then((r) => r.isConfirmed);
    if (!ok) return;

    setAlarms((prev) =>
      prev.map((a) =>
        a.id === row.id
          ? {
              ...a,
              status: "ACK",
              ackBy: "值班員 A",
              ackAt: new Date().toISOString(),
            }
          : a
      )
    );
    Swal.fire("完成", "已標記為已確認。", "success");
  };

  const closeOne = async (row) => {
    if (row.status === "CLOSED") {
      Swal.fire("已結案", "此告警已結案。", "info");
      return;
    }
    const ok = await Swal.fire({
      title: "結案告警",
      text: `確定要將「${row.title}」結案嗎？`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "結案",
      cancelButtonText: "取消",
    }).then((r) => r.isConfirmed);
    if (!ok) return;

    setAlarms((prev) =>
      prev.map((a) =>
        a.id === row.id
          ? {
              ...a,
              status: "CLOSED",
              closedBy: "值班員 A",
              closedAt: new Date().toISOString(),
              ackBy: a.ackBy || "值班員 A",
              ackAt: a.ackAt || new Date().toISOString(),
            }
          : a
      )
    );
    Swal.fire("完成", "已結案。", "success");
  };

  const ackSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return Swal.fire("未選取", "請先勾選要確認的告警。", "info");

    const openCount = alarms.filter((x) => ids.includes(x.id) && x.status === "OPEN").length;
    if (openCount === 0) return Swal.fire("無可確認項目", "選取項目都已確認或結案。", "info");

    const ok = await Swal.fire({
      title: "批次確認",
      html: `即將確認 <b>${openCount}</b> 筆告警（僅處理「未確認」）。`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "確認",
      cancelButtonText: "取消",
    }).then((r) => r.isConfirmed);
    if (!ok) return;

    const now = new Date().toISOString();
    setAlarms((prev) =>
      prev.map((a) =>
        ids.includes(a.id) && a.status === "OPEN"
          ? { ...a, status: "ACK", ackBy: "值班員 A", ackAt: now }
          : a
      )
    );
    Swal.fire("完成", "批次確認完成。", "success");
  };

  const exportCSV = () => {
    // 不做檔案輸出：用 Swal 示意（你接後端後再換成真匯出）
    Swal.fire("匯出（示意）", "之後接 API 後，這裡可匯出告警清單 CSV（含時間、船席、類型、嚴重度、狀態、量測值）。", "info");
  };

  /** ===== 檢視 Modal ===== */
  const openView = (row) => setViewing(row);
  const closeView = () => setViewing(null);

  const TypeOptions = [
    { code: "", name: "全部類型" },
    { code: "TRIP", name: "岸電跳脫" },
    { code: "OVERLOAD", name: "過載" },
    { code: "OVERVOLT", name: "過電壓" },
    { code: "UNDERVOLT", name: "欠電壓" },
    { code: "FREQ_DEV", name: "頻率偏移" },
    { code: "OFFLINE", name: "設備離線" },
    { code: "AUTH_FAIL", name: "授權失敗" },
    { code: "CMD_FAIL", name: "遠控命令失敗" },
  ];

  return (
    <div className="container mt-4">
      <h4 className="mb-3 text-danger">岸電管理系統 - 告警中心</h4>

      {/* 查詢列 */}
      <div className="p-3 bg-white shadow-sm rounded mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-auto d-flex align-items-center gap-2">
            <label htmlFor="start" className="form-label mb-0 small" style={{ whiteSpace: "nowrap" }}>
              開始日期
            </label>
            <input
              type="date"
              id="start"
              name="start"
              className="form-control form-control-sm"
              value={dateRange.start}
              onChange={handleDateChange}
              style={{ minWidth: 140 }}
            />
          </div>

          <div className="col-auto d-flex align-items-center gap-2">
            <label htmlFor="end" className="form-label mb-0 small" style={{ whiteSpace: "nowrap" }}>
              結束日期
            </label>
            <input
              type="date"
              id="end"
              name="end"
              className="form-control form-control-sm"
              value={dateRange.end}
              onChange={handleDateChange}
              style={{ minWidth: 140 }}
            />
          </div>

          <div className="col-auto">
            <label className="form-label mb-1 small">船席</label>
            <select className="form-select form-select-sm" value={qBerth} onChange={(e) => setQBerth(e.target.value)}>
              <option value="">全部</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  船席 {n}
                </option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <label className="form-label mb-1 small">嚴重度</label>
            <select className="form-select form-select-sm" value={qSeverity} onChange={(e) => setQSeverity(e.target.value)}>
              <option value="">全部</option>
              <option value="3">高</option>
              <option value="2">中</option>
              <option value="1">低</option>
            </select>
          </div>

          <div className="col-auto">
            <label className="form-label mb-1 small">狀態</label>
            <select className="form-select form-select-sm" value={qStatus} onChange={(e) => setQStatus(e.target.value)}>
              <option value="">全部</option>
              <option value="OPEN">未確認</option>
              <option value="ACK">已確認</option>
              <option value="CLOSED">已結案</option>
            </select>
          </div>

          <div className="col-auto">
            <label className="form-label mb-1 small">類型</label>
            <select className="form-select form-select-sm" value={qType} onChange={(e) => setQType(e.target.value)}>
              {TypeOptions.map((x) => (
                <option key={x.code || "ALL"} value={x.code}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label mb-1 small">關鍵字</label>
            <input
              className="form-control form-control-sm"
              placeholder="例：跳脫 / 過載 / A-01..."
              value={qKeyword}
              onChange={(e) => setQKeyword(e.target.value)}
            />
          </div>

          <div className="col-auto d-flex gap-2">
            <button className="btn btn-sm btn-outline-danger" onClick={runQuery} type="button">
              查詢
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={resetFilters} type="button">
              清空篩選
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={exportCSV} type="button">
              匯出
            </button>
          </div>
        </div>

        <div className="text-muted small mt-2">
          預設查詢近一週（開始：{dateRange.start || "-"}，結束：{dateRange.end || "-"}）。
        </div>
      </div>

      {/* 統計卡 */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="p-3 bg-white shadow-sm rounded h-100">
            <div className="text-muted small">符合篩選筆數</div>
            <div className="fs-4 fw-bold">{stats.total}</div>
            <div className="text-muted small">高嚴重度：{stats.high}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 bg-white shadow-sm rounded h-100">
            <div className="text-muted small">未確認</div>
            <div className="fs-4 fw-bold text-danger">{stats.open}</div>
            <div className="text-muted small">建議優先處理跳脫/過載</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 bg-white shadow-sm rounded h-100">
            <div className="text-muted small">已確認</div>
            <div className="fs-4 fw-bold text-primary">{stats.ack}</div>
            <div className="text-muted small">待持續追蹤</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="p-3 bg-white shadow-sm rounded h-100">
            <div className="text-muted small">已結案</div>
            <div className="fs-4 fw-bold text-success">{stats.closed}</div>
            <div className="text-muted small">完成處置與回寫</div>
          </div>
        </div>
      </div>

      {/* 批次工具列 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">已選取：{selectedIds.size} 筆</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={selectAllVisible} type="button">
            全選（目前篩選）
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={clearSelection} type="button">
            取消選取
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-danger" onClick={ackSelected} type="button">
            批次確認（未確認）
          </button>
        </div>
      </div>

      {/* 清單 */}
      {!hasQueried ? (
        <div className="p-4 bg-white shadow rounded">
          <div className="text-muted text-center">請先選擇日期區間並查詢</div>
        </div>
      ) : (
        <div className="table-responsive bg-white shadow-sm rounded">
          <table className="table table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr className="text-center">
                <th style={{ width: 44 }}>
                  <span className="text-muted small">選</span>
                </th>
                <th style={{ width: 170 }}>時間</th>
                <th style={{ width: 90 }}>船席</th>
                <th style={{ width: 150 }}>設備</th>
                <th style={{ width: 140 }}>類型</th>
                <th style={{ width: 90 }}>嚴重度</th>
                <th style={{ width: 90 }}>狀態</th>
                <th>摘要</th>
                <th style={{ width: 240 }}>監看數據</th>
                <th style={{ width: 220 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted py-4">
                    — 無資料 —
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const sev = severityMeta(row.severity);
                  const st = statusMeta(row.status);
                  const tp = typeMeta(row.type);
                  const checked = selectedIds.has(row.id);

                  return (
                    <tr key={row.id}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={checked}
                          onChange={() => toggleSelect(row.id)}
                        />
                      </td>

                      <td className="text-center">{fmtDT(row.time)}</td>

                      <td className="text-center fw-bold">{row.berthNo}</td>

                      <td className="text-center">{row.device}</td>

                      <td className="text-center">
                        <span className={`badge ${tp.badge}`}>{tp.name}</span>
                      </td>

                      <td className="text-center">
                        <span className={`badge ${sev.badge}`}>{sev.text}</span>
                      </td>

                      <td className="text-center">
                        <span className={`badge ${st.badge}`}>{st.text}</span>
                      </td>

                      <td className="text-start">
                        <div className="fw-bold">{row.title}</div>
                        <div className="text-muted small">{row.detail}</div>
                        {row.ackAt && (
                          <div className="text-muted small">
                            確認：{row.ackBy || "-"}（{fmtDT(row.ackAt)}）
                          </div>
                        )}
                      </td>

                      <td className="text-start">
                        <div className="small">
                          V：<b>{row.metrics.voltageV.toFixed(1)}</b>　
                          A：<b>{row.metrics.currentA.toFixed(2)}</b>　
                          kW：<b>{row.metrics.powerKW.toFixed(2)}</b>　
                          Hz：<b>{row.metrics.freqHz.toFixed(2)}</b>
                        </div>
                      </td>

                      <td className="text-center text-nowrap">
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openView(row)} type="button">
                          檢視
                        </button>

                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => ackOne(row)}
                          disabled={row.status !== "OPEN"}
                          type="button"
                        >
                          確認
                        </button>

                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => closeOne(row)}
                          disabled={row.status === "CLOSED"}
                          type="button"
                        >
                          結案
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 檢視 Modal */}
      {viewing && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.4)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">告警檢視</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeView}></button>
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="text-muted small mb-1">時間</div>
                    <div className="fw-bold">{fmtDT(viewing.time)}</div>
                  </div>

                  <div className="col-md-2">
                    <div className="text-muted small mb-1">船席</div>
                    <div className="fw-bold">{viewing.berthNo}</div>
                  </div>

                  <div className="col-md-3">
                    <div className="text-muted small mb-1">設備</div>
                    <div className="fw-bold">{viewing.device}</div>
                  </div>

                  <div className="col-md-3">
                    <div className="text-muted small mb-1">狀態</div>
                    <div className="fw-bold">
                      <span className={`badge ${statusMeta(viewing.status).badge}`}>{statusMeta(viewing.status).text}</span>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="text-muted small mb-1">類型</div>
                    <div className="fw-bold">
                      <span className={`badge ${typeMeta(viewing.type).badge}`}>{typeMeta(viewing.type).name}</span>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="text-muted small mb-1">嚴重度</div>
                    <div className="fw-bold">
                      <span className={`badge ${severityMeta(viewing.severity).badge}`}>{severityMeta(viewing.severity).text}</span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted small mb-1">摘要</div>
                    <div className="fw-bold">{viewing.title}</div>
                    <div className="text-muted">{viewing.detail}</div>
                  </div>

                  <div className="col-12">
                    <div className="text-muted small mb-1">監看數據（事件當下）</div>
                    <div className="p-3 bg-light rounded">
                      <div className="row g-2">
                        <div className="col-md-3">
                          <div className="text-muted small">電壓 (V)</div>
                          <div className="fw-bold">{viewing.metrics.voltageV.toFixed(1)}</div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-muted small">電流 (A)</div>
                          <div className="fw-bold">{viewing.metrics.currentA.toFixed(2)}</div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-muted small">功率 (kW)</div>
                          <div className="fw-bold">{viewing.metrics.powerKW.toFixed(2)}</div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-muted small">頻率 (Hz)</div>
                          <div className="fw-bold">{viewing.metrics.freqHz.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-muted small mt-2">
                      之後接 API 可補：波形、連續取樣、關聯操作紀錄（遠控/排程）、設備回報原始 payload。
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted small mb-1">確認資訊</div>
                    <div>
                      確認者：<b>{viewing.ackBy || "—"}</b>
                    </div>
                    <div>
                      確認時間：<b>{viewing.ackAt ? fmtDT(viewing.ackAt) : "—"}</b>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted small mb-1">結案資訊</div>
                    <div>
                      結案者：<b>{viewing.closedBy || "—"}</b>
                    </div>
                    <div>
                      結案時間：<b>{viewing.closedAt ? fmtDT(viewing.closedAt) : "—"}</b>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeView} type="button">
                  關閉
                </button>

                <button
                  className="btn btn-outline-primary"
                  onClick={() => ackOne(viewing)}
                  disabled={viewing.status !== "OPEN"}
                  type="button"
                >
                  確認
                </button>

                <button
                  className="btn btn-outline-success"
                  onClick={() => closeOne(viewing)}
                  disabled={viewing.status === "CLOSED"}
                  type="button"
                >
                  結案
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-muted small mt-3">
        此頁屬於「告警中心」：主要呈現跳脫/過載/電壓/頻率/離線等異常與處置狀態（確認/結案）。遠端開關、授權、切頻、排程屬於「遠端控管」頁；能耗趨勢屬於「歷史報表」頁。
      </div>
    </div>
  );
}
