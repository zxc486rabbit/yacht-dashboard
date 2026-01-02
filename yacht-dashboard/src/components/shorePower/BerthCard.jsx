import { FiWifiOff, FiAlertTriangle } from "react-icons/fi";
import { FaBolt } from "react-icons/fa";
import { LuPower } from "react-icons/lu";

const statusMeta = {
  POWERING: { text: "供電中", cls: "powering", icon: <FaBolt /> },
  READY: { text: "待啟動", cls: "ready", icon: <LuPower /> },
  ALARM: { text: "異常", cls: "alarm", icon: <FiAlertTriangle /> },
  OFFLINE: { text: "離線", cls: "offline", icon: <FiWifiOff /> },
};

const fmt = (n, d = 1) => (n == null ? "-" : Number(n).toFixed(d));

export default function BerthCard({ item, onClick }) {
  const meta = statusMeta[item.status] || statusMeta.READY;

  return (
    <button className={`sp-berth sp-berth--${meta.cls}`} onClick={() => onClick?.(item)} type="button">
      <div className="sp-berth__top">
        <div className="sp-berth__name">{item.berthName}</div>
        <div className="sp-berth__status">
          <span className="sp-berth__statusIcon">{meta.icon}</span>
          <span>{meta.text}</span>
        </div>
      </div>

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
            R {fmt(item.amps?.r, 0)}A · S {fmt(item.amps?.s, 0)}A · T {fmt(item.amps?.t, 0)}A
          </div>
        </div>
      </div>

      <div className="sp-berth__foot">
        <span className="sp-muted">更新時間</span>
        <span className="sp-muted">{new Date(item.updatedAt).toLocaleString()}</span>
      </div>
    </button>
  );
}
