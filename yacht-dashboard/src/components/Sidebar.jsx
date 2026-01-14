// 左側側欄
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

import {
  FaWater,
  FaShip,
  FaDoorClosed,
  FaVideo,
  FaNetworkWired,
  FaFileInvoiceDollar,
  FaThumbtack,
  FaSignInAlt,
  FaUserCircle, 
  FaClipboardList, 
  FaAnchor,
} from "react-icons/fa";

import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // pinned：固定展開（並且會推開右側內容）
  const [pinned, setPinned] = useState(true);

  // hovered：滑過去暫時展開（不推內容，只是覆蓋）
  const [hovered, setHovered] = useState(false);

  // 記錄目前展開的主選單（只會開一組）
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const isExpanded = pinned || hovered;

  // 切 pinned：解除固定時順便把子選單收起來
  const togglePin = () => {
    setPinned((prev) => {
      if (prev) setActiveSubmenu(null);
      return !prev;
    });
  };

  // pinned 時讓主內容讓位（靠 body 的 class 控制）
  useEffect(() => {
    if (pinned) document.body.classList.add("sidebar-pinned");
    else document.body.classList.remove("sidebar-pinned");

    return () => document.body.classList.remove("sidebar-pinned");
  }, [pinned]);

  // 點主選單：展開/收合該組子選單
  //（Sidebar 收合狀態下先不讓點，避免誤觸）
  const handleToggleSubmenu = (index) => {
    if (!isExpanded) return;
    setActiveSubmenu((prev) => (prev === index ? null : index));
  };

  const handleMouseEnter = () => setHovered(true);

  const handleMouseLeave = () => {
    setHovered(false);
    if (!pinned) setActiveSubmenu(null);
  };

  // 選單資料：之後要加/改路由只動這裡就好
  const menus = [
    {
      icon: <FaWater />,
      label: "岸電控制系統",
      children: [
        { label: "岸電儀錶板", path: "/shore-power" },
        { label: "即時監控", path: "/realtime" },
        { label: "船舶基本檔", path: "/BerthMaster" },
        { label: "遠端控管", path: "/remote-control" },
        // { label: "用戶資訊綁定 ?", path: "/user-binding" },
        { label: "歷史報表", path: "/history" },
        { label: "告警中心", path: "/alarm-center" },
        { label: "測試", path: "/test" },
      ],
    },
    {
      icon: <FaShip />,
      label: "船舶識別系統",
      children: [
        { label: "AIS整合模組", path: "/ais" },
        { label: "船舶影像辨識", path: "/image-recognition" },
        { label: "船主船隻管理", path: "/owner-ship" },
      ],
    },
    {
      icon: <FaDoorClosed />,
      label: "門禁管制系統",
      children: [
        { label: "門匣設備管理", path: "/equipment" },
        { label: "門禁排程設定 ?", path: "/schedule" },
        { label: "進出識別紀錄", path: "/access-log" },
        { label: "人員授權管理 ?", path: "/personnel" },
        { label: "異常警示事件", path: "/alerts" },
      ],
    },
    {
      icon: <FaVideo />,
      label: "影像監控系統",
      children: [
        { label: "監控畫面管理", path: "/monitoring" },
        { label: "攝影機管理", path: "/camera" },
        { label: "影像儲存管理", path: "/storage" },
        { label: "警示通報系統 ?", path: "/notifications" },
      ],
    },
    {
      icon: <FaNetworkWired />,
      label: "通訊傳輸系統",
      children: [
        { label: "網路傳輸管理", path: "/network" },
        { label: "有線設備管理", path: "/wired" },
        { label: "無線設備管理", path: "/wireless" },
      ],
    },
    {
     icon: <FaUserCircle />,
     label: "使用者專區",
     children: [
       { label: "船位預約", path: "/user/berth-booking" },
       { label: "我的預約 / 停泊費用", path: "/user/my-bookings" },
     ],
   },
    {
      icon: <FaFileInvoiceDollar />,
      label: "支付計費系統",
      children: [
        { label: "計費項目管理", path: "/items" },
        { label: "邏輯費率管理", path: "/rates" },
        { label: "支付方式支援", path: "/payment-methods" },
        { label: "帳單通知功能", path: "/billing-notice" },
        { label: "後台管理功能", path: "/backend" },
      ],
    },
    {
      icon: <FaClipboardList />,
      label: "權限管理",
      children: [
        { label: "權限設定", path: "/rbac/permissions" },
        { label: "稽核紀錄", path: "/rbac/audit-logs" },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`sidebar d-flex flex-column p-0 position-relative ${isExpanded ? "expanded" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 右上角的固定釘選 */}
      <button
        className={`pin-btn ${pinned ? "pinned" : ""}`}
        onClick={togglePin}
        aria-label="固定/解除固定側欄"
        title={pinned ? "解除固定" : "固定側欄"}
      >
        <FaThumbtack />
      </button>

      {/* Logo / 系統名（建議導到 dashboard） */}
      <Link
        to="/dashboard"
        className="text-center py-4 border-bottom d-block text-decoration-none text-white"
      >
        <h4 className="m-0">遊艇碼頭平台</h4>
      </Link>

      {/* 選單 */}
      <div className="flex-grow-1">
        {menus.map((menu, index) => (
          <div key={index}>
            <button
              type="button"
              className="menu-toggle btn btn-link text-start w-100 text-white"
              onClick={() => handleToggleSubmenu(index)}
            >
              <span className="sidebar-icon">{menu.icon}</span>
              <span className="sidebar-label">{menu.label}</span>
            </button>

            <div className={`submenu ${activeSubmenu === index ? "" : "d-none"}`}>
              {menu.children.map((item, i) => (
                <Link key={i} to={item.path} className="d-block py-1 text-white submenu-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 左下角：登入 / 會員卡 */}
      <div className="sidebar-login border-top">
        {!user ? (
          <Link to="/login" className="login-link">
            <FaSignInAlt className="me-2" />
            <span className="sidebar-label">登入</span>
          </Link>
        ) : (
          <div className="user-box">
            <button type="button" className="user-card" onClick={() => navigate("/account")}>
              <div className="user-avatar" aria-hidden="true">
                {(user.name || "U").slice(0, 1)}
              </div>

              <div className="user-meta">
                <div className="user-name sidebar-label">{user.name}</div>
                <div className="user-role">{user.role || "一般使用者"}</div>
              </div>
            </button>

            <button type="button" className="btn btn-sm btn-outline-light w-100 mt-2" onClick={handleLogout}>
              登出
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
