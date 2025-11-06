import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/** 動態載入 hls.js（只在需要 HLS 時載入一次） */
let hlsLibPromise = null;
function loadHlsLib() {
  if (!hlsLibPromise) {
    hlsLibPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      s.async = true;
      s.onload = () => resolve(window.Hls);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return hlsLibPromise;
}

/** 單一播放器：支援 HLS / MP4 / MJPEG */
function StreamPlayer({ url, type = "auto" }) {
  const videoRef = useRef(null);

  const resolvedType = useMemo(() => {
    if (type !== "auto") return type;
    if (!url) return "none";
    const u = url.toLowerCase();
    if (u.endsWith(".m3u8")) return "hls";
    if (u.endsWith(".mp4")) return "mp4";
    if (u.includes("mjpeg") || u.endsWith(".mjpeg") || u.includes("mjpg")) return "mjpeg";
    return "mp4"; // 假設一般 http mp4
  }, [url, type]);

  useEffect(() => {
    let hls;
    const video = videoRef.current;

    if (resolvedType === "hls" && video) {
      const run = async () => {
        const Hls = await loadHlsLib();
        if (Hls.isSupported()) {
          hls = new Hls({ maxBufferLength: 10 });
          hls.loadSource(url);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari 原生
          video.src = url;
        }
      };
      run();
    } else if (resolvedType === "mp4" && video) {
      video.src = url || "";
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (video) {
        video.removeAttribute("src");
        if (resolvedType === "mp4" || resolvedType === "hls") {
          video.load?.();
        }
      }
    };
  }, [url, resolvedType]);

  if (!url) {
    return (
      <div className="d-flex justify-content-center align-items-center border rounded" style={{ height: 180 }}>
        <span className="text-muted">未設定串流</span>
      </div>
    );
  }

  if (resolvedType === "mjpeg") {
    return (
      <div className="ratio ratio-16x9 border rounded overflow-hidden">
        {/* MJPEG 以 <img> 直接持續拉流 */}
        <img src={url} alt="mjpeg" style={{ objectFit: "cover" }} />
      </div>
    );
  }

  if (resolvedType === "mp4" || resolvedType === "hls") {
    return (
      <div className="ratio ratio-16x9 border rounded overflow-hidden">
        <video ref={videoRef} controls autoPlay muted playsInline style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center border rounded" style={{ height: 180 }}>
      <span className="text-muted">不支援的格式</span>
    </div>
  );
}

/** 將「4 分割 / 6 分割 / 9 分割 / 單畫面」轉換成網格設定 */
function layoutToGrid(layout) {
  const key = String(layout).replace(/\s/g, "");
  if (key.includes("4分割")) return { cols: 2, rows: 2, cells: 4 };
  if (key.includes("6分割")) return { cols: 3, rows: 2, cells: 6 };
  if (key.includes("9分割")) return { cols: 3, rows: 3, cells: 9 };
  if (key.includes("單畫面")) return { cols: 1, rows: 1, cells: 1 };
  // 預設 4 分割
  return { cols: 2, rows: 2, cells: 4 };
}

/** 以 Bootstrap grid 產生分割牆 */
function PreviewWall({ item, onClose }) {
  const wallRef = useRef(null);
  const { cols, cells } = layoutToGrid(item.layout || "4 分割");

  // streams: 使用 item.streams 陣列（[{url,type}]）；不足的用空白卡填充
  const streams = Array.isArray(item.streams) ? item.streams.slice(0, cells) : [];
  while (streams.length < cells) streams.push({ url: "", type: "auto" });

  const goFullscreen = () => {
    const el = wallRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.6)" }}>
      <div className="modal-dialog modal-fullscreen">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              即時預覽：{item.name}（{item.layout}）
            </h5>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={goFullscreen}>
                全螢幕切換
              </button>
              <button className="btn btn-outline-dark btn-sm" onClick={onClose}>
                關閉
              </button>
            </div>
          </div>
          <div className="modal-body" ref={wallRef}>
            <div className="container-fluid">
              <div className="row g-3">
                {streams.map((s, idx) => (
                  <div key={idx} className={`col-12 col-sm-${12 / Math.min(cols, 4)} col-lg-${12 / cols}`}>
                    <StreamPlayer url={s.url} type={s.type || "auto"} />
                    <div className="small text-muted mt-1">
                      {s.url ? s.url : "未設定串流"} {s.type ? `（${s.type}）` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <span className="text-muted small">
              支援 HLS（.m3u8）、MP4、MJPEG；如需 WebRTC（WHIP/WHEP）可再擴充。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MonitorViewManage() {
  const [data, setData] = useState([
    {
      id: 1,
      name: "大廳監視",
      layout: "4 分割",
      status: "啟用",
      streams: [
        { url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "hls" },
        { url: "https://test-streams.mux.dev/bbb-abr/bbb.m3u8", type: "hls" },
        { url: "", type: "auto" },
        { url: "", type: "auto" },
      ],
    },
    {
      id: 2,
      name: "停車場",
      layout: "6 分割",
      status: "停用",
      streams: [],
    },
    {
      id: 3,
      name: "貨物區",
      layout: "單畫面",
      status: "啟用",
      streams: [{ url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "hls" }],
    },
  ]);

  // ===== 查詢（單行＋label）=====
  const [qName, setQName] = useState("");        // 名稱
  const [qStatus, setQStatus] = useState("all"); // 狀態：全部/啟用/停用

  // ===== 分頁 =====
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 預覽面板
  const [previewItem, setPreviewItem] = useState(null);

  const filteredData = useMemo(() => {
    return data.filter((v) => {
      if (qName.trim() && !v.name.includes(qName.trim())) return false;
      if (qStatus !== "all" && v.status !== qStatus) return false;
      return true;
    });
  }, [data, qName, qStatus]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pageData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  // ===== 操作：啟用/停用、刪除、編輯、預覽 =====
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
          prev.map((v) =>
            v.id === item.id ? { ...v, status: v.status === "啟用" ? "停用" : "啟用" } : v
          )
        );
        Swal.fire("狀態已更新", "", "success");
      }
    });
  };

  const deleteItem = (id) => {
    Swal.fire({
      title: "確定刪除？",
      text: "刪除後無法復原！",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
    }).then((res) => {
      if (res.isConfirmed) {
        setData((prev) => prev.filter((v) => v.id !== id));
        Swal.fire("刪除成功", "", "success");
      }
    });
  };

  const editItem = (item) => {
    // 將 streams 轉為多行輸入，每行一個 "url,type"
    const text = (item.streams || [])
      .map((s) => `${s.url}${s.type && s.type !== "auto" ? `,${s.type}` : ""}`)
      .join("\n");

    Swal.fire({
      title: "編輯監控畫面",
      html: `
        <input id="name" class="swal2-input" placeholder="名稱" value="${item.name}">
        <select id="layout" class="swal2-input">
          <option ${item.layout.includes("單") ? "selected" : ""}>單畫面</option>
          <option ${item.layout.includes("4") ? "selected" : ""}>4 分割</option>
          <option ${item.layout.includes("6") ? "selected" : ""}>6 分割</option>
          <option ${item.layout.includes("9") ? "selected" : ""}>9 分割</option>
        </select>
        <textarea id="streams" class="swal2-textarea" placeholder="每行一個串流：url[,type]\n例：\nhttps://.../index.m3u8,hls\nhttp://.../video.mp4,mp4\nhttp://.../mjpeg.cgi,mjpeg"
          rows="6">${text}</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "儲存",
      cancelButtonText: "取消",
      preConfirm: () => {
        const name = document.getElementById("name").value.trim();
        const layout = document.getElementById("layout").value.trim();
        const streamsRaw = document.getElementById("streams").value;
        if (!name || !layout) {
          Swal.showValidationMessage("請輸入完整資料");
          return false;
        }
        const streams = streamsRaw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => {
            const [url, type] = l.split(",").map((x) => x?.trim());
            return { url, type: type || "auto" };
          });
        return { name, layout, streams };
      },
    }).then((res) => {
      if (res.isConfirmed) {
        setData((prev) =>
          prev.map((v) =>
            v.id === item.id ? { ...v, ...res.value } : v
          )
        );
        Swal.fire("更新成功", "", "success");
      }
    });
  };

  const addItem = () => {
    Swal.fire({
      title: "新增監控畫面",
      html: `
        <input id="name" class="swal2-input" placeholder="名稱">
        <select id="layout" class="swal2-input">
          <option>單畫面</option>
          <option selected>4 分割</option>
          <option>6 分割</option>
          <option>9 分割</option>
        </select>
        <textarea id="streams" class="swal2-textarea" placeholder="每行一個串流：url[,type]" rows="6"></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: "新增",
      cancelButtonText: "取消",
      preConfirm: () => {
        const name = document.getElementById("name").value.trim();
        const layout = document.getElementById("layout").value.trim();
        const streamsRaw = document.getElementById("streams").value;
        if (!name || !layout) {
          Swal.showValidationMessage("請輸入完整資料");
          return false;
        }
        const streams = streamsRaw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => {
            const [url, type] = l.split(",").map((x) => x?.trim());
            return { url, type: type || "auto" };
          });
        return { name, layout, streams };
      },
    }).then((res) => {
      if (res.isConfirmed) {
        const newItem = {
          id: Date.now(),
          status: "啟用",
          ...res.value,
        };
        setData((prev) => [newItem, ...prev]);
        Swal.fire("新增成功", "", "success");
      }
    });
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary">監控畫面管理</h3>

      {/* 單行查詢列（保留 label；可水平捲動） */}
      <div className="d-flex align-items-end gap-3 flex-nowrap overflow-auto pb-2" style={{ whiteSpace: "nowrap" }}>
        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 240 }}>
          <label htmlFor="name" className="form-label mb-1">名稱</label>
          <input
            id="name"
            type="text"
            className="form-control"
            placeholder="例：大廳監視"
            value={qName}
            onChange={onFilterChange(setQName)}
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
          <button onClick={addItem} className="btn btn-success">新增</button>
        </div>
      </div>

      {/* 表格 */}
      <div className="table-responsive mt-2">
        <table className="table table-bordered text-center shadow-sm align-middle">
          <thead className="table-info sticky-top">
            <tr>
              <th style={{ width: 80 }}>#</th>
              <th>名稱</th>
              <th style={{ width: 140 }}>版型</th>
              <th style={{ width: 120 }}>狀態</th>
              <th style={{ width: 260 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-muted">查無資料</td>
              </tr>
            ) : (
              pageData.map((item, idx) => (
                <tr key={item.id}>
                  <td>{(safePage - 1) * pageSize + idx + 1}</td>
                  <td className="text-start">{item.name}</td>
                  <td>{item.layout}</td>
                  <td>
                    {item.status === "啟用" ? (
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
                    <div className="d-flex justify-content-center gap-2 flex-nowrap">
                      <button
                        className="btn btn-sm btn-outline-primary text-nowrap"
                        onClick={() =>
                          item.status === "啟用"
                            ? setPreviewItem(item)
                            : Swal.fire("不可預覽", "此視圖目前停用", "info")
                        }
                      >
                        立即觀看
                      </button>
                      <button className="btn btn-sm btn-primary text-nowrap" onClick={() => toggleStatus(item)}>
                        切換狀態
                      </button>
                      <button className="btn btn-sm btn-warning text-nowrap" onClick={() => editItem(item)}>
                        編輯
                      </button>
                      <button className="btn btn-sm btn-danger text-nowrap" onClick={() => deleteItem(item.id)}>
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

      {/* 即時預覽面板（Modal，使用 Bootstrap 樣式模擬） */}
      {previewItem && <PreviewWall item={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
}
