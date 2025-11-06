import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function AlarmEvents() {
  // ---- 假資料（可接 API 後替換）----
  const initialData = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        timestamp: `2024-07-1${(i % 9) + 1} 12:${(i * 3) % 60}:00`, // "YYYY-MM-DD HH:mm:ss"
        device: `設備 ${Math.ceil((i + 1) / 3)}`,
        description: `異常事件 ${i + 1}`,
        status: i % 2 === 0 ? "未處理" : "已處理",
      })),
    []
  );

  // ---- 查詢條件 ----
  const [qKeyword, setQKeyword] = useState("");   // 關鍵字（設備 / 事件描述）
  const [qStatus, setQStatus] = useState("all");  // 狀態：all / 未處理 / 已處理
  const [qFrom, setQFrom] = useState("");         // 起（datetime-local）
  const [qTo, setQTo] = useState("");             // 迄（datetime-local）

  // ---- 分頁 ----
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ---- 工具：把 "YYYY-MM-DD HH:mm:ss" 轉成 Date ----
  function parseDateTime(str) {
    if (!str) return null;
    const s = str.replace(" ", "T"); // 允許 "YYYY-MM-DD HH:mm:ss"
    const hasSec = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s);
    const normalized = hasSec ? s : `${s}:00`;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }

  // ---- 篩選 ----
  const filteredData = useMemo(() => {
    const kw = qKeyword.trim();
    const from = qFrom ? new Date(qFrom) : null;
    const to = qTo ? new Date(qTo) : null;

    return initialData.filter((item) => {
      // 關鍵字（設備/描述）
      if (kw) {
        const hit = item.device.includes(kw) || item.description.includes(kw);
        if (!hit) return false;
      }
      // 狀態
      if (qStatus !== "all" && item.status !== qStatus) return false;

      // 時間
      const t = parseDateTime(item.timestamp);
      if (from && t && t < from) return false;
      if (to && t && t > to) return false;

      return true;
    });
  }, [initialData, qKeyword, qStatus, qFrom, qTo]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const safePage = Math.min(page || 1, totalPages || 1);
  const pageData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ---- 任一查詢條件變更 => 回到第 1 頁 ----
  const onFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setQKeyword("");
    setQStatus("all");
    setQFrom("");
    setQTo("");
    setPage(1);
  };

  // ---- 操作：標記單筆已處理 ----
  const [data, setData] = useState(initialData);
  const markAsProcessed = (id) => {
    Swal.fire({
      title: "確認處理此事件？",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "確認",
      cancelButtonText: "取消",
    }).then((result) => {
      if (result.isConfirmed) {
        setData((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: "已處理" } : x))
        );
        Swal.fire("狀態已更新", "", "success");
      }
    });
  };

  // ---- 批次：將「目前篩選結果」全部標記為已處理 ----
  const markFilteredAsProcessed = () => {
    if (filteredData.length === 0) {
      Swal.fire("目前沒有可處理的事件", "", "info");
      return;
    }
    Swal.fire({
      title: `將目前篩選的 ${filteredData.length} 筆全部標記為已處理？`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "確認",
      cancelButtonText: "取消",
    }).then((res) => {
      if (res.isConfirmed) {
        setData((prev) =>
          prev.map((x) =>
            // 只有在「篩選結果」且尚未處理的才更新
            filteredData.some((f) => f.id === x.id) && x.status !== "已處理"
              ? { ...x, status: "已處理" }
              : x
          )
        );
        Swal.fire("已批次更新", "", "success");
      }
    });
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary">異常警示事件</h3>

      {/* 單行查詢列：保留 label；可水平捲動 */}
      <div
        className="d-flex align-items-end gap-3 flex-nowrap overflow-auto pb-2"
        style={{ whiteSpace: "nowrap" }}
      >
        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 280 }}>
          <label htmlFor="kw" className="form-label mb-1">關鍵字（設備 / 事件描述）</label>
          <input
            id="kw"
            type="text"
            className="form-control"
            placeholder="例：設備 2、異常事件 5"
            value={qKeyword}
            onChange={onFilterChange(setQKeyword)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 180 }}>
          <label htmlFor="status" className="form-label mb-1">狀態</label>
          <select
            id="status"
            className="form-select"
            value={qStatus}
            onChange={onFilterChange(setQStatus)}
          >
            <option value="all">全部</option>
            <option value="未處理">未處理</option>
            <option value="已處理">已處理</option>
          </select>
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 220 }}>
          <label htmlFor="from" className="form-label mb-1">時間（起）</label>
          <input
            id="from"
            type="datetime-local"
            className="form-control"
            value={qFrom}
            onChange={onFilterChange(setQFrom)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 220 }}>
          <label htmlFor="to" className="form-label mb-1">時間（迄）</label>
          <input
            id="to"
            type="datetime-local"
            className="form-control"
            value={qTo}
            onChange={onFilterChange(setQTo)}
          />
        </div>

        <div className="flex-shrink-0" style={{ paddingBottom: 2 }}>
          <button className="btn btn-outline-secondary me-2" onClick={clearFilters}>
            清除條件
          </button>
          <button className="btn btn-outline-primary" onClick={markFilteredAsProcessed}>
            批次標記已處理
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="table-responsive mt-2">
        <table className="table table-bordered text-center shadow-sm align-middle">
          <thead className="table-info sticky-top">
            <tr>
              <th style={{ width: 80 }}>序號</th>
              <th style={{ minWidth: 180 }}>時間</th>
              <th style={{ minWidth: 140 }}>設備</th>
              <th>事件描述</th>
              <th style={{ width: 120 }}>狀態</th>
              <th style={{ width: 140 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-muted">查無資料</td>
              </tr>
            ) : (
              pageData.map((item, idx) => (
                <tr key={item.id}>
                  <td>{(safePage - 1) * pageSize + idx + 1}</td>
                  <td>{item.timestamp}</td>
                  <td>{item.device}</td>
                  <td className="text-start">{item.description}</td>
                  <td>
                    {item.status === "未處理" ? (
                      <span className="badge bg-danger">
                        <i className="fas fa-exclamation-circle me-1" /> 未處理
                      </span>
                    ) : (
                      <span className="badge bg-success">
                        <i className="fas fa-check-circle me-1" /> 已處理
                      </span>
                    )}
                  </td>
                  <td>
                    {item.status === "未處理" ? (
                      <button
                        onClick={() => markAsProcessed(item.id)}
                        className="btn btn-sm btn-primary"
                      >
                        標記已處理
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      <div className="d-flex justify-content-center">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${safePage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一頁
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li
                key={i}
                className={`page-item ${safePage === i + 1 ? "active" : ""}`}
              >
                <button className="page-link" onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${
                safePage === totalPages || totalPages === 0 ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                下一頁
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
