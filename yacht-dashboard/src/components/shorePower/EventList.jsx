// 事件列表：顯示岸電系統的最新事件 / 告警紀錄
// 這個元件只負責把事件清單畫出來，不負責資料來源或排序

import React from "react";

// 將事件等級轉成畫面顯示用的文字與樣式
// 後端若新增等級，只需要在這裡補對應
const levelMeta = {
  INFO:  { label: "資訊", cls: "good" },
  WARN:  { label: "警告", cls: "warn" },
  ALARM: { label: "告警", cls: "bad" },
};

export default function EventList({ items = [] }) {
  return (
    <div className="sp-list">
      {items.map((e) => {
        // 若等級不在對照表內，直接顯示原始 level，避免畫面壞掉
        const meta =
          levelMeta[e.level] || { label: e.level || "事件", cls: "off" };

        return (
          <div key={e.id} className="row">
            {/* 上排：事件標題 + 等級標籤 */}
            <div className="top">
              <b>{e.title}</b>
              <span className={`pill ${meta.cls}`}>
                {meta.label}
              </span>
            </div>

            {/* 下排：補充資訊（時間 / 來源） */}
            <div className="meta">
              時間：{e.at}　｜　來源：{e.by}
            </div>
          </div>
        );
      })}

      {/* 沒有任何事件時的空狀態顯示 */}
      {items.length === 0 ? (
        <div className="row">目前沒有事件</div>
      ) : null}
    </div>
  );
}