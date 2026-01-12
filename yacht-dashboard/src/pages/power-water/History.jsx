// pages/power-water/History.jsx
import { useEffect, useRef, useState } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

/**  小工具  */
const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) => d.toISOString().split("T")[0];
const todayISO = () => isoDate(new Date());
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - Number(n || 0));
  return isoDate(d);
};

const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randi = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

const fmtMoney = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  });

const dayLabel = (idx) => `D${idx + 1}`;

/** 星期中英對照（排程顯示用） */
const WEEK_ZH = {
  Mon: "週一",
  Tue: "週二",
  Wed: "週三",
  Thu: "週四",
  Fri: "週五",
  Sat: "週六",
  Sun: "週日",
};
const weekToZh = (daysText) => {
  if (!daysText || daysText === "—") return "—";
  return String(daysText)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((k) => WEEK_ZH[k] || k)
    .join("、");
};

/**  Chart Plugin: tooltip active 時畫紅色直線  */
const crosshairPlugin = {
  id: "crosshairLine",
  afterDraw(chart) {
    if (chart.tooltip?._active?.length) {
      const ctx = chart.ctx;
      const x = chart.tooltip._active[0].element.x;
      const topY = chart.chartArea.top;
      const bottomY = chart.chartArea.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "red";
      ctx.stroke();
      ctx.restore();
    }
  },
};

Chart.register(crosshairPlugin);

/**  假資料產生（後續可換 API）  */
function genTimeLabels(granularity) {
  if (granularity === "day") {
    return Array.from({ length: 30 }, (_, i) => dayLabel(i));
  }
  return Array.from({ length: 24 }, (_, i) => `${pad2(i)}:00`);
}

function generateTrendData({ berthNo, granularity }) {
  const labels = genTimeLabels(granularity);

  const kwh = labels.map(() => randi(80, 160));
  const voltage = labels.map(() => rand(212, 232)); // V
  const current = labels.map(() => rand(0, 18)); // A
  const powerKw = labels.map(() => rand(2, 12)); // kW
  const freq = labels.map(() => rand(59.4, 60.6)); // Hz

  const anomalyCount = randi(0, 6);

  return {
    labels,
    kwh,
    voltage,
    current,
    powerKw,
    freq,
    anomalyCount,
    berthNo,
  };
}

function generateAnomalies({ berthNo, start }) {
  const types = [
    { code: "TRIP", name: "岸電跳脫", sev: "高" },
    { code: "OVERLOAD", name: "過載", sev: "高" },
    { code: "OVERVOLT", name: "過電壓", sev: "中" },
    { code: "UNDERVOLT", name: "欠電壓", sev: "中" },
    { code: "FREQ_DEV", name: "頻率偏移", sev: "低" },
  ];

  const count = randi(2, 10);
  return Array.from({ length: count }, (_, i) => {
    const t = types[randi(0, types.length - 1)];
    const hh = randi(0, 23);
    const mm = randi(0, 59);
    const day = start || todayISO();
    return {
      id: `${berthNo}-${i}-${Date.now()}`,
      time: `${day} ${pad2(hh)}:${pad2(mm)}`,
      berthNo,
      type: t.name,
      severity: t.sev,
      detail:
        t.code === "OVERLOAD"
          ? `負載 ${randi(95, 135)}%（持續 ${randi(10, 180)} 秒）`
          : t.code === "TRIP"
          ? `跳脫原因：${["瞬間過載", "漏電保護", "短路保護", "過溫保護"][randi(0, 3)]}`
          : `量測值異常（請查閱波形/紀錄）`,
      ack: Math.random() > 0.5,
    };
  });
}

function generateOps({ berthNo, start }) {
  const actors = ["值班員 A", "值班員 B", "系統排程器", "遠端授權服務"];
  const actions = [
    "授權供電",
    "撤銷授權",
    "遠端開啟供電",
    "遠端關閉供電",
    "切換頻率 60Hz",
    "切換頻率 50Hz",
    "修改排程",
    "套用排程",
  ];

  const count = randi(6, 18);
  return Array.from({ length: count }, (_, i) => {
    const hh = randi(0, 23);
    const mm = randi(0, 59);
    const day = start || todayISO();
    const action = actions[randi(0, actions.length - 1)];
    return {
      id: `${berthNo}-op-${i}-${Date.now()}`,
      time: `${day} ${pad2(hh)}:${pad2(mm)}`,
      berthNo,
      actor: actors[randi(0, actors.length - 1)],
      action,
      result: Math.random() > 0.08 ? "成功" : "失敗",
      note: action.includes("頻率") ? `目標頻率：${action.includes("60") ? 60 : 50}Hz` : "—",
    };
  });
}

