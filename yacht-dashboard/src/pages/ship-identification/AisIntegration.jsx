import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaShip, FaAnchor, FaExternalLinkAlt } from "react-icons/fa";

// 解決 marker 圖示不顯示問題
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function AisIntegrationWithMap() {
  // 你給的 MarineTraffic 視角
  const MT_URL =
    "https://www.marinetraffic.com/en/ais/home/centerx:120.715/centery:22.092/zoom:17";

  // Leaflet 對應中心（MarineTraffic: centerx=lng, centery=lat）
  const DEFAULT_CENTER = [22.092, 120.715];
  const DEFAULT_ZOOM = 17;

  const initialShips = useMemo(
    () =>
      Array.from({ length: 23 }, (_, i) => ({
        id: i + 1,
        name: `船舶 ${i + 1}`,
        mmsi: `41234${1000 + i}`,
        lat: 22.05 + Math.random() * 0.1, // 改成靠近你指定位置附近（示意）
        lng: 120.68 + Math.random() * 0.1,
        speed: (Math.random() * 20).toFixed(1) + " kn",
        status: Math.random() > 0.5 ? "航行中" : "停泊中",
      })),
    []
  );

  const [ships, setShips] = useState(initialShips);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 右側地圖模式：leaflet / marinetraffic
  const [mapMode, setMapMode] = useState("leaflet");

  // MarineTraffic iframe 狀態（偵測被擋時顯示提示）
  const [mtLoaded, setMtLoaded] = useState(false);
  const [mtMaybeBlocked, setMtMaybeBlocked] = useState(false);

  useEffect(() => {
    if (mapMode !== "marinetraffic") return;

    setMtLoaded(false);
    setMtMaybeBlocked(false);

    // 有些情況 iframe 會 onLoad 但內容空白；用 timeout 做「疑似被擋」提示
    const t = setTimeout(() => {
      if (!mtLoaded) setMtMaybeBlocked(true);
    }, 2500);

    return () => clearTimeout(t);
  }, [mapMode, mtLoaded]);

  const filteredShips = ships.filter((ship) => {
    const q = search.trim();
    if (!q) return true;
    return ship.name.includes(q) || ship.mmsi.includes(q);
  });

  const totalPages = Math.ceil(filteredShips.length / pageSize);
  const pageShips = filteredShips.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0 text-primary">AIS 整合模組</h3>

        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-sm ${mapMode === "leaflet" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setMapMode("leaflet")}
          >
            內建地圖（Leaflet）
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mapMode === "marinetraffic" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setMapMode("marinetraffic")}
          >
            MarineTraffic 預覽
          </button>
        </div>
      </div>

      <div className="row">
        {/* 表格區塊 */}
        <div className="col-md-6 mb-3">
          <input
            type="text"
            placeholder="搜尋船名或 MMSI"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-control mb-3"
          />

          <table className="table table-bordered text-center shadow-sm">
            <thead className="table-info">
              <tr>
                <th>#</th>
                <th>船名</th>
                <th>MMSI</th>
                <th>速度</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              {pageShips.length === 0 ? (
                <tr>
                  <td colSpan="5">查無資料</td>
                </tr>
              ) : (
                pageShips.map((ship) => (
                  <tr key={ship.id}>
                    <td>{ship.id}</td>
                    <td>{ship.name}</td>
                    <td>{ship.mmsi}</td>
                    <td>{ship.speed}</td>
                    <td>
                      {ship.status === "航行中" ? (
                        <span className="badge bg-success">
                          <FaShip className="me-1" />
                          航行中
                        </span>
                      ) : (
                        <span className="badge bg-secondary">
                          <FaAnchor className="me-1" />
                          停泊中
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 分頁控制 */}
          <div className="d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  上一頁
                </button>
              </li>

              {Array.from({ length: totalPages || 1 }, (_, i) => (
                <li
                  key={i}
                  className={`page-item ${page === i + 1 ? "active" : ""} ${totalPages === 0 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => totalPages > 0 && setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${
                  page === totalPages || totalPages === 0 ? "disabled" : ""
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
          </div>
        </div>

        {/* 地圖區塊 */}
        <div className="col-md-6">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="text-muted small">
              目前模式：{mapMode === "leaflet" ? "內建地圖" : "MarineTraffic 預覽"}
            </div>

            <a
              className="btn btn-sm btn-outline-secondary"
              href={MT_URL}
              target="_blank"
              rel="noreferrer"
              title="開新視窗查看 MarineTraffic"
            >
              <FaExternalLinkAlt className="me-1" />
              開新視窗
            </a>
          </div>

          {mapMode === "leaflet" ? (
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom={true}
              style={{ height: "500px", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {ships.map((ship) => (
                <Marker key={ship.id} position={[ship.lat, ship.lng]}>
                  <Popup>
                    <strong>{ship.name}</strong>
                    <br />
                    MMSI: {ship.mmsi}
                    <br />
                    狀態: {ship.status}
                    <br />
                    速度: {ship.speed}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div style={{ position: "relative", height: 500, width: "100%" }}>
              <iframe
                title="MarineTraffic"
                src={MT_URL}
                style={{
                  height: "500px",
                  width: "100%",
                  border: 0,
                  borderRadius: 8,
                  background: "#f6f7f9",
                }}
                loading="lazy"
                // 有些站會用 CSP / X-Frame-Options 擋 iframe；sandbox 不一定救得回來，但可降低安全風險
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMtLoaded(true)}
              />

              {(mtMaybeBlocked || !mtLoaded) && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    className="alert alert-warning shadow-sm"
                    style={{ maxWidth: 520, pointerEvents: "auto" }}
                  >
                    <div className="fw-bold mb-1">MarineTraffic 可能禁止被 iframe 內嵌</div>
                    <div className="small text-muted mb-2">
                      若此區塊一直空白，通常是對方網站用安全標頭（X-Frame-Options/CSP）阻擋跨站嵌入。
                      你仍可用「內建地圖」正常預覽，或點右上角「開新視窗」查看 MarineTraffic。
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => setMapMode("leaflet")}
                      >
                        切回內建地圖
                      </button>
                      <a
                        className="btn btn-sm btn-outline-secondary"
                        href={MT_URL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        開新視窗
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
