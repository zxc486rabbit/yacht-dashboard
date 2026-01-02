// 統計卡片（支援 icon）
export default function StatsCard({ title, value, sub, icon, tone = "default" }) {
  return (
    <div className={`sp-stat sp-stat--${tone}`}>
      <div className="sp-stat__row">
        <div className="sp-stat__icon">{icon}</div>
        <div className="sp-stat__meta">
          <div className="sp-stat__title">{title}</div>
          <div className="sp-stat__value">{value}</div>
          {sub ? <div className="sp-stat__sub">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}
