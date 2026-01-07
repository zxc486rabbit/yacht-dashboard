import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../auth/AuthContext";

const LS_BOOKINGS = "hk_mock_bookings_v2";
const LS_SEEDED = "hk_mock_seeded_v2";

// 11 席船位固定清單（之後接 API 就改這裡）
const BERTHS = Array.from({ length: 11 }).map((_, idx) => {
  const no = String(idx + 1).padStart(2, "0");
  return { berthId: `B${no}`, name: `船位 ${no}` };
});

// 計費規則（展示用，之後可改成後端帶）
const DEFAULT_RATE = {
  first2HoursRate: 80, // 前 2 小時
  hourlyRate: 120, // 第 3 小時起
  dailyRate: 2000, // 每日上限 / 或純按日
};

// ---------- 小工具：時間/日期處理 ----------
const pad2 = (n) => String(n).padStart(2, "0");

function formatDateYMD(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function todayYMD() {
  return formatDateYMD(new Date());
}

// 把 YYYY-MM-DD + HH:mm 組成 Date（本地時間）
function makeLocalDate(dateYmd, timeHHmm) {
  // 直接組字串讓 new Date 解析成本地時間
  return new Date(`${dateYmd}T${timeHHmm}:00`);
}

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

// 以「小時計費」計算：前 2 小時優惠
function calcHourlyFee(totalHours, rate) {
  const h = Math.max(0, totalHours);
  const first2 = Math.min(2, h);
  const rest = Math.max(0, h - 2);
  return first2 * rate.first2HoursRate + rest * rate.hourlyRate;
}

// 自動（每日上限）：滿 24 小時算一天；剩餘用小時計費但不超過日費
function calcAutoFee(totalHours, rate) {
  const h = Math.max(0, totalHours);
  const days = Math.floor(h / 24);
  const remHours = h - days * 24;

  const remHourly = calcHourlyFee(remHours, rate);
  const remCapped = Math.min(remHourly, rate.dailyRate);

  const fee = days * rate.dailyRate + remCapped;

  return { fee, days, remHours, remHourly, remCapped };
}

// 依日期判斷「這一天是否有被占用」：
// 若一筆預約的時間區間與該日期的 00:00~23:59:59 有交集，就視為占用
function bookingOverlapsDate(booking, dateYmd) {
  const dayStart = new Date(`${dateYmd}T00:00:00`);
  const dayEnd = new Date(`${dateYmd}T23:59:59.999`);
  const s = new Date(booking.startAt);
  const e = new Date(booking.endAt);

  // overlap: s <= dayEnd && e >= dayStart
  return s <= dayEnd && e >= dayStart;
}

// ---------- 預設假資料：讓某些日期顯示已預約 ----------
function seedMockBookingsOnce() {
  const seeded = localStorage.getItem(LS_SEEDED);
  if (seeded) return;

  const base = new Date();
  const d0 = formatDateYMD(base);
  const d1 = formatDateYMD(new Date(base.getTime() + 24 * 3600 * 1000));
  const d2 = formatDateYMD(new Date(base.getTime() + 2 * 24 * 3600 * 1000));

  const mk = (id, userId, berthId, date, startHHmm, durHours, boatName) => {
    const start = makeLocalDate(date, startHHmm);
    const end = new Date(start.getTime() + durHours * 3600 * 1000);
    return {
      id,
      userId,
      userName: userId === "U0001" ? "示範使用者" : "其他使用者",
      berthId,
      berthName: `船位 ${berthId.slice(1)}`,
      boatName,
      phone: "09xx-xxx-xxx",
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      status: "ACTIVE",
      billingMode: "AUTO",
      rate: DEFAULT_RATE,
      createdAt: new Date().toISOString(),
    };
  };

  // 今天：讓 B03、B07、B10 已被預約
  const mocks = [
    mk(`BK-seed-1`, "U9999", "B03", d0, "09:30", 6.5, "海風號"),
    mk(`BK-seed-2`, "U9999", "B07", d0, "13:00", 3, "藍鯨號"),
    mk(`BK-seed-3`, "U9999", "B10", d0, "18:00", 10, "白浪號"),

    // 明天：B02、B05
    mk(`BK-seed-4`, "U9999", "B02", d1, "10:00", 5, "星海號"),
    mk(`BK-seed-5`, "U9999", "B05", d1, "15:30", 8, "晨曦號"),

    // 後天：B01
    mk(`BK-seed-6`, "U9999", "B01", d2, "08:00", 4, "遠航號"),
  ];

  const existing = loadJson(LS_BOOKINGS, []);
  saveJson(LS_BOOKINGS, [...mocks, ...existing]);
  localStorage.setItem(LS_SEEDED, "1");
}

export default function BerthBooking() {
  const { user } = useAuth();

  // 預約日期：預設今天
  const [bookingDate, setBookingDate] = useState(() => todayYMD());

  // 開始/結束時間：只用 time（HH:mm）
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");

  // 停泊多久（小時，0.5 的粒度）
  const [durationHours, setDurationHours] = useState(2);

  // 其他表單欄位
  const [boatName, setBoatName] = useState("");
  const [phone, setPhone] = useState("");

  // 全部預約紀錄（含別人），用來判斷船位占用
  const [bookings, setBookings] = useState(() => loadJson(LS_BOOKINGS, []));

  useEffect(() => {
    seedMockBookingsOnce();
    setBookings(loadJson(LS_BOOKINGS, []));
  }, []);

  // 簡單電話檢核：至少 8 碼數字（允許 -、空白）
  const isPhoneValid = (s) => String(s).replace(/[^\d]/g, "").length >= 8;

  // 當前日期下「哪些 berthId 已占用」
  const reservedSet = useMemo(() => {
    const set = new Set();
    for (const b of bookings) {
      if (b.status === "CANCELLED") continue;
      if (!b.startAt || !b.endAt) continue;
      if (bookingOverlapsDate(b, bookingDate)) {
        set.add(b.berthId);
      }
    }
    return set;
  }, [bookings, bookingDate]);

  const berthsForDate = useMemo(() => {
    return BERTHS.map((x) => ({
      ...x,
      isAvailable: !reservedSet.has(x.berthId),
    }));
  }, [reservedSet]);

  const availableCount = useMemo(
    () => berthsForDate.filter((b) => b.isAvailable).length,
    [berthsForDate]
  );

  // 依「日期 + 開始時間 + 停泊多久」計算出 endAt（可能跨日）
  const computed = useMemo(() => {
    const start = makeLocalDate(bookingDate, startTime);
    const end = new Date(start.getTime() + Number(durationHours || 0) * 3600 * 1000);

    const endDateYmd = formatDateYMD(end);
    const endHHmm = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
    const crossDay = endDateYmd !== bookingDate;

    const hours = Math.max(0, (end.getTime() - start.getTime()) / 3600000);
    const auto = calcAutoFee(hours, DEFAULT_RATE);

    return {
      start,
      end,
      endDateYmd,
      endHHmm,
      crossDay,
      hours,
      feeEstimate: Math.round(auto.fee),
      feeDetail: auto,
    };
  }, [bookingDate, startTime, durationHours]);

  // 當使用者改「停泊多久」→ 自動更新 endTime（只更新 time，跨日會用提示顯示）
  useEffect(() => {
    setEndTime(computed.endHHmm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed.endHHmm]);

  // 若使用者手動改 endTime，反算 durationHours（同一天若 end < start，就視為隔日）
  const handleEndTimeChange = (v) => {
    setEndTime(v);
    const s = makeLocalDate(bookingDate, startTime);
    let e = makeLocalDate(bookingDate, v);

    // 如果結束時間小於開始時間，代表隔天
    if (e.getTime() < s.getTime()) {
      e = new Date(e.getTime() + 24 * 3600 * 1000);
    }

    const hours = Math.max(0, (e.getTime() - s.getTime()) / 3600000);
    // 四捨五入到 0.5 小時，讓 UI 看起來一致
    const rounded = Math.round(hours * 2) / 2;
    setDurationHours(rounded);
  };

  // 常用停泊時間選單（可再加）
  const durationOptions = [
    0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 24, 36, 48,
  ];

  const handleBook = async (berth) => {
    if (!user) return;

    if (!berth.isAvailable) {
      Swal.fire("此船位在選擇的日期已被預約", "請改選其他船位或日期", "info");
      return;
    }

    if (!boatName.trim()) {
      Swal.fire("請填寫船名", "", "warning");
      return;
    }

    if (!isPhoneValid(phone)) {
      Swal.fire("請填寫有效的聯絡電話", "至少 8 碼數字（可含 - 或空白）", "warning");
      return;
    }

    // startAt / endAt 會用 ISO 存起來，之後查詢/計費比較好做
    const startAtIso = computed.start.toISOString();
    const endAtIso = computed.end.toISOString();

    const confirm = await Swal.fire({
      title: `確認預約 ${berth.name}？`,
      html: `<div style="text-align:left;line-height:1.7;">
              <div>預約日期：${bookingDate}</div>
              <div>船位：${berth.name}（${berth.berthId}）</div>
              <div>船名：${boatName.trim()}</div>
              <div>電話：${phone.trim()}</div>
              <div>開始：${computed.start.toLocaleString()}</div>
              <div>離開：${computed.end.toLocaleString()}</div>
              <div>停泊：${computed.hours.toFixed(2)} 小時</div>
              <div style="margin-top:8px;font-weight:800;">預估費用：${computed.feeEstimate}</div>
              <div style="margin-top:6px;color:#64748b;font-size:13px;">
                規則：前 2 小時 ${DEFAULT_RATE.first2HoursRate}/小時，之後 ${DEFAULT_RATE.hourlyRate}/小時，日上限 ${DEFAULT_RATE.dailyRate}/天（展示用）
              </div>
            </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "確認預約",
      cancelButtonText: "取消",
    });

    if (!confirm.isConfirmed) return;

    const booking = {
      id: `BK-${Date.now()}`,
      userId: user.id || "U0001",
      userName: user.name || "未命名",
      berthId: berth.berthId,
      berthName: berth.name,
      boatName: boatName.trim(),
      phone: phone.trim(),
      startAt: startAtIso,
      endAt: endAtIso,
      status: "ACTIVE",
      billingMode: "AUTO",
      rate: DEFAULT_RATE,
      createdAt: new Date().toISOString(),
    };

    const next = [booking, ...bookings];
    setBookings(next);
    saveJson(LS_BOOKINGS, next);

    Swal.fire("預約成功", "已加入你的預約紀錄", "success");
  };

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>船位預約</h3>
        <div style={{ color: "#64748b" }}>
          目前空位：{availableCount} / {BERTHS.length}
        </div>
      </div>

      {/* 預約表單 */}
      <div
        style={{
          marginTop: 14,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: "#fff",
          boxShadow: "0 8px 20px rgba(15,23,42,.06)",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>預約資料</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>預約日期</div>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="form-control"
            />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>停泊開始時間</div>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="form-control"
            />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>預計離開時間</div>
            <input
              type="time"
              value={endTime}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              className="form-control"
            />
            {computed.crossDay && (
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 6 }}>
                提醒：離開時間已跨日（離開日期：{computed.endDateYmd}）
              </div>
            )}
          </div>

          {/* <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>停泊多久</div>
            <select
              className="form-select"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
            >
              {durationOptions.map((h) => (
                <option key={h} value={h}>
                  {h} 小時
                </option>
              ))}
            </select>
          </div> */}

          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>船名</div>
            <input
              type="text"
              className="form-control"
              value={boatName}
              onChange={(e) => setBoatName(e.target.value)}
              placeholder="例如：海口一號"
            />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>聯絡電話</div>
            <input
              type="tel"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例如：0912-345-678"
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontWeight: 800 }}>預估費用：{computed.feeEstimate}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.6 }}>
            停泊：{computed.hours.toFixed(2)} 小時（自動每日上限計費）
          </div>
        </div>
      </div>

      {/* 船位清單（依日期顯示是否可預約） */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {berthsForDate.map((b) => (
          <div
            key={b.berthId}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
              boxShadow: "0 8px 20px rgba(15,23,42,.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800 }}>{b.name}</div>
              <span
                style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 999,
                  background: b.isAvailable ? "#ecfdf5" : "#fef2f2",
                  color: b.isAvailable ? "#065f46" : "#991b1b",
                  border: `1px solid ${b.isAvailable ? "#a7f3d0" : "#fecaca"}`,
                }}
              >
                {b.isAvailable ? "空位" : "已預約"}
              </span>
            </div>

            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
              <div>編號：{b.berthId}</div>
              <div>日期：{bookingDate}</div>
            </div>

            <button
              type="button"
              disabled={!b.isAvailable}
              onClick={() => handleBook(b)}
              className="btn btn-sm w-100 mt-3"
              style={{
                background: b.isAvailable ? "#0599BB" : "#cbd5e1",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {b.isAvailable ? "預約此船位" : "不可預約"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
