import { useEffect, useMemo, useState } from "react";
import "../../styles/userProfile/BerthRecord.css";

const fmtDate = (d) => (d ? String(d).slice(0, 10) : "-");

const StatusBadge = ({ status }) => {
  const tone =
    status === "已完成" ? "done" :
    status === "停泊中" ? "ing" :
    status === "待審核" ? "pending" :
    status === "已取消" ? "cancel" :
    "default";

  return <span className={`br-badge br-badge--${tone}`}>{status || "—"}</span>;
};

const KV = ({ k, v }) => (
  <div className="br-kv">
    <div className="br-k">{k}</div>
    <div className="br-v">{v ?? "-"}</div>
  </div>
);

const makeEmpty = () => ({
  schedule: {
    arrivalDate: "",
    departureDate: "",
    arrivalTime: "",
    purpose: "",
    previousPortCode: "",
    portCode: "",
    nextPortCode: "",
    berth: "",
  },
  other: { draft: "", crewHealthIssueCount: "" },
  visa: { onboardTaiwan: "", onboardForeign: "" },
});

export default function BerthRecord() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  const [openId, setOpenId] = useState(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("全部");

  useEffect(() => {
    const mock = [
      {
        id: "r1",
        recordName: "2026/01 停泊紀錄（A-12）",
        berth: "A-12",
        status: "已完成",
        arrivalDate: "2026-01-05",
        departureDate: "2026-01-06",
        data: {
          ...makeEmpty(),
          schedule: {
            ...makeEmpty().schedule,
            arrivalDate: "2026-01-05",
            departureDate: "2026-01-06",
            arrivalTime: "1030",
            purpose: "補給",
            previousPortCode: "KHH",
            portCode: "KHH",
            nextPortCode: "TPE",
            berth: "A-12",
          },
          other: { draft: "2.1", crewHealthIssueCount: "0" },
          visa: { onboardTaiwan: "6", onboardForeign: "2" },
        },
      },
      {
        id: "r2",
        recordName: "2026/02 停泊紀錄（B-03）",
        berth: "B-03",
        status: "停泊中",
        arrivalDate: "2026-02-02",
        departureDate: "",
        data: {
          ...makeEmpty(),
          schedule: {
            ...makeEmpty().schedule,
            arrivalDate: "2026-02-02",
            departureDate: "",
            arrivalTime: "0900",
            purpose: "維修",
            previousPortCode: "OKA",
            portCode: "KHH",
            nextPortCode: "",
            berth: "B-03",
          },
          other: { draft: "2.4", crewHealthIssueCount: "1" },
          visa: { onboardTaiwan: "3", onboardForeign: "5" },
        },
      },
    ];

    setRecords(mock);
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return records.filter((r) => {
      if (status !== "全部" && r.status !== status) return false;
      if (!kw) return true;
      const hay = `${r.recordName} ${r.berth}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [records, q, status]);

  const toggleOpen = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="br-container">
      <div className="br-header">
        <div>
          <h2 className="br-title">船隻停泊紀錄</h2>
          <div className="br-subtitle">點擊「紀錄名稱」可展開查看詳細內容。</div>
        </div>
      </div>

      <div className="br-filters">
        <div className="br-filter">
          <div className="br-filter-label">搜尋</div>
          <input
            className="br-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="輸入紀錄名稱 / 船席"
          />
        </div>

        <div className="br-filter">
          <div className="br-filter-label">狀態</div>
          <select className="br-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="全部">全部</option>
            <option value="待審核">待審核</option>
            <option value="停泊中">停泊中</option>
            <option value="已完成">已完成</option>
            <option value="已取消">已取消</option>
          </select>
        </div>

        <button className="br-btn br-btn--ghost" onClick={() => { setQ(""); setStatus("全部"); }}>
          清除條件
        </button>
      </div>

      {loading ? (
        <div className="br-skeleton">載入中…</div>
      ) : filtered.length === 0 ? (
        <div className="br-empty">查無停泊紀錄</div>
      ) : (
        <div className="br-list">
          {filtered.map((r) => {
            const open = openId === r.id;
            const d = r.data ?? makeEmpty();
            const visaTotal =
              Number(d.visa.onboardTaiwan || 0) + Number(d.visa.onboardForeign || 0);

            return (
              <div key={r.id} className={`br-card ${open ? "is-open" : ""}`}>
                <div className="br-row">
                  <button
                    type="button"
                    className="br-recordname"
                    onClick={() => toggleOpen(r.id)}
                    aria-expanded={open}
                  >
                    <span className="br-chevron">{open ? "▾" : "▸"}</span>
                    <span className="br-recordname-text">{r.recordName}</span>
                    {r.berth ? <span className="br-chip">{r.berth}</span> : null}
                  </button>

                  <div className="br-meta">
                    <div className="br-meta-item">
                      <span className="k">進港</span>
                      <span className="v">{fmtDate(r.arrivalDate)}</span>
                    </div>
                    <div className="br-meta-item">
                      <span className="k">離港</span>
                      <span className="v">{fmtDate(r.departureDate)}</span>
                    </div>
                    <div className="br-meta-item">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                </div>

                {open && (
                  <div className="br-expand">
                    <div className="br-detail">
                      <div className="br-detail-title">停泊紀錄明細</div>

                      <div className="br-detail-grid">
                        <KV k="紀錄名稱" v={r.recordName} />
                        <KV k="狀態" v={<StatusBadge status={r.status} />} />
                        <KV k="預定進港日期" v={fmtDate(d.schedule.arrivalDate)} />
                        <KV k="預定離臺日期" v={fmtDate(d.schedule.departureDate)} />
                      </div>

                      <div className="br-sections">
                        <div className="br-section">
                          <h3>預定進港日期、航線、港口</h3>
                          <div className="br-detail-grid">
                            <KV k="預定進港時間" v={d.schedule.arrivalTime || "-"} />
                            <KV k="進港目的" v={d.schedule.purpose || "-"} />
                            <KV k="前一港代碼" v={d.schedule.previousPortCode || "-"} />
                            <KV k="進出港口" v={d.schedule.portCode || "-"} />
                            <KV k="次一港代碼" v={d.schedule.nextPortCode || "-"} />
                            <KV k="靠泊馬頭" v={d.schedule.berth || "-"} />
                          </div>
                        </div>

                        <div className="br-section">
                          <h3>其他</h3>
                          <div className="br-detail-grid">
                            <KV k="吃水 (公尺)" v={d.other.draft || "-"} />
                            <KV k="船員健康異常人數" v={d.other.crewHealthIssueCount || "-"} />
                          </div>
                        </div>

                        <div className="br-section">
                          <h3>簽證人數</h3>
                          <div className="br-detail-grid">
                            <KV k="在船人數 (台灣)" v={d.visa.onboardTaiwan || "0"} />
                            <KV k="在船人數 (外國)" v={d.visa.onboardForeign || "0"} />
                            <KV k="合計" v={String(visaTotal)} />
                          </div>
                        </div>
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
