// 區塊容器卡片
// 用來當作儀表板每個區塊的外框（標題 + 內容）
// 本身不關心裡面放什麼，只負責版型一致

export default function SectionCard({ title, right, children }) {
  return (
    <div className="sp-card">
      {/* 標題列：左側標題，右側通常放按鈕或輔助資訊 */}
      <div className="sp-card__hd">
        <div className="sp-card__title">{title}</div>
        <div className="sp-card__right">{right}</div>
      </div>

      {/* 內容區：由外層決定放什麼進來 */}
      <div className="sp-card__bd">{children}</div>
    </div>
  );
}
