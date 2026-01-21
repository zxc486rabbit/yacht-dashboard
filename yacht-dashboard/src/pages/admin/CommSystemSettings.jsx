import React, { useMemo, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSortDown,
  FaSave,
  FaUndoAlt,
} from "react-icons/fa";

import "../../styles/dashboard/Dashboard.css";
import "../../styles/admin/admin.settings.css";

const seedData = [
  { id: 1, ip: "192.168.112.123", type: "路由器", subType: "N/A" },
  { id: 2, ip: "192.168.112.125", type: "交換器", subType: "一般" }, // 顯示層會轉成 N/A
  { id: 3, ip: "192.168.112.126", type: "交換器", subType: "POE" },
  { id: 4, ip: "192.168.112.250", type: "AP", subType: "N/A" },
];

const TYPE_OPTIONS = ["路由器", "交換器", "AP"];
const SWITCH_SUBTYPE_OPTIONS = ["一般", "POE"];

function normalizeByType(next) {
  if (next.type !== "交換器") return { ...next, subType: "N/A" };
  if (!SWITCH_SUBTYPE_OPTIONS.includes(next.subType))
    return { ...next, subType: "一般" };
  return next;
}

// 交換器一般型顯示 N/A（只有 POE 顯示 POE）
function renderSubType(row) {
  return row.type === "交換器" && row.subType === "POE" ? "POE" : "N/A";
}

export default function CommSystemSettings() {
  const [data, setData] = useState(seedData);
  const [selectedId, setSelectedId] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    ip: "",
    type: "路由器",
    subType: "N/A",
  });

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) =>
      String(a[sortKey]).localeCompare(String(b[sortKey]))
    );
  }, [data, sortKey]);

  const openAdd = () => {
    setForm({ ip: "", type: "路由器", subType: "N/A" });
    setShowModal(true);
  };

  const openEdit = () => {
    const target = data.find((d) => d.id === selectedId);
    if (!target) return;
    setForm(target);
    setShowModal(true);
  };

  const saveRow = () => {
    const next = normalizeByType(form);
    if (!next.ip?.trim()) return;

    setData((d) => {
      const out = next.id
        ? d.map((i) => (i.id === next.id ? next : i))
        : [...d, { ...next, id: Date.now() }];
      return out;
    });

    setDirty(true);
    setShowModal(false);
  };

  const removeRow = () => {
    setData((d) => d.filter((i) => i.id !== selectedId));
    setSelectedId(null);
    setDirty(true);
  };

  const saveAll = () => setDirty(false);

  const resetAll = () => {
    setData(seedData);
    setSelectedId(null);
    setDirty(false);
  };

  return (
    <div className="as-page">
      <div className="as-header">
        <div className="as-titleWrap">
          <h2 className="as-title">通訊系統設定</h2>
          {dirty && <span className="as-dirty">尚未儲存</span>}
        </div>

        <div className="as-topActions">
          <button
            className="as-btn primary"
            onClick={saveAll}
            disabled={!dirty}
          >
            <FaSave /> 儲存
          </button>
          <button
            className="as-btn ghost"
            onClick={resetAll}
            disabled={!dirty}
          >
            <FaUndoAlt /> 還原
          </button>
        </div>
      </div>

      <div className="as-card">
        <div className="as-cardHead">
          <div>
            <div className="as-cardTitle">網路設備清單</div>
            <div className="as-cardSubtitle">
              設定通訊設備 IP 與型態（交換器 POE 供電將標示為 POE）
            </div>
          </div>

          <div className="as-rowActions">
            <button className="as-btn" onClick={openAdd}>
              <FaPlus /> 新增
            </button>
            <button
              className="as-btn"
              disabled={!selectedId}
              onClick={openEdit}
            >
              <FaEdit /> 修改
            </button>
            <button
              className="as-btn danger"
              disabled={!selectedId}
              onClick={removeRow}
            >
              <FaTrash /> 刪除
            </button>
          </div>
        </div>

        <div className="as-tableWrap">
          <table className="as-table">
            <thead>
              <tr>
                <th className="as-colRadio"></th>
                <th
                  className="as-thSort"
                  onClick={() => setSortKey("ip")}
                  role="button"
                >
                  網路設備IP <FaSortDown className="as-sortIco" />
                </th>
                <th
                  className="as-thSort"
                  onClick={() => setSortKey("type")}
                  role="button"
                >
                  型態 <FaSortDown className="as-sortIco" />
                </th>
                <th
                  className="as-thSort"
                  onClick={() => setSortKey("subType")}
                  role="button"
                >
                  子型態 <FaSortDown className="as-sortIco" />
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedData.map((row) => (
                <tr
                  key={row.id}
                  className={selectedId === row.id ? "is-selected" : ""}
                >
                  <td className="as-colRadio">
                    <input
                      type="radio"
                      checked={selectedId === row.id}
                      onChange={() => setSelectedId(row.id)}
                    />
                  </td>
                  <td>{row.ip}</td>
                  <td>{row.type}</td>
                  <td>{renderSubType(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="as-modal">
          <div className="as-modalCard">
            <div className="as-modalHead">
              <h3>通訊設備設定</h3>
              <button
                className="x"
                onClick={() => setShowModal(false)}
                aria-label="close"
              >
                ×
              </button>
            </div>

            <div className="as-form">
              <div className="as-field">
                <label>網路設備 IP</label>
                <input
                  value={form.ip}
                  onChange={(e) =>
                    setForm({ ...form, ip: e.target.value })
                  }
                  placeholder="例如：192.168.112.123"
                />
              </div>

              <div className="as-field">
                <label>型態</label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setForm((prev) =>
                      normalizeByType({
                        ...prev,
                        type,
                        subType: prev.subType,
                      })
                    );
                  }}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {form.type === "交換器" && (
                <div className="as-field">
                  <label>子型態</label>
                  <select
                    value={form.subType}
                    onChange={(e) =>
                      setForm((prev) =>
                        normalizeByType({
                          ...prev,
                          subType: e.target.value,
                        })
                      )
                    }
                  >
                    {SWITCH_SUBTYPE_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  <div className="as-hint">
                    顯示規則：僅 POE 會顯示「POE」，一般型在列表顯示為
                    N/A。
                  </div>
                </div>
              )}
            </div>

            <div className="as-modalActions">
              <button className="as-btn primary" onClick={saveRow}>
                <FaSave /> 儲存
              </button>
              <button
                className="as-btn ghost"
                onClick={() => setShowModal(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
