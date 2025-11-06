import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RealtimeMonitor() {
  const [phaseData, setPhaseData] = useState({
    R: { voltage: 220, current: 1.0 },
    S: { voltage: 220, current: 1.0 },
    T: { voltage: 220, current: 1.0 },
  });

  const RATED_CURRENT_A = 16;
  const WATER_UNIT = "L";

  const [dockData, setDockData] = useState(
    Array.from({ length: 11 }, (_, i) => ({
      dockNumber: i + 1,
      powerOn: Math.random() > 0.3,
      frequency: 60,
      currentA: 0,
      loadPct: 0,
      waterUsedL: 0,
      isActive: false,
      powerKWh: 0,
    }))
  );

  // === 分頁設定 ===
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const totalPages = Math.ceil(dockData.length / PAGE_SIZE);
  const pageData = dockData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseData({
        R: {
          voltage: (210 + Math.random() * 20).toFixed(0),
          current: (Math.random() * 2 + 1).toFixed(2),
        },
        S: {
          voltage: (210 + Math.random() * 20).toFixed(0),
          current: (Math.random() * 2 + 1).toFixed(2),
        },
        T: {
          voltage: (210 + Math.random() * 20).toFixed(0),
          current: (Math.random() * 2 + 1).toFixed(2),
        },
      });

      setDockData((prev) =>
        prev.map((dock) => {
          const flip = Math.random();
          const powerOn = flip < 0.05 ? !dock.powerOn : dock.powerOn;
          const frequency = powerOn ? (59.8 + Math.random() * 0.4) : 0;
          const currentA = powerOn ? Number((Math.random() * 12).toFixed(2)) : 0;
          const loadPct = powerOn
            ? Math.min(100, Number(((currentA / RATED_CURRENT_A) * 100).toFixed(0)))
            : 0;

          const avgV =
            (Number(phaseData.R.voltage) +
              Number(phaseData.S.voltage) +
              Number(phaseData.T.voltage)) /
            3;
          const powerKW = powerOn ? (avgV * currentA) / 1000 : 0;
          const powerKWh = dock.powerKWh + powerKW * (5 / 3600);
          const waterIncrement = powerOn ? Math.random() * 1.5 : 0;
          const waterUsedL = Number((dock.waterUsedL + waterIncrement).toFixed(1));
          const isActive = powerOn && currentA > 0.3;

          return {
            ...dock,
            powerOn,
            frequency: Number(frequency.toFixed(2)),
            currentA,
            loadPct,
            waterUsedL,
            powerKWh: Number(powerKWh.toFixed(3)),
            isActive,
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [phaseData.R.voltage, phaseData.S.voltage, phaseData.T.voltage]);

  return (
    <div className="container mt-4">
      <h4 className="mb-4 text-primary">碼頭監控系統</h4>

      {/* R/S/T 相電錶 */}
      <div className="row text-center mb-4">
        {["R", "S", "T"].map((phase, i) => (
          <div key={phase} className="col-md-4 mb-3">
            <div
              className={`p-3 bg-white shadow rounded border-start border-4 ${
                ["border-danger", "border-warning", "border-primary"][i]
              }`}
            >
              <div className="text-muted fw-bold mb-1">{phase} 相</div>
              <div
                className={`fs-3 fw-bold ${
                  ["text-danger", "text-warning", "text-primary"][i]
                }`}
              >
                {phaseData[phase].voltage} V
              </div>
              <div className="text-muted small">
                電流：{phaseData[phase].current} A
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 船席清單（分頁顯示） */}
      <div className="row">
        {pageData.map((dock) => (
          <div key={dock.dockNumber} className="col-md-4 mb-4">
            <div
              className={`p-3 shadow-sm rounded border h-100 d-flex flex-column justify-content-between ${
                dock.isActive ? "bg-light" : "bg-secondary bg-opacity-25"
              }`}
              style={{ opacity: dock.powerOn ? 1 : 0.7 }}
            >
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className={`fw-bold ${dock.isActive ? "" : "text-muted"}`}>
                    船席 {dock.dockNumber}
                  </span>

                  <span
                    className={`badge ${
                      dock.powerOn ? "bg-success" : "bg-dark text-light"
                    }`}
                  >
                    供電 {dock.powerOn ? "ON" : "OFF"}
                  </span>
                </div>

                <div className="mb-2">
                  <span
                    className={`badge ${
                      dock.isActive ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    {dock.isActive ? "使用中" : "待機/無人使用"}
                  </span>
                </div>

                <div className="mt-2 small">
                  <div className="d-flex justify-content-between px-1 py-1">
                    <span>頻率</span>
                    <strong>{dock.powerOn ? `${dock.frequency} Hz` : "—"}</strong>
                  </div>
                  <div className="d-flex justify-content-between px-1 py-1">
                    <span>電流</span>
                    <strong>{dock.powerOn ? `${dock.currentA} A` : "—"}</strong>
                  </div>
                  <div className="d-flex justify-content-between px-1 py-1">
                    <span>負載比例</span>
                    <strong>{dock.powerOn ? `${dock.loadPct}%` : "—"}</strong>
                  </div>
                  <div className="d-flex justify-content-between px-1 py-1">
                    <span>用水量</span>
                    <strong>
                      {dock.powerOn ? `${dock.waterUsedL} ${WATER_UNIT}` : "—"}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between px-1 py-1">
                    <span>用電量</span>
                    <strong>{dock.powerOn ? `${dock.powerKWh} kWh` : "—"}</strong>
                  </div>
                </div>

                <div className="progress mt-2" style={{ height: 8 }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${dock.loadPct}%` }}
                    aria-valuenow={dock.loadPct}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* === 分頁按鈕 === */}
      <div className="d-flex justify-content-center align-items-center mt-3">
        <button
          className="btn btn-outline-primary btn-sm mx-2"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ◀ 上一頁
        </button>
        <span className="fw-bold text-secondary">
          第 {page} / {totalPages} 頁
        </span>
        <button
          className="btn btn-outline-primary btn-sm mx-2"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          下一頁 ▶
        </button>
      </div>

      <div className="text-muted small mt-2">
        負載比例以額定電流 {RATED_CURRENT_A}A 為基準。
      </div>
    </div>
  );
}
