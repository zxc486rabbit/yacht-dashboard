import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../auth/AuthContext";

const LS_BOOKINGS = "hk_mock_bookings_v2";

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

function msToHours(ms) {
  return ms / 1000 / 60 / 60;
}

const pad2 = (n) => String(n).padStart(2, "0");
function ymd(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

// 計費規則（跟預約頁一致）
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

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(() => loadJson(LS_BOOKINGS, []));

  // 查詢條件
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("ALL"); // ALL / ACTIVE / FINISHED / CANCELLED
  const [keyword, setKeyword] = useState(""); // 船名/船位/電話都可找

  useEffect(() => {
    setBookings(loadJson(LS_BOOKINGS, []));
  }, []);

  const myBookings = useMemo(() => {
    const myId = user?.id || "U0001";
    return bookings.filter((b) => b.userId === myId);
  }, [bookings, user]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return myBookings
      .filter((b) => {
        if (status !== "ALL" && b.status !== status) return false;

        const startMs = new Date(b.startAt).getTime();
        const endMs = new Date(b.endAt).getTime();

        // 日期區間：只要預約區間跟查詢區間有交集就算命中
        if (fromMs != null && endMs < fromMs) return false;
        if (toMs != null && startMs > toMs) return false;

        if (!kw) return true;

        const hay = [
          b.berthId,
          b.berthName,
          b.boatName,
          b.phone,
          b.userName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(kw);
      })
      // 新到舊
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [myBookings, dateFrom, dateTo, status, keyword]);

  const calcDurationHours = (b) => {
    const start = new Date(b.startAt).getTime();
    const end = new Date(b.endAt).getTime();
    return Math.max(0, msToHours(end - start));
  };

  const getRate = (b) =>
    b.rate || { first2HoursRate: 80, hourlyRate: 120, dailyRate: 2000 };

  const calcFee = (b) => {
    const hours = calcDurationHours(b);
    const rate = getRate(b);
    const mode = b.billingMode || "AUTO";

    if (mode === "HOURLY") return Math.round(calcHourlyFee(hours, rate));
    if (mode === "DAILY") return Math.round(calcDailyFee(hours, rate).fee);
    return Math.round(calcAutoFee(hours, rate).fee);
  };

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

  const statusText = (s) => {
    if (s === "ACTIVE") return "停泊中";
    if (s === "FINISHED") return "已結束";
    if (s === "CANCELLED") return "已取消";
    return s || "—";
  };

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 8 }}>我的預約紀錄</h3>

      {/* 查詢列 */}
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
        <div style={{ fontWeight: 800, marginBottom: 10 }}>查詢條件</div>

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

        <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
          共找到 {filtered.length} 筆
        </div>
      </div>

      {/* 清單 */}
      {filtered.length === 0 ? (
        <div style={{ padding: 16, border: "1px dashed #cbd5e1", borderRadius: 12, color: "#64748b" }}>
          沒有符合條件的紀錄。
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((b) => {
            const hours = calcDurationHours(b);
            const fee = calcFee(b);
            const active = b.status === "ACTIVE";

            return (
              <div
                key={b.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fff",
                  boxShadow: "0 8px 20px rgba(15,23,42,.06)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>
                    {b.berthName} <span style={{ color: "#64748b", fontWeight: 700 }}>({b.berthId})</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#334155" }}>
                    狀態：<span style={{ fontWeight: 800 }}>{statusText(b.status)}</span>
                  </div>
                </div>

                <div style={{ marginTop: 8, color: "#334155", lineHeight: 1.7, fontSize: 14 }}>
                  <div>船名：{b.boatName || "—"}</div>
                  <div>電話：{b.phone || "—"}</div>
                  <div>開始：{new Date(b.startAt).toLocaleString()}（{ymd(b.startAt)}）</div>
                  <div>離開：{new Date(b.endAt).toLocaleString()}（{ymd(b.endAt)}）</div>
                  <div>停泊：{hours.toFixed(2)} 小時</div>
                  <div style={{ marginTop: 6, fontWeight: 900 }}>費用：{fee}</div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {active && (
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleFinish(b)}>
                      結束停泊
                    </button>
                  )}
                  {active && (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleCancel(b)}>
                      取消預約
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
