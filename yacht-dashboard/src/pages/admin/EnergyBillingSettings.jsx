// EnergyBillingSettings.jsx
import React, { useMemo, useState } from "react";
import "../../styles/dashboard/Dashboard.css";
import "../../styles/admin/admin.settings.css";

/**
 UI-only（假資料）能耗與計費設定
 **/

const DEFAULT_SETTINGS = {
  // 1. 電價 / 水價設定（基礎單價）
  basePrice: {
    electricity: 5.0,
    water: 30.0,
    electricityUnit: "元/度",
    waterUnit: "元/度",
  },

  // 2. 計費方式（時租 / 日租 / 用量）
  billingMode: {
    electricity: "usage", // hour | day | usage
    water: "usage",
    berth: "day",
  },

  // 3. 峰值 / 離峰費率
  tou: {
    enabled: true,
    peak: {
      multiplier: 1.5,
      start: "08:00",
      end: "22:00",
      weekdaysOnly: true,
    },
    offPeak: { multiplier: 0.8 },
    applyTo: { electricity: true, water: false },
  },

  // 4. 異常用量判定規則
  anomaly: {
    enabled: true,
    baseline: "last_7d_avg", // last_7d_avg | last_30d_avg | fixed
    fixedBaselineKwhPerDay: 10,
    fixedBaselineWaterPerDay: 2,
    thresholdMultiplier: 3,
    hardLimitKwhPerDay: 80,
    hardLimitWaterPerDay: 15,
    notifyChannels: {
      dashboard: true,
      email: true,
      sms: false,
      line: false,
    },
  },

  // 5. 稅率、發票類型
  taxInvoice: {
    taxEnabled: true,
    taxRate: 5,
    invoiceType: "b2c", // b2c | b2b | donation | none
    invoiceCarrier: "email", // email | paper | mobile_barcode | none
    rounding: "round", // round | floor | ceil
  },

  // 6. 每席計費綁定規則
  berthBinding: {
    mode: "per_berth", // per_berth | per_meter | custom_group
    defaultBerthTariff: "A",
    allowOverridePerBerth: true,
    groups: [
      { id: 1, name: "A 區（近入口）", tariff: "A", note: "人流較多，預設日租" },
      { id: 2, name: "B 區（內側）", tariff: "B", note: "一般區域" },
      { id: 3, name: "VIP 區", tariff: "VIP", note: "專案價" },
    ],
    berthMap: [
      { id: "A-01", group: "A", tariff: "A", enabled: true },
      { id: "A-02", group: "A", tariff: "A", enabled: true },
      { id: "B-01", group: "B", tariff: "B", enabled: true },
      { id: "VIP-01", group: "VIP", tariff: "VIP", enabled: true },
    ],
  },
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function EnergyBillingSettings() {
  const [activeTab, setActiveTab] = useState("price");

  const [settings, setSettings] = useState(() => clone(DEFAULT_SETTINGS));
  const [lastSaved, setLastSaved] = useState(() => clone(DEFAULT_SETTINGS));

  const dirty = useMemo(() => !isEqual(settings, lastSaved), [settings, lastSaved]);

  const setPath = (path, value) => {
    setSettings((prev) => {
      const next = clone(prev);
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) ref = ref[path[i]];
      ref[path[path.length - 1]] = value;
      return next;
    });
  };

  const togglePath = (path) => {
    setSettings((prev) => {
      const next = clone(prev);
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) ref = ref[path[i]];
      const key = path[path.length - 1];
      ref[key] = !ref[key];
      return next;
    });
  };

  const onSave = () => setLastSaved(clone(settings));
  const onReset = () => setSettings(clone(lastSaved));

  const title =
    activeTab === "price"
      ? "電價 / 水價設定"
      : activeTab === "billing"
      ? "計費方式（時租 / 日租 / 用量）"
      : activeTab === "tou"
      ? "峰值 / 離峰費率"
      : activeTab === "anomaly"
      ? "異常用量判定規則"
      : activeTab === "tax"
      ? "稅率、發票類型"
      : "每席計費綁定規則";

  const subtitle =
    activeTab === "price"
      ? "設定基礎單價（未套用峰離峰前的基準）。"
      : activeTab === "billing"
      ? "分別設定電/水/席位的主要計價模式（UI 假資料）。"
      : activeTab === "tou"
      ? "以倍率作用於基礎單價；可指定時段與適用項目（UI 假資料）。"
      : activeTab === "anomaly"
      ? "基準、倍率門檻、硬上限與通知通道（UI 假資料）。"
      : activeTab === "tax"
      ? "稅率、發票開立類型、載具與金額進位規則（UI 假資料）。"
      : "席位如何對應費率群組與是否允許單席覆寫（UI 假資料）。";

  return (
    <div className="as-page">
      <div className="as-header">
        <div className="as-titleWrap">
          <h2 className="as-title">能耗與計費設定</h2>
        </div>
      </div>

      <div className="as-card">
        <div className="as-inCardSplit">
          {/* Left Tabs */}
          <div className="as-inCardTabs">
            <div className="as-inCardTabsList">
              <button
                className={`as-btn as-tabBtn ${activeTab === "price" ? "primary" : "ghost"}`}
                onClick={() => setActiveTab("price")}
              >
                電價 / 水價設定
              </button>

              <button
                className={`as-btn as-tabBtn ${activeTab === "billing" ? "primary" : "ghost"}`}
                onClick={() => setActiveTab("billing")}
              >
                計費方式（時租 / 日租 / 用量）
              </button>

              <button
                className={`as-btn as-tabBtn ${activeTab === "tou" ? "primary" : "ghost"}`}
                onClick={() => setActiveTab("tou")}
              >
                峰值 / 離峰費率
              </button>

              <button
                className={`as-btn as-tabBtn ${activeTab === "anomaly" ? "primary" : "ghost"}`}
                onClick={() => setActiveTab("anomaly")}
              >
                異常用量判定規則
              </button>

              <button
                className={`as-btn as-tabBtn ${activeTab === "tax" ? "primary" : "ghost"}`}
                onClick={() => setActiveTab("tax")}
              >
                稅率、發票類型
              </button>

              <button
                className={`as-btn as-tabBtn ${activeTab === "bind" ? "primary" : "ghost"}`}
                onClick={() => setActiveTab("bind")}
              >
                每席計費綁定規則
              </button>
            </div>

            <div className="as-tabHint">在左側選擇分頁，右側顯示設定內容。</div>
          </div>

          {/* Right Content */}
          <div className="as-inCardContent">
            <div className="as-cardHead" style={{ paddingBottom: 8 }}>
              <div>
                <div className="as-cardTitle">{title}</div>
                <div className="as-cardSubtitle">{subtitle}</div>
              </div>

              <div className="as-rowActions">
                <button className="as-btn primary" onClick={onSave} disabled={!dirty}>
                  儲存
                </button>
                <button className="as-btn" onClick={onReset} disabled={!dirty}>
                  還原
                </button>
              </div>
            </div>

            {/* ===== Tab: price ===== */}
            {activeTab === "price" && (
              <div className="as-formGrid">
                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">電價基準</div>
                    <div className="as-kvfield__hint">例如：5 元/度。後續峰離峰以倍率調整。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <div className="as-inline" style={{ width: "100%" }}>
                      <input
                        className="as-input"
                        type="number"
                        step="0.01"
                        value={settings.basePrice.electricity}
                        onChange={(e) => setPath(["basePrice", "electricity"], Number(e.target.value))}
                      />
                      <select
                        className="as-input"
                        value={settings.basePrice.electricityUnit}
                        onChange={(e) => setPath(["basePrice", "electricityUnit"], e.target.value)}
                      >
                        <option value="元/度">元/度</option>
                        <option value="元/kWh">元/kWh</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">水價基準</div>
                    <div className="as-kvfield__hint">例如：30 元/度（或元/立方）。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <div className="as-inline" style={{ width: "100%" }}>
                      <input
                        className="as-input"
                        type="number"
                        step="0.01"
                        value={settings.basePrice.water}
                        onChange={(e) => setPath(["basePrice", "water"], Number(e.target.value))}
                      />
                      <select
                        className="as-input"
                        value={settings.basePrice.waterUnit}
                        onChange={(e) => setPath(["basePrice", "waterUnit"], e.target.value)}
                      >
                        <option value="元/度">元/度</option>
                        <option value="元/立方">元/立方</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== Tab: billing ===== */}
            {activeTab === "billing" && (
              <div className="as-formGrid">
                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">電費計費方式</div>
                    <div className="as-kvfield__hint">用量：依 kWh；時租/日租：依時間區間。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <div className="as-radio">
                      {[
                        { k: "hour", t: "時租" },
                        { k: "day", t: "日租" },
                        { k: "usage", t: "用量" },
                      ].map((opt) => (
                        <label key={opt.k} className="as-radio__item">
                          <input
                            type="radio"
                            name="billing_electricity"
                            checked={settings.billingMode.electricity === opt.k}
                            onChange={() => setPath(["billingMode", "electricity"], opt.k)}
                          />
                          {opt.t}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">水費計費方式</div>
                    <div className="as-kvfield__hint">通常建議用量；也可依時/日採包套。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <div className="as-radio">
                      {[
                        { k: "hour", t: "時租" },
                        { k: "day", t: "日租" },
                        { k: "usage", t: "用量" },
                      ].map((opt) => (
                        <label key={opt.k} className="as-radio__item">
                          <input
                            type="radio"
                            name="billing_water"
                            checked={settings.billingMode.water === opt.k}
                            onChange={() => setPath(["billingMode", "water"], opt.k)}
                          />
                          {opt.t}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">每席（泊位）計費方式</div>
                    <div className="as-kvfield__hint">席位租金主模式（可與水電分離）。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <div className="as-radio">
                      {[
                        { k: "hour", t: "時租" },
                        { k: "day", t: "日租" },
                        { k: "usage", t: "用量" },
                      ].map((opt) => (
                        <label key={opt.k} className="as-radio__item">
                          <input
                            type="radio"
                            name="billing_berth"
                            checked={settings.billingMode.berth === opt.k}
                            onChange={() => setPath(["billingMode", "berth"], opt.k)}
                          />
                          {opt.t}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== Tab: tou ===== */}
            {activeTab === "tou" && (
              <>
                <div className="as-formGrid">
                  <div className="as-kvfield">
                    <div>
                      <div className="as-kvfield__label">啟用峰離峰</div>
                      <div className="as-kvfield__hint">關閉後不套用尖峰/離峰倍率。</div>
                    </div>
                    <div className="as-kvfield__control">
                      <label className="as-switch">
                        <input
                          type="checkbox"
                          checked={settings.tou.enabled}
                          onChange={() => togglePath(["tou", "enabled"])}
                        />
                        <span className="as-switch-ui" />
                        <span className="as-switch-label">{settings.tou.enabled ? "已啟用" : "未啟用"}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className={settings.tou.enabled ? "" : "is-disabled"}>
                  <div className="as-formGrid">
                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">尖峰倍率</div>
                        <div className="as-kvfield__hint">基價 × 倍率</div>
                      </div>
                      <div className="as-kvfield__control">
                        <input
                          className="as-input"
                          type="number"
                          step="0.01"
                          value={settings.tou.peak.multiplier}
                          onChange={(e) => setPath(["tou", "peak", "multiplier"], Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">離峰倍率</div>
                        <div className="as-kvfield__hint">基價 × 倍率</div>
                      </div>
                      <div className="as-kvfield__control">
                        <input
                          className="as-input"
                          type="number"
                          step="0.01"
                          value={settings.tou.offPeak.multiplier}
                          onChange={(e) => setPath(["tou", "offPeak", "multiplier"], Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">尖峰時段</div>
                        <div className="as-kvfield__hint">起迄時間；跨日由後端拆段。</div>
                      </div>
                      <div className="as-kvfield__control">
                        <div className="as-inline" style={{ width: "100%" }}>
                          <input
                            className="as-input"
                            type="time"
                            value={settings.tou.peak.start}
                            onChange={(e) => setPath(["tou", "peak", "start"], e.target.value)}
                          />
                          <span className="as-inline__sep">—</span>
                          <input
                            className="as-input"
                            type="time"
                            value={settings.tou.peak.end}
                            onChange={(e) => setPath(["tou", "peak", "end"], e.target.value)}
                          />
                          <label className="as-check" style={{ marginLeft: 8 }}>
                            <input
                              type="checkbox"
                              checked={settings.tou.peak.weekdaysOnly}
                              onChange={() => togglePath(["tou", "peak", "weekdaysOnly"])}
                            />
                            僅平日
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">適用項目</div>
                        <div className="as-kvfield__hint">峰離峰是否套用到電/水。</div>
                      </div>
                      <div className="as-kvfield__control">
                        <div className="as-checks">
                          <label className="as-check">
                            <input
                              type="checkbox"
                              checked={settings.tou.applyTo.electricity}
                              onChange={() => togglePath(["tou", "applyTo", "electricity"])}
                            />
                            電費
                          </label>
                          <label className="as-check">
                            <input
                              type="checkbox"
                              checked={settings.tou.applyTo.water}
                              onChange={() => togglePath(["tou", "applyTo", "water"])}
                            />
                            水費
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="as-subcard">
                    <div className="as-kvfield" style={{ gridTemplateColumns: "280px 1fr" }}>
                      <div>
                        <div className="as-kvfield__label">費率預覽（示意）</div>
                        <div className="as-kvfield__hint">以目前基價計算（UI 驗證用）。</div>
                      </div>
                      <div className="as-kvfield__control" style={{ alignItems: "flex-start" }}>
                        <div className="as-pills">
                          <span className="as-pill">
                            電尖峰：{(settings.basePrice.electricity * settings.tou.peak.multiplier).toFixed(2)}{" "}
                            {settings.basePrice.electricityUnit}
                          </span>
                          <span className="as-pill">
                            電離峰：{(settings.basePrice.electricity * settings.tou.offPeak.multiplier).toFixed(2)}{" "}
                            {settings.basePrice.electricityUnit}
                          </span>
                          <span className="as-pill">
                            水尖峰：{(settings.basePrice.water * settings.tou.peak.multiplier).toFixed(2)}{" "}
                            {settings.basePrice.waterUnit}
                          </span>
                          <span className="as-pill">
                            水離峰：{(settings.basePrice.water * settings.tou.offPeak.multiplier).toFixed(2)}{" "}
                            {settings.basePrice.waterUnit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ===== Tab: anomaly ===== */}
            {activeTab === "anomaly" && (
              <>
                <div className="as-formGrid">
                  <div className="as-kvfield">
                    <div>
                      <div className="as-kvfield__label">啟用異常偵測</div>
                      <div className="as-kvfield__hint">用於告警與稽核（UI 假資料）。</div>
                    </div>
                    <div className="as-kvfield__control">
                      <label className="as-switch">
                        <input
                          type="checkbox"
                          checked={settings.anomaly.enabled}
                          onChange={() => togglePath(["anomaly", "enabled"])}
                        />
                        <span className="as-switch-ui" />
                        <span className="as-switch-label">{settings.anomaly.enabled ? "已啟用" : "未啟用"}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className={settings.anomaly.enabled ? "" : "is-disabled"}>
                  <div className="as-formGrid">
                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">基準用量來源</div>
                        <div className="as-kvfield__hint">倍率門檻計算的參考基準。</div>
                      </div>
                      <div className="as-kvfield__control">
                        <select
                          className="as-input"
                          value={settings.anomaly.baseline}
                          onChange={(e) => setPath(["anomaly", "baseline"], e.target.value)}
                        >
                          <option value="last_7d_avg">近 7 日平均</option>
                          <option value="last_30d_avg">近 30 日平均</option>
                          <option value="fixed">固定基準</option>
                        </select>
                      </div>
                    </div>

                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">倍率門檻</div>
                        <div className="as-kvfield__hint">超過基準 × N 判定異常。</div>
                      </div>
                      <div className="as-kvfield__control">
                        <input
                          className="as-input"
                          type="number"
                          step="0.1"
                          value={settings.anomaly.thresholdMultiplier}
                          onChange={(e) => setPath(["anomaly", "thresholdMultiplier"], Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {settings.anomaly.baseline === "fixed" && (
                    <div className="as-subcard">
                      <div className="as-formGrid">
                        <div className="as-kvfield">
                          <div>
                            <div className="as-kvfield__label">固定基準：電（每日）</div>
                            <div className="as-kvfield__hint">kWh / 日</div>
                          </div>
                          <div className="as-kvfield__control">
                            <input
                              className="as-input"
                              type="number"
                              step="0.1"
                              value={settings.anomaly.fixedBaselineKwhPerDay}
                              onChange={(e) =>
                                setPath(["anomaly", "fixedBaselineKwhPerDay"], Number(e.target.value))
                              }
                            />
                          </div>
                        </div>

                        <div className="as-kvfield">
                          <div>
                            <div className="as-kvfield__label">固定基準：水（每日）</div>
                            <div className="as-kvfield__hint">度/日（依你水表單位）</div>
                          </div>
                          <div className="as-kvfield__control">
                            <input
                              className="as-input"
                              type="number"
                              step="0.1"
                              value={settings.anomaly.fixedBaselineWaterPerDay}
                              onChange={(e) =>
                                setPath(["anomaly", "fixedBaselineWaterPerDay"], Number(e.target.value))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="as-sectionDivider" />

                  <div className="as-formGrid">
                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">硬上限：電（每日）</div>
                        <div className="as-kvfield__hint">超過即直接判定異常。</div>
                      </div>
                      <div className="as-kvfield__control">
                        <div className="as-inline">
                          <input
                            className="as-input"
                            type="number"
                            step="0.1"
                            value={settings.anomaly.hardLimitKwhPerDay}
                            onChange={(e) => setPath(["anomaly", "hardLimitKwhPerDay"], Number(e.target.value))}
                          />
                          <span className="as-inline__sep">kWh/日</span>
                        </div>
                      </div>
                    </div>

                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">硬上限：水（每日）</div>
                        <div className="as-kvfield__hint">超過即直接判定異常。</div>
                      </div>
                      <div className="as-kvfield__control">
                        <div className="as-inline">
                          <input
                            className="as-input"
                            type="number"
                            step="0.1"
                            value={settings.anomaly.hardLimitWaterPerDay}
                            onChange={(e) => setPath(["anomaly", "hardLimitWaterPerDay"], Number(e.target.value))}
                          />
                          <span className="as-inline__sep">度/日</span>
                        </div>
                      </div>
                    </div>

                    <div className="as-kvfield">
                      <div>
                        <div className="as-kvfield__label">通知通道</div>
                        <div className="as-kvfield__hint">純 UI：可對接站內通知或外部渠道。</div>
                      </div>
                      <div className="as-kvfield__control">
                        <div className="as-checks">
                          <label className="as-check">
                            <input
                              type="checkbox"
                              checked={settings.anomaly.notifyChannels.dashboard}
                              onChange={() => togglePath(["anomaly", "notifyChannels", "dashboard"])}
                            />
                            後臺通知
                          </label>
                          <label className="as-check">
                            <input
                              type="checkbox"
                              checked={settings.anomaly.notifyChannels.email}
                              onChange={() => togglePath(["anomaly", "notifyChannels", "email"])}
                            />
                            Email
                          </label>
                          <label className="as-check">
                            <input
                              type="checkbox"
                              checked={settings.anomaly.notifyChannels.sms}
                              onChange={() => togglePath(["anomaly", "notifyChannels", "sms"])}
                            />
                            簡訊
                          </label>
                          <label className="as-check">
                            <input
                              type="checkbox"
                              checked={settings.anomaly.notifyChannels.line}
                              onChange={() => togglePath(["anomaly", "notifyChannels", "line"])}
                            />
                            LINE
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ===== Tab: tax ===== */}
            {activeTab === "tax" && (
              <div className="as-formGrid">
                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">稅率啟用</div>
                    <div className="as-kvfield__hint">未啟用則所有費用不加稅。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <label className="as-switch">
                      <input
                        type="checkbox"
                        checked={settings.taxInvoice.taxEnabled}
                        onChange={() => togglePath(["taxInvoice", "taxEnabled"])}
                      />
                      <span className="as-switch-ui" />
                      <span className="as-switch-label">{settings.taxInvoice.taxEnabled ? "已啟用" : "未啟用"}</span>
                    </label>
                  </div>
                </div>

                <div className={settings.taxInvoice.taxEnabled ? "" : "is-disabled"}>
                  <div className="as-kvfield">
                    <div>
                      <div className="as-kvfield__label">稅率（%）</div>
                      <div className="as-kvfield__hint">例如：5</div>
                    </div>
                    <div className="as-kvfield__control">
                      <input
                        className="as-input"
                        type="number"
                        step="0.1"
                        value={settings.taxInvoice.taxRate}
                        onChange={(e) => setPath(["taxInvoice", "taxRate"], Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">發票類型</div>
                    <div className="as-kvfield__hint">純 UI：後端可對接電子發票/捐贈/不開立。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <select
                      className="as-input"
                      value={settings.taxInvoice.invoiceType}
                      onChange={(e) => setPath(["taxInvoice", "invoiceType"], e.target.value)}
                    >
                      <option value="b2c">B2C（個人）</option>
                      <option value="b2b">B2B（公司）</option>
                      <option value="donation">捐贈</option>
                      <option value="none">不開立</option>
                    </select>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">載具/交付方式</div>
                    <div className="as-kvfield__hint">Email、紙本、手機條碼等（依你實際串接）。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <select
                      className="as-input"
                      value={settings.taxInvoice.invoiceCarrier}
                      onChange={(e) => setPath(["taxInvoice", "invoiceCarrier"], e.target.value)}
                    >
                      <option value="email">Email</option>
                      <option value="paper">紙本</option>
                      <option value="mobile_barcode">手機條碼</option>
                      <option value="none">不適用</option>
                    </select>
                  </div>
                </div>

                <div className="as-kvfield">
                  <div>
                    <div className="as-kvfield__label">金額進位</div>
                    <div className="as-kvfield__hint">用於稅後總額或各項目小計（後端策略）。</div>
                  </div>
                  <div className="as-kvfield__control">
                    <select
                      className="as-input"
                      value={settings.taxInvoice.rounding}
                      onChange={(e) => setPath(["taxInvoice", "rounding"], e.target.value)}
                    >
                      <option value="round">四捨五入</option>
                      <option value="floor">無條件捨去</option>
                      <option value="ceil">無條件進位</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ===== Tab: bind ===== */}
            {activeTab === "bind" && (
              <>
                <div className="as-formGrid">
                  <div className="as-kvfield">
                    <div>
                      <div className="as-kvfield__label">綁定模式</div>
                      <div className="as-kvfield__hint">per_berth：每席；per_meter：依長度；custom_group：群組方案。</div>
                    </div>
                    <div className="as-kvfield__control">
                      <select
                        className="as-input"
                        value={settings.berthBinding.mode}
                        onChange={(e) => setPath(["berthBinding", "mode"], e.target.value)}
                      >
                        <option value="per_berth">每席</option>
                        <option value="per_meter">依長度（米）</option>
                        <option value="custom_group">自訂群組</option>
                      </select>
                    </div>
                  </div>

                  <div className="as-kvfield">
                    <div>
                      <div className="as-kvfield__label">預設席位費率代碼</div>
                      <div className="as-kvfield__hint">例如：A / B / VIP（對應費率表或邏輯費率）。</div>
                    </div>
                    <div className="as-kvfield__control">
                      <input
                        className="as-input"
                        value={settings.berthBinding.defaultBerthTariff}
                        onChange={(e) => setPath(["berthBinding", "defaultBerthTariff"], e.target.value)}
                        placeholder="例如 A"
                      />
                    </div>
                  </div>

                  <div className="as-kvfield">
                    <div>
                      <div className="as-kvfield__label">允許單席覆寫</div>
                      <div className="as-kvfield__hint">關閉後所有席位依群組或預設費率套用。</div>
                    </div>
                    <div className="as-kvfield__control">
                      <label className="as-switch">
                        <input
                          type="checkbox"
                          checked={settings.berthBinding.allowOverridePerBerth}
                          onChange={() => togglePath(["berthBinding", "allowOverridePerBerth"])}
                        />
                        <span className="as-switch-ui" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="as-sectionDivider" />

                <div className="as-tableWrap">
                  <table className="as-table">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>#</th>
                        <th>群組名稱</th>
                        <th style={{ width: 140 }}>費率代碼</th>
                        <th>備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.berthBinding.groups.map((g, idx) => (
                        <tr key={g.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <input
                              className="as-input as-input--sm"
                              value={g.name}
                              onChange={(e) => {
                                const next = clone(settings.berthBinding.groups);
                                next[idx].name = e.target.value;
                                setPath(["berthBinding", "groups"], next);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="as-input as-input--sm"
                              value={g.tariff}
                              onChange={(e) => {
                                const next = clone(settings.berthBinding.groups);
                                next[idx].tariff = e.target.value;
                                setPath(["berthBinding", "groups"], next);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="as-input as-input--sm"
                              value={g.note}
                              onChange={(e) => {
                                const next = clone(settings.berthBinding.groups);
                                next[idx].note = e.target.value;
                                setPath(["berthBinding", "groups"], next);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="as-subcard" style={{ marginTop: 12 }}>
                  <div className="as-tableWrap">
                    <table className="as-table">
                      <thead>
                        <tr>
                          <th style={{ width: 160 }}>席位</th>
                          <th style={{ width: 140 }}>群組</th>
                          <th style={{ width: 140 }}>費率代碼</th>
                          <th style={{ width: 140 }}>啟用</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settings.berthBinding.berthMap.map((b, idx) => (
                          <tr key={b.id}>
                            <td style={{ fontWeight: 800 }}>{b.id}</td>
                            <td>
                              <select
                                className="as-input as-input--sm"
                                value={b.group}
                                onChange={(e) => {
                                  const next = clone(settings.berthBinding.berthMap);
                                  next[idx].group = e.target.value;
                                  setPath(["berthBinding", "berthMap"], next);
                                }}
                              >
                                {settings.berthBinding.groups.map((gg) => (
                                  <option key={gg.id} value={gg.tariff}>
                                    {gg.tariff}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className="as-input as-input--sm"
                                value={b.tariff}
                                disabled={!settings.berthBinding.allowOverridePerBerth}
                                onChange={(e) => {
                                  const next = clone(settings.berthBinding.berthMap);
                                  next[idx].tariff = e.target.value;
                                  setPath(["berthBinding", "berthMap"], next);
                                }}
                              />
                            </td>
                            <td>
                              <label className="as-switch">
                                <input
                                  type="checkbox"
                                  checked={b.enabled}
                                  onChange={() => {
                                    const next = clone(settings.berthBinding.berthMap);
                                    next[idx].enabled = !next[idx].enabled;
                                    setPath(["berthBinding", "berthMap"], next);
                                  }}
                                />
                                <span className="as-switch-ui" />
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
