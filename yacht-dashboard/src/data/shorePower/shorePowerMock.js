// 岸電假資料（之後可換成 API 回傳）
export const BERTHS = Array.from({ length: 11 }).map((_, i) => {
  const id = i + 1;
  const statuses = ["POWERING", "READY", "ALARM", "OFFLINE"];
  const status = statuses[id % statuses.length];

  return {
    berthId: id,
    berthName: `船位 ${String(id).padStart(2, "0")}`,
    status, // POWERING | READY | ALARM | OFFLINE
    updatedAt: new Date(Date.now() - id * 1000 * 15).toISOString(),
    kW: status === "POWERING" ? 8 + (id % 5) * 2 : 0,
    kWhToday: 12 + id * 3,
    waterToday_m3: 0.6 + id * 0.12,
    amps: {
      r: status === "POWERING" ? 12 + id : 0,
      s: status === "POWERING" ? 10 + id : 0,
      t: status === "POWERING" ? 11 + id : 0,
    },
  };
});

export const EVENTS = [
  { id: 1, level: "INFO", title: "船位 03 啟動供電", at: "2026-01-02 09:21", by: "工程-王小明" },
  { id: 2, level: "WARN", title: "船位 06 電流偏高", at: "2026-01-02 09:18", by: "系統" },
  { id: 3, level: "ALARM", title: "船位 08 跳脫保護", at: "2026-01-02 09:02", by: "系統" },
  { id: 4, level: "INFO", title: "船位 01 變頻器頻率切換 50Hz", at: "2026-01-02 08:56", by: "工程-林小華" },
];
