// src/page/rbac/PermissionManagement.jsx
import React, { useMemo, useState } from "react";
import "./rbac.styles.css";
import RolePermissions from "./RolePermissions";

export default function PermissionManagement() {
  const tabs = useMemo(
    () => [
      { key: "role", label: "角色權限" },
      { key: "account", label: "帳號權限" },
    ],
    []
  );

  const [active, setActive] = useState("role");

  return (
    <div className="rbac-page">
      <div className="rbac-top">
        <h1 className="rbac-title">權限管理</h1>
      </div>

      <div className="rbac-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`rbac-tab ${active === t.key ? "active" : ""}`}
            onClick={() => setActive(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "role" ? (
        <RolePermissions />
      ) : (
        <div className="rbac-card">
          <div className="small-muted">帳號權限頁面：下一步再接。</div>
        </div>
      )}
    </div>
  );
}
