import React, { useMemo, useState } from "react";
import "../../styles/dashboard/Dashboard.css"; // 共用 Dashboard 視覺
import "../../styles/admin/admin.settings.css";

import {
  FaSave,
  FaUndoAlt,
  FaWifi,
  FaPlug,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBug,
  FaTrash,
  FaPlay,
} from "react-icons/fa";

const seedSettings = {
  enabled: true,

  sourceType: "udp", // udp | tcp | serial | api
  udp: { host: "0.0.0.0", port: 10110 },
  tcp: { host: "127.0.0.1", port: 10110, autoReconnect: true, reconnectSec: 5 },
  serial: {
    com: "COM3",
    baudRate: 38400,
    dataBits: 8,
    parity: "None",
    stopBits: 1,
  },
  api: { provider: "ThirdPartyAIS", apiKey: "" },

  receive: {
    acceptMode: "ais_only", // ais_only | nmea_all
    maxBufferKb: 512,
    dedupeEnabled: true,
    dedupeWindowSec: 5,
    keepRaw: true,
  },

  parse: {
    perVesselMinIntervalMs: 800,
    missingSogAsZero: false,
    missingCogAsZero: false,
  },

  geofence: {
    enabled: false,
    shape: "circle", // circle | polygon
    circle: { lat: 25.0478, lon: 121.5319, radiusM: 800 },
    polygonPoints: [
      { lat: 25.0482, lon: 121.5308 },
      { lat: 25.0486, lon: 121.5333 },
      { lat: 25.0469, lon: 121.5340 },
      { lat: 25.0464, lon: 121.5312 },
    ],
    triggers: { onEnter: true, onExit: false, dwellMin: 10, dwellEnabled: false },
  },

  alerts: {
    speedKnots: 15,
    nightModeEnabled: false,
    nightStart: "22:00",
    nightEnd: "06:00",
    notify: { ui: true, email: false, webhook: false },
  },
};

const seedLogs = [
  { id: 1, ts: "2026/01/20 13:58:12", level: "INFO", source: "UDP", mmsi: "416123456", msg: "AIS listener started on 0.0.0.0:10110" },
  { id: 2, ts: "2026/01/20 13:58:21", level: "INFO", source: "PARSE", mmsi: "416123456", msg: "AIVDM parsed: lat=25.0479 lon=121.5322 sog=6.2 cog=181" },
  { id: 3, ts: "2026/01/20 13:59:05", level: "WARN", source: "PARSE", mmsi: "", msg: "Unknown sentence type received (ignored)" },
  { id: 4, ts: "2026/01/20 14:00:11", level: "ERROR", source: "PARSE", mmsi: "", msg: "Parse failed: invalid checksum. raw='!AIVDM,1,1,,A,15MuqP0P00PD;88MD5...' " },
  { id: 5, ts: "2026/01/20 14:02:44", level: "INFO", source: "GEOFENCE", mmsi: "416987654", msg: "Geofence disabled; event suppressed" },
];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function Badge({ tone = "neutral", children }) {
  return <span className={`ais-badge ais-badge--${tone}`}>{children}</span>;
}

