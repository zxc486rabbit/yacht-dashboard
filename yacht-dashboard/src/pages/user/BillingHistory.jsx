import { useEffect, useMemo, useRef, useState } from "react";
import "./BillingHistory.css";

// helpers
const fmtDate = (d) => (d ? String(d).slice(0, 10) : "-");
const fmtMoney = (n) => {
  const num = Number(n || 0);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });
};

const StatusBadge = ({ status }) => {
  const tone =
    status === "已付款" ? "paid" :
    status === "待付款" ? "pending" :
    status === "已取消" ? "cancel" :
    "default";

  return <span className={`bh-badge bh-badge--${tone}`}>{status || "—"}</span>;
};

export default function BillingHistory() {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);

  // 篩選（可留可不留）
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("全部");

  // 展開：點帳單名稱
  const [openId, setOpenId] = useState(null);

  // 列印會用到（你下一步要做列印我再幫你補）
  const detailRefs = useRef({});

  useEffect(() => {
    // TODO: 換成 API：getUserBillingRecords()

    // 注意：這裡已經沒有「項目」欄位
    // 用 billName 當帳單名稱；用 lines 當展開後明細
    const mock = [
      {
        id: "b1",
        billName: "2026/01 停泊費（A-12）",
        billNo: "INV-202601-0001",
        issueDate: "2026-01-05",
        dueDate: "2026-01-20",
        status: "已付款",
        amount: 15800,
        payMethod: "VISA ****1234",
        paidAt: "2026-01-06",
        lines: [
          { name: "停泊費（月租）", qty: 1, unitPrice: 12000, subtotal: 12000 },
          { name: "岸電費", qty: 1, unitPrice: 3800, subtotal: 3800 },
        ],
      },
      {
        id: "b2",
        billName: "2026/02 停泊費（B-03）",
        billNo: "INV-202602-0003",
        issueDate: "2026-02-02",
        dueDate: "2026-02-18",
        status: "待付款",
        amount: 13200,
        payMethod: "台灣銀行 ****5678",
        paidAt: "",
        lines: [{ name: "停泊費（月租）", qty: 1, unitPrice: 13200, subtotal: 13200 }],
      },
    ];

    setBills(mock);
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return bills.filter((b) => {
      if (status !== "全部" && b.status !== status) return false;
      if (!kw) return true;
      const hay = `${b.billName} ${b.billNo}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [bills, q, status]);

  const toggleOpen = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bh-container">
      <div className="bh-header">
        <div>
          <h2 className="bh-title">繳費紀錄</h2>
          <div className="bh-subtitle">點擊「帳單名稱」可展開查看明細。</div>
        </div>
      </div>

      <div className="bh-filters">
        <div className="bh-filter">
          <div className="bh-filter-label">搜尋</div>
          <input
            className="bh-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="輸入帳單名稱 / 帳單編號"
          />
        </div>

        <div className="bh-filter">
          <div className="bh-filter-label">狀態</div>
          <select className="bh-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="全部">全部</option>
            <option value="待付款">待付款</option>
            <option value="已付款">已付款</option>
            <option value="已取消">已取消</option>
          </select>
        </div>

        <button className="bh-btn bh-btn--ghost" onClick={() => { setQ(""); setStatus("全部"); }}>
          清除條件
        </button>
      </div>

      {loading ? (
        <div className="bh-skeleton">載入中…</div>
      ) : filtered.length === 0 ? (
        <div className="bh-empty">查無繳費紀錄</div>
      ) : (
        <div className="bh-list">
          {filtered.map((b) => {
            const open = openId === b.id;

            return (
              <div key={b.id} className={`bh-card ${open ? "is-open" : ""}`}>
                {/* row header */}
                <div className="bh-row">
                  {/* 帳單名稱：點這裡展開 */}
                  <button
                    type="button"
                    className="bh-billname"
                    onClick={() => toggleOpen(b.id)}
                    aria-expanded={open}
                  >
                    <span className="bh-chevron">{open ? "▾" : "▸"}</span>
                    <span className="bh-billname-text">{b.billName}</span>
                    {b.billNo ? <span className="bh-billno">{b.billNo}</span> : null}
                  </button>

                  <div className="bh-meta">
                    <div className="bh-meta-item">
                      <span className="k">開立日</span>
                      <span className="v">{fmtDate(b.issueDate)}</span>
                    </div>
                    <div className="bh-meta-item">
                      <span className="k">應繳日</span>
                      <span className="v">{fmtDate(b.dueDate)}</span>
                    </div>
                    <div className="bh-meta-item">
                      <span className="k">金額</span>
                      <span className="v bh-amount">{fmtMoney(b.amount)}</span>
                    </div>
                    <div className="bh-meta-item">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </div>

                {/* expand */}
                {open && (
                  <div className="bh-expand">
                    <div
                      className="bh-detail"
                      ref={(el) => { if (el) detailRefs.current[b.id] = el; }}
                    >
                      <div className="bh-detail-title">帳單明細</div>

                      <div className="bh-detail-grid">
                        <div className="bh-kv">
                          <div className="bh-k">帳單名稱</div>
                          <div className="bh-v">{b.billName}</div>
                        </div>
                        <div className="bh-kv">
                          <div className="bh-k">帳單編號</div>
                          <div className="bh-v">{b.billNo || "-"}</div>
                        </div>
                        <div className="bh-kv">
                          <div className="bh-k">付款方式</div>
                          <div className="bh-v">{b.payMethod || "-"}</div>
                        </div>
                        <div className="bh-kv">
                          <div className="bh-k">付款日期</div>
                          <div className="bh-v">{fmtDate(b.paidAt)}</div>
                        </div>
                      </div>

                      <div className="bh-lines">
                        <table>
                          <thead>
                            <tr>
                              <th>明細</th>
                              <th style={{ width: 90 }}>數量</th>
                              <th style={{ width: 130 }}>單價</th>
                              <th style={{ width: 130 }}>小計</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(b.lines ?? []).map((l, idx) => (
                              <tr key={idx}>
                                <td>{l.name}</td>
                                <td>{l.qty}</td>
                                <td>{fmtMoney(l.unitPrice)}</td>
                                <td>{fmtMoney(l.subtotal)}</td>
                              </tr>
                            ))}
                            {(b.lines ?? []).length === 0 && (
                              <tr>
                                <td colSpan={4} className="bh-muted">無明細資料</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="bh-total">
                        <span className="label">合計</span>
                        <span className="value">{fmtMoney(b.amount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
