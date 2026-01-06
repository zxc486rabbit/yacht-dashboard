import { useEffect, useMemo, useState } from "react";
import "./MyYachts.css";

/** ========= 可重用欄位元件 ========= */
const FormRow = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  required = false,
  error,
  placeholder,
}) => {
  return (
    <div className="y-form-row">
      <label className="y-label">
        {label} {required && <span className="y-required">*</span>}
      </label>

      <input
        className={`y-input ${error ? "y-input--error" : ""}`}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />

      {error && <div className="y-error">{error}</div>}
    </div>
  );
};

/** ========= helpers ========= */
const makeEmptyYacht = () => ({
  id: "",
  summary: {
    businessNo: "", // 唯讀：可由後端給
    vesselNo: "", // 唯讀：可由後端給
    vesselNameZh: "",
    nationality: "",
    vesselType: "",
    grossTonnage: "",
    operatorName: "",
    userAccountRef: "",
    passportNo: "",
  },
  detail: {
    arrivalNoticeNo: "", // 唯讀：可由後端給
    radioCallSign: "",
    vesselNameEn: "",
    portOfRegistry: "",
    loa: "",
    beam: "",
    depth: "",
    buildDate: "",
  },
});

const validateYacht = (yacht) => {
  const e = {};
  const s = yacht.summary;
  const d = yacht.detail;

  // 必填（依你目前需求）
  if (!s.vesselNameZh?.trim()) e["summary.vesselNameZh"] = "必填";
  if (!s.nationality?.trim()) e["summary.nationality"] = "必填";
  if (!s.vesselType?.trim()) e["summary.vesselType"] = "必填";
  if (!s.operatorName?.trim()) e["summary.operatorName"] = "必填";

  // 數字
  const numericFields = [
    ["summary.grossTonnage", s.grossTonnage],
    ["detail.loa", d.loa],
    ["detail.beam", d.beam],
    ["detail.depth", d.depth],
  ];
  numericFields.forEach(([key, val]) => {
    if (val !== "" && val !== null && val !== undefined) {
      if (Number.isNaN(Number(val))) e[key] = "必須為數字";
      if (!Number.isNaN(Number(val)) && Number(val) < 0) e[key] = "不可為負數";
    }
  });

  // 日期
  if (d.buildDate) {
    const ok = !Number.isNaN(Date.parse(d.buildDate));
    if (!ok) e["detail.buildDate"] = "日期格式錯誤";
  }

  return e;
};

