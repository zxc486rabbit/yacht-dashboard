// src/pages/admin/BerthBasic.jsx
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "../../styles/dashboard/Dashboard.css";
import "../../styles/admin/admin.settings.css";

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
    // ignore
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

function Field({ label, hint, children }) {
  return (
    <div className="as-field">
      <label>{label}</label>
      {children}
      {hint ? <div className="as-hint">{hint}</div> : null}
    </div>
  );
}

export default function BerthBasic() {
  const [berths, setBerths] = useState(seedIfEmpty);

  // 查詢條件
  const [qBerthNo, setQBerthNo] = useState("");
  const [qName, setQName] = useState("");
  const [qZone, setQZone] = useState("");
  const [qEnabled, setQEnabled] = useState("");
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
      // ignore
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

    if (!form.shoreId || !form.powerMeterId || !form.waterMeterId) {
      return Swal.fire("缺少資料", "請選擇岸電、電錶與水錶設備。", "warning");
    }

    if (berths.some((x) => Number(x.berthNo) === berthNo)) {
      return Swal.fire("重複船席", `船席編號 ${berthNo} 已存在。`, "warning");
    }

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
    Swal.fire("已新增", "船席資料已建立。", "success");
  };

  // 檢視
  const openView = (row) => {
    setForm({
      berthNo: row.berthNo ?? "",
      name: row.name ?? "",
      zone: row.zone ?? "",
      standard: normStandard(row.standard),
      ratedCurrentA: row.ratedCurrentA ?? 16,
      enabled: !!row.enabled,
      shoreId: row.shoreId ?? "",
      powerMeterId: row.powerMeterId ?? "",
      waterMeterId: row.waterMeterId ?? "",
      note: row.note ?? "",
    });
    setShowView(true);
  };
  const closeView = () => setShowView(false);

  // 編輯
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      berthNo: row.berthNo ?? "",
      name: row.name ?? "",
      zone: row.zone ?? "",
      standard: normStandard(row.standard),
      ratedCurrentA: row.ratedCurrentA ?? 16,
      enabled: !!row.enabled,
      shoreId: row.shoreId ?? "",
      powerMeterId: row.powerMeterId ?? "",
      waterMeterId: row.waterMeterId ?? "",
      note: row.note ?? "",
    });
    setShowEdit(true);
  };
  const closeEdit = () => setShowEdit(false);

  const submitEdit = (e) => {
    e?.preventDefault?.();

    const berthNo = clampBerthNo(form.berthNo);
    if (berthNo == null) return Swal.fire("缺少資料", "請輸入船席編號（1～11）。", "warning");

    const name = form.name.trim() || `船席 ${berthNo}`;

    if (!form.shoreId || !form.powerMeterId || !form.waterMeterId) {
      return Swal.fire("缺少資料", "請選擇岸電、電錶與水錶設備。", "warning");
    }

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
    setBerths((prev) => prev.map((b) => (b.id === row.id ? { ...b, enabled: !b.enabled, updatedAt: nowISO() } : b)));
  };

  const FormFields = ({ mode }) => (
    <div className="as-form" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
      <Field label={<>船席編號 <span style={{ color: "#ef4444" }}>*</span></>} hint="固定 11 席，請填 1～11。">
        <input
          type="number"
          min={1}
          max={11}
          placeholder="1~11"
          value={form.berthNo}
          onChange={(e) => setForm((p) => ({ ...p, berthNo: e.target.value }))}
          required
        />
      </Field>

      <Field label="船席名稱" hint="可不填，會自動用船席編號。">
        <input
          placeholder="例：船席 7"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          maxLength={50}
        />
      </Field>

      <Field label="區域（選填）">
        <input value={form.zone} onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))} placeholder="例：A 區" />
      </Field>

      <Field label="規格">
        <select value={form.standard} onChange={(e) => setForm((p) => ({ ...p, standard: e.target.value }))}>
          <option value="EU">EU</option>
          <option value="US">US</option>
        </select>
      </Field>

      <Field label="額定電流(A)">
        <input
          type="number"
          min={1}
          max={200}
          value={form.ratedCurrentA}
          onChange={(e) => setForm((p) => ({ ...p, ratedCurrentA: e.target.value }))}
        />
      </Field>

      <Field label="啟用此船席">
        <input
          type="checkbox"
          id={`enabled-${mode}`}
          checked={!!form.enabled}
          onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
        />
      </Field>

      <div style={{ gridColumn: "1 / -1", height: 1, background: "rgba(229,231,235,.9)" }} />

      <Field label={<>指定的岸電設備 <span style={{ color: "#ef4444" }}>*</span></>}>
        <select value={form.shoreId} onChange={(e) => setForm((p) => ({ ...p, shoreId: e.target.value }))} required>
          <option value="">— 請選擇 —</option>
          {shoreDevices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={<>指定的電錶設備 <span style={{ color: "#ef4444" }}>*</span></>}>
        <select value={form.powerMeterId} onChange={(e) => setForm((p) => ({ ...p, powerMeterId: e.target.value }))} required>
          <option value="">— 請選擇 —</option>
          {powerMeters.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={<>指定的水錶設備 <span style={{ color: "#ef4444" }}>*</span></>}>
        <select value={form.waterMeterId} onChange={(e) => setForm((p) => ({ ...p, waterMeterId: e.target.value }))} required>
          <option value="">— 請選擇 —</option>
          {waterMeters.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="備註（選填）">
        <textarea
          rows={3}
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          placeholder="例：此席靠近入口、設備維修中..."
          style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,.95)" }}
        />
      </Field>
    </div>
  );

  return (
    <div className="as-page">
      <div className="as-header">
        <div className="as-titleWrap">
          <h2 className="as-title">船席基本檔</h2>
        </div>

        <div className="as-topActions">
          <button className="as-btn primary" onClick={openAdd}>
            新增船席
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="as-card" style={{ marginBottom: 14 }}>
        <div className="as-cardHead">
          <div>
            <div className="as-cardTitle">查詢條件</div>
            <div className="as-cardSubtitle">支援船席編號、名稱、區域、啟用狀態與設備綁定篩選。</div>
          </div>

          <div className="as-rowActions">
            <button className="as-btn ghost" onClick={resetFilters}>
              清空查詢
            </button>
          </div>
        </div>

        <div className="as-form" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <Field label="船席編號">
            <input type="number" min={1} max={11} placeholder="輸入 1~11" value={qBerthNo} onChange={(e) => setQBerthNo(e.target.value)} />
          </Field>

          <Field label="船席名稱">
            <input placeholder="輸入名稱關鍵字" value={qName} onChange={(e) => setQName(e.target.value)} />
          </Field>

          <Field label="區域">
            <select value={qZone} onChange={(e) => setQZone(e.target.value)}>
              <option value="">全部</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>

          <Field label="啟用">
            <select value={qEnabled} onChange={(e) => setQEnabled(e.target.value)}>
              <option value="">全部</option>
              <option value="1">啟用</option>
              <option value="0">停用</option>
            </select>
          </Field>

          <Field label="岸電設備">
            <select value={qShore} onChange={(e) => setQShore(e.target.value)}>
              <option value="">全部</option>
              {shoreDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="電錶設備">
            <select value={qPowerMeter} onChange={(e) => setQPowerMeter(e.target.value)}>
              <option value="">全部</option>
              {powerMeters.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="水錶設備">
            <select value={qWaterMeter} onChange={(e) => setQWaterMeter(e.target.value)}>
              <option value="">全部</option>
              {waterMeters.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* List */}
      <div className="as-card">
        <div className="as-cardHead">
          <div>
            <div className="as-cardTitle">船席清單</div>
            <div className="as-cardSubtitle">操作包含：檢視 / 編輯 / 啟用停用 / 刪除。</div>
          </div>
        </div>

        <div className="as-tableWrap">
          <table className="as-table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>船席編號</th>
                <th style={{ width: 240 }}>船席</th>
                <th style={{ width: 120 }}>區域</th>
                <th style={{ width: 90 }}>啟用</th>
                <th style={{ width: 120 }}>規格</th>
                <th>岸電設備</th>
                <th>電錶設備</th>
                <th>水錶設備</th>
                <th style={{ width: 320 }}>操作</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: 18, color: "var(--muted)" }}>
                    — 無資料 —
                  </td>
                </tr>
              ) : (
                filtered
                  .slice()
                  .sort((a, b) => Number(a.berthNo || 0) - Number(b.berthNo || 0))
                  .map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 800 }}>{row.berthNo ?? "-"}</td>

                      <td>
                        <div style={{ fontWeight: 800 }}>{row.name}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>
                          更新：{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"}
                        </div>
                      </td>

                      <td>{row.zone || "-"}</td>
                      <td>{row.enabled ? "啟用" : "停用"}</td>

                      <td>
                        <div style={{ fontWeight: 800 }}>{row.standard || "EU"}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{row.ratedCurrentA || 16}A</div>
                      </td>

                      <td>{deviceName(shoreDevices, row.shoreId)}</td>
                      <td>{deviceName(powerMeters, row.powerMeterId)}</td>
                      <td>{deviceName(waterMeters, row.waterMeterId)}</td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="as-btn ghost" onClick={() => openView(row)}>
                          檢視
                        </button>{" "}
                        <button className="as-btn" onClick={() => openEdit(row)}>
                          編輯
                        </button>{" "}
                        <button
                          className={`as-btn ${row.enabled ? "" : "primary"}`}
                          onClick={() => toggleEnabled(row)}
                          title="停用可避免被即時/遠控使用"
                        >
                          {row.enabled ? "停用" : "啟用"}
                        </button>{" "}
                        <button className="as-btn danger" onClick={() => handleRemove(row)}>
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="as-modal">
          <div className="as-modalCard">
            <div className="as-modalHead">
              <h3>新增船席</h3>
              <button className="x" onClick={closeAdd} aria-label="close">×</button>
            </div>

            <form onSubmit={submitAdd}>
              <div style={{ padding: "12px 6px 6px 6px" }}>
                <FormFields mode="add" />
              </div>

              <div className="as-modalActions">
                <button type="button" className="as-btn ghost" onClick={closeAdd}>
                  取消
                </button>
                <button type="submit" className="as-btn primary">
                  新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="as-modal">
          <div className="as-modalCard">
            <div className="as-modalHead">
              <h3>編輯船席</h3>
              <button className="x" onClick={closeEdit} aria-label="close">×</button>
            </div>

            <form onSubmit={submitEdit}>
              <div style={{ padding: "12px 6px 6px 6px" }}>
                <FormFields mode="edit" />
              </div>

              <div className="as-modalActions">
                <button type="button" className="as-btn ghost" onClick={closeEdit}>
                  取消
                </button>
                <button type="submit" className="as-btn primary">
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && (
        <div className="as-modal">
          <div className="as-modalCard">
            <div className="as-modalHead">
              <h3>船席檢視</h3>
              <button className="x" onClick={closeView} aria-label="close">×</button>
            </div>

            <div style={{ padding: "12px 6px 6px 6px" }}>
              <div className="as-form" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <Field label="船席編號"><input value={form.berthNo || "-"} readOnly /></Field>
                <Field label="船席名稱"><input value={form.name || "-"} readOnly /></Field>
                <Field label="啟用"><input value={form.enabled ? "啟用" : "停用"} readOnly /></Field>
                <Field label="區域"><input value={form.zone || "-"} readOnly /></Field>
                <Field label="規格"><input value={normStandard(form.standard)} readOnly /></Field>
                <Field label="額定電流"><input value={`${Number(form.ratedCurrentA) || 16}A`} readOnly /></Field>
                <Field label="岸電設備"><input value={deviceName(shoreDevices, form.shoreId)} readOnly /></Field>
                <Field label="電錶設備"><input value={deviceName(powerMeters, form.powerMeterId)} readOnly /></Field>
                <Field label="水錶設備"><input value={deviceName(waterMeters, form.waterMeterId)} readOnly /></Field>
                <Field label="備註"><input value={form.note || "-"} readOnly /></Field>
              </div>
            </div>

            <div className="as-modalActions">
              <button className="as-btn ghost" onClick={closeView}>
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