function FieldRow({ label, hint, children }) {
  return (
    <div className="ais-field">
      <div className="ais-field__meta">
        <div className="ais-field__label">{label}</div>
        {hint ? <div className="ais-field__hint">{hint}</div> : null}
      </div>
      <div className="ais-field__control">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange, disabled }) {
  return (
    <label className={`ais-switch ${disabled ? "is-disabled" : ""}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
      />
      <span className="ais-switch__track" />
      <span className="ais-switch__thumb" />
    </label>
  );
}

function Select({ value, onChange, disabled, children }) {
  return (
    <select
      className="ais-input"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  );
}

function Input({ value, onChange, disabled, placeholder, type = "text" }) {
  return (
    <input
      className="ais-input"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      type={type}
    />
  );
}

function NumberInput({ value, onChange, disabled, min, max, step = 1 }) {
  return (
    <input
      className="ais-input"
      value={value}
      onChange={(e) => onChange?.(e.target.value === "" ? "" : Number(e.target.value))}
      disabled={disabled}
      type="number"
      min={min}
      max={max}
      step={step}
    />
  );
}

function RadioGroup({ value, onChange, disabled, options }) {
  return (
    <div className={`ais-radio ${disabled ? "is-disabled" : ""}`}>
      {options.map((opt) => (
        <label key={opt.value} className="ais-radio__item">
          <input
            type="radio"
            name={opt.name || "radio"}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
            disabled={disabled}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function LevelDot({ level }) {
  const tone =
    level === "ERROR" ? "danger" : level === "WARN" ? "warn" : "ok";
  return <span className={`ais-level-dot ais-level-dot--${tone}`} />;
}

export default function AisSettings() {
  const [settings, setSettings] = useState(() => deepClone(seedSettings));
  const [savedSnapshot, setSavedSnapshot] = useState(() => deepClone(seedSettings));

  // 監控（純 UI 假資料）
  const [conn, setConn] = useState({
    connected: true,
    lastPacket: "2026/01/20 14:05:33",
    rxPerMin: 128,
    parseOkRate: 97.4,
    topMmsi: ["416123456", "416987654", "416555777", "416333222", "416999000"],
  });

  // 測試工具（純 UI）
  const [testRaw, setTestRaw] = useState("!AIVDM,1,1,,A,15MuqP0P00PD;88MD5...,0*5C");
  const [testResult, setTestResult] = useState({
    ok: true,
    mmsi: "416123456",
    lat: 25.0479,
    lon: 121.5322,
    sog: 6.2,
    cog: 181,
    ts: "2026/01/20 14:05:33",
  });

  // 日誌（純 UI）
  const [logs, setLogs] = useState(() => deepClone(seedLogs));
  const [logFilter, setLogFilter] = useState({
    level: "ALL", // ALL | INFO | WARN | ERROR
    keyword: "",
  });

  const isDisabledAll = !settings.enabled;

  const statusChips = useMemo(() => {
    const aisTone = settings.enabled ? "ok" : "neutral";
    const connTone = conn.connected ? "ok" : "danger";
    return {
      ais: { label: settings.enabled ? "啟用" : "停用", tone: aisTone },
      conn: { label: conn.connected ? "已連線" : "離線", tone: connTone },
      last: conn.lastPacket,
      rx: `${conn.rxPerMin} msgs/min`,
    };
  }, [settings.enabled, conn.connected, conn.lastPacket, conn.rxPerMin]);

  const filteredLogs = useMemo(() => {
    const kw = logFilter.keyword.trim().toLowerCase();
    return logs.filter((x) => {
      const lvOk = logFilter.level === "ALL" ? true : x.level === logFilter.level;
      const kwOk = !kw
        ? true
        : `${x.ts} ${x.level} ${x.source} ${x.mmsi} ${x.msg}`.toLowerCase().includes(kw);
      return lvOk && kwOk;
    });
  }, [logs, logFilter]);

  function patch(path, value) {
    setSettings((prev) => {
      const next = deepClone(prev);
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function onSave() {
    // UI 版：只做快照保存 + 寫一筆 log
    setSavedSnapshot(deepClone(settings));
    setLogs((prev) => [
      {
        id: Date.now(),
        ts: new Date().toLocaleString("zh-TW", { hour12: false }),
        level: "INFO",
        source: "UI",
        mmsi: "",
        msg: "Settings saved (UI-only).",
      },
      ...prev,
    ]);
  }

  function onResetToSaved() {
    setSettings(deepClone(savedSnapshot));
    setLogs((prev) => [
      {
        id: Date.now(),
        ts: new Date().toLocaleString("zh-TW", { hour12: false }),
        level: "INFO",
        source: "UI",
        mmsi: "",
        msg: "Settings restored to last saved snapshot (UI-only).",
      },
      ...prev,
    ]);
  }

  function onRestoreDefaults() {
    setSettings(deepClone(seedSettings));
    setLogs((prev) => [
      {
        id: Date.now(),
        ts: new Date().toLocaleString("zh-TW", { hour12: false }),
        level: "WARN",
        source: "UI",
        mmsi: "",
        msg: "Settings restored to defaults (UI-only).",
      },
      ...prev,
    ]);
  }

  function simulateReconnect() {
    setConn((p) => ({ ...p, connected: false }));
    setLogs((prev) => [
      {
        id: Date.now(),
        ts: new Date().toLocaleString("zh-TW", { hour12: false }),
        level: "WARN",
        source: "CONN",
        mmsi: "",
        msg: "Connection dropped (simulated).",
      },
      ...prev,
    ]);
    setTimeout(() => {
      setConn((p) => ({
        ...p,
        connected: true,
        lastPacket: new Date().toLocaleString("zh-TW", { hour12: false }),
      }));
      setLogs((prev) => [
        {
          id: Date.now() + 1,
          ts: new Date().toLocaleString("zh-TW", { hour12: false }),
          level: "INFO",
          source: "CONN",
          mmsi: "",
          msg: "Reconnected (simulated).",
        },
        ...prev,
      ]);
    }, 700);
  }

  function runTestParse() {
    // UI-only：用目前 raw 做一份「看起來像解析」的結果
    const ok = testRaw.trim().startsWith("!AI") || testRaw.trim().startsWith("!AIVDM");
    if (!ok) {
      setTestResult({ ok: false, error: "Not an AIS/NMEA AIVDM sentence (UI-only)." });
      setLogs((prev) => [
        {
          id: Date.now(),
          ts: new Date().toLocaleString("zh-TW", { hour12: false }),
          level: "ERROR",
          source: "TEST",
          mmsi: "",
          msg: "Test parse failed (UI-only).",
        },
        ...prev,
      ]);
      return;
    }

    const now = new Date().toLocaleString("zh-TW", { hour12: false });
    setTestResult({
      ok: true,
      mmsi: "416123456",
      lat: settings.geofence.circle.lat + 0.0003,
      lon: settings.geofence.circle.lon + 0.0004,
      sog: 6.2,
      cog: 181,
      ts: now,
    });

    setLogs((prev) => [
      {
        id: Date.now(),
        ts: now,
        level: "INFO",
        source: "TEST",
        mmsi: "416123456",
        msg: "Test parse OK (UI-only).",
      },
      ...prev,
    ]);
  }

  return (
    <div className="appdash admin-shell">
      <div className="ais-page">
        {/* Header */}
        <div className="ais-header">
          <div className="ais-header__left">
            <h1 className="ais-title">AIS 設定</h1>
            <div className="ais-subtitle">資料接收來源、解析規則、圍欄與告警、監控與測試</div>
          </div>

          <div className="ais-header__actions">
            <button className="ais-btn ais-btn--primary" onClick={onSave}>
              <FaSave /> 儲存設定
            </button>
            <button className="ais-btn" onClick={onResetToSaved} title="還原到上次儲存的版本">
              <FaUndoAlt /> 還原
            </button>
            <button className="ais-btn ais-btn--ghost" onClick={onRestoreDefaults} title="回到預設值（UI-only）">
              <FaTrash /> 還原預設
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="ais-status">
          <div className="ais-status__item">
            <span className="ais-status__label">AIS</span>
            <Badge tone={statusChips.ais.tone}>{statusChips.ais.label}</Badge>
          </div>
          <div className="ais-status__item">
            <span className="ais-status__label">連線</span>
            <Badge tone={statusChips.conn.tone}>{statusChips.conn.label}</Badge>
          </div>
          <div className="ais-status__item">
            <span className="ais-status__label">最後接收</span>
            <span className="ais-status__value">{statusChips.last}</span>
          </div>
          <div className="ais-status__item">
            <span className="ais-status__label">訊息量</span>
            <span className="ais-status__value">{statusChips.rx}</span>
          </div>
        </div>

        {/* Section: Basic + Source */}
        <section className="ais-card">
          <div className="ais-card__head">
            <div className="ais-card__title">基本啟用與資料來源</div>
            <div className="ais-card__hint">停用 AIS 時，底下設定會變成唯讀（仍可查看）。</div>
          </div>

          <div className="ais-grid">
            <FieldRow label="AIS 功能啟用" hint="關閉後不會接收任何 AIS/NMEA 資料。">
              <Switch
                checked={settings.enabled}
                onChange={(v) => patch("enabled", v)}
              />
            </FieldRow>

            <FieldRow label="資料來源" hint="依你現場設備選擇 UDP/TCP/Serial。">
              <RadioGroup
                value={settings.sourceType}
                onChange={(v) => patch("sourceType", v)}
                disabled={isDisabledAll}
                options={[
                  { value: "udp", label: "UDP Listener", name: "sourceType" },
                  { value: "tcp", label: "TCP Client", name: "sourceType" },
                  { value: "serial", label: "Serial (COM)", name: "sourceType" },
                  { value: "api", label: "第三方 API", name: "sourceType" },
                ]}
              />
            </FieldRow>
          </div>

          {/* Source detail */}
          <div className={`ais-subcard ${isDisabledAll ? "is-disabled" : ""}`}>
            {settings.sourceType === "udp" && (
              <div className="ais-grid">
                <FieldRow label="Listen IP" hint="通常用 0.0.0.0 代表綁定所有網卡。">
                  <Input
                    value={settings.udp.host}
                    onChange={(v) => patch("udp.host", v)}
                    disabled={isDisabledAll}
                    placeholder="0.0.0.0"
                  />
                </FieldRow>
                <FieldRow label="Port" hint="常見 AIS UDP Port：10110（依設備可調）。">
                  <NumberInput
                    value={settings.udp.port}
                    onChange={(v) => patch("udp.port", v)}
                    disabled={isDisabledAll}
                    min={1}
                    max={65535}
                  />
                </FieldRow>
              </div>
            )}

            {settings.sourceType === "tcp" && (
              <div className="ais-grid">
                <FieldRow label="Host" hint="AIS 來源主機位址。">
                  <Input
                    value={settings.tcp.host}
                    onChange={(v) => patch("tcp.host", v)}
                    disabled={isDisabledAll}
                    placeholder="127.0.0.1"
                  />
                </FieldRow>
                <FieldRow label="Port">
                  <NumberInput
                    value={settings.tcp.port}
                    onChange={(v) => patch("tcp.port", v)}
                    disabled={isDisabledAll}
                    min={1}
                    max={65535}
                  />
                </FieldRow>

                <FieldRow label="自動重連">
                  <Switch
                    checked={settings.tcp.autoReconnect}
                    onChange={(v) => patch("tcp.autoReconnect", v)}
                    disabled={isDisabledAll}
                  />
                </FieldRow>
                <FieldRow label="重連間隔（秒）" hint="斷線後每幾秒嘗試一次。">
                  <NumberInput
                    value={settings.tcp.reconnectSec}
                    onChange={(v) => patch("tcp.reconnectSec", v)}
                    disabled={isDisabledAll || !settings.tcp.autoReconnect}
                    min={1}
                    max={60}
                  />
                </FieldRow>
              </div>
            )}

            {settings.sourceType === "serial" && (
              <div className="ais-grid">
                <FieldRow label="COM" hint="例如 COM3 / COM5。">
                  <Input
                    value={settings.serial.com}
                    onChange={(v) => patch("serial.com", v)}
                    disabled={isDisabledAll}
                    placeholder="COM3"
                  />
                </FieldRow>
                <FieldRow label="BaudRate" hint="AIS 常見 38400。">
                  <Select
                    value={settings.serial.baudRate}
                    onChange={(v) => patch("serial.baudRate", Number(v))}
                    disabled={isDisabledAll}
                  >
                    <option value={4800}>4800</option>
                    <option value={9600}>9600</option>
                    <option value={38400}>38400</option>
                    <option value={115200}>115200</option>
                  </Select>
                </FieldRow>

                <FieldRow label="DataBits">
                  <Select
                    value={settings.serial.dataBits}
                    onChange={(v) => patch("serial.dataBits", Number(v))}
                    disabled={isDisabledAll}
                  >
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                  </Select>
                </FieldRow>

                <FieldRow label="Parity">
                  <Select
                    value={settings.serial.parity}
                    onChange={(v) => patch("serial.parity", v)}
                    disabled={isDisabledAll}
                  >
                    <option value="None">None</option>
                    <option value="Odd">Odd</option>
                    <option value="Even">Even</option>
                  </Select>
                </FieldRow>

                <FieldRow label="StopBits">
                  <Select
                    value={settings.serial.stopBits}
                    onChange={(v) => patch("serial.stopBits", Number(v))}
                    disabled={isDisabledAll}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </Select>
                </FieldRow>
              </div>
            )}

            {settings.sourceType === "api" && (
              <div className="ais-grid">
                <FieldRow label="Provider">
                  <Select
                    value={settings.api.provider}
                    onChange={(v) => patch("api.provider", v)}
                    disabled={isDisabledAll}
                  >
                    <option value="ThirdPartyAIS">ThirdPartyAIS</option>
                    <option value="VendorAISCloud">VendorAISCloud</option>
                  </Select>
                </FieldRow>
                <FieldRow label="API Key" hint="UI-only：先留欄位，後續接後端保管。">
                  <Input
                    value={settings.api.apiKey}
                    onChange={(v) => patch("api.apiKey", v)}
                    disabled={isDisabledAll}
                    placeholder="(UI-only)"
                  />
                </FieldRow>
              </div>
            )}
          </div>
        </section>

        {/* Section: Receive / Parse */}
        <section className="ais-card">
          <div className="ais-card__head">
            <div className="ais-card__title">接收與解析設定</div>
            <div className="ais-card__hint">影響訊息吞吐量、解析成功率，以及後續儲存/告警的資料品質。</div>
          </div>

          <div className={`ais-grid ${isDisabledAll ? "is-disabled" : ""}`}>
            <FieldRow label="接收模式" hint="一般只收 AIVDM/AIVDO；除錯才收全部 NMEA。">
              <RadioGroup
                value={settings.receive.acceptMode}
                onChange={(v) => patch("receive.acceptMode", v)}
                disabled={isDisabledAll}
                options={[
                  { value: "ais_only", label: "僅接收 AIS（AIVDM/AIVDO）", name: "acceptMode" },
                  { value: "nmea_all", label: "接收全部 NMEA（除錯用）", name: "acceptMode" },
                ]}
              />
            </FieldRow>

            <FieldRow label="Max Buffer（KB）" hint="避免瞬間爆量導致記憶體壓力。">
              <NumberInput
                value={settings.receive.maxBufferKb}
                onChange={(v) => patch("receive.maxBufferKb", v)}
                disabled={isDisabledAll}
                min={64}
                max={8192}
                step={64}
              />
            </FieldRow>

            <FieldRow label="去重（Dedup）" hint="避免同一艘船短時間重複訊息造成寫入/告警暴增。">
              <Switch
                checked={settings.receive.dedupeEnabled}
                onChange={(v) => patch("receive.dedupeEnabled", v)}
                disabled={isDisabledAll}
              />
            </FieldRow>

            <FieldRow label="去重時間窗（秒）" hint="同 MMSI+訊息類型在時間窗內視為重複。">
              <NumberInput
                value={settings.receive.dedupeWindowSec}
                onChange={(v) => patch("receive.dedupeWindowSec", v)}
                disabled={isDisabledAll || !settings.receive.dedupeEnabled}
                min={1}
                max={60}
              />
            </FieldRow>

            <FieldRow label="保留原始 raw line" hint="解析失敗時可追查，建議保留。">
              <Switch
                checked={settings.receive.keepRaw}
                onChange={(v) => patch("receive.keepRaw", v)}
                disabled={isDisabledAll}
              />
            </FieldRow>

            <FieldRow label="每艘船最短更新間隔（ms）" hint="限制同一 MMSI 更新頻率，降低前台抖動。">
              <NumberInput
                value={settings.parse.perVesselMinIntervalMs}
                onChange={(v) => patch("parse.perVesselMinIntervalMs", v)}
                disabled={isDisabledAll}
                min={100}
                max={10000}
                step={50}
              />
            </FieldRow>

            <FieldRow label="缺值 SOG 視為 0" hint="未提供速度時是否補 0。">
              <Switch
                checked={settings.parse.missingSogAsZero}
                onChange={(v) => patch("parse.missingSogAsZero", v)}
                disabled={isDisabledAll}
              />
            </FieldRow>

            <FieldRow label="缺值 COG 視為 0" hint="未提供航向時是否補 0。">
              <Switch
                checked={settings.parse.missingCogAsZero}
                onChange={(v) => patch("parse.missingCogAsZero", v)}
                disabled={isDisabledAll}
              />
            </FieldRow>
          </div>
        </section>

        {/* Section: Geofence + Alerts */}
        <section className="ais-card">
          <div className="ais-card__head">
            <div className="ais-card__title">地理圍欄與告警規則</div>
            <div className="ais-card__hint">此區建議與「事件中心 / 告警通知」串成一致的規則與通道。</div>
          </div>

          <div className={`ais-grid ${isDisabledAll ? "is-disabled" : ""}`}>
            <FieldRow label="圍欄啟用">
              <Switch
                checked={settings.geofence.enabled}
                onChange={(v) => patch("geofence.enabled", v)}
                disabled={isDisabledAll}
              />
            </FieldRow>

            <FieldRow label="圍欄形狀" hint="UI-only：先用欄位/表格呈現，後續可接地圖畫多邊形。">
              <RadioGroup
                value={settings.geofence.shape}
                onChange={(v) => patch("geofence.shape", v)}
                disabled={isDisabledAll || !settings.geofence.enabled}
                options={[
                  { value: "circle", label: "圓形", name: "geofenceShape" },
                  { value: "polygon", label: "多邊形", name: "geofenceShape" },
                ]}
              />
            </FieldRow>
          </div>

          {/* Geofence detail */}
          <div className={`ais-subcard ${isDisabledAll || !settings.geofence.enabled ? "is-disabled" : ""}`}>
            {settings.geofence.shape === "circle" && (
              <div className="ais-grid">
                <FieldRow label="中心緯度（lat）">
                  <NumberInput
                    value={settings.geofence.circle.lat}
                    onChange={(v) => patch("geofence.circle.lat", v)}
                    disabled={isDisabledAll || !settings.geofence.enabled}
                    min={-90}
                    max={90}
                    step={0.0001}
                  />
                </FieldRow>
                <FieldRow label="中心經度（lon）">
                  <NumberInput
                    value={settings.geofence.circle.lon}
                    onChange={(v) => patch("geofence.circle.lon", v)}
                    disabled={isDisabledAll || !settings.geofence.enabled}
                    min={-180}
                    max={180}
                    step={0.0001}
                  />
                </FieldRow>
                <FieldRow label="半徑（m）">
                  <NumberInput
                    value={settings.geofence.circle.radiusM}
                    onChange={(v) => patch("geofence.circle.radiusM", v)}
                    disabled={isDisabledAll || !settings.geofence.enabled}
                    min={50}
                    max={20000}
                    step={50}
                  />
                </FieldRow>
              </div>
            )}

            {settings.geofence.shape === "polygon" && (
              <div className="ais-polypoints">
                <div className="ais-polypoints__head">
                  <div className="ais-polypoints__title">多邊形點位（UI-only）</div>
                  <div className="ais-polypoints__hint">後續可換成地圖畫點/拖曳調整。</div>
                </div>
                <table className="ais-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>#</th>
                      <th>lat</th>
                      <th>lon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.geofence.polygonPoints.map((p, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <input
                            className="ais-input ais-input--sm"
                            type="number"
                            step="0.0001"
                            value={p.lat}
                            disabled={isDisabledAll || !settings.geofence.enabled}
                            onChange={(e) => {
                              const next = deepClone(settings.geofence.polygonPoints);
                              next[idx].lat = Number(e.target.value);
                              patch("geofence.polygonPoints", next);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className="ais-input ais-input--sm"
                            type="number"
                            step="0.0001"
                            value={p.lon}
                            disabled={isDisabledAll || !settings.geofence.enabled}
                            onChange={(e) => {
                              const next = deepClone(settings.geofence.polygonPoints);
                              next[idx].lon = Number(e.target.value);
                              patch("geofence.polygonPoints", next);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="ais-divider" />

            <div className="ais-grid">
              <FieldRow label="觸發：進入圍欄">
                <Switch
                  checked={settings.geofence.triggers.onEnter}
                  onChange={(v) => patch("geofence.triggers.onEnter", v)}
                  disabled={isDisabledAll || !settings.geofence.enabled}
                />
              </FieldRow>

              <FieldRow label="觸發：離開圍欄">
                <Switch
                  checked={settings.geofence.triggers.onExit}
                  onChange={(v) => patch("geofence.triggers.onExit", v)}
                  disabled={isDisabledAll || !settings.geofence.enabled}
                />
              </FieldRow>

              <FieldRow label="觸發：停留超過（分鐘）" hint="例如停留超過 10 分鐘才告警。">
                <div className="ais-inline">
                  <Switch
                    checked={settings.geofence.triggers.dwellEnabled}
                    onChange={(v) => patch("geofence.triggers.dwellEnabled", v)}
                    disabled={isDisabledAll || !settings.geofence.enabled}
                  />
                  <NumberInput
                    value={settings.geofence.triggers.dwellMin}
                    onChange={(v) => patch("geofence.triggers.dwellMin", v)}
                    disabled={isDisabledAll || !settings.geofence.enabled || !settings.geofence.triggers.dwellEnabled}
                    min={1}
                    max={600}
                  />
                </div>
              </FieldRow>
            </div>
          </div>

          <div className="ais-divider" />

          <div className={`ais-grid ${isDisabledAll ? "is-disabled" : ""}`}>
            <FieldRow label="危險速度門檻（knots）" hint="超過門檻可觸發告警（UI-only）。">
              <NumberInput
                value={settings.alerts.speedKnots}
                onChange={(v) => patch("alerts.speedKnots", v)}
                disabled={isDisabledAll}
                min={1}
                max={80}
              />
            </FieldRow>

            <FieldRow label="夜間模式" hint="可用於夜間更嚴格的規則（先做 UI）。">
              <Switch
                checked={settings.alerts.nightModeEnabled}
                onChange={(v) => patch("alerts.nightModeEnabled", v)}
                disabled={isDisabledAll}
              />
            </FieldRow>

            <FieldRow label="夜間開始 / 結束">
              <div className="ais-inline">
                <Input
                  value={settings.alerts.nightStart}
                  onChange={(v) => patch("alerts.nightStart", v)}
                  disabled={isDisabledAll || !settings.alerts.nightModeEnabled}
                  placeholder="22:00"
                  type="time"
                />
                <span className="ais-inline__sep">—</span>
                <Input
                  value={settings.alerts.nightEnd}
                  onChange={(v) => patch("alerts.nightEnd", v)}
                  disabled={isDisabledAll || !settings.alerts.nightModeEnabled}
                  placeholder="06:00"
                  type="time"
                />
              </div>
            </FieldRow>

            <FieldRow label="通知通道">
              <div className="ais-checks">
                <label className="ais-check">
                  <input
                    type="checkbox"
                    checked={settings.alerts.notify.ui}
                    disabled={isDisabledAll}
                    onChange={(e) => patch("alerts.notify.ui", e.target.checked)}
                  />
                  <span>後台通知</span>
                </label>
                <label className="ais-check">
                  <input
                    type="checkbox"
                    checked={settings.alerts.notify.email}
                    disabled={isDisabledAll}
                    onChange={(e) => patch("alerts.notify.email", e.target.checked)}
                  />
                  <span>Email</span>
                </label>
                <label className="ais-check">
                  <input
                    type="checkbox"
                    checked={settings.alerts.notify.webhook}
                    disabled={isDisabledAll}
                    onChange={(e) => patch("alerts.notify.webhook", e.target.checked)}
                  />
                  <span>Webhook</span>
                </label>
              </div>
            </FieldRow>
          </div>
        </section>

        {/* Section: Monitor + Test + Logs */}
        <section className="ais-card">
          <div className="ais-card__head">
            <div className="ais-card__title">測試與狀態監控</div>
            <div className="ais-card__hint">UI-only：提供連線狀態、測試解析預覽與日誌篩選。後續接 API 即可變成真實監控。</div>
          </div>

          <div className="ais-monitor">
            <div className="ais-monitor__panel">
              <div className="ais-monitor__title">
                <FaWifi /> 連線狀態
              </div>

              <div className="ais-monitor__grid">
                <div className="ais-kv">
                  <div className="ais-kv__k">目前來源</div>
                  <div className="ais-kv__v">
                    {settings.sourceType === "udp" && `UDP:${settings.udp.host}:${settings.udp.port}`}
                    {settings.sourceType === "tcp" && `TCP:${settings.tcp.host}:${settings.tcp.port}`}
                    {settings.sourceType === "serial" && `SERIAL:${settings.serial.com}@${settings.serial.baudRate}`}
                    {settings.sourceType === "api" && `API:${settings.api.provider}`}
                  </div>
                </div>

                <div className="ais-kv">
                  <div className="ais-kv__k">狀態</div>
                  <div className="ais-kv__v">
                    {conn.connected ? (
                      <span className="ais-kv__ok"><FaCheckCircle /> Connected</span>
                    ) : (
                      <span className="ais-kv__bad"><FaExclamationTriangle /> Disconnected</span>
                    )}
                  </div>
                </div>

                <div className="ais-kv">
                  <div className="ais-kv__k">Last packet</div>
                  <div className="ais-kv__v">{conn.lastPacket}</div>
                </div>

                <div className="ais-kv">
                  <div className="ais-kv__k">RX</div>
                  <div className="ais-kv__v">{conn.rxPerMin} msgs/min</div>
                </div>

                <div className="ais-kv">
                  <div className="ais-kv__k">Parse OK</div>
                  <div className="ais-kv__v">{conn.parseOkRate}%</div>
                </div>

                <div className="ais-kv">
                  <div className="ais-kv__k">Top MMSI</div>
                  <div className="ais-kv__v">
                    <div className="ais-pills">
                      {conn.topMmsi.map((m) => (
                        <span key={m} className="ais-pill">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ais-monitor__actions">
                <button className="ais-btn" onClick={simulateReconnect} title="UI-only 模擬斷線/重連">
                  <FaPlug /> 模擬重連
                </button>
              </div>
            </div>

            <div className="ais-monitor__panel">
              <div className="ais-monitor__title">
                <FaBug /> 測試解析（UI-only）
              </div>

              <div className="ais-test">
                <div className="ais-test__raw">
                  <div className="ais-test__label">Raw input</div>
                  <textarea
                    className="ais-textarea"
                    value={testRaw}
                    onChange={(e) => setTestRaw(e.target.value)}
                    placeholder="Paste AIVDM line here..."
                    rows={5}
                  />
                  <div className="ais-test__actions">
                    <button className="ais-btn ais-btn--primary" onClick={runTestParse}>
                      <FaPlay /> 送出測試
                    </button>
                    <button
                      className="ais-btn ais-btn--ghost"
                      onClick={() => {
                        setTestRaw("");
                        setTestResult(null);
                      }}
                    >
                      <FaTrash /> 清除
                    </button>
                  </div>
                </div>

                <div className="ais-test__result">
                  <div className="ais-test__label">解析結果</div>
                  <pre className="ais-pre">
{JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="ais-divider" />

          <div className="ais-logs">
            <div className="ais-logs__head">
              <div className="ais-logs__title">日誌（Log）</div>
              <div className="ais-logs__filters">
                <Select
                  value={logFilter.level}
                  onChange={(v) => setLogFilter((p) => ({ ...p, level: v }))}
                >
                  <option value="ALL">ALL</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                </Select>

                <Input
                  value={logFilter.keyword}
                  onChange={(v) => setLogFilter((p) => ({ ...p, keyword: v }))}
                  placeholder="關鍵字（MMSI / 內容 / 來源）"
                />

                <button className="ais-btn ais-btn--ghost" onClick={() => setLogFilter({ level: "ALL", keyword: "" })}>
                  <FaUndoAlt /> 清除篩選
                </button>
              </div>
            </div>

            <div className="ais-tablewrap">
              <table className="ais-table">
                <thead>
                  <tr>
                    <th style={{ width: "160px" }}>時間</th>
                    <th style={{ width: "120px" }}>等級</th>
                    <th style={{ width: "120px" }}>來源</th>
                    <th style={{ width: "140px" }}>MMSI</th>
                    <th>內容</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ais-empty">沒有符合條件的日誌</td>
                    </tr>
                  ) : (
                    filteredLogs.map((x) => (
                      <tr key={x.id}>
                        <td className="ais-mono">{x.ts}</td>
                        <td className="ais-level">
                          <LevelDot level={x.level} />
                          <span className="ais-mono">{x.level}</span>
                        </td>
                        <td className="ais-mono">{x.source}</td>
                        <td className="ais-mono">{x.mmsi || "-"}</td>
                        <td className="ais-msg">{x.msg}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
