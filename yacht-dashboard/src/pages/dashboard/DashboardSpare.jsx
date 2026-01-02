import { useState } from "react";
import {
  FaBolt,
  FaTint,
  FaShip,
  FaUsers,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";

export default function Dashboard() {
  const [activeKey, setActiveKey] = useState("ship");
  const [showModal, setShowModal] = useState(false);
  const [selectedBerth, setSelectedBerth] = useState(null);

  const cardInfo = [
    { key: "electricity", label: "總用電量", value: "12,345 kWh", icon: <FaBolt className="text-warning me-1" /> },
    { key: "water", label: "總用水量", value: "8,765 m³", icon: <FaTint className="text-primary me-1" /> },
    { key: "ship", label: "停泊船舶數量", value: "4 / 11 艘", icon: <FaShip className="text-info me-1" /> },
    { key: "people", label: "進出人次", value: "1,238 人", icon: <FaUsers className="text-success me-1" /> },
    { key: "alert", label: "當前異常警示", value: "3 筆", icon: <FaExclamationTriangle className="text-danger me-1" /> },
    { key: "bill", label: "懸掛帳單", value: "NT$ 124,000", icon: <FaFileInvoiceDollar className="text-secondary me-1" /> },
  ];

  const berthData = [
    { id: 1, occupied: false },
    { id: 2, occupied: true, shipName: "海洋之星", time: "2025-07-24 08:30", remark: "預計停靠 2 天" },
    { id: 3, occupied: false },
    { id: 4, occupied: true, shipName: "天鵝號", time: "2025-07-24 07:10", remark: "補給中" },
    { id: 5, occupied: false },
    { id: 6, occupied: true, shipName: "藍海公主", time: "2025-07-23 16:50", remark: "進行維修" },
    { id: 7, occupied: false },
    { id: 8, occupied: false },
    { id: 9, occupied: true, shipName: "黃金航線", time: "2025-07-23 15:20", remark: "將於今晚離港" },
    { id: 10, occupied: false },
    { id: 11, occupied: false },
  ];

  const handleBerthClick = (berth) => {
    if (!berth.occupied) return;
    setSelectedBerth(berth);
    setShowModal(true);
  };

  const portLogs = [
    { id: 1, type: "入港", ship: "海洋之星", time: "2025-07-24 08:30" },
    { id: 2, type: "出港", ship: "遠航號", time: "2025-07-24 07:00" },
    { id: 3, type: "入港", ship: "天鵝號", time: "2025-07-24 06:50" },
  ];

  return (
    <div style={{ fontSize: "1rem", lineHeight: 1.5 }}>
      <nav className="navbar navbar-light bg-white shadow-sm mb-4">
        <div className="container-fluid">
          <span className="navbar-brand mb-0" style={{ color: "#0599BB" }}>
            遊艇碼頭管理平台 Dashboard
          </span>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="p-4 bg-white shadow rounded">
          <div className="row text-center">
            {cardInfo.map((card) => (
              <div
                key={card.key}
                className="col-md-2"
                style={{ cursor: "pointer", minHeight: "72px" }}
                onClick={() => setActiveKey(card.key)}
              >
                <div className="text-muted small">{card.label}</div>
                <div className="fs-4 fw-bold">
                  {card.icon} {card.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ 11 個船位圖示 */}
      <div className="container p-4 bg-white shadow rounded mt-4">
        <h5 className="text-primary mb-3">目前 11 個船舶泊位狀況</h5>
        <div className="d-flex justify-content-center flex-wrap gap-3">
          {berthData.map((berth) => (
            <OverlayTrigger
              key={berth.id}
              placement="top"
              overlay={
                <Tooltip style={{ whiteSpace: "nowrap" }}>
                  {berth.occupied ? (
                    <>
                      <strong>{berth.shipName}</strong><br />
                      {berth.time}
                    </>
                  ) : (
                    "空位"
                  )}
                </Tooltip>
              }
            >
              <div
                className="d-flex flex-column align-items-center"
                style={{ width: "60px", cursor: berth.occupied ? "pointer" : "default", minHeight: "70px" }}
                onClick={() => handleBerthClick(berth)}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: berth.occupied ? "#0599BB" : "#e0e0e0",
                    border: "2px solid #ccc",
                  }}
                ></div>
                <div className="mt-1 small">船位 {berth.id}</div>
              </div>
            </OverlayTrigger>
          ))}
        </div>
      </div>

      {/* ✅ 進出港紀錄 */}
      <div className="container p-4 bg-white shadow rounded mt-4 mb-5">
        <h5 className="text-primary mb-3">近期進出港紀錄</h5>
        <table className="table table-bordered table-sm mb-0">
          <thead className="table-light">
            <tr>
              <th>類型</th>
              <th>船名</th>
              <th>時間</th>
            </tr>
          </thead>
          <tbody>
            {portLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.type}</td>
                <td>{log.ship}</td>
                <td>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ 船舶詳細資訊 Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>船舶資訊</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBerth && (
            <>
              <p><strong>船名：</strong>{selectedBerth.shipName}</p>
              <p><strong>停靠時間：</strong>{selectedBerth.time}</p>
              <p><strong>備註：</strong>{selectedBerth.remark}</p>
              <p><strong>泊位：</strong>船位 {selectedBerth.id}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            關閉
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}