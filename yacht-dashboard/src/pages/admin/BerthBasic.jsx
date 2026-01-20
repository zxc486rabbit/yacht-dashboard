// src/pages/admin/BerthBasic.jsx
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

const LS_KEY = "marina:berths";

// 假資料 - 設備清單（之後可換成 API）
const shoreDevices = [
  { id: "SP-01", name: "岸電樁 A-01" },
  { id: "SP-02", name: "岸電樁 A-02" },
  { id: "SP-03", name: "岸電樁 B-01" },
];
const powerMeters = [
  { id: "PM-11", name: "電錶 #11" },
  { id: "PM-12", name: "電錶 #12" },
  { id: "PM-13", name: "電錶 #13" },
];
const waterMeters = [
  { id: "WM-21", name: "水錶 #21" },
  { id: "WM-22", name: "水錶 #22" },
  { id: "WM-23", name: "水錶 #23" },
];

const deviceName = (list, id) => list.find((x) => x.id === id)?.name || "-";
const nowISO = () => new Date().toISOString();

// 只允許 1~11
function clampBerthNo(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  if (x < 1 || x > 11) return null;
  return Math.floor(x);
}

// 初次沒有資料時種入兩筆假資料
const seedIfEmpty = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw && JSON.parse(raw)?.length) return JSON.parse(raw);
  } catch {
    // Silently ignore localStorage errors (e.g., parse errors)
  }
  const demo = [
    {
      id: 1001,
      berthNo: 1,
      name: "船席 1",
      zone: "A 區",
      standard: "EU", // EU / US
      ratedCurrentA: 16,
      enabled: true,
      shoreId: "SP-01",
      powerMeterId: "PM-11",
      waterMeterId: "WM-21",
      note: "",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: 1002,
      berthNo: 2,
      name: "船席 2",
      zone: "A 區",
      standard: "EU",
      ratedCurrentA: 16,
      enabled: true,
      shoreId: "SP-02",
      powerMeterId: "PM-12",
      waterMeterId: "WM-22",
      note: "靠近入口",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
  ];
  localStorage.setItem(LS_KEY, JSON.stringify(demo));
  return demo;
};

function normStandard(v) {
  return v === "US" ? "US" : "EU";
}

function ensureUniqueBinding(list, candidate, ignoreId = null) {
  // 同一個設備不能綁兩個船席（避免維運大災難）
  const clashes = [];
  for (const b of list) {
    if (ignoreId != null && b.id === ignoreId) continue;

    if (candidate.shoreId && b.shoreId === candidate.shoreId) {
      clashes.push(`岸電設備 ${candidate.shoreId} 已被「${b.name}」使用`);
    }
    if (candidate.powerMeterId && b.powerMeterId === candidate.powerMeterId) {
      clashes.push(`電錶設備 ${candidate.powerMeterId} 已被「${b.name}」使用`);
    }
    if (candidate.waterMeterId && b.waterMeterId === candidate.waterMeterId) {
      clashes.push(`水錶設備 ${candidate.waterMeterId} 已被「${b.name}」使用`);
    }
  }
  return clashes;
}

