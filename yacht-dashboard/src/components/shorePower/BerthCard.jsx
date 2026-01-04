// 船位卡片：顯示單一船位的即時狀態與用電 / 用水資訊
// 這個元件只負責顯示，不會自己打 API
// 資料由儀表板頁面傳進來

import { FiWifiOff, FiAlertTriangle } from "react-icons/fi";
import { FaBolt } from "react-icons/fa";
import { LuPower } from "react-icons/lu";

// 將後端的 status 轉成畫面需要的資訊
// 如果之後有新狀態，只需要在這裡補
const statusMeta = {
  POWERING: { text: "供電中", cls: "powering", icon: <FaBolt /> },
  READY: { text: "待啟動", cls: "ready", icon: <LuPower /> },
  ALARM: { text: "異常", cls: "alarm", icon: <FiAlertTriangle /> },
  OFFLINE: { text: "離線", cls: "offline", icon: <FiWifiOff /> },
};

// 共用的數字格式化
// null / undefined 顯示 "-"，避免畫面出現 NaN
const fmt = (n, d = 1) => (n == null ? "-" : Number(n).toFixed(d));

export default function BerthCard({ item, onClick }) {
  // 依照船位狀態決定顯示樣式，沒有對應就當成 READY
  const meta = statusMeta[item.status] || statusMeta.READY;

  return (
    // 用 button 包整張卡片，方便點擊與鍵盤操作
    <button
      type="button"
      className={`sp-berth sp-berth--${meta.cls}`}
      onClick={() => onClick?.(item)}
    >
      {/* 上方：船位名稱與目前狀態 */}
      <div className="sp-berth__top">
        <div className="sp-berth__name">{item.berthName}</div>

        <div className="sp-berth__status">
          <span className="sp-berth__statusIcon">{meta.icon}</span>
          <span>{meta.text}</span>
        </div>
      </div>

      {/* 中間：KPI 區塊 */}
      <div className="sp-berth__grid">
        <div className="sp-kpi">
          <div className="sp-kpi__k">即時功率</div>
          <div className="sp-kpi__v">{fmt(item.kW, 1)} kW</div>
        </div>

        <div className="sp-kpi">
          <div className="sp-kpi__k">今日用電</div>
          <div className="sp-kpi__v">{fmt(item.kWhToday, 1)} kWh</div>
        </div>

        <div className="sp-kpi">
          <div className="sp-kpi__k">今日用水</div>
          <div className="sp-kpi__v">{fmt(item.waterToday_m3, 2)} m³</div>
        </div>

        <div className="sp-kpi">
          <div className="sp-kpi__k">三相電流</div>
          <div className="sp-kpi__v sp-kpi__v--small">
            R {fmt(item.amps?.r, 0)}A ·
            S {fmt(item.amps?.s, 0)}A ·
            T {fmt(item.amps?.t, 0)}A
          </div>
        </div>
      </div>

      {/* 底部只放更新時間，避免卡片資訊太擠 */}
      <div className="sp-berth__foot">
        <span className="sp-muted">更新時間</span>
        <span className="sp-muted">
          {new Date(item.updatedAt).toLocaleString()}
        </span>
      </div>
    </button>
  );
}
