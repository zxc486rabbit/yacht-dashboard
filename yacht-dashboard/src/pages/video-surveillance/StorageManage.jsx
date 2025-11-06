// pages/power-water/BerthMaster.jsx
import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/* ===== Mock 設備清單（之後可換成 API）===== */
const SHORE = [
  { id: "SP-01", name: "岸電樁 A-01" },
  { id: "SP-02", name: "岸電樁 A-02" },
  { id: "SP-03", name: "岸電樁 B-01" },
];

const PM = [
  { id: "PM-11", name: "電錶 #11" },
  { id: "PM-12", name: "電錶 #12" },
  { id: "PM-13", name: "電錶 #13" },
];

const WM = [
  { id: "WM-21", name: "水錶 #21" },
  { id: "WM-22", name: "水錶 #22" },
  { id: "WM-23", name: "水錶 #23" },
];

const findName = (list, id) => list.find((x) => x.id === id)?.name || "-";

export default function BerthMaster() {
  // 兩筆假資料
  const [data, setData] = useState([
    { id: 1, name: "船席 1", shoreId: "SP-01", powerMeterId: "PM-11", waterMeterId: "WM-21" },
    { id: 2, name: "船席 2", shoreId: "SP-02", powerMeterId: "PM-12", waterMeterId: "WM-22" },
  ]);

  // ===== 查詢條件（單行、保留 label）=====
  const [qName, setQName] = useState("");         // 船席名稱
  const [qShore, setQShore] = useState("all");    // 岸電設備
  const [qPM, setQPM] = useState("all");          // 電錶設備
  const [qWM, setQWM] = useState("all");          // 水錶設備

  // ===== 分頁（保留結構；目前資料少）=====
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 篩選
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (qName.trim() && !item.name.includes(qName.trim())) return false;
      if (qShore !== "all" && item.shoreId !== qShore) return false;
      if (qPM !== "all" && item.powerMeterId !== qPM) return false;
      if (qWM !== "all" && item.waterMeterId !== qWM) return false;
      return true;
    });
  }, [data, qName, qShore, qPM, qWM]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pageData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setQName("");
    setQShore("all");
    setQPM("all");
    setQWM("all");
    setPage(1);
  };

  /* ========== 新增（彈出框）========== */
  const addBerth = () => {
    Swal.fire({
      title: "新增船席",
      html: `
        <div class="text-start">
          <label class="form-label">船席名稱 <span class="text-danger">*</span></label>
          <input id="bm-name" class="swal2-input" placeholder="例：船席 3" style="width:100%;">

          <label class="form-label mt-2">指定的岸電設備 <span class="text-danger">*</span></label>
          <select id="bm-shore" class="swal2-select" style="width:100%;">
            <option value="">— 請選擇 —</option>
            ${SHORE.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
          </select>

          <label class="form-label mt-2">指定的電錶設備 <span class="text-danger">*</span></label>
          <select id="bm-pm" class="swal2-select" style="width:100%;">
            <option value="">— 請選擇 —</option>
            ${PM.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
          </select>

          <label class="form-label mt-2">指定的水錶設備 <span class="text-danger">*</span></label>
          <select id="bm-wm" class="swal2-select" style="width:100%;">
            <option value="">— 請選擇 —</option>
            ${WM.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "新增",
      cancelButtonText: "取消",
      preConfirm: () => {
        const name = document.getElementById("bm-name").value.trim();
        const shoreId = document.getElementById("bm-shore").value;
        const powerMeterId = document.getElementById("bm-pm").value;
        const waterMeterId = document.getElementById("bm-wm").value;

        if (!name || !shoreId || !powerMeterId || !waterMeterId) {
          Swal.showValidationMessage("請填寫完整資料（名稱 / 岸電 / 電錶 / 水錶）。");
          return false;
        }
        return { name, shoreId, powerMeterId, waterMeterId };
      },
    }).then((res) => {
      if (!res.isConfirmed) return;

      // 名稱不可重複
      if (data.some((b) => b.name === res.value.name)) {
        Swal.fire("重複名稱", "已有相同的船席名稱。", "warning");
        return;
      }

      const newItem = {
        id: Date.now(),
        ...res.value,
      };
      setData((prev) => [newItem, ...prev]);
      Swal.fire("新增成功", `${newItem.name} 已建立。`, "success");
    });
  };

  /* ========== 單筆刪除（可選）========== */
  const removeBerth = (row) => {
    Swal.fire({
      title: "刪除確認",
      text: `確定刪除「${row.name}」？`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
    }).then((r) => {
      if (!r.isConfirmed) return;
      setData((prev) => prev.filter((x) => x.id !== row.id));
      Swal.fire("已刪除", "", "success");
    });
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary">船席基本檔</h3>

      {/* 單行查詢列（保留 label；可水平捲動） */}
      <div
        className="d-flex align-items-end gap-3 flex-nowrap overflow-auto pb-2"
        style={{ whiteSpace: "nowrap" }}
      >
        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 220 }}>
          <label className="form-label mb-1">船席名稱</label>
          <input
            type="text"
            className="form-control"
            placeholder="例：船席 1"
            value={qName}
            onChange={onFilterChange(setQName)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 240 }}>
          <label className="form-label mb-1">指定的岸電設備</label>
          <select
            className="form-select"
            value={qShore}
            onChange={onFilterChange(setQShore)}
          >
            <option value="all">全部</option>
            {SHORE.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 240 }}>
          <label className="form-label mb-1">指定的電錶設備</label>
          <select
            className="form-select"
            value={qPM}
            onChange={onFilterChange(setQPM)}
          >
            <option value="all">全部</option>
            {PM.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 240 }}>
          <label className="form-label mb-1">指定的水錶設備</label>
          <select
            className="form-select"
            value={qWM}
            onChange={onFilterChange(setQWM)}
          >
            <option value="all">全部</option>
            {WM.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-shrink-0" style={{ paddingBottom: 2 }}>
          <button className="btn btn-outline-secondary me-2" onClick={clearFilters}>
            清除條件
          </button>
          <button className="btn btn-success" onClick={addBerth}>
            新增
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="table-responsive">
        <table className="table table-bordered text-center shadow-sm align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: 70 }}>序號</th>
              <th>船席名稱</th>
              <th>指定的岸電設備</th>
              <th>指定的電錶設備</th>
              <th>指定的水錶設備</th>
              <th style={{ width: 140 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-muted">查無資料</td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr key={row.id}>
                  <td>{(safePage - 1) * pageSize + idx + 1}</td>
                  <td className="text-start">{row.name}</td>
                  <td className="text-start">{findName(SHORE, row.shoreId)}</td>
                  <td className="text-start">{findName(PM, row.powerMeterId)}</td>
                  <td className="text-start">{findName(WM, row.waterMeterId)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeBerth(row)}>
                      刪除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁（保留與範例一致） */}
      <div className="d-flex justify-content-center">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${safePage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                上一頁
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i} className={`page-item ${safePage === i + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${safePage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                下一頁
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
