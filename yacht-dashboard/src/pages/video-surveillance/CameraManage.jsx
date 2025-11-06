import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function CameraManage() {
  const [data, setData] = useState([
    { id: 1, name: "攝影機 A", location: "入口大門", status: "啟用" },
    { id: 2, name: "攝影機 B", location: "停車場", status: "停用" },
    { id: 3, name: "攝影機 C", location: "辦公區", status: "啟用" },
  ]);

  // ---- 查詢條件（單行、保留 label）----
  const [qSerial, setQSerial] = useState("");      // 序號（id）
  const [qName, setQName] = useState("");          // 名稱
  const [qLocation, setQLocation] = useState("");  // 安裝位置
  const [qStatus, setQStatus] = useState("all");   // 狀態：all / 啟用 / 停用

  // ---- 分頁 ----
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ---- 篩選 ----
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (qSerial.trim() && !String(item.id).includes(qSerial.trim())) return false;
      if (qName.trim() && !item.name.includes(qName.trim())) return false;
      if (qLocation.trim() && !item.location.includes(qLocation.trim())) return false;
      if (qStatus !== "all" && item.status !== qStatus) return false;
      return true;
    });
  }, [data, qSerial, qName, qLocation, qStatus]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pageData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setQSerial("");
    setQName("");
    setQLocation("");
    setQStatus("all");
    setPage(1);
  };

  // ---- 操作 ----
  const toggleStatus = (item) => {
    Swal.fire({
      title: "確定切換狀態？",
      text: `目前狀態為「${item.status}」`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "切換",
      cancelButtonText: "取消",
    }).then((res) => {
      if (res.isConfirmed) {
        setData((prev) =>
          prev.map((cam) =>
            cam.id === item.id
              ? { ...cam, status: cam.status === "啟用" ? "停用" : "啟用" }
              : cam
          )
        );
        Swal.fire("狀態已更新", "", "success");
      }
    });
  };

  const deleteCamera = (id) => {
    Swal.fire({
      title: "確定刪除？",
      text: "刪除後無法復原！",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
    }).then((res) => {
      if (res.isConfirmed) {
        setData((prev) => prev.filter((cam) => cam.id !== id));
        Swal.fire("刪除成功", "", "success");
      }
    });
  };

  const editCamera = (item) => {
    Swal.fire({
      title: "編輯攝影機",
      html: `
        <input id="name" class="swal2-input" placeholder="名稱" value="${item.name}">
        <input id="location" class="swal2-input" placeholder="位置" value="${item.location}">
      `,
      showCancelButton: true,
      confirmButtonText: "儲存",
      cancelButtonText: "取消",
      preConfirm: () => {
        const name = document.getElementById("name").value.trim();
        const location = document.getElementById("location").value.trim();
        if (!name || !location) {
          Swal.showValidationMessage("請輸入完整資料");
          return false;
        }
        return { name, location };
      },
    }).then((res) => {
      if (res.isConfirmed) {
        setData((prev) =>
          prev.map((cam) =>
            cam.id === item.id
              ? { ...cam, name: res.value.name, location: res.value.location }
              : cam
          )
        );
        Swal.fire("更新成功", "", "success");
      }
    });
  };

  const addCamera = () => {
    Swal.fire({
      title: "新增攝影機",
      html: `
        <input id="name" class="swal2-input" placeholder="名稱">
        <input id="location" class="swal2-input" placeholder="位置">
      `,
      showCancelButton: true,
      confirmButtonText: "新增",
      cancelButtonText: "取消",
      preConfirm: () => {
        const name = document.getElementById("name").value.trim();
        const location = document.getElementById("location").value.trim();
        if (!name || !location) {
          Swal.showValidationMessage("請輸入完整資料");
          return false;
        }
        return { name, location };
      },
    }).then((res) => {
      if (res.isConfirmed) {
        const newItem = {
          id: Date.now(),
          name: res.value.name,
          location: res.value.location,
          status: "啟用",
        };
        setData((prev) => [newItem, ...prev]);
        Swal.fire("新增成功", "", "success");
      }
    });
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary">攝影機管理</h3>

      {/* 單行查詢列（保留 label；可水平捲動） */}
      <div
        className="d-flex align-items-end gap-3 flex-nowrap overflow-auto pb-2"
        style={{ whiteSpace: "nowrap" }}
      >
        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 140 }}>
          <label htmlFor="serial" className="form-label mb-1">序號</label>
          <input
            id="serial"
            type="text"
            className="form-control"
            placeholder="例：1、10"
            value={qSerial}
            onChange={onFilterChange(setQSerial)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 220 }}>
          <label htmlFor="name" className="form-label mb-1">名稱</label>
          <input
            id="name"
            type="text"
            className="form-control"
            placeholder="例：攝影機 A"
            value={qName}
            onChange={onFilterChange(setQName)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 220 }}>
          <label htmlFor="loc" className="form-label mb-1">安裝位置</label>
          <input
            id="loc"
            type="text"
            className="form-control"
            placeholder="例：入口大門"
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
            <option value="啟用">啟用</option>
            <option value="停用">停用</option>
          </select>
        </div>

        <div className="flex-shrink-0" style={{ paddingBottom: 2 }}>
          <button className="btn btn-outline-secondary me-2" onClick={clearFilters}>
            清除條件
          </button>
          <button onClick={addCamera} className="btn btn-success">
            新增
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="table-responsive mt-2">
        <table className="table table-bordered text-center shadow-sm align-middle">
          <thead className="table-info sticky-top">
            <tr>
              <th style={{ width: 100 }}>序號</th>
              <th>名稱</th>
              <th>安裝位置</th>
              <th style={{ width: 120 }}>狀態</th>
              <th style={{ width: 220 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-muted">查無資料</td>
              </tr>
            ) : (
              pageData.map((cam, idx) => (
                <tr key={cam.id}>
                  <td>{(safePage - 1) * pageSize + idx + 1}</td>
                  <td className="text-start">{cam.name}</td>
                  <td className="text-start">{cam.location}</td>
                  <td>
                    {cam.status === "啟用" ? (
                      <span className="badge bg-success">
                        <i className="fas fa-check-circle me-1" /> 啟用
                      </span>
                    ) : (
                      <span className="badge bg-secondary">
                        <i className="fas fa-ban me-1" /> 停用
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      <button
                        onClick={() => toggleStatus(cam)}
                        className="btn btn-sm btn-primary"
                      >
                        切換狀態
                      </button>
                      <button
                        onClick={() => editCamera(cam)}
                        className="btn btn-sm btn-warning"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => deleteCamera(cam.id)}
                        className="btn btn-sm btn-danger"
                      >
                        刪除
                      </button>
                    </div>
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