function generateSchedules({ berthNo }) {
  const count = randi(3, 10);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const pickDays = () => days.filter(() => Math.random() > 0.5).slice(0, randi(2, 6));

  return Array.from({ length: count }, (_, i) => {
    const d = todayISO();
    const hh = randi(0, 23);
    const mm = randi(0, 59);
    const enabled = Math.random() > 0.2;
    const start = `${pad2(randi(0, 23))}:${pad2([0, 15, 30, 45][randi(0, 3)])}`;
    const end = `${pad2(randi(0, 23))}:${pad2([0, 15, 30, 45][randi(0, 3)])}`;
    const dayList = pickDays();
    return {
      id: `${berthNo}-sch-${i}-${Date.now()}`,
      time: `${d} ${pad2(hh)}:${pad2(mm)}`,
      berthNo,
      enabled,
      days: dayList.length ? dayList.join(", ") : "—",
      window: enabled ? `${start} ~ ${end}` : "—",
      exceptions: Math.random() > 0.7 ? `${d}` : "—",
      by: ["值班員 A", "值班員 B", "系統排程器"][randi(0, 2)],
    };
  });
}

function calcSummary(kwhSeries, voltageSeries, currentSeries, powerKwSeries, freqSeries) {
  const sum = (arr) => arr.reduce((a, b) => a + Number(b || 0), 0);
  const avg = (arr) => (arr.length ? sum(arr) / arr.length : 0);
  const max = (arr) => (arr.length ? Math.max(...arr.map((x) => Number(x || 0))) : 0);

  const totalKwh = Math.round(sum(kwhSeries));
  const avgV = avg(voltageSeries);
  const avgA = avg(currentSeries);
  const avgKw = avg(powerKwSeries);
  const avgHz = avg(freqSeries);

  const rate = 4.2; // TWD/kWh（示意）
  const estFee = totalKwh * rate;

  return {
    totalKwh,
    avgV: Number(avgV.toFixed(1)),
    avgA: Number(avgA.toFixed(2)),
    avgKw: Number(avgKw.toFixed(2)),
    avgHz: Number(avgHz.toFixed(2)),
    maxKw: Number(max(powerKwSeries).toFixed(2)),
    rate,
    estFee,
  };
}

