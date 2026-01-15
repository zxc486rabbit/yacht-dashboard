import React, { useMemo, useState } from "react";
import "./rbac.styles.css";

const DEFAULT_GROUPS = [
  {
    key: "shorePower",
    title: "岸電控制系統",
    items: [
      { key: "sp_history", name: "歷史紀錄查詢" },
      { key: "sp_equipment", name: "岸電設備監控" },
      { key: "sp_alarm", name: "岸電告警" },
    ],
  },
  {
    key: "ais",
    title: "船舶識別系統",
    items: [
      { key: "ais_integrated", name: "AIS整合模組" },
      { key: "ais_shipManage", name: "船舶主檔管理" },
      { key: "ais_shipDetect", name: "船舶影像辨識" },
    ],
  },
  {
    key: "access",
    title: "門禁管制系統",
    items: [
      { key: "ac_door", name: "門禁設備管理" },
      { key: "ac_schedule", name: "門禁排程設定" },
      { key: "ac_record", name: "進出識別紀錄" },
      { key: "ac_person", name: "人員授權管理" },
      { key: "ac_event", name: "異常警示事件" },
    ],
  },
  {
    key: "cctv",
    title: "影像監控系統",
    items: [
      { key: "cc_monitor", name: "監控畫面管理" },
      { key: "cc_camera", name: "攝影機管理" },
      { key: "cc_storage", name: "影像儲存管理" },
      { key: "cc_alarm", name: "警示通報系統" },
    ],
  },
  {
    key: "comm",
    title: "通訊傳輸系統",
    items: [
      { key: "cm_network", name: "網路傳輸管理" },
      { key: "cm_wired", name: "有線設備管理" },
      { key: "cm_wireless", name: "無線設備管理" },
    ],
  },
  {
    key: "billing",
    title: "支付計費系統",
    items: [{ key: "bl_project", name: "計費項目管理" }],
  },
];

// 權限動作（可依後端調整）
const ACTIONS = [
  { key: "view", label: "檢視" },
  { key: "edit", label: "編輯" },
  { key: "delete", label: "刪除" },
];

export default function PermissionEditorModal({
  open,
  title = "編輯權限",
  groups = DEFAULT_GROUPS,
  initial = {}, // { [itemKey]: { view:true, create:false, ... } }
  onClose,
  onSave,
}) {
  const [openGroup, setOpenGroup] = useState(groups[0]?.key ?? null);
  const [groupVisibility, setGroupVisibility] = useState(() => {
    // 初始化大項目可見性
    const vis = {};
    groups.forEach((g) => {
      vis[g.key] = true;
    });
    return vis;
  });

  const [perm, setPerm] = useState(() => structuredClone(initial || {}));

  // open時重新帶入初值（避免上次編輯殘留）
  React.useEffect(() => {
    if (!open) return;
    setPerm(structuredClone(initial || {}));
    setOpenGroup(groups[0]?.key ?? null);
    // 重置大項目可見性
    const vis = {};
    groups.forEach((g) => {
      vis[g.key] = true;
    });
    setGroupVisibility(vis);
  }, [open, initial, groups]);

  const flatItems = useMemo(() => {
    return groups.flatMap((g) => g.items.map((it) => ({ ...it, groupKey: g.key })));
  }, [groups]);

  const toggleGroupVisibility = (groupKey) => {
    setGroupVisibility((prev) => {
      const next = { ...prev };
      next[groupKey] = !prev[groupKey];
      
      // 如果設為不可見，清除該組所有子項目的權限
      if (!next[groupKey]) {
        const group = groups.find((g) => g.key === groupKey);
        if (group) {
          setPerm((prevPerm) => {
            const nextPerm = structuredClone(prevPerm || {});
            group.items.forEach((it) => {
              nextPerm[it.key] = {};
            });
            return nextPerm;
          });
        }
      }
      
      return next;
    });
  };

  const toggle = (itemKey, actionKey) => {
    setPerm((prev) => {
      const next = structuredClone(prev || {});
      if (!next[itemKey]) next[itemKey] = {};
      next[itemKey][actionKey] = !next[itemKey][actionKey];
      return next;
    });
  };

  const setRowAll = (itemKey, value) => {
    setPerm((prev) => {
      const next = structuredClone(prev || {});
      if (!next[itemKey]) next[itemKey] = {};
      ACTIONS.forEach((a) => (next[itemKey][a.key] = value));
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="rbac-modal-backdrop" role="dialog" aria-modal="true">
      <div className="rbac-modal">
        <div className="rbac-modal-header">
          <h3 className="rbac-modal-title">{title}</h3>
          <button type="button" className="rbac-btn rbac-btn-ghost" onClick={onClose}>
            關閉
          </button>
        </div>

        <div className="rbac-modal-body rbac-perm-layout">
          {/* 左側：系統大項 */}
          <aside className="rbac-perm-left">
            {groups.map((g) => {
              const isOpen = openGroup === g.key;
              const isVisible = groupVisibility[g.key];
              return (
                <div key={g.key} className="rbac-perm-group">
                  <button
                    type="button"
                    className={`rbac-perm-group-header ${isOpen ? "open" : ""} ${!isVisible ? "disabled" : ""}`}
                    onClick={() => setOpenGroup(isOpen ? null : g.key)}
                  >
                    <span>{g.title}</span>
                  </button>
                  
                  <div className={`rbac-perm-group-body ${isOpen ? "open" : ""}`}>
                    <label className="rbac-perm-check" style={{ marginTop: '8px', marginLeft: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleGroupVisibility(g.key)}
                      />
                      <span style={{ fontWeight: 'bold' }}>可檢視此系統</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </aside>

          {/* 右側：細項權限表 */}
          <section className="rbac-perm-right">
            <div className="rbac-perm-table">
              <div className="rbac-perm-head">
                <div className="col-name">細項</div>
                <div className="col-actions">權限</div>
              </div>

              <div className="rbac-perm-rows">
                {flatItems
                  .filter((it) => it.groupKey === openGroup && groupVisibility[it.groupKey])
                  .map((it) => {
                    const row = perm[it.key] || {};
                    const allOn = ACTIONS.every((a) => !!row[a.key]);
                    return (
                      <div className="rbac-perm-row" key={it.key} id={`perm-row-${it.key}`}>
                        <div className="col-name">
                          <div className="rbac-perm-item-title">{it.name}</div>
                        </div>

                        <div className="col-actions">
                          <button
                            type="button"
                            className="rbac-btn rbac-btn-xs rbac-btn-ghost"
                            onClick={() => setRowAll(it.key, !allOn)}
                          >
                            {allOn ? "全清" : "全選"}
                          </button>

                          {ACTIONS.map((a) => (
                            <label key={a.key} className="rbac-perm-check">
                              <input
                                type="checkbox"
                                checked={!!row[a.key]}
                                onChange={() => toggle(it.key, a.key)}
                              />
                              <span>{a.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        </div>

        <div className="rbac-modal-footer">
          <button type="button" className="rbac-btn rbac-btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="rbac-btn"
            onClick={() => onSave?.(perm)}
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}