export default function BerthBasic() {
  const [berths, setBerths] = useState(seedIfEmpty);

  // 查詢條件
  const [qBerthNo, setQBerthNo] = useState(""); // 輸入 7 就查第 7
  const [qName, setQName] = useState("");
  const [qZone, setQZone] = useState("");
  const [qEnabled, setQEnabled] = useState(""); // "" | "1" | "0"
  const [qShore, setQShore] = useState("");
  const [qPowerMeter, setQPowerMeter] = useState("");
  const [qWaterMeter, setQWaterMeter] = useState("");

  // Modal 狀態
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    berthNo: "",
    name: "",
    zone: "",
    standard: "EU",
    ratedCurrentA: 16,
    enabled: true,
    shoreId: "",
    powerMeterId: "",
    waterMeterId: "",
    note: "",
  };

  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(berths));
    } catch {
      // Silently ignore localStorage errors (e.g., quota exceeded)
    }
  }, [berths]);

  const zones = useMemo(() => {
    const set = new Set(berths.map((b) => (b.zone || "").trim()).filter(Boolean));
    return Array.from(set).sort();
  }, [berths]);

  // 查詢
  const filtered = useMemo(() => {
    const nameKey = qName.trim();
    const berthNoQ = qBerthNo.trim();

    return berths.filter((b) => {
      if (berthNoQ) {
        const n = clampBerthNo(berthNoQ);
        // 使用者輸入不是 1~11：直接不顯示任何結果（避免誤會）
        if (n == null) return false;
        if (Number(b.berthNo) !== n) return false;
      }

      if (nameKey && !String(b.name || "").includes(nameKey)) return false;
      if (qZone && (b.zone || "") !== qZone) return false;
      if (qEnabled === "1" && !b.enabled) return false;
      if (qEnabled === "0" && b.enabled) return false;
      if (qShore && b.shoreId !== qShore) return false;
      if (qPowerMeter && b.powerMeterId !== qPowerMeter) return false;
      if (qWaterMeter && b.waterMeterId !== qWaterMeter) return false;
      return true;
    });
  }, [berths, qBerthNo, qName, qZone, qEnabled, qShore, qPowerMeter, qWaterMeter]);

  const resetFilters = () => {
    setQBerthNo("");
    setQName("");
    setQZone("");
    setQEnabled("");
    setQShore("");
    setQPowerMeter("");
    setQWaterMeter("");
  };

  // 新增
  const openAdd = () => {
    setForm({ ...emptyForm });
    setShowAdd(true);
  };
  const closeAdd = () => setShowAdd(false);

  const submitAdd = (e) => {
    e?.preventDefault?.();

    const berthNo = clampBerthNo(form.berthNo);
    if (berthNo == null) return Swal.fire("缺少資料", "請輸入船席編號（1～11）。", "warning");

    const name = form.name.trim() || `船席 ${berthNo}`;

    if (!form.shoreId || !form.powerMeterId || !form.waterMeterId)
      return Swal.fire("缺少資料", "請選擇岸電、電錶與水錶設備。", "warning");

    if (berths.some((x) => Number(x.berthNo) === berthNo))
      return Swal.fire("重複船席", `船席編號 ${berthNo} 已存在。`, "warning");

    const clashes = ensureUniqueBinding(berths, form);
    if (clashes.length) return Swal.fire("設備綁定衝突", clashes.join("<br/>"), "warning");

    const newItem = {
      id: Date.now(),
      berthNo,
      name,
      zone: (form.zone || "").trim(),
      standard: normStandard(form.standard),
      ratedCurrentA: Number(form.ratedCurrentA) || 16,
      enabled: !!form.enabled,
      shoreId: form.shoreId,
      powerMeterId: form.powerMeterId,
      waterMeterId: form.waterMeterId,
      note: (form.note || "").trim(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    setBerths((prev) => [newItem, ...prev]);
    setShowAdd(false);
    Swal.fire("已新增", `${newItem.name} 建立完成。`, "success");
  };

  // 檢視
  const openView = (row) => {
    setEditingId(row.id);
    setForm({
      berthNo: row.berthNo ?? "",
      name: row.name || "",
      zone: row.zone || "",
      standard: normStandard(row.standard),
      ratedCurrentA: row.ratedCurrentA ?? 16,
      enabled: !!row.enabled,
      shoreId: row.shoreId || "",
      powerMeterId: row.powerMeterId || "",
      waterMeterId: row.waterMeterId || "",
      note: row.note || "",
    });
    setShowView(true);
  };
  const closeView = () => setShowView(false);

  // 編輯
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      berthNo: row.berthNo ?? "",
      name: row.name || "",
      zone: row.zone || "",
      standard: normStandard(row.standard),
      ratedCurrentA: row.ratedCurrentA ?? 16,
      enabled: !!row.enabled,
      shoreId: row.shoreId || "",
      powerMeterId: row.powerMeterId || "",
      waterMeterId: row.waterMeterId || "",
      note: row.note || "",
    });
    setShowEdit(true);
  };
  const closeEdit = () => setShowEdit(false);

  const submitEdit = (e) => {
    e?.preventDefault?.();

    const berthNo = clampBerthNo(form.berthNo);
    if (berthNo == null) return Swal.fire("缺少資料", "請輸入船席編號（1～11）。", "warning");

    const name = form.name.trim() || `船席 ${berthNo}`;

    if (!form.shoreId || !form.powerMeterId || !form.waterMeterId)
      return Swal.fire("缺少資料", "請選擇岸電、電錶與水錶設備。", "warning");

    if (berths.some((x) => x.id !== editingId && Number(x.berthNo) === berthNo))
      return Swal.fire("重複船席", `船席編號 ${berthNo} 已存在。`, "warning");

    if (berths.some((x) => x.id !== editingId && x.name === name))
      return Swal.fire("重複名稱", "已有相同的船席名稱。", "warning");

    const clashes = ensureUniqueBinding(berths, form, editingId);
    if (clashes.length) return Swal.fire("設備綁定衝突", clashes.join("<br/>"), "warning");

    setBerths((prev) =>
      prev.map((b) =>
        b.id === editingId
          ? {
              ...b,
              berthNo,
              name,
              zone: (form.zone || "").trim(),
              standard: normStandard(form.standard),
              ratedCurrentA: Number(form.ratedCurrentA) || 16,
              enabled: !!form.enabled,
              shoreId: form.shoreId,
              powerMeterId: form.powerMeterId,
              waterMeterId: form.waterMeterId,
              note: (form.note || "").trim(),
              updatedAt: nowISO(),
            }
          : b
      )
    );
    setShowEdit(false);
    Swal.fire("已更新", "船席資料已儲存。", "success");
  };

  // 刪除
  const handleRemove = async (row) => {
    const ok = await Swal.fire({
      title: "刪除確認",
      text: `確定要刪除「${row.name}」嗎？`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
    }).then((r) => r.isConfirmed);
    if (!ok) return;
    setBerths((prev) => prev.filter((b) => b.id !== row.id));
    Swal.fire("已刪除", `${row.name} 已移除。`, "success");
  };

  // 啟用/停用
  const toggleEnabled = (row) => {
    setBerths((prev) =>
      prev.map((b) => (b.id === row.id ? { ...b, enabled: !b.enabled, updatedAt: nowISO() } : b))
    );
  };

  //  Modal: Add / Edit 共用表單區塊（放 return 上面）
  const FormFields = ({ mode }) => (
    <>
      <div className="row g-2">
        <div className="col-4">
          <label className="form-label">
            船席編號 <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            className="form-control"
            min={1}
            max={11}
            placeholder="1~11"
            value={form.berthNo}
            onChange={(e) => setForm((p) => ({ ...p, berthNo: e.target.value }))}
            required
          />
          <div className="form-text">固定 11 席，請填 1～11。</div>
        </div>

        <div className="col-8">
          <label className="form-label">船席名稱</label>
          <input
            className="form-control"
            placeholder="例：船席 7（可不填，會自動用船席編號）"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            maxLength={50}
          />
        </div>
      </div>

      <div className="row g-2 mt-1">
        <div className="col-6">
          <label className="form-label">區域（選填）</label>
          <input
            className="form-control"
            placeholder="例：A 區"
            value={form.zone}
            onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}
          />
        </div>

        <div className="col-3">
          <label className="form-label">規格</label>
          <select
            className="form-select"
            value={form.standard}
            onChange={(e) => setForm((p) => ({ ...p, standard: e.target.value }))}
          >
            <option value="EU">EU</option>
            <option value="US">US</option>
          </select>
        </div>

        <div className="col-3">
          <label className="form-label">額定電流(A)</label>
          <input
            type="number"
            className="form-control"
            min={1}
            max={200}
            value={form.ratedCurrentA}
            onChange={(e) => setForm((p) => ({ ...p, ratedCurrentA: e.target.value }))}
          />
        </div>
      </div>

      <div className="form-check form-switch mt-3">
        <input
          className="form-check-input"
          type="checkbox"
          id={`enabled-${mode}`}
          checked={!!form.enabled}
          onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
        />
        <label className="form-check-label" htmlFor={`enabled-${mode}`}>
          啟用此船席
        </label>
      </div>

      <hr className="my-3" />

      <div className="mb-3">
        <label className="form-label">
          指定的岸電設備 <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          value={form.shoreId}
          onChange={(e) => setForm((p) => ({ ...p, shoreId: e.target.value }))}
          required
        >
          <option value="">— 請選擇 —</option>
          {shoreDevices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">
          指定的電錶設備 <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          value={form.powerMeterId}
          onChange={(e) => setForm((p) => ({ ...p, powerMeterId: e.target.value }))}
          required
        >
          <option value="">— 請選擇 —</option>
          {powerMeters.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">
          指定的水錶設備 <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          value={form.waterMeterId}
          onChange={(e) => setForm((p) => ({ ...p, waterMeterId: e.target.value }))}
          required
        >
          <option value="">— 請選擇 —</option>
          {waterMeters.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-1">
        <label className="form-label">備註（選填）</label>
        <textarea
          className="form-control"
          rows={3}
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          placeholder="例：此席靠近入口、設備維修中..."
        />
      </div>
    </>
  );

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary d-flex align-items-center justify-content-between">
        <span>船席基本檔</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          新增船席
        </button>
      </h3>

      {/* 查詢列：清空按鈕放同一行右側 */}
      <div className="row g-3 align-items-end mb-3">
        <div className="col-md-2">
          <label className="form-label">船席編號</label>
          <input
            type="number"
            min={1}
            max={11}
            className="form-control"
            placeholder="輸入 1~11"
            value={qBerthNo}
            onChange={(e) => setQBerthNo(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">船席名稱</label>
          <input
            className="form-control"
            placeholder="輸入名稱關鍵字"
            value={qName}
            onChange={(e) => setQName(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">區域</label>
          <select className="form-select" value={qZone} onChange={(e) => setQZone(e.target.value)}>
            <option value="">全部</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <label className="form-label">啟用</label>
          <select className="form-select" value={qEnabled} onChange={(e) => setQEnabled(e.target.value)}>
            <option value="">全部</option>
            <option value="1">啟用</option>
            <option value="0">停用</option>
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">岸電設備</label>
          <select className="form-select" value={qShore} onChange={(e) => setQShore(e.target.value)}>
            <option value="">全部</option>
            {shoreDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">電錶 / 水錶</label>
          <div className="d-flex gap-2">
            <select className="form-select" value={qPowerMeter} onChange={(e) => setQPowerMeter(e.target.value)}>
              <option value="">電錶全部</option>
              {powerMeters.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select className="form-select" value={qWaterMeter} onChange={(e) => setQWaterMeter(e.target.value)}>
              <option value="">水錶全部</option>
              {waterMeters.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-md-8 d-flex justify-content-end">
          <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
            清空查詢
          </button>
        </div>
      </div>

      {/* 清單 */}
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr className="text-center">
              <th style={{ width: 110 }}>船席編號</th>
              <th style={{ width: 200 }}>船席</th>
              <th style={{ width: 120 }}>區域</th>
              <th style={{ width: 90 }}>啟用</th>
              <th style={{ width: 120 }}>規格</th>
              <th>岸電設備</th>
              <th>電錶設備</th>
              <th>水錶設備</th>
              <th style={{ width: 220 }}>操作</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-muted py-4">
                  — 無資料 —
                </td>
              </tr>
            ) : (
              filtered
                .slice()
                .sort((a, b) => Number(a.berthNo || 0) - Number(b.berthNo || 0))
                .map((row) => (
                  <tr key={row.id}>
                    <td className="text-center fw-bold">{row.berthNo ?? "-"}</td>

                    <td className="text-start">
                      <div className="fw-bold">{row.name}</div>
                      <div className="text-muted small">
                        更新：{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"}
                      </div>
                    </td>

                    <td className="text-center">{row.zone || "-"}</td>

                    <td className="text-center">
                      <span className={`badge ${row.enabled ? "bg-success" : "bg-secondary"}`}>
                        {row.enabled ? "啟用" : "停用"}
                      </span>
                    </td>

                    <td className="text-center">
                      <div className="fw-bold">{row.standard || "EU"}</div>
                      <div className="text-muted small">{row.ratedCurrentA || 16}A</div>
                    </td>

                    <td className="text-start">{deviceName(shoreDevices, row.shoreId)}</td>
                    <td className="text-start">{deviceName(powerMeters, row.powerMeterId)}</td>
                    <td className="text-start">{deviceName(waterMeters, row.waterMeterId)}</td>

                    <td className="text-nowrap text-center">
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openView(row)}>
                        檢視
                      </button>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(row)}>
                        編輯
                      </button>
                      <button
                        className={`btn btn-sm me-2 ${row.enabled ? "btn-outline-warning" : "btn-outline-success"}`}
                        onClick={() => toggleEnabled(row)}
                        title="停用可避免被即時/遠控使用"
                      >
                        {row.enabled ? "停用" : "啟用"}
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemove(row)}>
                        刪除
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/*  新增 Modal  */}
      {showAdd && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.4)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <form onSubmit={submitAdd}>
                <div className="modal-header">
                  <h5 className="modal-title">新增船席</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeAdd}></button>
                </div>
                <div className="modal-body">
                  <FormFields mode="add" />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeAdd}>
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    新增
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/*  編輯 Modal  */}
      {showEdit && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.4)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <form onSubmit={submitEdit}>
                <div className="modal-header">
                  <h5 className="modal-title">編輯船席</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeEdit}></button>
                </div>
                <div className="modal-body">
                  <FormFields mode="edit" />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeEdit}>
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    儲存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/*  檢視 Modal  */}
      {showView && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.4)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">船席檢視</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeView}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="text-muted small mb-1">船席編號</div>
                    <div className="fw-bold">{form.berthNo || "-"}</div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted small mb-1">船席名稱</div>
                    <div className="fw-bold">{form.name || "-"}</div>
                  </div>

                  <div className="col-md-3">
                    <div className="text-muted small mb-1">啟用</div>
                    <div className="fw-bold">{form.enabled ? "啟用" : "停用"}</div>
                  </div>

                  <div className="col-md-3">
                    <div className="text-muted small mb-1">區域</div>
                    <div className="fw-bold">{form.zone || "-"}</div>
                  </div>

                  <div className="col-md-3">
                    <div className="text-muted small mb-1">規格</div>
                    <div className="fw-bold">{normStandard(form.standard)}</div>
                  </div>

                  <div className="col-md-3">
                    <div className="text-muted small mb-1">額定電流</div>
                    <div className="fw-bold">{Number(form.ratedCurrentA) || 16}A</div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted small mb-1">岸電設備</div>
                    <div className="fw-bold">{deviceName(shoreDevices, form.shoreId)}</div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted small mb-1">電錶設備</div>
                    <div className="fw-bold">{deviceName(powerMeters, form.powerMeterId)}</div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-muted small mb-1">水錶設備</div>
                    <div className="fw-bold">{deviceName(waterMeters, form.waterMeterId)}</div>
                  </div>

                  <div className="col-12">
                    <div className="text-muted small mb-1">備註</div>
                    <div>{form.note || <span className="text-muted">—</span>}</div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeView}>
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-muted small mt-3">
        建議：主檔頁負責「固定 11 船席編號 / 設備綁定 / 規格 / 啟用停用」，即時數據與事件細節請到「即時監控 / 告警中心」。
      </div>
    </div>
  );
}
