// src/components/shorePower/EventList.jsx
import React from "react";

const levelMeta = {
  INFO: { label: "資訊", cls: "good" },
  WARN: { label: "警告", cls: "warn" },
  ALARM: { label: "告警", cls: "bad" },
};

export default function EventList({ items = [] }) {
  return (
    <div className="sp-list">
      {items.map((e) => {
        const meta = levelMeta[e.level] || { label: e.level || "事件", cls: "off" };
        return (
          <div key={e.id} className="row">
            <div className="top">
              <b>{e.title}</b>
              <span className={`pill ${meta.cls}`}>{meta.label}</span>
            </div>
            <div className="meta">時間：{e.at}　｜　來源：{e.by}</div>
          </div>
        );
      })}
      {items.length === 0 ? <div className="row">目前沒有事件</div> : null}
    </div>
  );
}
