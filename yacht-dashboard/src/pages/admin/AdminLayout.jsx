// src/pages/admin/AdminLayout.jsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();

  const isAdminHome = loc.pathname === "/admin";

  // 首頁不要包任何外層，避免破壞 AdminDashboard 的全畫面背景
  if (isAdminHome) return <Outlet />;

  // 內頁才顯示返回按鈕（回到 /admin）
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "12px 16px",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => nav("/admin")}
          title="返回後臺管理"
        >
          ← 返回後臺
        </button>
      </div>

      {/* 內頁內容 */}
      <div style={{ padding: "16px" }}>
        <Outlet />
      </div>
    </div>
  );
}
