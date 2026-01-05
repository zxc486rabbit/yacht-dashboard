import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../auth/AuthContext";

const LS_BOOKINGS = "hk_mock_bookings_v2";
const LS_SEEDED = "hk_mock_mybookings_seeded_v2";

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const pad2 = (n) => String(n).padStart(2, "0");

function fmtDateTime(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(
    dt.getMinutes()
  )}`;
}

function ymd(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function msToHours(ms) {
  return ms / 1000 / 60 / 60;
}

// 停泊計費
function calcHourlyFee(totalHours, rate) {
  const h = Math.max(0, totalHours);
  const first2 = Math.min(2, h);
  const rest = Math.max(0, h - 2);
  return first2 * rate.first2HoursRate + rest * rate.hourlyRate;
}
function calcAutoFee(totalHours, rate) {
  const h = Math.max(0, totalHours);
  const days = Math.floor(h / 24);
  const remHours = h - days * 24;

  const remHourly = calcHourlyFee(remHours, rate);
  const remCapped = Math.min(remHourly, rate.dailyRate);

  const fee = days * rate.dailyRate + remCapped;
  return { fee, days, remHours, remHourly, remCapped };
}
function calcDailyFee(totalHours, rate) {
  const h = Math.max(0, totalHours);
  if (h === 0) return { fee: 0, days: 0 };
  const days = Math.ceil(h / 24);
  return { fee: days * rate.dailyRate, days };
}

function statusText(s) {
  if (s === "RESERVED") return "已預約";
  if (s === "ACTIVE") return "停泊中";
  if (s === "FINISHED") return "已結束";
  if (s === "CANCELLED") return "已取消";
  return s || "—";
}

function statusBadgeClass(s) {
  if (s === "RESERVED") return "badge bg-primary-subtle text-primary border border-primary-subtle";
  if (s === "ACTIVE") return "badge bg-success-subtle text-success border border-success-subtle";
  if (s === "FINISHED") return "badge bg-secondary-subtle text-secondary border border-secondary-subtle";
  if (s === "CANCELLED") return "badge bg-danger-subtle text-danger border border-danger-subtle";
  return "badge bg-light text-dark border";
}

// 只跑一次：塞一些「可查詢用」的假資料到 localStorage
function seedMyBookingsOnce() {
  if (localStorage.getItem(LS_SEEDED)) return;

  const now = new Date();

  // 停泊計費（你原本的）
  const baseRate = { first2HoursRate: 80, hourlyRate: 120, dailyRate: 2000 };

  // 水電單價（示範用）
  const utilityRate = {
    powerPerKwh: 6.5, // 每度電
    waterPerTon: 25,  // 每噸水（1噸 = 1000L，先用噸比較好看）
  };

  const berthIds = Array.from({ length: 11 }).map((_, i) => `B${String(i + 1).padStart(2, "0")}`);
  const boatNames = [
    "海口一號",
    "海風號",
    "藍鯨號",
    "白浪號",
    "星海號",
    "晨曦號",
    "遠航號",
    "海豚號",
    "彩虹號",
    "浪花號",
    "珊瑚號",
  ];
  const phones = ["0912-345-678", "0922-111-222", "0988-888-666", "0905-123-456"];

  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[rnd(0, arr.length - 1)];
  const addHours = (d, hours) => new Date(d.getTime() + hours * 3600 * 1000);

  // 用來生成更像真的水電數值
  function genUtilities(hours, status) {
    // 已預約：通常還沒用電用水
    if (status === "RESERVED") {
      return {
        powerKwh: 0,
        waterTon: 0,
        meter: {
          powerStart: rnd(12000, 19000),
          powerEnd: null,
          waterStart: rnd(3000, 6000),
          waterEnd: null,
        },
      };
    }

    // 依停泊時間給個合理區間：每小時 2~8 度電、每小時 0.02~0.12 噸水
    const powerPerHour = rnd(2, 8) + Math.random(); // kWh
    const waterPerHour = (rnd(2, 12) / 100) + Math.random() / 100; // ton

    const powerKwh = Math.max(0, powerPerHour * Math.max(0.5, hours));
    const waterTon = Math.max(0, waterPerHour * Math.max(0.5, hours));

    const powerStart = rnd(12000, 19000);
    const waterStart = rnd(3000, 6000);

    return {
      powerKwh: Number(powerKwh.toFixed(1)),
      waterTon: Number(waterTon.toFixed(2)),
      meter: {
        powerStart,
        powerEnd: powerStart + Math.round(powerKwh),
        waterStart,
        waterEnd: Number((waterStart + waterTon).toFixed(2)),
      },
    };
  }

  // 假裝有進出港刷卡/柵欄紀錄（展示用）
  function genGateLogs(start, end, status) {
    const logs = [];

    // RESERVED：只會有「預約建立」那種記錄
    if (status === "RESERVED") {
      logs.push({
        type: "SYSTEM",
        time: new Date(start.getTime() - rnd(2, 48) * 3600 * 1000).toISOString(),
        note: "已完成線上預約（系統建立）",
      });
      return logs.sort((a, b) => new Date(a.time) - new Date(b.time));
    }

    // ACTIVE/FINISHED：有進港；FINISHED 再加離港
    logs.push({
      type: "GATE",
      time: new Date(start.getTime() - rnd(10, 40) * 60 * 1000).toISOString(),
      note: "門禁放行：進港（車道 1）",
    });
    logs.push({
      type: "BERTH",
      time: new Date(start.getTime() + rnd(5, 20) * 60 * 1000).toISOString(),
      note: "靠泊完成：繫纜確認",
    });

    if (status === "FINISHED") {
      logs.push({
        type: "BERTH",
        time: new Date(end.getTime() - rnd(15, 45) * 60 * 1000).toISOString(),
        note: "離泊準備：解纜完成",
      });
      logs.push({
        type: "GATE",
        time: new Date(end.getTime() + rnd(5, 30) * 60 * 1000).toISOString(),
        note: "門禁放行：離港（車道 2）",
      });
    }

    return logs.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  const mkBooking = (idx, start, hours, status) => {
    const berthId = berthIds[idx % berthIds.length];
    const berthName = `船位 ${berthId.slice(1)}`;
    const boatName = boatNames[idx % boatNames.length];
    const phone = phones[idx % phones.length];
    const end = addHours(start, hours);

    const utilities = genUtilities(hours, status);
    const gateLogs = genGateLogs(start, end, status);

    // 折扣：偶爾給個優惠（展示用）
    const discount = Math.random() < 0.25 ? rnd(50, 200) : 0;

    return {
      id: `BK-seed-${Date.now()}-${idx}`,
      userId: "U0001",
      userName: "示範使用者",
      berthId,
      berthName,
      boatName,
      phone,

      startAt: start.toISOString(),
      endAt: end.toISOString(),

      // RESERVED / ACTIVE / FINISHED / CANCELLED
      status,

      billingMode: ["AUTO", "HOURLY", "DAILY"][idx % 3],
      rate: baseRate,

      utilities,
      utilityRate,
      discount,

      gateLogs,
      createdAt: start.toISOString(),
    };
  };

  const existing = loadJson(LS_BOOKINGS, []);
  const generated = [];

  // 過去 60 天：每 3 天塞 2~3 筆（已結束/已取消）
  for (let dayOffset = 60; dayOffset >= 1; dayOffset--) {
    if (dayOffset % 3 !== 0) continue;
    const day = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000);

    const count = rnd(2, 3);
    for (let i = 0; i < count; i++) {
      const start = new Date(day);
      start.setHours(rnd(8, 20), [0, 30][rnd(0, 1)], 0, 0);

      const hoursPool = [0.5, 1, 2.5, 3, 5, 8, 10, 26, 30];
      const hours = pick(hoursPool);

      const status = Math.random() < 0.15 ? "CANCELLED" : "FINISHED";
      generated.push(mkBooking(generated.length, start, hours, status));
    }
  }

  // 最近 7 天：每天 3~5 筆（已結束/已取消）
  for (let dayOffset = 7; dayOffset >= 1; dayOffset--) {
    const day = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000);
    const count = rnd(3, 5);

    for (let i = 0; i < count; i++) {
      const start = new Date(day);
      start.setHours(rnd(7, 22), [0, 30][rnd(0, 1)], 0, 0);

      const hoursPool = [0.5, 1.5, 2, 2.5, 4, 6, 9, 12];
      const hours = pick(hoursPool);

      const roll = Math.random();
      const status = roll < 0.2 ? "CANCELLED" : "FINISHED";
      generated.push(mkBooking(generated.length, start, hours, status));
    }
  }

  // 今天：做停泊中/已結束混合
  {
    const s1 = new Date(now);
    s1.setHours(9, 0, 0, 0);
    generated.push(mkBooking(generated.length, s1, 8, "ACTIVE"));

    const s2 = new Date(now);
    s2.setHours(14, 30, 0, 0);
    generated.push(mkBooking(generated.length, s2, 5.5, "ACTIVE"));

    const s3 = new Date(now);
    s3.setHours(7, 30, 0, 0);
    generated.push(mkBooking(generated.length, s3, 3, "FINISHED"));
  }

  // 未來 14 天：RESERVED/取消 混一些，讓你查得到「已預約」
  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    if (dayOffset % 2 !== 0) continue;
    const day = new Date(now.getTime() + dayOffset * 24 * 3600 * 1000);

    const count = rnd(1, 2);
    for (let i = 0; i < count; i++) {
      const start = new Date(day);
      start.setHours(rnd(8, 18), [0, 30][rnd(0, 1)], 0, 0);

      const hoursPool = [1, 2, 2.5, 4, 6, 10, 28];
      const hours = pick(hoursPool);

      const roll = Math.random();
      const status = roll < 0.15 ? "CANCELLED" : "RESERVED";
      generated.push(mkBooking(generated.length, start, hours, status));
    }
  }

  saveJson(LS_BOOKINGS, [...generated, ...existing]);
  localStorage.setItem(LS_SEEDED, "1");
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(() => loadJson(LS_BOOKINGS, []));

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("ALL"); // ALL / RESERVED / ACTIVE / FINISHED / CANCELLED
  const [keyword, setKeyword] = useState("");

  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    seedMyBookingsOnce();
    setBookings(loadJson(LS_BOOKINGS, []));
  }, []);

  const myBookings = useMemo(() => {
    const myId = user?.id || "U0001";
    return bookings.filter((b) => b.userId === myId);
  }, [bookings, user]);

  const calcDurationHours = (b) => {
    const start = new Date(b.startAt).getTime();
    const end = new Date(b.endAt).getTime();
    return Math.max(0, msToHours(end - start));
  };

  const getRate = (b) => b.rate || { first2HoursRate: 80, hourlyRate: 120, dailyRate: 2000 };

  const calcMooringFee = (b) => {
    const hours = calcDurationHours(b);
    const rate = getRate(b);
    const mode = b.billingMode || "AUTO";

    if (mode === "HOURLY") return Math.round(calcHourlyFee(hours, rate));
    if (mode === "DAILY") return Math.round(calcDailyFee(hours, rate).fee);
    return Math.round(calcAutoFee(hours, rate).fee);
  };

  const calcUtilityFee = (b) => {
    const u = b.utilities || { powerKwh: 0, waterTon: 0 };
    const r = b.utilityRate || { powerPerKwh: 6.5, waterPerTon: 25 };
    const powerFee = Math.round((u.powerKwh || 0) * r.powerPerKwh);
    const waterFee = Math.round((u.waterTon || 0) * r.waterPerTon);
    return { powerFee, waterFee };
  };

  const calcTotal = (b) => {
    const mooringFee = calcMooringFee(b);
    const { powerFee, waterFee } = calcUtilityFee(b);
    const discount = Math.max(0, Number(b.discount || 0));
    const total = Math.max(0, mooringFee + powerFee + waterFee - discount);
    return { mooringFee, powerFee, waterFee, discount, total };
  };

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return myBookings
      .filter((b) => {
        if (status !== "ALL" && b.status !== status) return false;

        const startMs = new Date(b.startAt).getTime();
        const endMs = new Date(b.endAt).getTime();

        if (fromMs != null && endMs < fromMs) return false;
        if (toMs != null && startMs > toMs) return false;

        if (!kw) return true;

        const hay = [b.berthId, b.berthName, b.boatName, b.phone, b.userName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(kw);
      })
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [myBookings, dateFrom, dateTo, status, keyword]);

  const updateBooking = (id, patch) => {
    const next = bookings.map((x) => (x.id === id ? { ...x, ...patch } : x));
    setBookings(next);
    saveJson(LS_BOOKINGS, next);
  };

  const handleFinish = async (b) => {
    const confirm = await Swal.fire({
      title: "結束停泊？",
      text: "結束後會把狀態改為已結束（展示用）",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "確認結束",
      cancelButtonText: "取消",
    });
    if (!confirm.isConfirmed) return;

    updateBooking(b.id, { status: "FINISHED" });
    Swal.fire("已更新", "此筆紀錄已標記為已結束", "success");
  };

  const handleCancel = async (b) => {
    const confirm = await Swal.fire({
      title: "取消預約？",
      text: "取消後仍會保留紀錄（展示用）",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "確認取消",
      cancelButtonText: "返回",
    });
    if (!confirm.isConfirmed) return;

    updateBooking(b.id, { status: "CANCELLED" });
    Swal.fire("已取消", "此筆紀錄已標記為已取消", "success");
  };

  const quickSetRange = (type) => {
    const now = new Date();
    const today = ymd(now);

    if (type === "TODAY") {
      setDateFrom(today);
      setDateTo(today);
      return;
    }
    if (type === "7D") {
      const d = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
      setDateFrom(ymd(d));
      setDateTo(today);
      return;
    }
    if (type === "THIS_MONTH") {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(ymd(d));
      setDateTo(today);
      return;
    }
    if (type === "CLEAR") {
      setDateFrom("");
      setDateTo("");
      setStatus("ALL");
      setKeyword("");
      return;
    }
  };

  return (
    <div style={{ padding: 18 }}>
      <div className="d-flex align-items-baseline justify-content-between flex-wrap gap-2" style={{ marginBottom: 10 }}>
        <h3 className="m-0">我的預約紀錄</h3>
        <div style={{ color: "#64748b" }}>共 {filtered.length} 筆</div>
      </div>

      {/* 查詢條件 */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: "#fff",
          boxShadow: "0 8px 20px rgba(15,23,42,.06)",
          marginBottom: 12,
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 800 }}>查詢條件</div>

          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => quickSetRange("TODAY")}>
              今天
            </button>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => quickSetRange("7D")}>
              近 7 天
            </button>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => quickSetRange("THIS_MONTH")}>
              本月
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => quickSetRange("CLEAR")}>
              清除條件
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>起日</div>
            <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>迄日</div>
            <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>狀態</div>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">全部</option>
              <option value="RESERVED">已預約</option>
              <option value="ACTIVE">停泊中</option>
              <option value="FINISHED">已結束</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>關鍵字</div>
            <input
              type="text"
              className="form-control"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="船名 / 船位 / 電話"
            />
          </div>
        </div>
      </div>

      {/* 表格 */}
      {filtered.length === 0 ? (
        <div style={{ padding: 16, border: "1px dashed #cbd5e1", borderRadius: 12, color: "#64748b" }}>
          沒有符合條件的紀錄。
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 8px 20px rgba(15,23,42,.06)",
          }}
        >
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ whiteSpace: "nowrap" }}>狀態</th>
                  <th style={{ whiteSpace: "nowrap" }}>船位</th>
                  <th style={{ whiteSpace: "nowrap" }}>船名</th>
                  <th style={{ whiteSpace: "nowrap" }}>開始</th>
                  <th style={{ whiteSpace: "nowrap" }}>離開</th>
                  <th style={{ whiteSpace: "nowrap" }}>停泊(小時)</th>
                  <th style={{ whiteSpace: "nowrap" }}>總費用</th>
                  <th style={{ whiteSpace: "nowrap", width: 160 }}>操作</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((b) => {
                  const hours = calcDurationHours(b);
                  const active = b.status === "ACTIVE";
                  const canCancel = b.status === "ACTIVE" || b.status === "RESERVED";

                  const { total } = calcTotal(b);
                  const isExpanded = expandedId === b.id;

                  return (
                    <>
                      <tr
                        key={b.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setExpandedId((prev) => (prev === b.id ? null : b.id))}
                        title="點一下可展開明細"
                      >
                        <td>
                          <span className={statusBadgeClass(b.status)}>{statusText(b.status)}</span>
                        </td>

                        <td style={{ whiteSpace: "nowrap", fontWeight: 800 }}>
                          {b.berthName} <span style={{ color: "#64748b", fontWeight: 600 }}>({b.berthId})</span>
                        </td>

                        <td style={{ whiteSpace: "nowrap" }}>{b.boatName || "—"}</td>

                        <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(b.startAt)}</td>

                        <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(b.endAt)}</td>

                        <td style={{ whiteSpace: "nowrap" }}>{hours.toFixed(2)}</td>

                        <td style={{ whiteSpace: "nowrap", fontWeight: 900 }}>{total}</td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={!active}
                              onClick={() => handleFinish(b)}
                              title={!active ? "只有停泊中才能結束" : "結束停泊"}
                            >
                              結束
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              disabled={!canCancel}
                              onClick={() => handleCancel(b)}
                              title={!canCancel ? "此狀態不可取消" : "取消預約"}
                            >
                              取消
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ background: "#f8fafc" }}>
                            {(() => {
                              const util = b.utilities || { powerKwh: 0, waterTon: 0, meter: {} };
                              const ur = b.utilityRate || { powerPerKwh: 6.5, waterPerTon: 25 };
                              const { mooringFee, powerFee, waterFee, discount, total } = calcTotal(b);

                              const mooringHours = calcDurationHours(b);
                              const rate = getRate(b);
                              const mode = b.billingMode || "AUTO";

                              return (
                                <div style={{ padding: "12px 10px" }}>
                                  <div className="row g-3">
                                    {/* 左：基本資訊 */}
                                    <div className="col-12 col-lg-5">
                                      <div style={{ fontWeight: 900, marginBottom: 8 }}>基本資訊</div>
                                      <div style={{ color: "#334155", lineHeight: 1.9, fontSize: 14 }}>
                                        <div>聯絡電話：{b.phone || "—"}</div>
                                        <div>預約人：{b.userName || "—"}</div>
                                        <div>建立時間：{fmtDateTime(b.createdAt)}</div>
                                        <div>
                                          計費模式：<span style={{ fontWeight: 800 }}>{mode}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                                          計費參數：前 2 小時 {rate.first2HoursRate}/時，之後 {rate.hourlyRate}/時，日上限 {rate.dailyRate}/日
                                        </div>
                                      </div>
                                    </div>

                                    {/* 中：用電用水 */}
                                    <div className="col-12 col-lg-3">
                                      <div style={{ fontWeight: 900, marginBottom: 8 }}>用電 / 用水</div>
                                      <div style={{ color: "#334155", lineHeight: 1.9, fontSize: 14 }}>
                                        <div>
                                          用電量：<span style={{ fontWeight: 900 }}>{util.powerKwh}</span> kWh
                                        </div>
                                        <div style={{ fontSize: 12, color: "#64748b" }}>
                                          單價：{ur.powerPerKwh}/kWh
                                        </div>

                                        <div style={{ marginTop: 8 }}>
                                          用水量：<span style={{ fontWeight: 900 }}>{util.waterTon}</span> 噸
                                        </div>
                                        <div style={{ fontSize: 12, color: "#64748b" }}>
                                          單價：{ur.waterPerTon}/噸
                                        </div>

                                        <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                                          電表：{util.meter?.powerStart ?? "—"} → {util.meter?.powerEnd ?? "—"}
                                          <br />
                                          水表：{util.meter?.waterStart ?? "—"} → {util.meter?.waterEnd ?? "—"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* 右：費用拆解 */}
                                    <div className="col-12 col-lg-4">
                                      <div style={{ fontWeight: 900, marginBottom: 8 }}>費用明細</div>

                                      <div
                                        style={{
                                          border: "1px solid #e5e7eb",
                                          borderRadius: 10,
                                          background: "#fff",
                                          padding: 10,
                                        }}
                                      >
                                        <div style={{ display: "grid", gap: 6, fontSize: 14, color: "#334155" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span>停泊費（{mooringHours.toFixed(2)} 小時）</span>
                                            <span style={{ fontWeight: 900 }}>{mooringFee}</span>
                                          </div>

                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span>用電費（{util.powerKwh} kWh）</span>
                                            <span style={{ fontWeight: 900 }}>{powerFee}</span>
                                          </div>

                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span>用水費（{util.waterTon} 噸）</span>
                                            <span style={{ fontWeight: 900 }}>{waterFee}</span>
                                          </div>

                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span>折扣</span>
                                            <span style={{ fontWeight: 900, color: discount ? "#dc2626" : "#334155" }}>
                                              -{discount}
                                            </span>
                                          </div>

                                          <div style={{ height: 1, background: "#e5e7eb", margin: "6px 0" }} />

                                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                                            <span style={{ fontWeight: 900 }}>合計</span>
                                            <span style={{ fontWeight: 900 }}>{total}</span>
                                          </div>

                                          <div style={{ fontSize: 12, color: "#64748b" }}>
                                            這裡可以再加「稅額」或「發票狀態」等欄位，畫面會更像正式結帳。
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* 下方：進出港/事件紀錄 */}
                                    <div className="col-12">
                                      <div style={{ fontWeight: 900, marginBottom: 8 }}>進出港 / 事件紀錄</div>

                                      <div
                                        style={{
                                          border: "1px solid #e5e7eb",
                                          borderRadius: 10,
                                          background: "#fff",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <table className="table table-sm mb-0">
                                          <thead style={{ background: "#f1f5f9" }}>
                                            <tr>
                                              <th style={{ width: 120, whiteSpace: "nowrap" }}>類型</th>
                                              <th style={{ width: 180, whiteSpace: "nowrap" }}>時間</th>
                                              <th>內容</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(b.gateLogs || []).length === 0 ? (
                                              <tr>
                                                <td colSpan={3} style={{ color: "#64748b", padding: 10 }}>
                                                  目前沒有事件紀錄。
                                                </td>
                                              </tr>
                                            ) : (
                                              b.gateLogs.map((x, i) => (
                                                <tr key={i}>
                                                  <td style={{ whiteSpace: "nowrap", fontWeight: 800 }}>
                                                    {x.type === "GATE" ? "門禁" : x.type === "BERTH" ? "泊位" : "系統"}
                                                  </td>
                                                  <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(x.time)}</td>
                                                  <td>{x.note}</td>
                                                </tr>
                                              ))
                                            )}
                                          </tbody>
                                        </table>
                                      </div>

                                      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                                        小提醒：之後你如果有接到 RTU/門禁/計費資料，就把這些欄位直接替換成真資料，UI 幾乎不用動。
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