export default function History() {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  const [tab, setTab] = useState("trend"); // trend | anomalies | ops | schedule

  const [selectedDock, setSelectedDock] = useState(1);
  const [compareDock, setCompareDock] = useState("");
  const [granularity, setGranularity] = useState("hour"); // hour | day

  // ✅ 預設近一週：start = 6 天前、end = 今天
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [trend, setTrend] = useState(null);
  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [ops, setOps] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [compareTrend, setCompareTrend] = useState(null);
  const [compareSummary, setCompareSummary] = useState(null);

  const [hasQueried, setHasQueried] = useState(false); // ✅ 用來控制「請先查詢」顯示

  useEffect(() => {
    setDateRange({ start: daysAgoISO(6), end: todayISO() });
  }, []);

  const renderChart = (main, compare) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !main) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const datasets = [
      {
        label: `船席 ${main.berthNo} 用電量 (kWh)`,
        data: main.kwh,
        borderColor: "#fbc02d",
        fill: false,
        tension: 0.3,
      },
      {
        label: `船席 ${main.berthNo} 功率 (kW)`,
        data: main.powerKw,
        borderColor: "#7e57c2",
        fill: false,
        tension: 0.3,
      },
      {
        label: `船席 ${main.berthNo} 頻率 (Hz)`,
        data: main.freq,
        borderColor: "#26a69a",
        fill: false,
        tension: 0.3,
      },
    ];

    if (compare) {
      datasets.push(
        {
          label: `船席 ${compare.berthNo} 用電量 (kWh)`,
          data: compare.kwh,
          borderColor: "#ff7043",
          fill: false,
          tension: 0.3,
          borderDash: [6, 4],
        },
        {
          label: `船席 ${compare.berthNo} 功率 (kW)`,
          data: compare.powerKw,
          borderColor: "#5c6bc0",
          fill: false,
          tension: 0.3,
          borderDash: [6, 4],
        }
      );
    }

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: { labels: main.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            callbacks: {
              title: (items) => `時間：${items?.[0]?.label || "-"}`,
            },
          },
          legend: { display: true, position: "bottom" },
        },
        scales: { y: { beginAtZero: true } },
      },
      plugins: [crosshairPlugin],
    });
  };

  const runQuery = () => {
    if (!dateRange.start || !dateRange.end) {
      Swal.fire("缺少日期", "請選擇開始與結束日期。", "warning");
      return;
    }

    setHasQueried(true);

    const main = generateTrendData({ berthNo: selectedDock, granularity });
    const sum = calcSummary(main.kwh, main.voltage, main.current, main.powerKw, main.freq);

    setTrend(main);
    setSummary(sum);

    setAnomalies(generateAnomalies({ berthNo: selectedDock, start: dateRange.start, end: dateRange.end }));
    setOps(generateOps({ berthNo: selectedDock, start: dateRange.start, end: dateRange.end }));
    setSchedules(generateSchedules({ berthNo: selectedDock }));

    if (compareDock) {
      const cDock = Number(compareDock);
      const c = generateTrendData({ berthNo: cDock, granularity });
      const cSum = calcSummary(c.kwh, c.voltage, c.current, c.powerKw, c.freq);
      setCompareTrend(c);
      setCompareSummary(cSum);
      renderChart(main, c);
    } else {
      setCompareTrend(null);
      setCompareSummary(null);
      renderChart(main, null);
    }
  };

  // 初次：日期設定好後自動查一次（讓頁面進來就有近一週）
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;
    runQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;
    runQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDock, granularity, compareDock]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  const handleDateChange = (e) => setDateRange((p) => ({ ...p, [e.target.name]: e.target.value }));

  const exportCSV = () => {
    Swal.fire("匯出（示意）", "之後接 API 後，這裡可匯出 kWh / 電壓 / 電流 / 功率 / 頻率 的 CSV。", "info");
  };

  const TabBtn = ({ id, label }) => (
    <button
      className={`btn btn-sm me-2 ${tab === id ? "btn-primary" : "btn-outline-primary"}`}
      onClick={() => setTab(id)}
      type="button"
    >
      {label}
    </button>
  );

  const severityBadge = (sev) => {
    if (sev === "高") return "bg-danger";
    if (sev === "中") return "bg-warning text-dark";
    return "bg-secondary";
  };

  // ✅ 讓「請先查詢」顯示在卡片內（不再跑到卡片外）
  const TrendEmptyInsideCard = () => (
    <div className="p-4 bg-white shadow rounded">
      <div className="text-muted text-center py-3">
        請先選擇日期區間並查詢
      </div>
    </div>
  );

  return (
    <div className="container mt-4">
      <h4 className="mb-3 text-primary">岸電管理系統 - 歷史報表</h4>

      {/* 查詢列 */}
      <div className="p-3 bg-white shadow-sm rounded mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-auto d-flex align-items-center gap-2">
            <label htmlFor="start" className="form-label mb-0 small" style={{ whiteSpace: "nowrap" }}>
              開始日期
            </label>
            <input
              type="date"
              id="start"
              name="start"
              className="form-control form-control-sm"
              value={dateRange.start}
              onChange={handleDateChange}
              style={{ minWidth: "140px" }}
            />
          </div>

          <div className="col-auto d-flex align-items-center gap-2">
            <label htmlFor="end" className="form-label mb-0 small" style={{ whiteSpace: "nowrap" }}>
              結束日期
            </label>
            <input
              type="date"
              id="end"
              name="end"
              className="form-control form-control-sm"
              value={dateRange.end}
              onChange={handleDateChange}
              style={{ minWidth: "140px" }}
            />
          </div>

          <div className="col-auto">
            <label className="form-label mb-1 small">船席</label>
            <select
              className="form-select form-select-sm"
              value={selectedDock}
              onChange={(e) => setSelectedDock(Number(e.target.value))}
            >
              {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  船席 {n}
                </option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <label className="form-label mb-1 small">粒度</label>
            <select
              className="form-select form-select-sm"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
            >
              <option value="hour">每小時</option>
              <option value="day">每日</option>
            </select>
          </div>

          <div className="col-auto">
            <label className="form-label mb-1 small">比較船席（選填）</label>
            <select className="form-select form-select-sm" value={compareDock} onChange={(e) => setCompareDock(e.target.value)}>
              <option value="">不比較</option>
              {Array.from({ length: 11 }, (_, i) => i + 1)
                .filter((n) => n !== selectedDock)
                .map((n) => (
                  <option key={n} value={n}>
                    船席 {n}
                  </option>
                ))}
            </select>
          </div>

          <div className="col-auto d-flex gap-2">
            <button className="btn btn-sm btn-outline-primary" onClick={runQuery} type="button">
              查詢
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={exportCSV} type="button">
              匯出
            </button>
          </div>
        </div>

        <div className="text-muted small mt-2">
          預設查詢近一週（開始：{dateRange.start || "-"}，結束：{dateRange.end || "-"}）。
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3">
        <TabBtn id="trend" label="能耗 / 監看趨勢" />
        <TabBtn id="anomalies" label="異常 / 跳脫 / 過載" />
        <TabBtn id="ops" label="事件控制 / 操作追蹤" />
        <TabBtn id="schedule" label="排程器紀錄" />
      </div>

      {/*  能耗/監看趨勢  */}
      {tab === "trend" && (
        <>
          {!summary && hasQueried === false ? (
            <TrendEmptyInsideCard />
          ) : (
            <>
              {/* Summary cards */}
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <div className="p-3 bg-white shadow-sm rounded h-100">
                    <div className="text-muted small">區間用電量（kWh）</div>
                    <div className="fs-4 fw-bold text-warning">{summary?.totalKwh ?? "-"}</div>
                    <div className="text-muted small">估算電費（示意）：{fmtMoney(summary?.estFee ?? 0)}</div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="p-3 bg-white shadow-sm rounded h-100">
                    <div className="text-muted small">平均電壓（V）</div>
                    <div className="fs-4 fw-bold text-primary">{summary?.avgV ?? "-"}</div>
                    <div className="text-muted small">平均電流（A）：{summary?.avgA ?? "-"}</div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="p-3 bg-white shadow-sm rounded h-100">
                    <div className="text-muted small">平均功率（kW）</div>
                    <div className="fs-4 fw-bold" style={{ color: "#7e57c2" }}>
                      {summary?.avgKw ?? "-"}
                    </div>
                    <div className="text-muted small">最大功率（kW）：{summary?.maxKw ?? "-"}</div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="p-3 bg-white shadow-sm rounded h-100">
                    <div className="text-muted small">平均頻率（Hz）</div>
                    <div className="fs-4 fw-bold text-success">{summary?.avgHz ?? "-"}</div>
                    <div className="text-muted small">（切頻紀錄見「操作追蹤」）</div>
                  </div>
                </div>

                {compareSummary && (
                  <div className="col-12">
                    <div className="p-3 bg-white shadow-sm rounded">
                      <div className="fw-bold mb-2">
                        比較結果（船席 {selectedDock} vs 船席 {compareDock}）
                      </div>
                      <div className="row g-2">
                        <div className="col-md-3">
                          <div className="text-muted small">用電量差（kWh）</div>
                          <div className="fw-bold">{(summary?.totalKwh ?? 0) - (compareSummary.totalKwh ?? 0)}</div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-muted small">平均功率差（kW）</div>
                          <div className="fw-bold">{((summary?.avgKw ?? 0) - (compareSummary.avgKw ?? 0)).toFixed(2)}</div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-muted small">平均頻率差（Hz）</div>
                          <div className="fw-bold">{((summary?.avgHz ?? 0) - (compareSummary.avgHz ?? 0)).toFixed(2)}</div>
                        </div>
                        <div className="col-md-3">
                          <div className="text-muted small">估算電費差</div>
                          <div className="fw-bold">{fmtMoney((summary?.estFee ?? 0) - (compareSummary.estFee ?? 0))}</div>
                        </div>
                      </div>
                      <div className="text-muted small mt-2">（示意）之後可接尖離峰/日週月比較。</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="p-4 bg-white shadow rounded" style={{ height: "420px" }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h5 className="text-primary mb-0">船席 {selectedDock} - 用電 / 功率 / 頻率 趨勢</h5>
                  <span className="text-muted small">
                    粒度：{granularity === "hour" ? "每小時" : "每日"}（紅線跟隨 tooltip）
                  </span>
                </div>
                <canvas ref={canvasRef}></canvas>
              </div>
            </>
          )}
        </>
      )}

      {/*  異常 / 跳脫 / 過載  */}
      {tab === "anomalies" && (
        <div className="bg-white shadow-sm rounded p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-bold">船席 {selectedDock} 異常事件</div>
            <div className="text-muted small">對應：岸電跳脫異常、過載狀況監測</div>
          </div>

          {anomalies.length === 0 ? (
            <div className="text-muted text-center py-4">— 無資料 —</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr className="text-center">
                    <th style={{ width: 170 }}>時間</th>
                    <th style={{ width: 90 }}>船席</th>
                    <th style={{ width: 140 }}>類型</th>
                    <th style={{ width: 90 }}>嚴重度</th>
                    <th>細節</th>
                    <th style={{ width: 110 }}>已確認</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies
                    .slice()
                    .sort((a, b) => String(b.time).localeCompare(String(a.time)))
                    .map((x) => (
                      <tr key={x.id}>
                        <td className="text-center">{x.time}</td>
                        <td className="text-center fw-bold">{x.berthNo}</td>
                        <td className="text-center">{x.type}</td>
                        <td className="text-center">
                          <span className={`badge ${severityBadge(x.severity)}`}>{x.severity}</span>
                        </td>
                        <td className="text-start">{x.detail}</td>
                        <td className="text-center">{x.ack ? "是" : "否"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/*  操作追蹤  */}
      {tab === "ops" && (
        <div className="bg-white shadow-sm rounded p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-bold">船席 {selectedDock} 操作追蹤（Audit Log）</div>
            <div className="text-muted small">對應：事件控制、操作追蹤（此頁顯示紀錄，不做控制）</div>
          </div>

          {ops.length === 0 ? (
            <div className="text-muted text-center py-4">— 無資料 —</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr className="text-center">
                    <th style={{ width: 170 }}>時間</th>
                    <th style={{ width: 90 }}>船席</th>
                    <th style={{ width: 130 }}>操作者</th>
                    <th style={{ width: 160 }}>動作</th>
                    <th style={{ width: 90 }}>結果</th>
                    <th>備註</th>
                  </tr>
                </thead>
                <tbody>
                  {ops
                    .slice()
                    .sort((a, b) => String(b.time).localeCompare(String(a.time)))
                    .map((x) => (
                      <tr key={x.id}>
                        <td className="text-center">{x.time}</td>
                        <td className="text-center fw-bold">{x.berthNo}</td>
                        <td className="text-center">{x.actor}</td>
                        <td className="text-center">{x.action}</td>
                        <td className="text-center">
                          <span className={`badge ${x.result === "成功" ? "bg-success" : "bg-danger"}`}>{x.result}</span>
                        </td>
                        <td className="text-start">{x.note}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/*  排程器紀錄  */}
      {tab === "schedule" && (
        <div className="bg-white shadow-sm rounded p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-bold">船席 {selectedDock} 排程器紀錄</div>
            <div className="text-muted small">對應：岸電排程器模組（歷史套用/修改紀錄）</div>
          </div>

          {schedules.length === 0 ? (
            <div className="text-muted text-center py-4">— 無資料 —</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr className="text-center">
                    <th style={{ width: 170 }}>時間</th>
                    <th style={{ width: 90 }}>船席</th>
                    <th style={{ width: 90 }}>啟用</th>
                    <th style={{ width: 240 }}>星期</th>
                    <th style={{ width: 160 }}>時段</th>
                    <th style={{ width: 140 }}>例外日</th>
                    <th style={{ width: 130 }}>變更者</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules
                    .slice()
                    .sort((a, b) => String(b.time).localeCompare(String(a.time)))
                    .map((x) => (
                      <tr key={x.id}>
                        <td className="text-center">{x.time}</td>
                        <td className="text-center fw-bold">{x.berthNo}</td>
                        <td className="text-center">
                          <span className={`badge ${x.enabled ? "bg-success" : "bg-secondary"}`}>{x.enabled ? "是" : "否"}</span>
                        </td>
                        <td className="text-center">{weekToZh(x.days)}</td>
                        <td className="text-center">{x.window}</td>
                        <td className="text-center">{x.exceptions}</td>
                        <td className="text-center">{x.by}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* <div className="text-muted small mt-2">
            建議後續接 API 時補上：「是否成功套用設備」、「套用結果/錯誤碼」。
          </div> */}
        </div>
      )}
    </div>
  );
}
