import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./RealtimeMonitor.css";

const RATED_CURRENT_A = 16;
const WATER_UNIT = "L";

const RULES = {
  voltageLow: 205,
  voltageHigh: 235,
  freqLow: 59.5,
  freqHigh: 60.5,
  overloadPct: 95,
  tripChanceWhenOverload: 0.15,
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function fmt(n, digits = 2) {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return x.toFixed(digits);
}

function badgeClassByStatus(status) {
  switch (status) {
    case "ALARM":
      return "bg-danger";
    case "WARN":
      return "bg-warning text-dark";
    case "OK":
      return "bg-success";
    case "OFF":
    default:
      return "bg-dark";
  }
}

function cardBorderByStatus(status) {
  switch (status) {
    case "ALARM":
      return "border-danger";
    case "WARN":
      return "border-warning";
    case "OK":
      return "border-success";
    case "OFF":
    default:
      return "border-secondary";
  }
}

// 狀態燈（依你需求：綠 OK / 黃 WARN / 紅 ALARM / 灰 OFF）
function lampClassByStatus(status) {
  switch (status) {
    case "OK":
      return "rm-lamp ok";
    case "WARN":
      return "rm-lamp warn";
    case "ALARM":
      return "rm-lamp alarm";
    case "OFF":
    default:
      return "rm-lamp off";
  }
}

// 純 SVG sparkline
function Sparkline({ data = [], height = 28, strokeWidth = 2 }) {
  const w = 120;
  const h = height;

  const clean = (Array.isArray(data) ? data : []).filter(
    (v) => typeof v === "number" && !Number.isNaN(v)
  );
  if (clean.length < 2) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <text x="0" y={h - 8} fontSize="10" fill="#94a3b8">
          —
        </text>
      </svg>
    );
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;

  const pts = clean.map((v, i) => {
    const x = (i / (clean.length - 1)) * (w - 2) + 1;
    const y = h - 2 - ((v - min) / span) * (h - 4);
    return [x, y];
  });

  const d = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="rm-spark">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export default function RealtimeMonitor() {
  const [phaseData, setPhaseData] = useState({
    R: { voltage: 220, current: 1.0 },
    S: { voltage: 220, current: 1.0 },
    T: { voltage: 220, current: 1.0 },
  });

  const [dockData, setDockData] = useState(
    Array.from({ length: 11 }, (_, i) => ({
      dockNumber: i + 1,
      powerOn: Math.random() > 0.3,
      frequency: 60,
      currentA: 0,
      loadPct: 0,
      powerKW: 0,
      powerKWh: 0,
      waterUsedL: 0,
      isActive: false,
      alarms: [],
      status: "OK",
      tripped: false,
      updatedAt: Date.now(),
      history: { kw: [], a: [], hz: [] },
    }))
  );

  const [viewMode, setViewMode] = useState("cards");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showOnlyAlarm, setShowOnlyAlarm] = useState(false);

  const [selectedDockNo, setSelectedDockNo] = useState(null);

  const avgVoltage = useMemo(() => {
    const v =
      (Number(phaseData.R.voltage) +
        Number(phaseData.S.voltage) +
        Number(phaseData.T.voltage)) /
      3;
    return Number(v.toFixed(0));
  }, [phaseData.R.voltage, phaseData.S.voltage, phaseData.T.voltage]);

  const kpi = useMemo(() => {
    const total = dockData.length;
    const on = dockData.filter((d) => d.powerOn).length;
    const active = dockData.filter((d) => d.isActive).length;
    const alarm = dockData.filter((d) => d.status === "ALARM").length;
    const warn = dockData.filter((d) => d.status === "WARN").length;
    const sumKwh = dockData.reduce((s, d) => s + (d.powerKWh || 0), 0);
    const sumWater = dockData.reduce((s, d) => s + (d.waterUsedL || 0), 0);
    return {
      total,
      on,
      active,
      alarm,
      warn,
      sumKwh: Number(sumKwh.toFixed(2)),
      sumWater: Number(sumWater.toFixed(1)),
    };
  }, [dockData]);

  const filteredDockData = useMemo(() => {
    return dockData.filter((d) => {
      if (showOnlyActive && !d.isActive) return false;
      if (showOnlyAlarm && d.status !== "ALARM") return false;
      return true;
    });
  }, [dockData, showOnlyActive, showOnlyAlarm]);

  const selectedDock = useMemo(() => {
    if (selectedDockNo == null) return null;
    return dockData.find((d) => d.dockNumber === selectedDockNo) || null;
  }, [dockData, selectedDockNo]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextPhase = {
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
      };
      setPhaseData(nextPhase);

      const vAvg =
        (Number(nextPhase.R.voltage) +
          Number(nextPhase.S.voltage) +
          Number(nextPhase.T.voltage)) /
        3;

      const HISTORY_MAX = 18;

      setDockData((prev) =>
        prev.map((dock) => {
          const canPowerOn = !dock.tripped;

          const flip = Math.random();
          const powerOn = canPowerOn
            ? flip < 0.04
              ? !dock.powerOn
              : dock.powerOn
            : false;

          if (!powerOn) {
            const alarms = dock.tripped ? ["TRIP 跳脫（需復歸）"] : [];
            return {
              ...dock,
              powerOn: false,
              frequency: 0,
              currentA: 0,
              loadPct: 0,
              powerKW: 0,
              isActive: false,
              alarms,
              status: dock.tripped ? "ALARM" : "OFF",
              updatedAt: Date.now(),
              history: {
                kw: dock.history.kw.slice(-HISTORY_MAX),
                a: dock.history.a.slice(-HISTORY_MAX),
                hz: dock.history.hz.slice(-HISTORY_MAX),
              },
            };
          }

          const frequency = 59.7 + Math.random() * 0.8;
          const currentA = Number((Math.random() * 14).toFixed(2));
          const loadPct = clamp(
            Math.round((currentA / RATED_CURRENT_A) * 100),
            0,
            100
          );

          const powerKW = Number(((vAvg * currentA) / 1000).toFixed(2));
          const powerKWh = Number(
            (dock.powerKWh + powerKW * (5 / 3600)).toFixed(3)
          );

          const waterIncrement =
            currentA > 0.8 ? Math.random() * 1.2 : Math.random() * 0.2;
          const waterUsedL = Number((dock.waterUsedL + waterIncrement).toFixed(1));
          const isActive = currentA > 0.6;

          const alarms = [];
          if (vAvg < RULES.voltageLow) alarms.push(`低壓 ${Math.round(vAvg)}V`);
          if (vAvg > RULES.voltageHigh) alarms.push(`高壓 ${Math.round(vAvg)}V`);
          if (frequency < RULES.freqLow) alarms.push(`頻率偏低 ${fmt(frequency, 2)}Hz`);
          if (frequency > RULES.freqHigh) alarms.push(`頻率偏高 ${fmt(frequency, 2)}Hz`);
          if (loadPct >= RULES.overloadPct) alarms.push(`接近過載 ${loadPct}%`);

          const willTrip =
            loadPct >= RULES.overloadPct &&
            Math.random() < RULES.tripChanceWhenOverload;

          const nextHistory = {
            kw: [...dock.history.kw, powerKW].slice(-HISTORY_MAX),
            a: [...dock.history.a, currentA].slice(-HISTORY_MAX),
            hz: [...dock.history.hz, Number(frequency.toFixed(2))].slice(-HISTORY_MAX),
          };

          if (willTrip) {
            return {
              ...dock,
              powerOn: false,
              frequency: 0,
              currentA: 0,
              loadPct: 0,
              powerKW: 0,
              powerKWh,
              waterUsedL,
              isActive: false,
              tripped: true,
              alarms: ["TRIP 跳脫（需復歸）", ...alarms],
              status: "ALARM",
              updatedAt: Date.now(),
              history: nextHistory,
            };
          }

          const status =
            alarms.some((a) => a.includes("低壓")) || alarms.some((a) => a.includes("高壓"))
              ? "ALARM"
              : alarms.length > 0
                ? "WARN"
                : "OK";

          return {
            ...dock,
            powerOn: true,
            frequency: Number(frequency.toFixed(2)),
            currentA,
            loadPct,
            powerKW,
            powerKWh,
            waterUsedL,
            isActive,
            alarms,
            status,
            tripped: false,
            updatedAt: Date.now(),
            history: nextHistory,
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rm-page">
      {/* Header */}
      <div className="rm-header">
        <div>
          <div className="rm-title">即時監控</div>
          <div className="rm-subtitle">11 船席｜即時監看｜點船席展開詳細內容</div>
        </div>

        <div className="rm-actions">
          <div className="btn-group" role="group" aria-label="view">
            <button
              className={`btn btn-sm ${viewMode === "cards" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setViewMode("cards")}
            >
              卡片
            </button>
            <button
              className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setViewMode("table")}
            >
              表格
            </button>
          </div>

          <div className="form-check form-switch ms-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="onlyActive"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="onlyActive">
              只看使用中
            </label>
          </div>

          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="onlyAlarm"
              checked={showOnlyAlarm}
              onChange={(e) => setShowOnlyAlarm(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="onlyAlarm">
              只看異常
            </label>
          </div>

          <Link to="/alarm-center" className="btn btn-sm btn-outline-danger">
            告警中心
          </Link>
        </div>
      </div>

      {/* KPI + 相電錶（同列等高） */}
      <div className="row g-3 align-items-start mb-3">
        {/* 左：KPI 大卡（包四個 KPI） */}
        <div className="col-12 col-lg-8">
          <div className="rm-panel h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="fw-bold">總覽</div>
              <div className="rm-muted small">即時更新</div>
            </div>

            <div className="row g-3 align-items-stretch">
              <div className="col-6 col-md-3">
                <div className="rm-kpi h-100">
                  <div className="rm-kpi-label">供電中</div>
                  <div className="rm-kpi-value">{kpi.on} / {kpi.total}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="rm-kpi h-100">
                  <div className="rm-kpi-label">使用中</div>
                  <div className="rm-kpi-value">{kpi.active}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="rm-kpi h-100">
                  <div className="rm-kpi-label">異常 / 警告</div>
                  <div className="rm-kpi-value">
                    <span className="rm-danger">{kpi.alarm}</span>
                    <span className="rm-muted"> / </span>
                    <span className="rm-warn">{kpi.warn}</span>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="rm-kpi h-100">
                  <div className="rm-kpi-label">累積用電 / 用水</div>
                  <div className="rm-kpi-value-sm">{kpi.sumKwh} kWh</div>
                  <div className="rm-muted">{kpi.sumWater} {WATER_UNIT}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右：相電錶（Bar 版：一行三個小條形指示） */}
        <div className="col-12 col-lg-4">
          <div className="rm-panel rm-phase-panel">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="fw-bold">相電錶</div>
              <div className="rm-phase-avg">
                平均 <strong>{avgVoltage}</strong> V
              </div>
            </div>

            <div className="rm-phase-bars rm-phase-bars-3">
              {["R", "S", "T"].map((phase) => {
                const v = Number(phaseData[phase].voltage);
                const min = RULES.voltageLow;
                const max = RULES.voltageHigh;

                const scaleMin = 190;
                const scaleMax = 250;

                const pct = clamp(((v - scaleMin) / (scaleMax - scaleMin)) * 100, 0, 100);

                const status =
                  v < min || v > max ? "alarm" : v < min + 3 || v > max - 3 ? "warn" : "ok";

                return (
                  <div key={phase} className={`rm-phasebar rm-phasebar-compact rm-phasebar-${phase}`}>
                    <div className="rm-phasebar-top">
                      <div className="rm-phasebar-tag">{phase}</div>
                      <div className="rm-phasebar-v">{v}V</div>
                    </div>

                    <div className="rm-phasebar-track">
                      <div
                        className="rm-phasebar-range"
                        style={{
                          left: `${clamp(((min - scaleMin) / (scaleMax - scaleMin)) * 100, 0, 100)}%`,
                          width: `${clamp(((max - min) / (scaleMax - scaleMin)) * 100, 0, 100)}%`,
                        }}
                      />
                      <div className={`rm-phasebar-fill ${status}`} style={{ width: `${pct}%` }} />
                      <div className={`rm-phasebar-dot ${status}`} style={{ left: `${pct}%` }} />
                    </div>

                    <div className={`rm-phasebar-pill ${status}`}>
                      {status === "alarm" ? "異常" : status === "warn" ? "警告" : "正常"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* <div className="rm-muted small mt-2">
              合格範圍：{RULES.voltageLow}–{RULES.voltageHigh}V
            </div> */}
          </div>
        </div>
      </div>

      {/* 內容 */}
      {viewMode === "cards" ? (
        <div className="rm-grid">
          {filteredDockData.map((dock) => {
            const status = dock.status;
            const border = cardBorderByStatus(status);
            const badge = badgeClassByStatus(status);

            return (
              <button
                key={dock.dockNumber}
                className={`rm-card border ${border}`}
                onClick={() => setSelectedDockNo(dock.dockNumber)}
              >
                <div className="rm-card-head">
                  <div className="rm-card-title">
                    <span className={lampClassByStatus(status)} />
                    <span className="fw-bold">船席 {dock.dockNumber}</span>
                    {dock.isActive && <span className="badge bg-primary ms-2">使用中</span>}
                  </div>

                  <div className="rm-card-badges">
                    <span className={`badge ${dock.powerOn ? "bg-success" : "bg-dark"}`}>
                      {dock.powerOn ? "ON" : "OFF"}
                    </span>
                    <span className={`badge ${badge}`}>
                      {status === "ALARM"
                        ? "異常"
                        : status === "WARN"
                          ? "警告"
                          : status === "OK"
                            ? "正常"
                            : "離線"}
                    </span>
                  </div>
                </div>

                <div className="rm-card-body">
                  <div className="rm-card-top">
                    <div>
                      <div className="rm-muted small">功率</div>
                      <div className="rm-big">
                        {dock.powerOn ? `${fmt(dock.powerKW, 2)} kW` : "—"}
                      </div>
                    </div>

                    <div className="rm-spark-wrap">
                      <div className="rm-muted small text-end">kW 趨勢</div>
                      <div className="rm-spark-color">
                        <Sparkline data={dock.history.kw} />
                      </div>
                    </div>
                  </div>

                  <div className="rm-stats">
                    <div className="rm-stat">
                      <div className="rm-muted">Hz</div>
                      <div className="fw-bold">{dock.powerOn ? fmt(dock.frequency, 2) : "—"}</div>
                    </div>
                    <div className="rm-stat">
                      <div className="rm-muted">A</div>
                      <div className="fw-bold">{dock.powerOn ? fmt(dock.currentA, 2) : "—"}</div>
                    </div>
                    <div className="rm-stat">
                      <div className="rm-muted">負載</div>
                      <div className="fw-bold">{dock.powerOn ? `${dock.loadPct}%` : "—"}</div>
                    </div>
                    <div className="rm-stat">
                      <div className="rm-muted">kWh</div>
                      <div className="fw-bold">{fmt(dock.powerKWh, 3)}</div>
                    </div>
                  </div>

                  <div className="progress rm-progress">
                    <div
                      className={`progress-bar ${dock.loadPct >= 95
                        ? "bg-danger"
                        : dock.loadPct >= 75
                          ? "bg-warning"
                          : "bg-success"
                        }`}
                      style={{ width: `${dock.loadPct}%` }}
                    />
                  </div>

                  {dock.alarms?.length > 0 && (
                    <div className="rm-alarms">
                      {dock.alarms.slice(0, 2).map((a, idx) => (
                        <span key={idx} className="badge bg-danger">
                          {a}
                        </span>
                      ))}
                      {dock.alarms.length > 2 && (
                        <span className="badge bg-secondary">+{dock.alarms.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="rm-card-foot">
                    <div className="rm-muted small">
                      更新：{new Date(dock.updatedAt).toLocaleTimeString()}
                    </div>
                    <div className="rm-muted small">點擊查看詳情</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rm-panel">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 110 }}>船席</th>
                  <th style={{ width: 120 }}>供電</th>
                  <th style={{ width: 120 }}>狀態</th>
                  <th>告警</th>
                  <th style={{ width: 90 }}>Hz</th>
                  <th style={{ width: 90 }}>A</th>
                  <th style={{ width: 90 }}>kW</th>
                  <th style={{ width: 110 }}>負載</th>
                  <th style={{ width: 120 }}>kWh</th>
                  <th style={{ width: 120 }}>用水</th>
                </tr>
              </thead>
              <tbody>
                {filteredDockData.map((d) => (
                  <tr
                    key={d.dockNumber}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedDockNo(d.dockNumber)}
                  >
                    <td className="fw-bold d-flex align-items-center gap-2">
                      <span className={lampClassByStatus(d.status)} />
                      #{d.dockNumber}
                    </td>
                    <td>
                      <span className={`badge ${d.powerOn ? "bg-success" : "bg-dark"}`}>
                        {d.powerOn ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClassByStatus(d.status)}`}>
                        {d.status === "ALARM"
                          ? "異常"
                          : d.status === "WARN"
                            ? "警告"
                            : d.status === "OK"
                              ? "正常"
                              : "離線"}
                      </span>
                    </td>
                    <td>
                      {d.alarms?.length ? (
                        <span className="text-danger small">{d.alarms.join("、")}</span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>{d.powerOn ? fmt(d.frequency, 2) : "—"}</td>
                    <td>{d.powerOn ? fmt(d.currentA, 2) : "—"}</td>
                    <td>{d.powerOn ? fmt(d.powerKW, 2) : "—"}</td>
                    <td>{d.powerOn ? `${d.loadPct}%` : "—"}</td>
                    <td>{fmt(d.powerKWh, 3)}</td>
                    <td>{fmt(d.waterUsedL, 1)} {WATER_UNIT}</td>
                  </tr>
                ))}
                {filteredDockData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-4">
                      目前沒有符合條件的船席
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rm-muted small px-3 py-2">
            點擊列可展開詳細內容。
          </div>
        </div>
      )}

      <div className="rm-muted small mt-3">
        負載比例以額定電流 {RATED_CURRENT_A}A 為基準。跳脫/過載/頻率偏移等為 mock 規則，接 API 後以設備回傳為準。
      </div>

      {/* Drawer */}
      {selectedDock && (
        <>
          <div className="rm-mask" onClick={() => setSelectedDockNo(null)} />

          <div className="rm-drawer" role="dialog" aria-modal="true">
            <div className="rm-drawer-head">
              <div className="fw-bold d-flex align-items-center gap-2">
                <span className={lampClassByStatus(selectedDock.status)} />
                船席 {selectedDock.dockNumber} 詳細監控
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedDockNo(null)}
              >
                關閉
              </button>
            </div>

            <div className="rm-drawer-body">
              <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <span className={`badge ${selectedDock.powerOn ? "bg-success" : "bg-dark"}`}>
                  供電 {selectedDock.powerOn ? "ON" : "OFF"}
                </span>
                <span className={`badge ${badgeClassByStatus(selectedDock.status)}`}>
                  {selectedDock.status === "ALARM"
                    ? "異常"
                    : selectedDock.status === "WARN"
                      ? "警告"
                      : selectedDock.status === "OK"
                        ? "正常"
                        : "離線"}
                </span>
                {selectedDock.isActive && <span className="badge bg-primary">使用中</span>}
                <div className="rm-muted small ms-auto">
                  更新：{new Date(selectedDock.updatedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <div className="rm-mini">
                    <div className="rm-mini-label">頻率</div>
                    <div className="rm-mini-value">
                      {selectedDock.powerOn ? `${fmt(selectedDock.frequency, 2)} Hz` : "—"}
                    </div>
                    <div className="rm-spark-color">
                      <Sparkline data={selectedDock.history.hz} />
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="rm-mini">
                    <div className="rm-mini-label">電流</div>
                    <div className="rm-mini-value">
                      {selectedDock.powerOn ? `${fmt(selectedDock.currentA, 2)} A` : "—"}
                    </div>
                    <div className="rm-spark-color">
                      <Sparkline data={selectedDock.history.a} />
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="rm-mini">
                    <div className="rm-mini-label">功率</div>
                    <div className="rm-mini-value">
                      {selectedDock.powerOn ? `${fmt(selectedDock.powerKW, 2)} kW` : "—"}
                    </div>
                    <div className="rm-spark-color">
                      <Sparkline data={selectedDock.history.kw} />
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="rm-mini">
                    <div className="rm-mini-label">負載</div>
                    <div className="rm-mini-value">
                      {selectedDock.powerOn ? `${selectedDock.loadPct}%` : "—"}
                    </div>
                    <div className="progress rm-progress mt-2">
                      <div
                        className={`progress-bar ${selectedDock.loadPct >= 95
                          ? "bg-danger"
                          : selectedDock.loadPct >= 75
                            ? "bg-warning"
                            : "bg-success"
                          }`}
                        style={{ width: `${selectedDock.loadPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="rm-mini">
                    <div className="rm-mini-label">累積用電</div>
                    <div className="rm-mini-value">{fmt(selectedDock.powerKWh, 3)} kWh</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="rm-mini">
                    <div className="rm-mini-label">累積用水</div>
                    <div className="rm-mini-value">
                      {fmt(selectedDock.waterUsedL, 1)} {WATER_UNIT}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="fw-bold mb-2">告警</div>
                {selectedDock.alarms?.length ? (
                  <div className="d-flex flex-column gap-2">
                    {selectedDock.alarms.map((a, idx) => (
                      <div key={idx} className="rm-alarm-item">
                        <span className="badge bg-danger me-2">ALARM</span>
                        <span className="small">{a}</span>
                      </div>
                    ))}
                    <Link to="/alarm-center" className="btn btn-sm btn-outline-danger">
                      前往告警中心處理
                    </Link>
                  </div>
                ) : (
                  <div className="rm-muted small">目前無告警</div>
                )}
              </div>

              <div className="d-grid gap-2">
                <Link to="/remote-control" className="btn btn-outline-primary">
                  前往遠端控管（開關/授權/頻率切換）
                </Link>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSelectedDockNo(null)}
                >
                  關閉詳細視窗
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
