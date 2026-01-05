import { useMemo, useState } from "react";
import Swal from "sweetalert2";

/* ======== 初始資料產生 ======== */
const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const yesno = () => Math.random() > 0.5;
const ONLINE = () => Math.random() > 0.15;

const genDefaultSchedule = () => ({
  enable: true,
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  start: "18:00",
  end: "06:00",
  exceptions: [],
});

const genShorePower = () =>
  Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    name: `船席 ${i + 1}`,
    online: ONLINE(),
    shoreState: "正常",
    powerOn: yesno(),
    frequency: 60,
    currentA: rand(0, 12),
    loadPct: rand(0, 95),
  }));

const genLighting = () =>
  ["碼頭主道", "候船亭", "停車區", "水電樁照明", "港務辦公區"].map((n, i) => ({
    id: i + 1,
    name: n,
    online: ONLINE(),
    state: "正常",
    on: yesno(),
    schedule: genDefaultSchedule(),
  }));

const genAC = () => ({
  units: [
    {
      id: 1,
      name: "冷氣主機 A",
      online: ONLINE(),
      running: yesno(),
      currentTemp: rand(18, 33),
      minTemp: 22,
      maxTemp: 28,
      isPreferred: true,
    },
    {
      id: 2,
      name: "冷氣主機 B",
      online: ONLINE(),
      running: yesno(),
      currentTemp: rand(18, 33),
      minTemp: 22,
      maxTemp: 28,
      isPreferred: false,
    },
    {
      id: 3,
      name: "備援 冷氣主機 C",
      online: ONLINE(),
      running: yesno(),
      currentTemp: rand(18, 33),
      minTemp: 22,
      maxTemp: 28,
      isPreferred: false,
    },
  ],
});

const genVent = () => ({
  units: [
    { id: 101, name: "通風扇 A", online: ONLINE(), state: "正常", on: yesno(), schedule: genDefaultSchedule() },
    { id: 102, name: "通風扇 B", online: ONLINE(), state: "正常", on: yesno(), schedule: genDefaultSchedule() },
    { id: 103, name: "備援 通風扇 C", online: ONLINE(), state: "正常", on: yesno(), schedule: genDefaultSchedule() },
  ],
});

const genFire = () =>
  ["碼頭 A 區", "碼頭 B 區", "燃料補給區", "倉儲棟"].map((n, i) => ({
    id: i + 1,
    name: n,
    online: ONLINE(),
    state: "正常",
    on: yesno(),
    schedule: genDefaultSchedule(),
  }));

