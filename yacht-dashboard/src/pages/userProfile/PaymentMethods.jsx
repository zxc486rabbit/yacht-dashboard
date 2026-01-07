import { useEffect, useMemo, useState } from "react";
import "../../styles/userProfile/PaymentMethods.css";

// ------- helpers -------
const maskLast4 = (last4) => (last4 ? `****${String(last4).padStart(4, "0")}` : "****----");
const monthOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const yearOptions = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() + i));

function validatePayment(draft) {
  const errors = {};

  if (!draft.type) errors.type = "請選擇類型";

  if (draft.type === "card") {
    if (!draft.brand) errors.brand = "請選擇卡別";
    if (!draft.holderName?.trim()) errors.holderName = "持卡人為必填";
    if (!draft.last4 || !/^\d{4}$/.test(draft.last4)) errors.last4 = "卡號末四碼需為 4 位數字";
    if (!draft.expMonth) errors.expMonth = "請選擇月份";
    if (!draft.expYear) errors.expYear = "請選擇年份";

    // 簡易到期日檢查：到期年月不得早於本月
    if (draft.expMonth && draft.expYear) {
      const exp = new Date(Number(draft.expYear), Number(draft.expMonth) - 1, 1);
      const now = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      if (exp < now) errors.expYear = "到期日不可早於本月";
    }
  }

  if (draft.type === "bank") {
    if (!draft.bankName?.trim()) errors.bankName = "銀行名稱為必填";
    if (!draft.accountLast4 || !/^\d{4}$/.test(draft.accountLast4)) errors.accountLast4 = "帳號末四碼需為 4 位數字";
    if (!draft.accountName?.trim()) errors.accountName = "戶名為必填";
  }

  return errors;
}

// ------- UI components -------
const Badge = ({ children, tone = "default" }) => (
  <span className={`pm-badge pm-badge--${tone}`}>{children}</span>
);

const EmptyState = ({ onAdd }) => (
  <div className="pm-empty">
    <div className="pm-empty-title">尚未設定支付方式</div>
    <div className="pm-empty-desc">建議至少新增一種支付方式，方便後續停泊費 / 月租扣款。</div>
    <button className="pm-btn pm-btn--primary" onClick={onAdd}>新增支付方式</button>
  </div>
);

