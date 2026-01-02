// 區塊容器卡片
export default function SectionCard({ title, right, children }) {
  return (
    <div className="sp-card">
      <div className="sp-card__hd">
        <div className="sp-card__title">{title}</div>
        <div className="sp-card__right">{right}</div>
      </div>
      <div className="sp-card__bd">{children}</div>
    </div>
  );
}
