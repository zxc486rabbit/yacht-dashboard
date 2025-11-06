import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function DeviceAccessManage() {
  // ---- 假資料：新增 doorState（開啟/關閉）----
  const initialData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        deviceName: `門禁設備 ${i + 1}`,
        location: `區域 ${Math.ceil((i + 1) / 3)}`,
        // 類型不是查詢必要，但你若想顯示仍可保留在資料中
        type: i % 2 === 0 ? "刷卡機" : "閘門",
        status: i % 3 === 0 ? "故障" : "正常",
        doorState: i % 2 === 0 ? "關閉" : "開啟", // ⬅ 新增：匣門當前狀態
      })),
    []
  );

  const [data, setData] = useState(initialData);

  // ---- 查詢條件（單行、保留 label）----
  const [qName, setQName] = useState("");          // 設備名稱
  const [qLocation, setQLocation] = useState("");  // 所在區域
  const [qStatus, setQStatus] = useState("all");   // 狀態：all / 正常 / 故障
  const [qDoor, setQDoor] = useState("all");       // 匣門：all / 開啟 / 關閉

  // ---- 分頁 ----
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ---- 篩選 ----
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (qName.trim() && !item.deviceName.includes(qName.trim())) return false;
      if (qLocation.trim() && !item.location.includes(qLocation.trim())) return false;
      if (qStatus !== "all" && item.status !== qStatus) return false;
      if (qDoor !== "all" && item.doorState !== qDoor) return false;
      return true;
    });
  }, [data, qName, qLocation, qStatus, qDoor]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pageData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setQName("");
    setQLocation("");
    setQStatus("all");
    setQDoor("all");
    setPage(1);
  };

  // ---- 操作：開啟 / 關閉 匣門 ----
  const openGate = (id) => {
    const device = data.find((x) => x.id === id);
    if (!device) return;

    if (device.status === "故障") {
      Swal.fire("無法操作", "設備故障，請先排除故障再操作匣門。", "warning");
      return;
    }
    if (device.doorState === "開啟") {
      Swal.fire("目前已開啟", "匣門已是開啟狀態。", "info");
      return;
    }

    Swal.fire({
      title: `確認開啟「${device.deviceName}」的匣門？`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "開啟",
      cancelButtonText: "取消",
    }).then((res) => {
      if (res.isConfirmed) {
        setData((prev) =>
          prev.map((x) => (x.id === id ? { ...x, doorState: "開啟" } : x))
        );
        Swal.fire("已開啟", "", "success");
      }
    });
  };

  const closeGate = (id) => {
    const device = data.find((x) => x.id === id);
    if (!device) return;

    if (device.status === "故障") {
      Swal.fire("無法操作", "設備故障，請先排除故障再操作匣門。", "warning");
      return;
    }
    if (device.doorState === "關閉") {
      Swal.fire("目前已關閉", "匣門已是關閉狀態。", "info");
      return;
    }

    Swal.fire({
      title: `確認關閉「${device.deviceName}」的匣門？`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "關閉",
      cancelButtonText: "取消",
    }).then((res) => {
      if (res.isConfirmed) {
        setData((prev) =>
          prev.map((x) => (x.id === id ? { ...x, doorState: "關閉" } : x))
        );
        Swal.fire("已關閉", "", "success");
      }
    });
  };

  // ---- UI：按鈕可用性 ----
  const getActionStates = (item) => {
    const isFault = item.status === "故障";
    const canOpen = !isFault && item.doorState === "關閉";
    const canClose = !isFault && item.doorState === "開啟";
    return { isFault, canOpen, canClose };
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary">門匣設備管理</h3>

      {/* 單行查詢列（保留 label；可水平捲動） */}
      <div
        className="d-flex align-items-end gap-3 flex-nowrap overflow-auto pb-2"
        style={{ whiteSpace: "nowrap" }}
      >
        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 240 }}>
          <label htmlFor="name" className="form-label mb-1">設備名稱</label>
          <input
            id="name"
            type="text"
            className="form-control"
            placeholder="例：門禁設備 1"
            value={qName}
            onChange={onFilterChange(setQName)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 220 }}>
          <label htmlFor="loc" className="form-label mb-1">所在區域</label>
          <input
            id="loc"
            type="text"
            className="form-control"
            placeholder="例：區域 2"
            value={qLocation}
            onChange={onFilterChange(setQLocation)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 160 }}>
          <label htmlFor="status" className="form-label mb-1">狀態</label>
          <select
            id="status"
            className="form-select"
            value={qStatus}
            onChange={onFilterChange(setQStatus)}
          >
            <option value="all">全部</option>
            <option value="正常">正常</option>
            <option value="故障">故障</option>
          </select>
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 160 }}>
          <label htmlFor="door" className="form-label mb-1">匣門狀態</label>
          <select
            id="door"
            className="form-select"
            value={qDoor}
            onChange={onFilterChange(setQDoor)}
          >
            <option value="all">全部</option>
            <option value="開啟">開啟</option>
            <option value="關閉">關閉</option>
          </select>
        </div>

        <div className="flex-shrink-0" style={{ paddingBottom: 2 }}>
          <button className="btn btn-outline-secondary" onClick={clearFilters}>
            清除條件
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="table-responsive mt-2">
        <table className="table table-bordered text-center shadow-sm align-middle">
          <thead className="table-info sticky-top">
            <tr>
              <th style={{ width: 80 }}>序號</th>
              <th>設備名稱</th>
              <th>所在區域</th>
              <th style={{ width: 120 }}>狀態</th>
              <th style={{ width: 120 }}>匣門狀態</th>
              <th style={{ width: 220 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-muted">查無資料</td>
              </tr>
            ) : (
              pageData.map((item, idx) => {
                const { isFault, canOpen, canClose } = getActionStates(item);
                return (
                  <tr key={item.id}>
                    <td>{(safePage - 1) * pageSize + idx + 1}</td>
                    <td className="text-start">{item.deviceName}</td>
                    <td>{item.location}</td>
                    <td>
                      {item.status === "正常" ? (
                        <span className="badge bg-success">
                          <i className="fas fa-check-circle me-1" /> 正常
                        </span>
                      ) : (
                        <span className="badge bg-danger">
                          <i className="fas fa-exclamation-triangle me-1" /> 故障
                        </span>
                      )}
                    </td>
                    <td>
                      {item.doorState === "開啟" ? (
                        <span className="badge bg-primary">
                          <i className="fas fa-door-open me-1" /> 開啟
                        </span>
                      ) : (
                        <span className="badge bg-secondary">
                          <i className="fas fa-door-closed me-1" /> 關閉
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => openGate(item.id)}
                          disabled={!canOpen}
                          title={
                            isFault
                              ? "設備故障，無法操作"
                              : item.doorState === "開啟"
                              ? "已開啟"
                              : "開啟匣門"
                          }
                        >
                          開啟匣門
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => closeGate(item.id)}
                          disabled={!canClose}
                          title={
                            isFault
                              ? "設備故障，無法操作"
                              : item.doorState === "關閉"
                              ? "已關閉"
                              : "關閉匣門"
                          }
                        >
                          關閉匣門
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

      {/* 分頁 */}
      <div className="d-flex justify-content-center">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${safePage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
              className={`page-item ${safePage === totalPages ? "disabled" : ""}`}
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
