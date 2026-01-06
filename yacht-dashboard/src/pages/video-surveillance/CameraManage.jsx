import { useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "../../styles/CameraManage.css"; // ✅ 路徑若不同，依你的資料夾層級調整

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pct(n) {
  return `${Number(n).toFixed(2)}%`;
}

/** 攝影機 marker：可拖曳 + 顯示視角方向 */
function CameraMarker({ cam, isActive, onPick, onMove, onRotate, onClickMarker }) {
  const draggingRef = useRef(false);
  const startRef = useRef({ px: 0, py: 0, x: 0, y: 0 });

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    startRef.current = { px: e.clientX, py: e.clientY, x: cam.x ?? 50, y: cam.y ?? 50 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const mapEl = e.currentTarget.closest(".cm-map"); // ✅ 找到地圖容器（比 parentElement 更穩）
    if (!mapEl) return;

    const rect = mapEl.getBoundingClientRect();
    const dx = e.clientX - startRef.current.px;
    const dy = e.clientY - startRef.current.py;

    const nextX = clamp(startRef.current.x + (dx / rect.width) * 100, 0, 100);
    const nextY = clamp(startRef.current.y + (dy / rect.height) * 100, 0, 100);
    onMove?.(cam.id, nextX, nextY);
  };

  const handlePointerUp = (e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const statusCls = cam.status === "啟用" ? "cm-ok" : "cm-off";

  return (
    <div
      className={`cm-marker ${statusCls} ${isActive ? "cm-active" : ""}`}
      style={{ left: pct(cam.x ?? 50), top: pct(cam.y ?? 50) }}
      title={`${cam.name}｜${cam.location}｜${cam.status}`}
      onClick={(e) => {
        e.stopPropagation();
        onClickMarker?.(cam);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onPick?.(cam.id);
      }}
    >
      {/* 視角扇形（可跟著 angle 旋轉） */}
      <div
        className="cm-fov"
        style={{ transform: `translate(-50%, -50%) rotate(${cam.angle || 0}deg)` }}
      />

      {/* 主體（可拖曳） */}
      <div
        className="cm-body"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="cm-head">
          <div className="cm-lens" />
          <div className="cm-led" />
        </div>
        <div className="cm-neck" />
        <div className="cm-base" />
      </div>

      {/* 小標籤 */}
      <div className="cm-label">
        <div className="cm-title">{cam.name}</div>
        <div className="cm-sub">{cam.location}</div>
      </div>

      {/* 旋轉控制（小圓點） */}
      <button
        type="button"
        className="cm-rotate"
        title="旋轉視角（每次 +15°）"
        onClick={(e) => {
          e.stopPropagation();
          onRotate?.(cam.id, ((cam.angle || 0) + 15) % 360);
        }}
      />
    </div>
  );
}

export default function CameraManage() {
  // ✅ 預設加上 x/y/angle：地圖定位用（百分比座標）
  const [data, setData] = useState([
    { id: 1, name: "攝影機 A", location: "入口大門", status: "啟用", x: 22, y: 28, angle: 35 },
    { id: 2, name: "攝影機 B", location: "停車場", status: "停用", x: 55, y: 46, angle: 120 },
    { id: 3, name: "攝影機 C", location: "辦公區", status: "啟用", x: 72, y: 62, angle: 300 },
  ]);

  // ---- 查詢條件 ----
  const [qSerial, setQSerial] = useState("");
  const [qName, setQName] = useState("");
  const [qLocation, setQLocation] = useState("");
  const [qStatus, setQStatus] = useState("all"); // all / 啟用 / 停用

  // ---- 分頁 ----
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ---- 地圖互動 ----
  const mapRef = useRef(null);
  const [placingId, setPlacingId] = useState(null); // 正在「點地圖放置」的 camId
  const [activeId, setActiveId] = useState(null); // 被選中的攝影機

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

  // ---- 地圖：點擊放置 ----
  const onMapClick = (e) => {
    if (!placingId) return;
    const el = mapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);

    setData((prev) => prev.map((c) => (c.id === placingId ? { ...c, x, y } : c)));
    setPlacingId(null);

    Swal.fire({
      icon: "success",
      title: "定位完成",
      text: `已更新座標：x=${x.toFixed(2)}%, y=${y.toFixed(2)}%`,
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const moveCam = (id, x, y) => {
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const rotateCam = (id, angle) => {
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, angle } : c)));
  };

  // ---- 操作（你原本的）----
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
        if (activeId === id) setActiveId(null);
        if (placingId === id) setPlacingId(null);
        Swal.fire("刪除成功", "", "success");
      }
    });
  };

  const editCamera = (item) => {
    Swal.fire({
      title: "編輯攝影機",
      html: `
        <input id="swal_name" class="swal2-input" placeholder="名稱" value="${item.name}">
        <input id="swal_location" class="swal2-input" placeholder="位置" value="${item.location}">
      `,
      showCancelButton: true,
      confirmButtonText: "儲存",
      cancelButtonText: "取消",
      preConfirm: () => {
        const name = document.getElementById("swal_name")?.value?.trim();
        const location = document.getElementById("swal_location")?.value?.trim();
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
            cam.id === item.id ? { ...cam, name: res.value.name, location: res.value.location } : cam
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
        <input id="swal_name_add" class="swal2-input" placeholder="名稱">
        <input id="swal_location_add" class="swal2-input" placeholder="位置">
      `,
      showCancelButton: true,
      confirmButtonText: "新增",
      cancelButtonText: "取消",
      preConfirm: () => {
        const name = document.getElementById("swal_name_add")?.value?.trim();
        const location = document.getElementById("swal_location_add")?.value?.trim();
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
          x: 50,
          y: 50,
          angle: 0,
        };
        setData((prev) => [newItem, ...prev]);
        Swal.fire("新增成功", "", "success");
      }
    });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <h3 className="mb-0 text-primary">攝影機管理</h3>
        <div className="text-muted small">
          地圖操作：按「定位」→ 點一下地圖放置；或直接拖曳攝影機本體移動；點右上小圓點旋轉視角
        </div>
      </div>

      {/* 單行查詢列 */}
      <div className="d-flex align-items-end gap-3 flex-nowrap overflow-auto pb-2" style={{ whiteSpace: "nowrap" }}>
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

      {/* 兩欄：左表格 / 右地圖 */}
      <div className="row g-3 mt-1">
        {/* 左：表格 */}
        <div className="col-12 col-xl-6">
          <div className="table-responsive">
            <table className="table table-bordered text-center shadow-sm align-middle">
              <thead className="table-info sticky-top">
                <tr>
                  <th style={{ width: 100 }}>序號</th>
                  <th>名稱</th>
                  <th>安裝位置</th>
                  <th style={{ width: 120 }}>狀態</th>
                  <th style={{ width: 300 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-muted">查無資料</td>
                  </tr>
                ) : (
                  pageData.map((cam, idx) => (
                    <tr key={cam.id} className={activeId === cam.id ? "table-warning" : ""}>
                      <td>{(safePage - 1) * pageSize + idx + 1}</td>
                      <td className="text-start">{cam.name}</td>
                      <td className="text-start">{cam.location}</td>
                      <td>
                        {cam.status === "啟用" ? (
                          <span className="badge bg-success">啟用</span>
                        ) : (
                          <span className="badge bg-secondary">停用</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          <button onClick={() => toggleStatus(cam)} className="btn btn-sm btn-primary">切換狀態</button>
                          <button onClick={() => editCamera(cam)} className="btn btn-sm btn-warning">編輯</button>
                          <button onClick={() => deleteCamera(cam.id)} className="btn btn-sm btn-danger">刪除</button>

                          <button
                            onClick={() => {
                              setActiveId(cam.id);
                              setPlacingId(cam.id);
                              Swal.fire({
                                icon: "info",
                                title: "請點地圖放置位置",
                                text: "現在點一下右側地圖，就會把此攝影機放到那個位置（也可直接拖曳圖示）",
                                timer: 1400,
                                showConfirmButton: false,
                              });
                            }}
                            className={`btn btn-sm ${placingId === cam.id ? "btn-dark" : "btn-outline-dark"}`}
                          >
                            定位
                          </button>

                          <button
                            onClick={() => {
                              setActiveId(cam.id);
                              const txt = `x=${(cam.x ?? 0).toFixed(2)}%, y=${(cam.y ?? 0).toFixed(2)}%, angle=${cam.angle ?? 0}°`;
                              navigator.clipboard?.writeText(txt);
                              Swal.fire("座標已複製", txt, "success");
                            }}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            複製座標
                          </button>
                        </div>

                        <div className="small text-muted mt-1">
                          x:{(cam.x ?? 0).toFixed(1)}% / y:{(cam.y ?? 0).toFixed(1)}% / angle:{cam.angle ?? 0}°
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

        {/* 右：地圖 */}
        <div className="col-12 col-xl-6">
          <div className="cm-panel">
            <div className="cm-panel__head">
              <div className="fw-semibold">地圖預覽</div>
              <div className="d-flex align-items-center gap-2">
                {placingId ? (
                  <span className="badge text-bg-dark">定位模式：點地圖放置中</span>
                ) : (
                  <span className="badge text-bg-secondary">一般模式</span>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setPlacingId(null)}
                  disabled={!placingId}
                >
                  取消定位
                </button>
              </div>
            </div>

            <div
              ref={mapRef}
              className={`cm-map ${placingId ? "cm-map--placing" : ""}`}
              onClick={onMapClick}
              role="button"
              tabIndex={0}
            >
              {data.map((cam) => (
                <CameraMarker
                  key={cam.id}
                  cam={cam}
                  isActive={activeId === cam.id}
                  onPick={(id) => setPlacingId(id)}
                  onMove={moveCam}
                  onRotate={rotateCam}
                  onClickMarker={(c) => setActiveId(c.id)}
                />
              ))}
            </div>

            <div className="cm-panel__foot">
              <div className="text-muted small">
                小技巧：雙擊攝影機可進入「定位模式」；拖曳攝影機本體可微調；右上小圓點旋轉視角
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
