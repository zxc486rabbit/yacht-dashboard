import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "../../styles/dashboard/Dashboard.css";
import "../../styles/admin/admin.settings.css";

export default function AccessControl() {
  const [activeTab, setActiveTab] = useState("device");

  /* =====================================================
     Tab 1：門禁設備（閘門開關）
  ===================================================== */
  const deviceData = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `門禁設備 ${i + 1}`,
        location: `區域 ${Math.ceil((i + 1) / 3)}`,
        status: i % 3 === 0 ? "故障" : "正常",
        door: i % 2 === 0 ? "關閉" : "開啟",
      })),
    []
  );

  const [devices, setDevices] = useState(deviceData);

  const toggleDoor = (id, action) => {
    const target = devices.find((d) => d.id === id);
    if (target.status === "故障") {
      Swal.fire("無法操作", "設備故障中", "warning");
      return;
    }

    Swal.fire({
      title: `確認${action === "open" ? "開啟" : "關閉"}匣門？`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "確認",
      cancelButtonText: "取消",
    }).then((res) => {
      if (res.isConfirmed) {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, door: action === "open" ? "開啟" : "關閉" } : d
          )
        );
      }
    });
  };

  /* =====================================================
     Tab 2：門禁排程
  ===================================================== */
  const [schedules, setSchedules] = useState(
    Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `排程 ${i + 1}`,
      time: `0${8 + i}:00 - 1${0 + i}:00`,
      device: `門禁設備 ${i + 1}`,
    }))
  );

  const addSchedule = () => {
    Swal.fire({
      title: "新增排程",
      html: `
        <input id="name" class="swal2-input" placeholder="排程名稱"/>
        <input id="time" class="swal2-input" placeholder="時間區間"/>
        <input id="device" class="swal2-input" placeholder="設備"/>
      `,
      preConfirm: () => ({
        name: document.getElementById("name").value,
        time: document.getElementById("time").value,
        device: document.getElementById("device").value,
      }),
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed) {
        setSchedules((prev) => [{ id: Date.now(), ...res.value }, ...prev]);
      }
    });
  };

  /* =====================================================
     Tab 3：人員授權
  ===================================================== */
  const [persons, setPersons] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `人員 ${i + 1}`,
      card: `CARD-${1000 + i}`,
      role: i % 2 === 0 ? "一般員工" : "管理員",
      status: i % 3 === 0 ? "停用" : "啟用",
    }))
  );

  const togglePerson = (id) => {
    setPersons((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === "啟用" ? "停用" : "啟用" } : p
      )
    );
  };

  return (
    <div className="as-page">
      <div className="as-header">
        <div className="as-titleWrap">
          <h2 className="as-title">門禁管理</h2>
        </div>
      </div>

      <div className="as-card">
        <div className="as-cardHead">
          <div>
            <div className="as-cardTitle">功能分頁</div>
            <div className="as-cardSubtitle">門禁設備（閘門開關）／門禁排程／人員授權</div>
          </div>

          <div className="as-rowActions">
            <button
              className={`as-btn ${activeTab === "device" ? "primary" : "ghost"}`}
              onClick={() => setActiveTab("device")}
            >
              門禁設備
            </button>
            <button
              className={`as-btn ${activeTab === "schedule" ? "primary" : "ghost"}`}
              onClick={() => setActiveTab("schedule")}
            >
              門禁排程
            </button>
            <button
              className={`as-btn ${activeTab === "person" ? "primary" : "ghost"}`}
              onClick={() => setActiveTab("person")}
            >
              人員授權
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "device" && (
          <div className="as-tableWrap">
            <table className="as-table">
              <thead>
                <tr>
                  <th>設備</th>
                  <th>區域</th>
                  <th>狀態</th>
                  <th>匣門</th>
                  <th style={{ width: 260 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.location}</td>
                    <td>{d.status}</td>
                    <td>{d.door}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        className="as-btn primary"
                        disabled={d.door === "開啟"}
                        onClick={() => toggleDoor(d.id, "open")}
                      >
                        開啟
                      </button>{" "}
                      <button
                        className="as-btn danger"
                        disabled={d.door === "關閉"}
                        onClick={() => toggleDoor(d.id, "close")}
                      >
                        關閉
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "schedule" && (
          <>
            <div style={{ marginBottom: 10 }}>
              <button className="as-btn primary" onClick={addSchedule}>
                新增排程
              </button>
            </div>

            <div className="as-tableWrap">
              <table className="as-table">
                <thead>
                  <tr>
                    <th>名稱</th>
                    <th>時間</th>
                    <th>設備</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.time}</td>
                      <td>{s.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "person" && (
          <div className="as-tableWrap">
            <table className="as-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>卡號</th>
                  <th>角色</th>
                  <th>狀態</th>
                  <th style={{ width: 160 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {persons.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.card}</td>
                    <td>{p.role}</td>
                    <td>{p.status}</td>
                    <td>
                      <button className="as-btn" onClick={() => togglePerson(p.id)}>
                        切換
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