export default function MyYachts() {
  /** ========= 列表狀態 ========= */
  const [loading, setLoading] = useState(true);
  const [yachts, setYachts] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  /** ========= 查詢/篩選 ========= */
  const [qVesselNo, setQVesselNo] = useState("");
  const [qName, setQName] = useState("");
  const [qNationality, setQNationality] = useState("");

  /** ========= 右側表單狀態 ========= */
  const [mode, setMode] = useState("view"); // view | edit | create
  const [draft, setDraft] = useState(makeEmptyYacht());
  const [errors, setErrors] = useState({});

  /** ========= 初始化：載入清單 ========= */
  useEffect(() => {
    // TODO: 改成 API：GET /yachts
    const mock = [
      {
        id: "y1",
        summary: {
          businessNo: "BIZ-20260001",
          vesselNo: "TW-001",
          vesselNameZh: "海風號",
          nationality: "台灣",
          vesselType: "遊艇",
          grossTonnage: "28",
          operatorName: "林先生",
          userAccountRef: "U-10001",
          passportNo: "P1234567",
        },
        detail: {
          arrivalNoticeNo: "AN-998877",
          radioCallSign: "BC8XYZ",
          vesselNameEn: "SEA BREEZE",
          portOfRegistry: "Kaohsiung",
          loa: "16.2",
          beam: "4.3",
          depth: "2.1",
          buildDate: "2018-05-10",
        },
      },
      {
        id: "y2",
        summary: {
          businessNo: "BIZ-20260002",
          vesselNo: "TW-002",
          vesselNameZh: "藍鯨號",
          nationality: "日本",
          vesselType: "帆船",
          grossTonnage: "34",
          operatorName: "佐藤",
          userAccountRef: "U-10001",
          passportNo: "JP998811",
        },
        detail: {
          arrivalNoticeNo: "AN-112233",
          radioCallSign: "JA1ABC",
          vesselNameEn: "BLUE WHALE",
          portOfRegistry: "Yokohama",
          loa: "18.0",
          beam: "4.8",
          depth: "2.4",
          buildDate: "2016-03-22",
        },
      },
    ];

    setYachts(mock);
    setSelectedId(mock[0]?.id ?? "");
    setLoading(false);
  }, []);

  /** ========= 取得選中的船 ========= */
  const selected = useMemo(
    () => yachts.find((x) => x.id === selectedId) ?? null,
    [yachts, selectedId]
  );

  /** ========= 列表過濾 ========= */
  const filtered = useMemo(() => {
    const v = qVesselNo.trim().toLowerCase();
    const n = qName.trim().toLowerCase();
    const nat = qNationality.trim().toLowerCase();

    return yachts.filter((y) => {
      const vesselNo = (y.summary.vesselNo ?? "").toLowerCase();
      const nameZh = (y.summary.vesselNameZh ?? "").toLowerCase();
      const nationality = (y.summary.nationality ?? "").toLowerCase();

      if (v && !vesselNo.includes(v)) return false;
      if (n && !nameZh.includes(n)) return false;
      if (nat && !nationality.includes(nat)) return false;
      return true;
    });
  }, [yachts, qVesselNo, qName, qNationality]);

  /** ========= 左側操作 ========= */
  const onSelectRow = (id) => {
    setSelectedId(id);
    setMode("view");
    setErrors({});
    const row = yachts.find((x) => x.id === id);
    if (row) setDraft(structuredClone(row));
  };

  const onClickCreate = () => {
    setMode("create");
    setErrors({});
    setSelectedId("");
    setDraft(makeEmptyYacht());
  };

  const onClickEdit = () => {
    if (!selected) return;
    setMode("edit");
    setErrors({});
    setDraft(structuredClone(selected));
  };

  const onCancel = () => {
    setErrors({});
    if (mode === "create") {
      // 回到第一筆
      const first = filtered[0] ?? yachts[0];
      if (first) {
        setSelectedId(first.id);
        setDraft(structuredClone(first));
        setMode("view");
      } else {
        setDraft(makeEmptyYacht());
        setMode("view");
      }
      return;
    }
    // edit -> view，回復 selected
    if (selected) setDraft(structuredClone(selected));
    setMode("view");
  };

  /** ========= 右側表單 change ========= */
  const setField = (path, value) => {
    // path: "summary.vesselNameZh"
    setDraft((prev) => {
      const next = structuredClone(prev);
      const [sec, key] = path.split(".");
      next[sec][key] = value;
      return next;
    });

    // 即時驗證（只驗證這個欄位，避免錯誤閃爍）
    setErrors((prev) => {
      const nextErrs = { ...prev };
      const temp = structuredClone(draft);
      const [sec, key] = path.split(".");
      temp[sec][key] = value;
      const all = validateYacht(temp);
      // 僅更新該欄位的 error
      if (all[path]) nextErrs[path] = all[path];
      else delete nextErrs[path];
      return nextErrs;
    });
  };

  /** ========= 儲存（新增/更新） ========= */
  const onSave = () => {
    const v = validateYacht(draft);
    setErrors(v);
    if (Object.keys(v).length > 0) {
      alert("請先修正錯誤欄位");
      return;
    }

    if (mode === "create") {
      // TODO: API POST
      const newItem = {
        ...draft,
        id: `y_${Date.now()}`,
        summary: {
          ...draft.summary,
          businessNo: draft.summary.businessNo || `BIZ-${Date.now()}`,
          vesselNo: draft.summary.vesselNo || `TW-${String(Math.floor(Math.random() * 900) + 100)}`,
        },
        detail: {
          ...draft.detail,
          arrivalNoticeNo: draft.detail.arrivalNoticeNo || `AN-${String(Math.floor(Math.random() * 900000) + 100000)}`,
        },
      };
      setYachts((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      setDraft(structuredClone(newItem));
      setMode("view");
      return;
    }

    if (mode === "edit") {
      // TODO: API PUT /yachts/:id
      setYachts((prev) => prev.map((x) => (x.id === draft.id ? draft : x)));
      setMode("view");
      return;
    }
  };

  /** ========= 刪除（可選，但管理頁通常需要） ========= */
  const onDelete = () => {
    if (!selected) return;
    const ok = window.confirm(`確定要刪除船隻「${selected.summary.vesselNameZh}」嗎？`);
    if (!ok) return;

    // TODO: API DELETE /yachts/:id
    setYachts((prev) => prev.filter((x) => x.id !== selected.id));

    // 選擇下一筆
    const next = yachts.filter((x) => x.id !== selected.id)[0] ?? null;
    if (next) {
      setSelectedId(next.id);
      setDraft(structuredClone(next));
      setMode("view");
    } else {
      setSelectedId("");
      setDraft(makeEmptyYacht());
      setMode("view");
    }
  };

  /** ========= UI ========= */
  const isView = mode === "view";
  const isEditing = mode === "edit" || mode === "create";

  return (
    <div className="yacht-mgr">
      {/* 左：列表 / 右：詳細 */}
      <div className="yacht-mgr-grid">
        {/* ========== LEFT ========== */}
        <div className="y-left card">
          <div className="y-left-header">
            <div>
              <div className="y-title">船隻管理</div>
              <div className="y-subtitle">新增、查詢並維護船隻資料</div>
            </div>
            <button className="y-btn y-btn--primary" onClick={onClickCreate}>
              新增
            </button>
          </div>

          {/* filters */}
          <div className="y-filters">
            <div className="y-filter">
              <div className="y-filter-label">船舶號數</div>
              <input
                className="y-input"
                value={qVesselNo}
                onChange={(e) => setQVesselNo(e.target.value)}
                placeholder="例：TW-001"
              />
            </div>

            <div className="y-filter">
              <div className="y-filter-label">中文船名</div>
              <input
                className="y-input"
                value={qName}
                onChange={(e) => setQName(e.target.value)}
                placeholder="例：海風號"
              />
            </div>

            <div className="y-filter">
              <div className="y-filter-label">國籍</div>
              <input
                className="y-input"
                value={qNationality}
                onChange={(e) => setQNationality(e.target.value)}
                placeholder="例：台灣"
              />
            </div>

            <button
              className="y-btn y-btn--ghost"
              onClick={() => {
                setQVesselNo("");
                setQName("");
                setQNationality("");
              }}
            >
              清除條件
            </button>
          </div>

          {/* table */}
          <div className="y-table-wrap">
            <table className="y-table">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>序號</th>
                  <th style={{ width: 140 }}>船舶號數</th>
                  <th>中文船名</th>
                  <th style={{ width: 120 }}>國籍</th>
                  <th style={{ width: 120 }}>種類</th>
                  <th style={{ width: 140 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="y-muted">載入中…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="y-muted">查無資料</td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={row.id === selectedId ? "is-active" : ""}
                      onClick={() => onSelectRow(row.id)}
                    >
                      <td>{idx + 1}</td>
                      <td className="y-strong">{row.summary.vesselNo}</td>
                      <td>{row.summary.vesselNameZh}</td>
                      <td>{row.summary.nationality}</td>
                      <td>{row.summary.vesselType}</td>
                      <td>
                        <button
                          className="y-btn y-btn--mini"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRow(row.id);
                            onClickEdit();
                          }}
                        >
                          編輯
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* paging placeholder */}
          <div className="y-paging">
            <button className="y-btn y-btn--ghost y-btn--mini" disabled>上一頁</button>
            <span className="y-page-chip">1</span>
            <button className="y-btn y-btn--ghost y-btn--mini" disabled>下一頁</button>
          </div>
        </div>

        {/* ========== RIGHT ========== */}
        <div className="y-right card">
          <div className="y-right-header">
            <div>
              <div className="y-title">船隻詳情</div>
              <div className="y-subtitle">
                {mode === "create"
                  ? "新增船隻資料"
                  : selected
                  ? `目前選擇：${selected.summary.vesselNameZh}`
                  : "請從左側選擇一筆船隻"}
              </div>
            </div>

            <div className="y-right-actions">
              {isView ? (
                <>
                  <button className="y-btn y-btn--primary" onClick={onClickEdit} disabled={!selected}>
                    編輯
                  </button>
                  <button className="y-btn y-btn--danger" onClick={onDelete} disabled={!selected}>
                    刪除
                  </button>
                </>
              ) : (
                <>
                  <button className="y-btn y-btn--primary" onClick={onSave}>
                    儲存
                  </button>
                  <button className="y-btn" onClick={onCancel}>
                    取消
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="y-divider" />

          {/* 船舶摘要資訊 */}
          <div className="y-section">
            <div className="y-section-title">船舶摘要資訊</div>
            <div className="y-grid-2">
              <div>
                <FormRow label="業務編號" value={draft.summary.businessNo} disabled />
                <FormRow label="船舶號數" value={draft.summary.vesselNo} disabled />

                <FormRow
                  label="中文船名"
                  value={draft.summary.vesselNameZh}
                  onChange={(v) => setField("summary.vesselNameZh", v)}
                  disabled={!isEditing}
                  required
                  error={errors["summary.vesselNameZh"]}
                />

                <FormRow
                  label="國籍"
                  value={draft.summary.nationality}
                  onChange={(v) => setField("summary.nationality", v)}
                  disabled={!isEditing}
                  required
                  error={errors["summary.nationality"]}
                />

                <FormRow
                  label="船舶種類"
                  value={draft.summary.vesselType}
                  onChange={(v) => setField("summary.vesselType", v)}
                  disabled={!isEditing}
                  required
                  error={errors["summary.vesselType"]}
                />

                <FormRow
                  label="總噸位"
                  value={draft.summary.grossTonnage}
                  onChange={(v) => setField("summary.grossTonnage", v)}
                  disabled={!isEditing}
                  error={errors["summary.grossTonnage"]}
                  placeholder="例：28"
                />

                <FormRow
                  label="駕駛人 / 所有人 / 代理人"
                  value={draft.summary.operatorName}
                  onChange={(v) => setField("summary.operatorName", v)}
                  disabled={!isEditing}
                  required
                  error={errors["summary.operatorName"]}
                />

                <FormRow
                  label="使用者帳號 / 公司流水號"
                  value={draft.summary.userAccountRef}
                  onChange={(v) => setField("summary.userAccountRef", v)}
                  disabled={!isEditing}
                />

                <FormRow
                  label="駕駛人護照號碼"
                  value={draft.summary.passportNo}
                  onChange={(v) => setField("summary.passportNo", v)}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <FormRow label="入境通報單" value={draft.detail.arrivalNoticeNo} disabled />

                <FormRow
                  label="電臺呼號"
                  value={draft.detail.radioCallSign}
                  onChange={(v) => setField("detail.radioCallSign", v)}
                  disabled={!isEditing}
                />

                <FormRow
                  label="英文船名"
                  value={draft.detail.vesselNameEn}
                  onChange={(v) => setField("detail.vesselNameEn", v)}
                  disabled={!isEditing}
                />

                <FormRow
                  label="船籍港"
                  value={draft.detail.portOfRegistry}
                  onChange={(v) => setField("detail.portOfRegistry", v)}
                  disabled={!isEditing}
                />

                <FormRow
                  label="總長 LOA (公尺)"
                  value={draft.detail.loa}
                  onChange={(v) => setField("detail.loa", v)}
                  disabled={!isEditing}
                  error={errors["detail.loa"]}
                  placeholder="例：16.2"
                />

                <FormRow
                  label="船寬 (公尺)"
                  value={draft.detail.beam}
                  onChange={(v) => setField("detail.beam", v)}
                  disabled={!isEditing}
                  error={errors["detail.beam"]}
                />

                <FormRow
                  label="船深 (公尺)"
                  value={draft.detail.depth}
                  onChange={(v) => setField("detail.depth", v)}
                  disabled={!isEditing}
                  error={errors["detail.depth"]}
                />

                <FormRow
                  label="建造日期"
                  type="date"
                  value={draft.detail.buildDate}
                  onChange={(v) => setField("detail.buildDate", v)}
                  disabled={!isEditing}
                  error={errors["detail.buildDate"]}
                />
              </div>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}
