import { useMemo, useState } from "react";

/** 小工具：把 "YYYY-MM-DD HH:mm" 轉成 Date（不合規就回 null） */
function parseDateTime(str) {
  if (!str) return null;
  const s = str.replace(" ", "T");
  const withSec = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? `${s}:00` : s;
  const d = new Date(withSec);
  return isNaN(d.getTime()) ? null : d;
}

export default function AccessRecords() {
  const names = [
    "王小明","陳美麗","李志強","林佳蓉","張育誠",
    "黃淑芬","趙元華","吳佳玲","鄭文龍","周婉君",
    "徐志豪","曾雅婷","賴建銘","劉佩君","簡士強",
    "羅怡君","蔡嘉文","謝冠宇","鍾惠茹","唐昱翔",
    "杜依婷","馮育仁","韓佳珍","葉志成","程芷涵",
  ];

  const methods = ["人臉辨識", "刷卡", "密碼", "遠端"];

  // ---- 假資料（可接 API 後替換）----
  const initialRecords = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => {
        const method = methods[i % methods.length];
        const isRemote = method === "遠端";
        const action = isRemote ? "門開" : i % 2 === 0 ? "進入" : "離開";

        return {
          id: i + 1,
          // 遠端：姓名 & userID 皆空
          name: isRemote ? "" : names[i],
          userId: isRemote ? "" : `AIC-${1000 + i}`,
          method, // 人臉辨識 / 刷卡 / 密碼 / 遠端
          time: `2024-07-18 0${(i % 9) + 1}:30`,
          action, // 進入 / 離開 / 門開
        };
      }),
    []
  );

  // ---- 查詢條件（合併：姓名/userID）----
  const [qKeyword, setQKeyword] = useState("");     // 姓名或 userID
  const [qFrom, setQFrom] = useState("");           // 起（datetime-local）
  const [qTo, setQTo] = useState("");               // 迄（datetime-local）
  const [qAction, setQAction] = useState("all");    // 動作
  const [qMethod, setQMethod] = useState("all");    // 方式

  // ---- 分頁 ----
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ---- 過濾 ----
  const filtered = useMemo(() => {
    const kw = qKeyword.trim();
    const from = qFrom ? new Date(qFrom) : null;
    const to = qTo ? new Date(qTo) : null;

    return initialRecords.filter((r) => {
      // 1) 關鍵字（姓名 or userID）
      if (kw) {
        const hit =
          (r.name || "").includes(kw) ||
          (r.userId || "").includes(kw);
        if (!hit) return false;
      }

      // 2) 動作
      if (qAction !== "all" && r.action !== qAction) return false;

      // 3) 方式
      if (qMethod !== "all" && r.method !== qMethod) return false;

      // 4) 時間區間
      const t = parseDateTime(r.time);
      if (from && t && t < from) return false;
      if (to && t && t > to) return false;

      return true;
    });
  }, [initialRecords, qKeyword, qFrom, qTo, qAction, qMethod]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pageRecords = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // 任一查詢條件變更 => 回到第 1 頁
  const onFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setQKeyword("");
    setQFrom("");
    setQTo("");
    setQAction("all");
    setQMethod("all");
    setPage(1);
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-primary">進出識別紀錄</h3>

      {/* 單行查詢列（保留 label；超出寬度可水平捲動） */}
      <div
        className="d-flex align-items-end gap-3 flex-nowrap overflow-auto pb-2"
        style={{ whiteSpace: "nowrap" }}
      >
        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 280 }}>
          <label htmlFor="kw" className="form-label mb-1">關鍵字（姓名 / userID）</label>
          <input
            id="kw"
            type="text"
            className="form-control"
            placeholder="例：王小明、AIC-1003"
            value={qKeyword}
            onChange={onFilterChange(setQKeyword)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 220 }}>
          <label htmlFor="from" className="form-label mb-1">時間（起）</label>
          <input
            id="from"
            type="datetime-local"
            className="form-control"
            value={qFrom}
            onChange={onFilterChange(setQFrom)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 220 }}>
          <label htmlFor="to" className="form-label mb-1">時間（迄）</label>
          <input
            id="to"
            type="datetime-local"
            className="form-control"
            value={qTo}
            onChange={onFilterChange(setQTo)}
          />
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 160 }}>
          <label htmlFor="act" className="form-label mb-1">動作</label>
          <select
            id="act"
            className="form-select"
            value={qAction}
            onChange={onFilterChange(setQAction)}
          >
            <option value="all">全部</option>
            <option value="進入">進入</option>
            <option value="離開">離開</option>
            <option value="門開">門開</option>
          </select>
        </div>

        <div className="d-flex flex-column flex-shrink-0" style={{ minWidth: 170 }}>
          <label htmlFor="method" className="form-label mb-1">方式</label>
          <select
            id="method"
            className="form-select"
            value={qMethod}
            onChange={onFilterChange(setQMethod)}
          >
            <option value="all">全部</option>
            <option value="人臉辨識">人臉辨識</option>
            <option value="刷卡">刷卡</option>
            <option value="密碼">密碼</option>
            <option value="遠端">遠端</option>
          </select>
        </div>

        <div className="flex-shrink-0" style={{ paddingBottom: 2 }}>
          <button className="btn btn-outline-secondary" onClick={clearFilters}>
            清除條件
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="table-responsive mt-2">
        <table className="table table-bordered text-center shadow-sm align-middle">
          <thead className="table-info sticky-top">
            <tr>
              <th style={{ width: 80 }}>序號</th>
              <th>姓名</th>
              <th>userID</th>
              <th style={{ width: 140 }}>方式</th>
              <th style={{ minWidth: 180 }}>時間</th>
              <th style={{ width: 120 }}>動作</th>
            </tr>
          </thead>
          <tbody>
            {pageRecords.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-muted">查無資料</td>
              </tr>
            ) : (
              pageRecords.map((rec) => {
                const isRemote = rec.method === "遠端";
                const showName = isRemote ? "" : rec.name;
                const showUserId = isRemote ? "" : rec.userId;

                return (
                  <tr key={rec.id}>
                    <td>{rec.id}</td>
                    <td className={isRemote ? "text-muted" : ""}>{showName}</td>
                    <td className={isRemote ? "text-muted" : ""}>{showUserId}</td>
                    {/* 方式：純文字顯示 */}
                    <td>{rec.method}</td>
                    <td>{rec.time}</td>
                    <td>
                      {rec.action === "進入" && (
                        <span className="badge bg-success">
                          <i className="fas fa-door-open me-1" /> 進入
                        </span>
                      )}
                      {rec.action === "離開" && (
                        <span className="badge bg-danger">
                          <i className="fas fa-door-closed me-1" /> 離開
                        </span>
                      )}
                      {rec.action === "門開" && (
                        <span className="badge bg-dark">
                          <i className="fas fa-unlock me-1" /> 門開
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      <div className="d-flex justify-content-center">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${safePage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                上一頁
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i} className={`page-item ${safePage === i + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${safePage === totalPages ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                下一頁
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
