const pad2 = (n) => String(n).padStart(2, "0");
const fmt = (d) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 10) / 10;

function makeBerths() {
  const list = [];
  for (let i = 1; i <= 11; i++) {
    const statusRoll = Math.random();
    const status =
      statusRoll < 0.68 ? "ON" :
      statusRoll < 0.82 ? "READY" :
      statusRoll < 0.93 ? "OFF" : "ALARM";

    const voltage = status === "OFF" ? 0 : rand(210, 235);
    const current = status === "OFF" ? 0 : rand(3, 42);
    const freq = status === "OFF" ? 0 : rand(49.7, 50.2);
    const powerKw = status === "OFF" ? 0 : Math.round((voltage * current * 0.85) / 100) / 10;

    list.push({
      berthId: i,
      berthName: `船位 ${pad2(i)}`,
      boatName: status === "ON" ? `Yacht-${100 + i}` : "",
      status, // ON / READY / OFF / ALARM
      voltage,
      current,
      powerKw,
      freq,
      vfdHz: status === "ON" ? rand(30, 50) : 0,
      lastUpdate: new Date(Date.now() - Math.random() * 60_000),
      spark: Array.from({ length: 18 }).map((_, idx) => {
        const base = status === "OFF" ? 0 : Math.max(0, powerKw + Math.sin(idx / 2) * 1.2 + rand(-0.4, 0.6));
        return Math.round(base * 10) / 10;
      }),
      canStart: status === "READY",
      canStop: status === "ON" || status === "ALARM",
      needsAuth: status === "READY",
      alarmText: status === "ALARM" ? (Math.random() > 0.5 ? "過載警報" : "跳脫/斷路") : "",
    });
  }
  return list;
}

function makeEvents() {
  const now = new Date();
  const types = [
    { t: "CONTROL", label: "控制命令" },
    { t: "AUTH", label: "授權" },
    { t: "ALARM", label: "異常" },
    { t: "SCHEDULE", label: "排程" },
  ];

  return Array.from({ length: 10 }).map((_, i) => {
    const when = new Date(now.getTime() - (i + 1) * 7 * 60_000);
    const berthId = 1 + Math.floor(Math.random() * 11);
    const tp = types[Math.floor(Math.random() * types.length)];
    const msg =
      tp.t === "CONTROL" ? "遠端啟停操作" :
      tp.t === "AUTH" ? "授權更新/撤銷" :
      tp.t === "ALARM" ? "偵測到異常狀態" :
      "排程即將啟動/停止";

    return {
      id: `${when.getTime()}_${i}`,
      time: fmt(when),
      berthId,
      type: tp,
      message: `${msg}（船位 ${pad2(berthId)}）`,
      by: ["Admin", "Engineer", "System"][Math.floor(Math.random() * 3)],
    };
  });
}

function makeScheduleSummary() {
  const today = new Date();
  const items = Array.from({ length: 6 }).map((_, i) => {
    const berthId = 1 + Math.floor(Math.random() * 11);
    const start = new Date(today.getTime() + (i + 1) * 45 * 60_000);
    const end = new Date(start.getTime() + 2 * 60 * 60_000);
    return {
      id: `${start.getTime()}_${i}`,
      berthId,
      start,
      end,
      action: Math.random() > 0.5 ? "啟動" : "停止",
    };
  });
  return items;
}

// ---- public API ----
export async function getDashboardSnapshot() {
  // 這裡先 mock：後面換成 fetch('/api/xxx') 回相同結構即可
  const berths = makeBerths();
  const events = makeEvents();
  const schedules = makeScheduleSummary();

  return {
    serverTime: new Date(),
    berths,
    events,
    schedules,
  };
}

export async function sendCommand({ berthId, command, payload }) {
  // mock: 之後換成真正 API
  console.log("[shorePower] sendCommand", { berthId, command, payload });
  return { success: true, message: "OK" };
}
