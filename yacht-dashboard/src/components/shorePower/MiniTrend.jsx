// 迷你趨勢圖（先用簡單 bar 假裝，之後換 Recharts）
export default function MiniTrend({ data = [] }) {
  const max = Math.max(1, ...data);
  return (
    <div className="sp-miniTrend">
      {data.map((v, i) => (
        <div key={i} className="sp-miniTrend__barWrap" title={String(v)}>
          <div className="sp-miniTrend__bar" style={{ height: `${(v / max) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}
