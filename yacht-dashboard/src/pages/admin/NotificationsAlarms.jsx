import React, { useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import "../../styles/dashboard/Dashboard.css";
import "../../styles/admin/admin.settings.css";

import {
  FaBell,
  FaDoorClosed,
  FaExclamationTriangle,
  FaEnvelope,
  FaMobileAlt,
  FaBroadcastTower,
  FaSave,
  FaUndoAlt,
  FaEdit,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

/** ===== Helpers ===== */
const clone = (x) => JSON.parse(JSON.stringify(x));

const CHANNELS = [
  { key: "email", label: "Email", icon: <FaEnvelope /> },
  { key: "app", label: "App", icon: <FaMobileAlt /> },
  { key: "push", label: "推播", icon: <FaBroadcastTower /> },
];

const SEVERITY = [
  { key: "high", label: "高", badge: "as-badge as-badge--danger" },
  { key: "mid", label: "中", badge: "as-badge as-badge--warn" },
  { key: "low", label: "低", badge: "as-badge as-badge--neutral" },
];

const TAB_DEFS = [
  { key: "summary", label: "告警摘要", icon: <FaBell /> },
  { key: "access", label: "門禁異常", icon: <FaDoorClosed /> },
  { key: "device", label: "設備異常", icon: <FaExclamationTriangle /> },
];

/** ===== Seed rules (假資料，之後可換 API) ===== */
function seedRules() {
  return {
    summary: [
      {
        id: "sum-001",
        name: "高嚴重度未確認 > 3 筆",
        enabled: true,
        severity: "high",
        condition: "OPEN 且 severity=高，數量大於 3",
        debounceMin: 2,
        escalateMin: 10,
        channels: { email: true, app: true, push: true },
        receivers: "值班群組 / 維運主管",
      },
      {
        id: "sum-002",
        name: "同設備 10 分鐘內重複告警",
        enabled: true,
        severity: "mid",
        condition: "同 deviceId、10 分鐘內 >= 5 次",
        debounceMin: 1,
        escalateMin: 15,
        channels: { email: false, app: true, push: true },
        receivers: "值班群組",
      },
      {
        id: "sum-003",
        name: "告警未結案超過 24 小時",
        enabled: false,
        severity: "low",
        condition: "status != CLOSED 且 age > 24h",
        debounceMin: 0,
        escalateMin: 0,
        channels: { email: true, app: false, push: false },
        receivers: "維運主管",
      },
    ],
    access: [
      {
        id: "acc-001",
        name: "門禁強制開啟（疑似破壞）",
        enabled: true,
        severity: "high",
        condition: "Door forced open",
        debounceMin: 0,
        escalateMin: 3,
        channels: { email: true, app: true, push: true },
        receivers: "保全 / 值班群組",
      },
      {
        id: "acc-002",
        name: "連續刷卡失敗（同人/同門）",
        enabled: true,
        severity: "mid",
        condition: "5 分鐘內 >= 5 次 auth fail",
        debounceMin: 1,
        escalateMin: 8,
        channels: { email: false, app: true, push: true },
        receivers: "值班群組",
      },
      {
        id: "acc-003",
        name: "門禁離線超過 5 分鐘",
        enabled: true,
        severity: "mid",
        condition: "device offline > 5m",
        debounceMin: 2,
        escalateMin: 10,
        channels: { email: true, app: false, push: true },
        receivers: "維運值班",
      },
    ],
    device: [
      {
        id: "dev-001",
        name: "攝影機畫面遺失",
        enabled: true,
        severity: "high",
        condition: "video loss / black screen",
        debounceMin: 1,
        escalateMin: 5,
        channels: { email: true, app: true, push: true },
        receivers: "值班群組",
      },
      {
        id: "dev-002",
        name: "設備異常斷線（連線狀態）",
        enabled: true,
        severity: "mid",
        condition: "heartbeat missing > 90s",
        debounceMin: 1,
        escalateMin: 12,
        channels: { email: false, app: true, push: true },
        receivers: "維運值班",
      },
      {
        id: "dev-003",
        name: "設備回報錯誤碼（非致命）",
        enabled: false,
        severity: "low",
        condition: "warning code >= 1",
        debounceMin: 3,
        escalateMin: 0,
        channels: { email: true, app: false, push: false },
        receivers: "維運主管",
      },
    ],
  };
}

function severityMeta(key) {
  return SEVERITY.find((x) => x.key === key) || SEVERITY[2];
}

function countEnabled(rules) {
  return rules.reduce((acc, r) => acc + (r.enabled ? 1 : 0), 0);
}

function channelsText(ch) {
  const on = CHANNELS.filter((c) => !!ch?.[c.key]).map((c) => c.label);
  return on.length ? on.join(" / ") : "—";
}

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/** ===== Component ===== */
export default function AlertRulesSettings() {
  const [tab, setTab] = useState("summary");

  // data
  const [ruleMap, setRuleMap] = useState(() => seedRules());
  const [dirty, setDirty] = useState(false);

  // modal
  const [editing, setEditing] = useState(null); // { tabKey, rule }
  const [draft, setDraft] = useState(null);

  const rules = ruleMap[tab] || [];

  const stats = useMemo(() => {
    const all = Object.values(ruleMap).flat();
    return {
      total: all.length,
      enabled: all.filter((x) => x.enabled).length,
      high: all.filter((x) => x.severity === "high").length,
      mid: all.filter((x) => x.severity === "mid").length,
      low: all.filter((x) => x.severity === "low").length,
    };
  }, [ruleMap]);

  const tabStats = useMemo(() => {
    const list = ruleMap[tab] || [];
    return {
      total: list.length,
      enabled: countEnabled(list),
      high: list.filter((x) => x.severity === "high").length,
    };
  }, [ruleMap, tab]);

  /** ===== actions ===== */
  const markDirty = () => setDirty(true);

  const onSave = async () => {
    // 之後接 API: PUT /admin/alerts/rules
    setDirty(false);
    await Swal.fire("已儲存", "（示意）設定已套用。", "success");
  };

  const onReset = async () => {
    const ok = await Swal.fire({
      title: "重設未儲存變更？",
      text: "會還原為此頁面載入時的狀態（示意）。",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "重設",
      cancelButtonText: "取消",
    }).then((r) => r.isConfirmed);

    if (!ok) return;

    setRuleMap(seedRules());
    setDirty(false);
    setEditing(null);
    setDraft(null);
  };

  const openEdit = (tabKey, rule) => {
    setEditing({ tabKey, rule });
    setDraft(clone(rule));
  };

  const closeEdit = () => {
    setEditing(null);
    setDraft(null);
  };

  const applyDraft = () => {
    if (!editing || !draft) return;

    // simple validations
    if (!draft.name?.trim()) {
      Swal.fire("缺少名稱", "請輸入規則名稱。", "warning");
      return;
    }
    if (!draft.condition?.trim()) {
      Swal.fire("缺少條件", "請輸入觸發條件（可先用文字描述）。", "warning");
      return;
    }

    setRuleMap((prev) => {
      const next = clone(prev);
      const list = next[editing.tabKey] || [];
      const idx = list.findIndex((x) => x.id === draft.id);
      if (idx >= 0) list[idx] = draft;
      next[editing.tabKey] = list;
      return next;
    });

    markDirty();
    closeEdit();
    Swal.fire("已更新", "", "success");
  };

  const addRule = () => {
    const prefix = tab === "summary" ? "sum" : tab === "access" ? "acc" : "dev";
    const newRule = {
      id: genId(prefix),
      name: "新規則",
      enabled: true,
      severity: "mid",
      condition: "",
      debounceMin: 1,
      escalateMin: 10,
      channels: { email: true, app: true, push: false },
      receivers: "",
    };
    setRuleMap((prev) => {
      const next = clone(prev);
      next[tab] = [newRule, ...(next[tab] || [])];
      return next;
    });
    markDirty();
    openEdit(tab, newRule);
  };

  const deleteRule = async (rule) => {
    const ok = await Swal.fire({
      title: "確定刪除規則？",
      text: `「${rule.name}」刪除後無法復原（示意）。`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
    }).then((r) => r.isConfirmed);

    if (!ok) return;

    setRuleMap((prev) => {
      const next = clone(prev);
      next[tab] = (next[tab] || []).filter((x) => x.id !== rule.id);
      return next;
    });
    markDirty();
    Swal.fire("已刪除", "", "success");
  };

  const toggleEnabled = (rule) => {
    setRuleMap((prev) => {
      const next = clone(prev);
      const list = next[tab] || [];
      const idx = list.findIndex((x) => x.id === rule.id);
      if (idx >= 0) list[idx].enabled = !list[idx].enabled;
      next[tab] = list;
      return next;
    });
    markDirty();
  };

  /** ===== render ===== */
  return (
    <div className="as-page">
      {/* Header */}
      <div className="as-header">
        <div className="as-titleBlock">
          <h2 className="as-title as-title--xl">通知與告警設定</h2>
          <div className="as-subtitle">
            依類型配置告警規則與通知方式（Email / App / 推播）
          </div>
        </div>

        <div className="as-actions">
          {dirty && <span className="as-dirty">尚未儲存</span>}

          <button className="as-btn" onClick={onReset} type="button">
            <FaUndoAlt />
            重設
          </button>
          <button className="as-btn primary" onClick={onSave} type="button">
            <FaSave />
            儲存
          </button>
        </div>
      </div>

      {/* Status Row */}
      <div className="as-statusRow">
        <div className="as-statusItem">
          <div className="as-statusLabel">總規則</div>
          <div className="as-statusValue">{stats.total}</div>
        </div>
        <div className="as-statusItem">
          <div className="as-statusLabel">啟用中</div>
          <div className="as-statusValue">{stats.enabled}</div>
        </div>
        <div className="as-statusItem">
          <div className="as-statusLabel">高 / 中 / 低</div>
          <div className="as-statusValue">
            {stats.high} / {stats.mid} / {stats.low}
          </div>
        </div>
        <div className="as-statusItem">
          <div className="as-statusLabel">目前分頁啟用</div>
          <div className="as-statusValue">
            {tabStats.enabled} / {tabStats.total}
          </div>
        </div>
        <div className="as-statusItem">
          <div className="as-statusLabel">目前分頁高嚴重度</div>
          <div className="as-statusValue">{tabStats.high}</div>
        </div>
      </div>

      {/* Main Card (left tabs + right content) */}
      <div className="as-card">
        <div className="as-cardHead">
          <div>
            <div className="as-cardTitle">規則管理</div>
            <div className="as-cardSubtitle">
              左側切換分類；右側管理規則與通知方式。每條規則可獨立配置 Email / App / 推播。
            </div>
          </div>

          <div className="as-rowActions">
            <button className="as-btn primary" onClick={addRule} type="button">
              <FaPlus />
              新增規則
            </button>
          </div>
        </div>

        <div className="as-inCardSplit">
          {/* Left tabs */}
          <aside className="as-inCardTabs">
            <div className="as-inCardTabsList">
              {TAB_DEFS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    className={`as-btn as-tabBtn ${active ? "primary" : ""}`}
                    onClick={() => setTab(t.key)}
                    type="button"
                  >
                    {t.icon}
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="as-tabHint">
              建議做法：
              <ul style={{ margin: "10px 0 0 18px" }}>
                <li>高嚴重度：推播 + App；必要時 Email 給主管。</li>
                <li>避免告警風暴：用「去彈跳（Debounce）」與「升級（Escalate）」控管。</li>
                <li>門禁異常通常需要更短的升級時間。</li>
              </ul>
            </div>
          </aside>

          {/* Right content */}
          <section className="as-inCardContent" style={{ minWidth: 0 }}>
            <div className="as-tableWrap">
              <table className="as-table">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>啟用</th>
                    <th style={{ minWidth: 220 }}>規則名稱</th>
                    <th style={{ width: 110 }}>嚴重度</th>
                    <th>觸發條件</th>
                    <th style={{ width: 200 }}>通知方式</th>
                    <th style={{ width: 220 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="as-empty">
                        目前沒有規則
                      </td>
                    </tr>
                  ) : (
                    rules.map((r) => {
                      const sev = severityMeta(r.severity);
                      return (
                        <tr key={r.id}>
                          <td>
                            <label className="as-switch">
                              <input
                                type="checkbox"
                                checked={!!r.enabled}
                                onChange={() => toggleEnabled(r)}
                              />
                              <span className="as-switch-ui" />
                              <span className="as-switch-label">
                                {r.enabled ? "開" : "關"}
                              </span>
                            </label>
                          </td>

                          <td style={{ fontWeight: 900, color: "var(--ink,#0f172a)" }}>
                            {r.name}
                          </td>

                          <td>
                            <span className={sev.badge}>{sev.label}</span>
                          </td>

                          <td style={{ color: "var(--muted,#64748b)" }}>
                            {r.condition || "—"}
                          </td>

                          <td style={{ fontWeight: 800 }}>
                            {channelsText(r.channels)}
                          </td>

                          <td>
                            <div className="as-inline">
                              <button
                                className="as-btn small"
                                onClick={() => openEdit(tab, r)}
                                type="button"
                              >
                                <FaEdit />
                                編輯
                              </button>

                              <button
                                className="as-btn small danger"
                                onClick={() => deleteRule(r)}
                                type="button"
                              >
                                <FaTrash />
                                刪除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="as-help" style={{ marginTop: 10 }}>
              備註：此頁先用假資料，之後接 API ，以「規則集合」一次性儲存（避免部分更新造成配置不一致）
            </div>
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && draft && (
        <div className="as-modal" role="dialog" aria-modal="true">
          <div className="as-modalCard">
            <div className="as-modalHead">
              <h3>編輯告警規則</h3>
              <button className="x" onClick={closeEdit} type="button" aria-label="Close">
                ×
              </button>
            </div>

            <div className="as-form">
              <div className="as-formGrid">
                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">規則名稱</div>
                    <div className="as-kvfield__hint">顯示於告警摘要/設定清單的名稱。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <input
                      className="as-input"
                      value={draft.name}
                      onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                      placeholder="例：設備離線超過 5 分鐘"
                    />
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">啟用狀態</div>
                    <div className="as-kvfield__hint">關閉後不觸發通知（仍可保留規則）。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <label className="as-switch" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!draft.enabled}
                        onChange={(e) => setDraft((p) => ({ ...p, enabled: e.target.checked }))}
                      />
                      <span className="as-switch-ui" />
                      <span className="as-switch-label">{draft.enabled ? "啟用" : "停用"}</span>
                    </label>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">嚴重度</div>
                    <div className="as-kvfield__hint">用於排序與升級策略（High 通常要更快通知）。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <div className="as-radio">
                      {SEVERITY.map((s) => (
                        <label key={s.key} className="as-radio__item">
                          <input
                            type="radio"
                            name="sev"
                            checked={draft.severity === s.key}
                            onChange={() => setDraft((p) => ({ ...p, severity: s.key }))}
                          />
                          <span className={s.badge}>{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">通知方式（Email / App / 推播）</div>
                    <div className="as-kvfield__hint">可多選。建議高嚴重度至少包含推播或 App。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <div className="as-checks">
                      {CHANNELS.map((c) => (
                        <label key={c.key} className="as-check">
                          <input
                            type="checkbox"
                            checked={!!draft.channels?.[c.key]}
                            onChange={(e) =>
                              setDraft((p) => ({
                                ...p,
                                channels: { ...(p.channels || {}), [c.key]: e.target.checked },
                              }))
                            }
                          />
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            {c.icon}
                            {c.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">去彈跳 Debounce（分鐘）</div>
                    <div className="as-kvfield__hint">避免短時間重複觸發造成告警風暴。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <input
                      className="as-input as-input--sm"
                      type="number"
                      min={0}
                      value={draft.debounceMin ?? 0}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, debounceMin: Number(e.target.value || 0) }))
                      }
                      style={{ maxWidth: 160 }}
                    />
                    <span className="as-inline__sep">分鐘</span>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">升級 Escalate（分鐘）</div>
                    <div className="as-kvfield__hint">持續未處置時升級通知（例如加寄主管）。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <input
                      className="as-input as-input--sm"
                      type="number"
                      min={0}
                      value={draft.escalateMin ?? 0}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, escalateMin: Number(e.target.value || 0) }))
                      }
                      style={{ maxWidth: 160 }}
                    />
                    <span className="as-inline__sep">分鐘</span>
                  </div>
                </div>
              </div>

              <div className="as-sectionDivider" />

              <div className="as-kvfield">
                <div>
                  <div className="as-kvfield__label">觸發條件</div>
                  <div className="as-kvfield__hint">
                    先用文字描述即可；接 API 後可改為條件建構器（type / status / 門檻 / 時間窗）。
                  </div>
                </div>
                <div className="as-kvfield__control" style={{ alignItems: "stretch" }}>
                  <textarea
                    className="as-textarea"
                    value={draft.condition}
                    onChange={(e) => setDraft((p) => ({ ...p, condition: e.target.value }))}
                    placeholder="例：device offline > 5m 或 10 分鐘內重複告警 >= 5 次"
                  />
                </div>
              </div>

              <div className="as-kvfield">
                <div>
                  <div className="as-kvfield__label">通知對象（示意）</div>
                  <div className="as-kvfield__hint">可填群組/角色；接 API 後可改為收件人清單。</div>
                </div>
                <div className="as-kvfield__control">
                  <input
                    className="as-input"
                    value={draft.receivers || ""}
                    onChange={(e) => setDraft((p) => ({ ...p, receivers: e.target.value }))}
                    placeholder="例：值班群組 / 維運主管 / 保全"
                  />
                </div>
              </div>
            </div>

            <div className="as-modalActions">
              <button className="as-btn" onClick={closeEdit} type="button">
                取消
              </button>
              <button className="as-btn primary" onClick={applyDraft} type="button">
                <FaSave />
                套用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
