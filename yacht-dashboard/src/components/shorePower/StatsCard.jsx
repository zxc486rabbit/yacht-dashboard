// 統計卡片：用來顯示單一 KPI 數值（例如今日用電、異常數）
// 只負責呈現資料，樣式由 tone 決定

export default function StatsCard({
  title,
  value,
  sub,
  icon,
  tone = "default",
}) {
  return (
    // tone 會對應不同顏色樣式（default / good / warn / bad ...）
    <div className={`sp-stat sp-stat--${tone}`}>
      <div className="sp-stat__row">
        {/* 左側 icon，通常用來快速辨識 KPI 類型 */}
        <div className="sp-stat__icon">{icon}</div>

        {/* 右側文字資訊 */}
        <div className="sp-stat__meta">
          <div className="sp-stat__title">{title}</div>
          <div className="sp-stat__value">{value}</div>

          {/* sub 為可選欄位，沒有就不顯示 */}
          {sub ? <div className="sp-stat__sub">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}
