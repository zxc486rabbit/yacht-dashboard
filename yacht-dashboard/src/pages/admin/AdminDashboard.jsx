import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ✅ 共用你的 Dashboard 視覺（不要改）
import "../../styles/dashboard/Dashboard.css";

import {
  FaShip,
  FaDoorClosed,
  FaSatelliteDish,
  FaNetworkWired,
  FaVideo,
  FaBolt,
  FaCashRegister,
  FaBell,
  FaCogs,
} from "react-icons/fa";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const items = useMemo(
    () => [
      { key: "berth-setting", title: "船席基本設定", icon: <FaShip />, to: "/admin/berth-basic" },
      { key: "access-control", title: "門禁管理", icon: <FaDoorClosed />, to: "/admin/access-control" },
      { key: "ais-setting", title: "AIS 設定", icon: <FaSatelliteDish />, to: "/admin/ais" },
      { key: "communication", title: "通訊系統設定", icon: <FaNetworkWired />, to: "/admin/communication" },
      { key: "camera", title: "攝影機管理", icon: <FaVideo />, to: "/admin/cameras" },
      { key: "energy-billing", title: "能耗與計費設定", icon: <FaBolt />, to: "/admin/energy-billing" },
      { key: "payment", title: "支付模組", icon: <FaCashRegister />, to: "/admin/payment" },
      { key: "notification", title: "通知與告警設定", icon: <FaBell />, to: "/admin/notifications-alarms" },
      { key: "feature-toggle", title: "功能頁面管理", icon: <FaCogs />, to: "/admin/feature-pages" },
    ],
    []
  );

  return (
    <div className="appdash">
      {/* 背景遮罩層 */}
      <div className="appdash__bg" />

      {/* 內容 */}
      <div className="appdash__wrap">
        <header className="appdash__header">
          <div className="appdash__title">後臺管理</div>
          <div className="appdash__subtitle">系統設定與管理中心</div>
        </header>

        <section className="appdash__grid" role="list">
          {items.map((it) => (
            <button
              key={it.key}
              className="appdash__tile"
              type="button"
              onClick={() => navigate(it.to)}
              role="listitem"
              title={it.title}
            >
              <div className="appdash__icon">{it.icon}</div>
              <div className="appdash__text">{it.title}</div>
            </button>
          ))}
        </section>

        <footer className="appdash__footer">
          <div className="appdash__hint">點選模組進入後臺管理功能</div>
        </footer>
      </div>
    </div>
  );
}
