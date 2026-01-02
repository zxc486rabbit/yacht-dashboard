import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard/Dashboard.css";

import { FaBolt, FaShip, FaDoorClosed, FaVideo, FaNetworkWired, FaClipboardList, FaUserCircle, FaCashRegister, FaListAlt } from "react-icons/fa";
import { MdDirectionsBoatFilled } from "react-icons/md";

export default function Dashboard() {
  const navigate = useNavigate();

  // 9 大項目：名稱 + icon + 導頁
  const items = useMemo(
    () => [
      { key: "shorePower", title: "岸電控制系統", icon: <FaBolt />, to: "/shore-power" },

      // 船舶動態系統：你目前已有 AIS / 影像辨識 / 船主管理 → 這裡先導到 AIS（你也可改成子選單）
      { key: "shipDynamic", title: "船舶動態系統", icon: <FaShip />, to: "/ais" },

      {
        key: "accessControl",
        title: "門禁管制系統",
        icon: <FaDoorClosed />,
        to: "/access-log",
      },

      { key: "video", title: "影像監控系統", icon: <FaVideo />, to: "/monitoring" },

      // 弱電設備管理：你目前 communication 相關路由 /network /wired /wireless
      { key: "weakElectric", title: "弱電設備管理", icon: <FaNetworkWired />, to: "/network" },

      // 靠泊申請系統：目前路由清單內沒有 → 先導到 /BerthMaster 當暫時入口（你之後有新頁再改）
      { key: "berthApply", title: "靠泊申請系統", icon: <FaClipboardList />, to: "/BerthMaster" },

      // 使用者專區：你目前有 /user-binding
      { key: "userZone", title: "使用者專區", icon: <FaUserCircle />, to: "/user-binding" },

      // 支付計費系統：你目前有 billing-system 的 /items /rates /payment-methods /billing-notice /backend
      // 先導到 /items 當入口
      { key: "billing", title: "支付計費系統", icon: <FaCashRegister />, to: "/items" },

      // 事件日誌紀錄：你目前有 access-control 的 /access-log 或 alerts
      // 先導到 /access-log
      { key: "logs", title: "事件日誌紀錄", icon: <FaListAlt />, to: "/access-log" },
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
          <div className="appdash__title">海口遊艇碼頭</div>
          <div className="appdash__subtitle">智慧碼頭控制中心</div>
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
          <div className="appdash__hint">點選模組進入系統功能</div>
        </footer>
      </div>
    </div>
  );
}
