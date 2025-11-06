// pages/power-water/BerthMaster.jsx
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

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

// 初次沒有資料時種入兩筆假資料
const seedIfEmpty = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw && JSON.parse(raw)?.length) return JSON.parse(raw);
  } catch {}
  const demo = [
    {
      id: 1001,
      name: "船席 1",
      shoreId: "SP-01",
      powerMeterId: "PM-11",
      waterMeterId: "WM-21",
      createdAt: new Date().toISOString(),
    },
    {
      id: 1002,
      name: "船席 2",
      shoreId: "SP-02",
      powerMeterId: "PM-12",
      waterMeterId: "WM-22",
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(LS_KEY, JSON.stringify(demo));
  return demo;
};

export default function BerthMaster() {
  // 清單
  const [berths, setBerths] = useState(seedIfEmpty);

  // 個別查詢條件
  const [qName, setQName] = useState("");
  const [qShore, setQShore] = useState("");         // device id
  const [qPowerMeter, setQPowerMeter] = useState(""); // device id
  const [qWaterMeter, setQWaterMeter] = useState(""); // device id

  // 新增 Modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shoreId: "",
    powerMeterId: "",
    waterMeterId: "",
  });

  // 同步儲存
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(berths));
    } catch {}
  }, [berths]);

  // 依條件篩選
  const filtered = useMemo(() => {
    return berths.filter((b) => {
      if (qName && !b.name.includes(qName.trim())) return false;
      if (qShore && b.shoreId !== qShore) return false;
      if (qPowerMeter && b.powerMeterId !== qPowerMeter) return false;
      if (qWaterMeter && b.waterMeterId !== qWaterMeter) return false;
      return true;
    });
  }, [berths, qName, qShore, qPowerMeter, qWaterMeter]);

  const resetFilters = () => {
    setQName("");
    setQShore("");
    setQPowerMeter("");
    setQWaterMeter("");
  };

  // 新增
  const openAdd = () => {
    setForm({ name: "", shoreId: "", powerMeterId: "", waterMeterId: "" });
    setShowAdd(true);
  };
  const closeAdd = () => setShowAdd(false);

  const submitAdd = (e) => {
    e?.preventDefault?.();

    const name = form.name.trim();
    if (!name) return Swal.fire("缺少資料", "請輸入船席名稱。", "warning");
    if (!form.shoreId || !form.powerMeterId || !form.waterMeterId)
      return Swal.fire("缺少資料", "請選擇岸電、電錶與水錶設備。", "warning");

    if (berths.some((x) => x.name === name))
      return Swal.fire("重複名稱", "已有相同的船席名稱。", "warning");

    const newItem = {
      id: Date.now(),
      name,
      shoreId: form.shoreId,
      powerMeterId: form.powerMeterId,
      waterMeterId: form.waterMeterId,
      createdAt: new Date().toISOString(),
    };

    setBerths((prev) => [newItem, ...prev]);
    setShowAdd(false);
    Swal.fire("已新增", `${newItem.name} 建立完成。`, "success");
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

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary d-flex align-items-center justify-content-between">
        <span>船席基本檔</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          新增船席
        </button>
      </h3>

      {/* 個別查詢列 */}
      <div className="row g-3 align-items-end mb-3">
        <div className="col-md-3">
          <label className="form-label">船席名稱</label>
          <input
            className="form-control"
            placeholder="輸入名稱關鍵字"
            value={qName}
            onChange={(e) => setQName(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">岸電設備</label>
          <select
            className="form-select"
            value={qShore}
            onChange={(e) => setQShore(e.target.value)}
          >
            <option value="">全部</option>
            {shoreDevices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">電錶設備</label>
          <select
            className="form-select"
            value={qPowerMeter}
            onChange={(e) => setQPowerMeter(e.target.value)}
          >
            <option value="">全部</option>
            {powerMeters.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">水錶設備</label>
          <select
            className="form-select"
            value={qWaterMeter}
            onChange={(e) => setQWaterMeter(e.target.value)}
          >
            <option value="">全部</option>
            {waterMeters.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="col-12">
          <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
            清空查詢
          </button>
        </div>
      </div>

      {/* 清單 */}
      <table className="table table-bordered text-center align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: "18%" }}>船席名稱</th>
            <th>岸電設備</th>
            <th>電錶設備</th>
            <th>水錶設備</th>
            <th style={{ width: "14%" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="5">— 無資料 —</td></tr>
          ) : (
            filtered.map((row) => (
              <tr key={row.id}>
                <td className="text-start">{row.name}</td>
                <td className="text-start">{deviceName(shoreDevices, row.shoreId)}</td>
                <td className="text-start">{deviceName(powerMeters, row.powerMeterId)}</td>
                <td className="text-start">{deviceName(waterMeters, row.waterMeterId)}</td>
                <td className="text-nowrap">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemove(row)}
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 新增 Modal（純 Bootstrap，不需額外套件） */}
      {showAdd && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.4)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <form onSubmit={submitAdd}>
                <div className="modal-header">
                  <h5 className="modal-title">新增船席</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeAdd}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">船席名稱 <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      placeholder="例：船席 3"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      maxLength={50}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">指定的岸電設備 <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={form.shoreId}
                      onChange={(e) => setForm((p) => ({ ...p, shoreId: e.target.value }))}
                      required
                    >
                      <option value="">— 請選擇 —</option>
                      {shoreDevices.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">指定的電錶設備 <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={form.powerMeterId}
                      onChange={(e) => setForm((p) => ({ ...p, powerMeterId: e.target.value }))}
                      required
                    >
                      <option value="">— 請選擇 —</option>
                      {powerMeters.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-1">
                    <label className="form-label">指定的水錶設備 <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={form.waterMeterId}
                      onChange={(e) => setForm((p) => ({ ...p, waterMeterId: e.target.value }))}
                      required
                    >
                      <option value="">— 請選擇 —</option>
                      {waterMeters.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
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
    </div>
  );
}
