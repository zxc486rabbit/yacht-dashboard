import React, { useMemo, useState } from "react";
import "../../styles/dashboard/Dashboard.css"; // 共用 Dashboard 視覺（
import "../../styles/admin/admin.settings.css"; // 統一內頁樣式

const ROLE_OPTIONS = ["管理者", "工程師", "船長", "船員"];

const DEFAULT_PERMS = () => ({
  管理者: { view: true, edit: true, del: true },
  工程師: { view: true, edit: true, del: true },
  船長: { view: true, edit: true, del: true },
  船員: { view: true, edit: true, del: true },
});

const seedSidebar = [
  "岸電控制系統",
  "船舶識別",
  "門禁管制",
  "影像監控",
  "通訊傳輸",
  "使用者專區",
  "支付計費",
  "權限管理",
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function FeaturePageManager() {
  const initialItems = useMemo(
    () =>
      seedSidebar.map((name) => ({
        id: uid(),
        name,
        perms: DEFAULT_PERMS(),
      })),
    []
  );

  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState(initialItems[0]?.id || "");
  const active = useMemo(
    () => items.find((x) => x.id === activeId) || null,
    [items, activeId]
  );

  const [draftName, setDraftName] = useState(active?.name || "");
  const [draftPerms, setDraftPerms] = useState(active?.perms || DEFAULT_PERMS());

  React.useEffect(() => {
    if (!active) return;
    setDraftName(active.name);
    setDraftPerms(active.perms || DEFAULT_PERMS());
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = useMemo(() => {
    const name = String(draftName || "").trim();
    if (!name) return false;
    const dup = items.some((x) => x.id !== activeId && x.name.trim() === name);
    if (dup) return false;
    return true;
  }, [draftName, items, activeId]);

  function handleAdd() {
    const base = "新功能頁";
    let name = base;
    let i = 1;
    while (items.some((x) => x.name === name)) {
      i += 1;
      name = `${base}${i}`;
    }

    const newItem = { id: uid(), name, perms: DEFAULT_PERMS() };
    setItems((prev) => [newItem, ...prev]);
    setActiveId(newItem.id);
  }

  function handleDelete(id) {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (id === activeId) setActiveId(next[0]?.id || "");
      return next;
    });
  }

  function handleToggle(role, key) {
    setDraftPerms((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev?.[role]?.[key] },
    }));
  }

  function handleSave() {
    if (!active || !canSave) return;
    const name = String(draftName || "").trim();
    setItems((prev) =>
      prev.map((x) =>
        x.id === activeId ? { ...x, name, perms: draftPerms } : x
      )
    );
  }

  function handleReset() {
    if (!active) return;
    setDraftName(active.name);
    setDraftPerms(active.perms || DEFAULT_PERMS());
  }

  return (
    <div className="appdash">
      <div className="as-page">
        <div className="as-header">
          <div>
            <h2 className="as-title">後臺管理｜功能頁管理</h2>
            <div className="as-subtitle">
              管理新增功能頁與各角色預設權限（檢視 / 編輯 / 刪除）
            </div>
          </div>

          <div className="as-actions">
            <button className="as-btn" onClick={handleReset} disabled={!active}>
              重設
            </button>
            <button
              className="as-btn primary"
              onClick={handleSave}
              disabled={!active || !canSave}
            >
              儲存
            </button>
          </div>
        </div>

        <div className="as-grid">
          {/* Left list */}
          <section className="as-card as-card--list">
            <div className="as-card-head">
              <div className="as-card-title">功能頁清單</div>
              <button className="as-btn small" onClick={handleAdd}>
                add
              </button>
            </div>

            <div className="as-list">
              {items.map((it) => {
                const isActive = it.id === activeId;
                return (
                  <div
                    key={it.id}
                    className={`as-list-item ${isActive ? "is-active" : ""}`}
                    onClick={() => setActiveId(it.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setActiveId(it.id);
                    }}
                  >
                    <div className="as-list-item-name">{it.name}</div>
                    <button
                      className="as-icon-btn danger"
                      title="刪除"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(it.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {!items.length && (
                <div className="as-empty">目前沒有功能頁</div>
              )}
            </div>
          </section>

          {/* Right editor */}
          <section className="as-card as-card--editor">
            <div className="as-card-head">
              <div className="as-card-title">新增 / 編輯功能頁</div>
              <div className="as-card-hint">
                選取左側項目後，在此調整名稱與預設權限
              </div>
            </div>

            {!active ? (
              <div className="as-empty">請先新增或選取左側項目</div>
            ) : (
              <>
                <div className="as-form">
                  <label className="as-label">功能頁名稱</label>
                  <input
                    className="as-input"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="例如：泊位排程、設備維護、告警中心..."
                  />
                  {!canSave && (
                    <div className="as-help danger">
                      名稱不可空白，且不可與其他項目重複。
                    </div>
                  )}
                </div>

                <div className="as-divider" />

                <div className="as-perms">
                  <div className="as-perms-head">
                    <div className="as-perms-title">角色</div>
                    <div className="as-perms-title">預設權限</div>
                  </div>

                  <div className="as-perms-body">
                    {ROLE_OPTIONS.map((role) => (
                      <div className="as-perm-row" key={role}>
                        <div className="as-perm-role">{role}</div>
                        <div className="as-perm-actions">
                          <PermSwitch
                            label="檢視"
                            checked={!!draftPerms?.[role]?.view}
                            onChange={() => handleToggle(role, "view")}
                          />
                          <PermSwitch
                            label="編輯"
                            checked={!!draftPerms?.[role]?.edit}
                            onChange={() => handleToggle(role, "edit")}
                          />
                          <PermSwitch
                            label="刪除"
                            checked={!!draftPerms?.[role]?.del}
                            onChange={() => handleToggle(role, "del")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function PermSwitch({ label, checked, onChange }) {
  return (
    <label className="as-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="as-switch-ui" />
      <span className="as-switch-label">{label}</span>
    </label>
  );
}