/* ======== 可視化排程 Modal ======== */
function ScheduleModal({ show, onClose, value, onSave, title }) {
  const WEEK = [
    { key: "Mon", label: "週一" },
    { key: "Tue", label: "週二" },
    { key: "Wed", label: "週三" },
    { key: "Thu", label: "週四" },
    { key: "Fri", label: "週五" },
    { key: "Sat", label: "週六" },
    { key: "Sun", label: "週日" },
  ];

  const [local, setLocal] = useState(() => value || genDefaultSchedule());
  const [newException, setNewException] = useState("");

  useMemo(() => {
    if (show) {
      setLocal(value || genDefaultSchedule());
      setNewException("");
    }
  }, [show, value]);

  const toggleDay = (k) => {
    setLocal((p) => {
      const has = p.days.includes(k);
      const days = has ? p.days.filter((d) => d !== k) : [...p.days, k];
      return { ...p, days };
    });
  };

  const addException = () => {
    if (!newException) return;
    setLocal((p) => {
      if (p.exceptions.includes(newException)) return p;
      return { ...p, exceptions: [...p.exceptions, newException] };
    });
    setNewException("");
  };

  const deleteException = (d) => {
    setLocal((p) => ({ ...p, exceptions: p.exceptions.filter((x) => x !== d) }));
  };

  const handleSave = () => {
    if (local.enable) {
      if (!local.start || !local.end) {
        Swal.fire("資料不完整", "請設定開始與結束時間。", "warning");
        return;
      }
      if (local.days.length === 0) {
        Swal.fire("未選擇星期", "請至少選擇一個星期。", "warning");
        return;
      }
    }
    onSave(local);
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.4)" }}>
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title || "排程設定"}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="schEnable"
                checked={!!local.enable}
                onChange={(e) => setLocal((p) => ({ ...p, enable: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="schEnable">
                啟用排程
              </label>
            </div>

            <div className="mb-3">
              <label className="form-label d-block">星期</label>
              <div className="d-flex flex-wrap gap-2">
                {WEEK.map((w) => (
                  <div className="form-check" key={w.key}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`day-${w.key}`}
                      checked={local.days.includes(w.key)}
                      onChange={() => toggleDay(w.key)}
                      disabled={!local.enable}
                    />
                    <label className="form-check-label" htmlFor={`day-${w.key}`}>
                      {w.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="row g-3 align-items-end mb-3">
              <div className="col-md-4">
                <label className="form-label">開始時間</label>
                <input
                  type="time"
                  className="form-control"
                  value={local.start}
                  onChange={(e) => setLocal((p) => ({ ...p, start: e.target.value }))}
                  disabled={!local.enable}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">結束時間</label>
                <input
                  type="time"
                  className="form-control"
                  value={local.end}
                  onChange={(e) => setLocal((p) => ({ ...p, end: e.target.value }))}
                  disabled={!local.enable}
                />
              </div>
              <div className="col-md-4">
                <div className="form-text">可跨午夜，例如 18:00 ~ 06:00（隔日）</div>
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label d-block">例外日（不套用排程）</label>
              <div className="d-flex gap-2">
                <input type="date" className="form-control" value={newException} onChange={(e) => setNewException(e.target.value)} />
                <button className="btn btn-outline-primary" type="button" onClick={addException}>
                  新增
                </button>
              </div>
            </div>

            <div className="mt-2">
              {local.exceptions?.length ? (
                <div className="d-flex flex-wrap gap-2">
                  {local.exceptions.map((d) => (
                    <span className="badge bg-secondary" key={d}>
                      {d}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        aria-label="Remove"
                        onClick={() => deleteException(d)}
                        style={{ transform: "scale(.7)" }}
                      ></button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-muted small">尚無例外日</div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======== 主元件 ======== */
export default function RemoteControl() {
  const [tab, setTab] = useState("shore");

  // 資料
  const [shore, setShore] = useState(genShorePower());
  const [lighting, setLighting] = useState(genLighting());
  const [ac, setAc] = useState(genAC());
  const [ventState, setVentState] = useState(genVent());
  const [fire, setFire] = useState(genFire());

  /* =========================
     船席岸電：供電、頻率（美規/歐規）
  ========================= */
  const toggleShorePower = async (row) => {
    if (!row.online) return Swal.fire("離線中", "設備離線，無法切換供電。", "warning");
    const isOn = row.powerOn;
    const ok = await Swal.fire({
      title: `${isOn ? "關閉" : "開啟"}電源`,
      text: `${row.name} — 確定要${isOn ? "關閉" : "開啟"}供電嗎？`,
      icon: "question",
      showCancelButton: true,
    }).then((r) => r.isConfirmed);
    if (!ok) return;

    setShore((prev) => prev.map((d) => (d.id === row.id ? { ...d, powerOn: !isOn, frequency: !isOn ? 60 : 0 } : d)));
    Swal.fire("完成", `${row.name} 供電已${isOn ? "關閉" : "開啟"}`, "success");
  };

  const setShoreFrequencyStandard = async (row, targetHz) => {
    if (!row.online || !row.powerOn) return Swal.fire("無法設定", "請先確認設備在線且供電為 ON。", "warning");

    const label = targetHz === 60 ? "美規 60Hz" : "歐規 50Hz";
    const ok = await Swal.fire({
      title: `設定變頻器頻率 - ${row.name}`,
      html: `確認要切換為 <b>${label}</b> 嗎？`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "確認切換",
    }).then((r) => r.isConfirmed);

    if (!ok) return;

    setShore((prev) => prev.map((d) => (d.id === row.id ? { ...d, frequency: targetHz } : d)));
    Swal.fire("完成", `${row.name} 頻率已更新為 ${targetHz} Hz`, "success");
  };

  /* =========================
     共用：排程 Modal
  ========================= */
  const [scheduleModal, setScheduleModal] = useState({
    show: false,
    title: "",
    getList: null,
    setList: null,
    targetId: null,
    value: null,
  });

  const openSchedule = (title, getList, setList, row) => {
    setScheduleModal({
      show: true,
      title,
      getList,
      setList,
      targetId: row.id,
      value: row.schedule || genDefaultSchedule(),
    });
  };

  const closeSchedule = () => setScheduleModal((p) => ({ ...p, show: false }));

  const saveSchedule = (newSchedule) => {
    const { getList, setList, targetId } = scheduleModal;
    const list = getList();
    setList(list.map((item) => (item.id === targetId ? { ...item, schedule: newSchedule } : item)));
    setScheduleModal((p) => ({ ...p, show: false }));
    Swal.fire("已儲存", "排程設定已更新。", "success");
  };

  /* =========================
     共用：開關切換
  ========================= */
  const toggleOnOff = (getter, setter, row) => {
    if (!row.online) return Swal.fire("離線中", "設備離線，無法切換電源。", "warning");
    Swal.fire({
      title: `${row.on ? "關閉" : "開啟"}電源`,
      text: `${row.name} — 確定要${row.on ? "關閉" : "開啟"}嗎？`,
      icon: "question",
      showCancelButton: true,
    }).then((r) => {
      if (!r.isConfirmed) return;
      setter(getter().map((z) => (z.id === row.id ? { ...z, on: !row.on } : z)));
      Swal.fire("完成", `${row.name} 已${row.on ? "關閉" : "開啟"}`, "success");
    });
  };

  /* =========================
     冷氣：備援切換 & 溫度
  ========================= */
  const switchToBackup = async (unit) => {
    const onlineUnits = ac.units.filter((u) => u.id !== unit.id && u.online);
    if (!onlineUnits.length) return Swal.fire("無備援主機", "沒有在線的備援主機可切換。", "info");

    const { value: targetId } = await Swal.fire({
      title: `切換備援冷氣主機 - ${unit.name}`,
      input: "select",
      inputOptions: onlineUnits.reduce((o, u) => ((o[u.id] = u.name), o), {}),
      showCancelButton: true,
    });
    if (!targetId) return;

    const id = Number(targetId);
    setAc((prev) => ({ ...prev, units: prev.units.map((u) => ({ ...u, isPreferred: u.id === id })) }));
    Swal.fire("完成", `已切換到備援主機 ${onlineUnits.find((u) => u.id === id)?.name}`, "success");
  };

  const setTempRange = async (unit) => {
    const { value: formValues } = await Swal.fire({
      title: `設定溫度上下限 - ${unit.name}`,
      html: `
        <label>最低溫 (°C)</label>
        <input id="min-t" type="number" value="${unit.minTemp}" class="form-control" />
        <label class="mt-2">最高溫 (°C)</label>
        <input id="max-t" type="number" value="${unit.maxTemp}" class="form-control" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const min = Number(document.getElementById("min-t").value);
        const max = Number(document.getElementById("max-t").value);
        if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
          Swal.showValidationMessage("請輸入正確範圍（最低 < 最高）");
          return false;
        }
        return { min, max };
      },
    });
    if (!formValues) return;

    setAc((prev) => ({
      ...prev,
      units: prev.units.map((u) => (u.id === unit.id ? { ...u, minTemp: formValues.min, maxTemp: formValues.max } : u)),
    }));
    Swal.fire("完成", `${unit.name} 溫度上下限已更新`, "success");
  };

  /* =========================
     ✅ 冷氣 + 通風 合併成同表資料
  ========================= */
  const hvacRows = useMemo(() => {
    const acRows = ac.units.map((u) => ({
      kind: "AC",
      id: `AC-${u.id}`,
      rawId: u.id,
      name: u.name,
      online: u.online,
      runOrOn: u.running,
      currentTemp: u.currentTemp,
      minTemp: u.minTemp,
      maxTemp: u.maxTemp,
      isPreferred: u.isPreferred,
      raw: u,
    }));

    const ventRows = ventState.units.map((v) => ({
      kind: "VENT",
      id: `VENT-${v.id}`,
      rawId: v.id,
      name: v.name,
      online: v.online,
      runOrOn: v.on,
      state: v.state,
      schedule: v.schedule,
      raw: v,
    }));

    return [...acRows, ...ventRows];
  }, [ac.units, ventState.units]);

  const TabBtn = ({ id, label }) => (
    <button className={`btn btn-sm me-2 ${tab === id ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab(id)}>
      {label}
    </button>
  );

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary">遠端控管功能</h3>

      {/* 分頁按鈕（✅ 通風 tab 已移除） */}
      <div className="mb-3">
        <TabBtn id="shore" label="船席岸電設定" />
        <TabBtn id="light" label="照明系統設定" />
        <TabBtn id="ac" label="冷氣主機設定（含通風）" />
        <TabBtn id="fire" label="消防系統設定" />
      </div>

      {/* 船席岸電設定 */}
      {tab === "shore" && (
        <table className="table table-bordered text-center align-middle">
          <thead className="table-info">
            <tr>
              <th>船席名稱</th>
              <th>連線狀態</th>
              <th>岸電狀態</th>
              <th>供電 ON/OFF</th>
              <th>變頻器頻率</th>
              <th>電流值</th>
              <th>負載比例</th>
              <th>遠端控管功能</th>
            </tr>
          </thead>
          <tbody>
            {shore.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <span className={`badge ${row.online ? "bg-success" : "bg-secondary"}`}>{row.online ? "在線" : "離線"}</span>
                </td>
                <td>{row.shoreState}</td>
                <td>
                  <span className={`badge ${row.powerOn ? "bg-primary" : "bg-dark"}`}>{row.powerOn ? "ON" : "OFF"}</span>
                </td>
                <td>{row.frequency} Hz</td>
                <td>{row.currentA} A</td>
                <td>{row.loadPct}%</td>
                <td className="text-nowrap">
                  <button className={`btn btn-sm me-2 ${row.powerOn ? "btn-danger" : "btn-success"}`} onClick={() => toggleShorePower(row)}>
                    {row.powerOn ? "關閉電源" : "開啟電源"}
                  </button>

                  <div className="btn-group" role="group" aria-label="Frequency">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShoreFrequencyStandard(row, 60)}
                      disabled={!row.online || !row.powerOn}
                      type="button"
                    >
                      美規(60Hz)
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShoreFrequencyStandard(row, 50)}
                      disabled={!row.online || !row.powerOn}
                      type="button"
                    >
                      歐規(50Hz)
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 照明系統設定 */}
      {tab === "light" && (
        <table className="table table-bordered text-center align-middle">
          <thead className="table-warning">
            <tr>
              <th>設備名稱</th>
              <th>連線狀態</th>
              <th>設備狀態</th>
              <th>開關狀態</th>
              <th>遠端控管功能</th>
            </tr>
          </thead>
          <tbody>
            {lighting.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <span className={`badge ${row.online ? "bg-success" : "bg-secondary"}`}>{row.online ? "在線" : "離線"}</span>
                </td>
                <td>{row.state}</td>
                <td>
                  <span className={`badge ${row.on ? "bg-primary" : "bg-dark"}`}>{row.on ? "開" : "關"}</span>
                </td>
                <td className="text-nowrap">
                  <button className={`btn btn-sm me-2 ${row.on ? "btn-danger" : "btn-success"}`} onClick={() => toggleOnOff(() => lighting, setLighting, row)}>
                    {row.on ? "關閉電源" : "開啟電源"}
                  </button>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => openSchedule(`排程設定 - ${row.name}`, () => lighting, setLighting, row)}>
                    排程設定
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ 冷氣主機設定（同表含通風） */}
      {tab === "ac" && (
        <table className="table table-bordered text-center align-middle">
          <thead className="table-primary">
            <tr>
              <th>設備類型</th>
              <th>設備名稱</th>
              <th>連線狀態</th>
              <th>運行/開關狀態</th>
              <th>目前溫度</th>
              <th>上下限</th>
              <th>預設/現用</th>
              <th>排程</th>
              <th>遠端控管功能</th>
            </tr>
          </thead>
          <tbody>
            {hvacRows.map((row) => {
              const isAC = row.kind === "AC";
              const isVENT = row.kind === "VENT";

              return (
                <tr key={row.id}>
                  <td>
                    <span className={`badge ${isAC ? "bg-info" : "bg-success"}`}>{isAC ? "冷氣主機" : "通風/排風"}</span>
                  </td>

                  <td>{row.name}</td>

                  <td>
                    <span className={`badge ${row.online ? "bg-success" : "bg-secondary"}`}>{row.online ? "在線" : "離線"}</span>
                  </td>

                  <td>
                    <span className={`badge ${row.runOrOn ? "bg-primary" : "bg-dark"}`}>{row.runOrOn ? (isAC ? "運行中" : "開") : (isAC ? "待機" : "關")}</span>
                  </td>

                  {/* 冷氣才顯示溫度；通風顯示 - */}
                  <td>{isAC ? `${row.currentTemp} °C` : "-"}</td>

                  {/* 冷氣才顯示上下限；通風顯示 - */}
                  <td>{isAC ? `${row.minTemp} ~ ${row.maxTemp} °C` : "-"}</td>

                  {/* 冷氣才顯示預設/現用；通風顯示 - */}
                  <td>{isAC ? (row.isPreferred ? "✔ 預設/現用" : "—") : "-"}</td>

                  {/* 通風才顯示排程按鈕；冷氣顯示 - */}
                  <td className="text-nowrap">
                    {isVENT ? (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          openSchedule(
                            `排程設定 - ${row.name}`,
                            () => ventState.units,
                            (nextList) => setVentState((p) => ({ ...p, units: nextList })),
                            row.raw
                          )
                        }
                      >
                        排程設定
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="text-nowrap">
                    {isAC ? (
                      <>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => switchToBackup(row.raw)}>
                          切換備援冷氣主機
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setTempRange(row.raw)}>
                          設定溫度上下限
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`btn btn-sm me-2 ${row.raw.on ? "btn-danger" : "btn-success"}`}
                          onClick={() =>
                            toggleOnOff(
                              () => ventState.units,
                              (nextList) => setVentState((p) => ({ ...p, units: nextList })),
                              row.raw
                            )
                          }
                        >
                          {row.raw.on ? "關閉電源" : "開啟電源"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* 消防系統設定 */}
      {tab === "fire" && (
        <table className="table table-bordered text-center align-middle">
          <thead className="table-danger">
            <tr>
              <th>設備名稱</th>
              <th>連線狀態</th>
              <th>設備狀態</th>
              <th>開關狀態</th>
              <th>遠端控管功能</th>
            </tr>
          </thead>
          <tbody>
            {fire.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <span className={`badge ${row.online ? "bg-success" : "bg-secondary"}`}>{row.online ? "在線" : "離線"}</span>
                </td>
                <td>{row.state}</td>
                <td>
                  <span className={`badge ${row.on ? "bg-primary" : "bg-dark"}`}>{row.on ? "開" : "關"}</span>
                </td>
                <td className="text-nowrap">
                  <button className={`btn btn-sm me-2 ${row.on ? "btn-danger" : "btn-success"}`} onClick={() => toggleOnOff(() => fire, setFire, row)}>
                    {row.on ? "關閉電源" : "開啟電源"}
                  </button>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => openSchedule(`排程設定 - ${row.name}`, () => fire, setFire, row)}>
                    排程設定
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 可視化排程 Modal */}
      <ScheduleModal show={scheduleModal.show} title={scheduleModal.title} value={scheduleModal.value} onClose={closeSchedule} onSave={saveSchedule} />
    </div>
  );
}