const PaymentMethods = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);

  const [draft, setDraft] = useState({
    type: "card", // card | bank
    isDefault: false,

    // card
    brand: "VISA",
    holderName: "",
    last4: "",
    expMonth: "",
    expYear: "",

    // bank
    bankName: "",
    accountLast4: "",
    accountName: "",
  });

  const [errors, setErrors] = useState({});

  const defaultId = useMemo(() => items.find((x) => x.isDefault)?.id ?? null, [items]);

  useEffect(() => {
    // TODO: 換成 API：getUserPaymentMethods()
    // 先用 mock
    const mock = [
      { id: "p1", type: "card", brand: "VISA", holderName: "ARIEL LIN", last4: "1234", expMonth: "08", expYear: String(new Date().getFullYear() + 2), isDefault: true, createdAt: "2026-01-01" },
      { id: "p2", type: "bank", bankName: "台灣銀行", accountLast4: "5678", accountName: "ARIEL LIN", isDefault: false, createdAt: "2026-01-02" },
    ];
    setItems(mock);
    setLoading(false);
  }, []);

  const resetDraft = () => {
    setDraft({
      type: "card",
      isDefault: items.length === 0, // 第一筆預設設為 default
      brand: "VISA",
      holderName: "",
      last4: "",
      expMonth: "",
      expYear: "",
      bankName: "",
      accountLast4: "",
      accountName: "",
    });
    setErrors({});
    setEditingId(null);
    setMode("create");
  };

  const openCreate = () => {
    resetDraft();
    setOpen(true);
  };

  const openEdit = (item) => {
    setMode("edit");
    setEditingId(item.id);
    setErrors({});
    setDraft({
      type: item.type,
      isDefault: !!item.isDefault,

      brand: item.brand ?? "VISA",
      holderName: item.holderName ?? "",
      last4: item.last4 ?? "",
      expMonth: item.expMonth ?? "",
      expYear: item.expYear ?? "",

      bankName: item.bankName ?? "",
      accountLast4: item.accountLast4 ?? "",
      accountName: item.accountName ?? "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setErrors({});
  };

  const onChange = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
  };

  const setDefault = (id) => {
    setItems((prev) =>
      prev.map((x) => ({
        ...x,
        isDefault: x.id === id,
      }))
    );
  };

  const removeItem = (id) => {
    const ok = window.confirm("確定要刪除此支付方式嗎？");
    if (!ok) return;

    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      // 如果刪掉的是 default，則把第一筆設為 default
      if (defaultId === id && next.length > 0) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  };

  const save = () => {
    const v = validatePayment(draft);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    // 形成要保存的資料
    const payload =
      draft.type === "card"
        ? {
            type: "card",
            brand: draft.brand,
            holderName: draft.holderName.trim(),
            last4: draft.last4,
            expMonth: draft.expMonth,
            expYear: draft.expYear,
            isDefault: draft.isDefault,
          }
        : {
            type: "bank",
            bankName: draft.bankName.trim(),
            accountLast4: draft.accountLast4,
            accountName: draft.accountName.trim(),
            isDefault: draft.isDefault,
          };

    setItems((prev) => {
      let next = [...prev];

      if (mode === "edit") {
        next = next.map((x) => (x.id === editingId ? { ...x, ...payload } : x));
      } else {
        next.unshift({
          id: `p_${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString().slice(0, 10),
        });
      }

      // default 處理：若勾選 default，其他全取消；若沒任何 default，保留第一筆為 default
      if (payload.isDefault) {
        next = next.map((x) => ({ ...x, isDefault: x.id === (mode === "edit" ? editingId : next[0].id) }));
      } else if (!next.some((x) => x.isDefault) && next.length > 0) {
        next[0] = { ...next[0], isDefault: true };
      }

      return next;
    });

    // TODO: API save (POST/PUT)
    closeModal();
  };

  return (
    <div className="pm-container">
      <div className="pm-header">
        <div>
          <h2 className="pm-title">支付方式</h2>
          <div className="pm-subtitle">管理信用卡與銀行帳戶，設定預設扣款方式。</div>
        </div>

        <button className="pm-btn pm-btn--primary" onClick={openCreate} disabled={loading}>
          新增支付方式
        </button>
      </div>

      {loading ? (
        <div className="pm-skeleton">載入中…</div>
      ) : items.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <div className="pm-list">
          {items.map((p) => (
            <div key={p.id} className="pm-card">
              <div className="pm-card-main">
                <div className="pm-card-title">
                  {p.type === "card" ? (
                    <>
                      <span className="pm-card-name">{p.brand} 信用卡</span>
                      <span className="pm-card-meta">
                        {maskLast4(p.last4)} ・ {p.holderName}
                        {p.expMonth && p.expYear ? ` ・ ${p.expMonth}/${String(p.expYear).slice(-2)}` : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="pm-card-name">銀行帳戶</span>
                      <span className="pm-card-meta">
                        {p.bankName} ・ {maskLast4(p.accountLast4)} ・ {p.accountName}
                      </span>
                    </>
                  )}

                  {p.isDefault ? <Badge tone="primary">預設</Badge> : null}
                </div>

                <div className="pm-card-actions">
                  {!p.isDefault && (
                    <button className="pm-btn pm-btn--ghost" onClick={() => setDefault(p.id)}>
                      設為預設
                    </button>
                  )}
                  <button className="pm-btn pm-btn--ghost" onClick={() => openEdit(p)}>
                    編輯
                  </button>
                  <button className="pm-btn pm-btn--danger" onClick={() => removeItem(p.id)}>
                    刪除
                  </button>
                </div>
              </div>

              <div className="pm-card-foot">
                <div className="pm-foot-item">
                  <span className="pm-foot-label">新增日期</span>
                  <span className="pm-foot-value">{p.createdAt ?? "-"}</span>
                </div>
                <div className="pm-foot-item">
                  <span className="pm-foot-label">狀態</span>
                  <span className="pm-foot-value">{p.isDefault ? "啟用（預設）" : "啟用"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="pm-modal-backdrop" role="dialog" aria-modal="true">
          <div className="pm-modal">
            <div className="pm-modal-header">
              <div className="pm-modal-title">
                {mode === "edit" ? "編輯支付方式" : "新增支付方式"}
              </div>
              <button className="pm-icon-btn" onClick={closeModal} aria-label="關閉">×</button>
            </div>

            <div className="pm-modal-body">
              <div className="pm-form-grid">
                <div className="pm-field">
                  <label className="pm-label">類型 <span className="pm-required">*</span></label>
                  <select
                    className={`pm-input ${errors.type ? "pm-input--error" : ""}`}
                    value={draft.type}
                    onChange={(e) => onChange({ type: e.target.value })}
                  >
                    <option value="card">信用卡</option>
                    <option value="bank">銀行帳戶</option>
                  </select>
                  {errors.type && <div className="pm-error">{errors.type}</div>}
                </div>

                <div className="pm-field pm-field--switch">
                  <label className="pm-label">預設扣款</label>
                  <label className="pm-switch">
                    <input
                      type="checkbox"
                      checked={!!draft.isDefault}
                      onChange={(e) => onChange({ isDefault: e.target.checked })}
                    />
                    <span className="pm-switch-ui" />
                  </label>
                </div>

                {/* Card fields */}
                {draft.type === "card" && (
                  <>
                    <div className="pm-field">
                      <label className="pm-label">卡別 <span className="pm-required">*</span></label>
                      <select
                        className={`pm-input ${errors.brand ? "pm-input--error" : ""}`}
                        value={draft.brand}
                        onChange={(e) => onChange({ brand: e.target.value })}
                      >
                        <option value="VISA">VISA</option>
                        <option value="MasterCard">MasterCard</option>
                        <option value="JCB">JCB</option>
                        <option value="AMEX">AMEX</option>
                      </select>
                      {errors.brand && <div className="pm-error">{errors.brand}</div>}
                    </div>

                    <div className="pm-field">
                      <label className="pm-label">持卡人 <span className="pm-required">*</span></label>
                      <input
                        className={`pm-input ${errors.holderName ? "pm-input--error" : ""}`}
                        value={draft.holderName}
                        onChange={(e) => onChange({ holderName: e.target.value })}
                        placeholder="例如：LIN YU-XUAN"
                      />
                      {errors.holderName && <div className="pm-error">{errors.holderName}</div>}
                    </div>

                    <div className="pm-field">
                      <label className="pm-label">卡號末四碼 <span className="pm-required">*</span></label>
                      <input
                        className={`pm-input ${errors.last4 ? "pm-input--error" : ""}`}
                        value={draft.last4}
                        onChange={(e) => onChange({ last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="1234"
                        inputMode="numeric"
                      />
                      {errors.last4 && <div className="pm-error">{errors.last4}</div>}
                    </div>

                    <div className="pm-field">
                      <label className="pm-label">到期月 / 年 <span className="pm-required">*</span></label>
                      <div className="pm-row">
                        <select
                          className={`pm-input ${errors.expMonth ? "pm-input--error" : ""}`}
                          value={draft.expMonth}
                          onChange={(e) => onChange({ expMonth: e.target.value })}
                        >
                          <option value="">月</option>
                          {monthOptions.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>

                        <select
                          className={`pm-input ${errors.expYear ? "pm-input--error" : ""}`}
                          value={draft.expYear}
                          onChange={(e) => onChange({ expYear: e.target.value })}
                        >
                          <option value="">年</option>
                          {yearOptions.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      {(errors.expMonth || errors.expYear) && <div className="pm-error">{errors.expMonth || errors.expYear}</div>}
                    </div>
                  </>
                )}

                {/* Bank fields */}
                {draft.type === "bank" && (
                  <>
                    <div className="pm-field">
                      <label className="pm-label">銀行名稱 <span className="pm-required">*</span></label>
                      <input
                        className={`pm-input ${errors.bankName ? "pm-input--error" : ""}`}
                        value={draft.bankName}
                        onChange={(e) => onChange({ bankName: e.target.value })}
                        placeholder="例如：台灣銀行"
                      />
                      {errors.bankName && <div className="pm-error">{errors.bankName}</div>}
                    </div>

                    <div className="pm-field">
                      <label className="pm-label">帳號末四碼 <span className="pm-required">*</span></label>
                      <input
                        className={`pm-input ${errors.accountLast4 ? "pm-input--error" : ""}`}
                        value={draft.accountLast4}
                        onChange={(e) => onChange({ accountLast4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="5678"
                        inputMode="numeric"
                      />
                      {errors.accountLast4 && <div className="pm-error">{errors.accountLast4}</div>}
                    </div>

                    <div className="pm-field">
                      <label className="pm-label">戶名 <span className="pm-required">*</span></label>
                      <input
                        className={`pm-input ${errors.accountName ? "pm-input--error" : ""}`}
                        value={draft.accountName}
                        onChange={(e) => onChange({ accountName: e.target.value })}
                        placeholder="例如：LIN YU-XUAN"
                      />
                      {errors.accountName && <div className="pm-error">{errors.accountName}</div>}
                    </div>
                  </>
                )}
              </div>

              <div className="pm-note">
                為保護隱私，本系統僅保存「末四碼」與必要資訊；不保存完整卡號 / 完整帳號。
              </div>
            </div>

            <div className="pm-modal-footer">
              <button className="pm-btn" onClick={closeModal}>取消</button>
              <button className="pm-btn pm-btn--primary" onClick={save}>儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
