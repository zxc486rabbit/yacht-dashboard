import React, { useMemo, useState } from "react";
import "./rbac.styles.css";
import RolePermissions from "./RolePermissions";
import AccountManagement from "./AccountManagement";

export default function PermissionManagement() {
  const tabs = useMemo(
    () => [
      { key: "account", label: "帳號權限" },
      { key: "role", label: "角色權限" },
    ],
    []
  );

  // 目前分頁
  const [active, setActive] = useState("account");

  const handleKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    e.preventDefault();
    const idx = tabs.findIndex((t) => t.key === active);
    const nextIdx = e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;

    setActive(tabs[nextIdx].key);
  };

  return (
    <div className="rbac-page">
      <div className="rbac-top">
        <h1 className="rbac-title">權限設定</h1>
      </div>

      <div className="rbac-tabs" role="tablist" aria-label="權限設定分頁" onKeyDown={handleKeyDown}>
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`rbac-tab ${isActive ? "active" : ""}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`rbac-panel-${t.key}`}
              id={`rbac-tab-${t.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rbac-content">
        <section role="tabpanel" id="rbac-panel-account" aria-labelledby="rbac-tab-account" hidden={active !== "account"}>
          {active === "account" ? (
            <div className="rbac-card-wrap">
              <AccountManagement />
            </div>
          ) : null}
        </section>

        <section role="tabpanel" id="rbac-panel-role" aria-labelledby="rbac-tab-role" hidden={active !== "role"}>
          {active === "role" ? (
            <div className="rbac-card-wrap">
              <RolePermissions />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
