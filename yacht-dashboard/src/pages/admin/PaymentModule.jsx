import React, { useEffect, useMemo, useState } from "react";

import "../../styles/dashboard/Dashboard.css";
import "../../styles/admin/admin.settings.css";

import {
  FaCreditCard,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaUniversity,
  FaQrcode,
  FaRedo,
} from "react-icons/fa";

const STEPS = [
  { key: "settlement", label: "費用結算（明細確認）" },
  { key: "method", label: "付款方式選擇" },
  { key: "processing", label: "付款進行中" },
  { key: "result", label: "付款結果" },
];

// ====== 假資料（可替換 API）======
const seedBill = {
  billNo: "BILL-2026-00018",
  applicant: "靠泊申請（臨時）",
  vesselName: "Q比號",
  berth: "A-12",
  period: { from: "2026/01/18", to: "2026/01/21" },
  currency: "TWD",
  items: [
    { id: 1, name: "靠泊費", spec: "3 晚", qty: 3, unitPrice: 1800 },
    { id: 2, name: "水電費", spec: "按度計", qty: 1, unitPrice: 320 },
    { id: 3, name: "清潔費", spec: "一次性", qty: 1, unitPrice: 200 },
  ],
  discounts: [{ id: 1, name: "會員折扣", amount: 150 }],
  taxRate: 0.05,
};

function money(n) {
  const num = Number(n || 0);
  return num.toLocaleString("zh-TW");
}

function calcTotals(bill) {
  const subTotal = bill.items.reduce((sum, x) => sum + x.qty * x.unitPrice, 0);
  const discountTotal = bill.discounts.reduce((sum, d) => sum + d.amount, 0);
  const taxable = Math.max(0, subTotal - discountTotal);
  const tax = Math.round(taxable * bill.taxRate);
  const grand = taxable + tax;
  return { subTotal, discountTotal, taxable, tax, grand };
}

function StepPill({ active, done, children, onClick }) {
  const cls = [
    "as-pay-step",
    active ? "is-active" : "",
    done ? "is-done" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

function RadioCard({ checked, title, desc, icon, onClick, right }) {
  return (
    <button
      type="button"
      className={`as-pay-method ${checked ? "is-checked" : ""}`}
      onClick={onClick}
    >
      <div className="as-pay-method__left">
        <div className="as-pay-method__icon">{icon}</div>
        <div className="as-pay-method__text">
          <div className="as-pay-method__title">{title}</div>
          <div className="as-pay-method__desc">{desc}</div>
        </div>
      </div>

      <div className="as-pay-method__right">
        {right}
        <span className={`as-pay-dot ${checked ? "is-on" : ""}`} />
      </div>
    </button>
  );
}

export default function PaymentModuleAs() {
  const bill = useMemo(() => seedBill, []);
  const totals = useMemo(() => calcTotals(bill), [bill]);

  const [stepIdx, setStepIdx] = useState(0);

  // settlement
  const [confirmed, setConfirmed] = useState(false);

  // method
  const [method, setMethod] = useState("card"); // card | transfer | qrcode
  const [payerEmail, setPayerEmail] = useState("qbi@example.com");

  // processing/result
  const [processingState, setProcessingState] = useState("idle"); // idle | running | done
  const [result, setResult] = useState(null); // { ok: boolean, msg: string, paidAt: string, txn: string }

  const stepKey = STEPS[stepIdx]?.key;

  const canGoPrev = stepIdx > 0 && stepKey !== "processing";
  const canGoNext =
    (stepKey === "settlement" && confirmed) ||
    (stepKey === "method" && !!method) ||
    stepKey === "result";

  const goto = (idx) => {
    const target = Math.max(0, Math.min(STEPS.length - 1, idx));
    setStepIdx(target);
  };

  const next = () => {
    if (!canGoNext) return;

    if (stepKey === "method") {
      // 進入 processing 時啟動模擬
      setStepIdx(2);
      setProcessingState("running");
      setResult(null);
      return;
    }

    if (stepKey === "result") {
      // 完成：回到第一步（如要導頁可改成 navigate）
      setConfirmed(false);
      setProcessingState("idle");
      setResult(null);
      setStepIdx(0);
      return;
    }

    goto(stepIdx + 1);
  };

  const prev = () => {
    if (!canGoPrev) return;
    goto(stepIdx - 1);
  };

  // 模擬付款處理（純 UI 假流程）
  useEffect(() => {
    if (stepKey !== "processing") return;
    if (processingState !== "running") return;

    const t = setTimeout(() => {
      const ok = true; // 想測失敗可改成 Math.random() > 0.4

      const now = new Date();
      const paidAt = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}/${String(now.getDate()).padStart(2, "0")} ${String(
        now.getHours()
      ).padStart(2, "0")}:${String(now.getMinutes()).padStart(
        2,
        "0"
      )}:${String(now.getSeconds()).padStart(2, "0")}`;

      setResult({
        ok,
        msg: ok ? "付款成功，已完成入帳。" : "付款失敗，請稍後重試或更換付款方式。",
        paidAt,
        txn: ok ? "TXN-7A93D1F2" : "TXN-FAILED",
      });
      setProcessingState("done");
      setStepIdx(3);
    }, 1600);

    return () => clearTimeout(t);
  }, [stepKey, processingState]);

  return (
    <div className="as-page as-pay">
      {/* ===== Header ===== */}
      <div className="as-header">
        <div className="as-titleWrap">
          <div>
            <h2 className="as-title">支付模組</h2>
            <div className="as-subtitle">費用結算與付款流程（後臺）</div>
          </div>
        </div>

        <div className="as-topActions as-pay-headMeta">
          <div className="as-pay-kv">
            <div className="as-pay-kv__k">帳單編號</div>
            <div className="as-pay-kv__v">{bill.billNo}</div>
          </div>
          <div className="as-pay-kv">
            <div className="as-pay-kv__k">應付金額</div>
            <div className="as-pay-kv__v">
              {bill.currency} {money(totals.grand)}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Stepper ===== */}
      <div className="as-card as-pay-stepper">
        <div className="as-pay-stepper__row">
          {STEPS.map((s, i) => (
            <StepPill
              key={s.key}
              active={i === stepIdx}
              done={i < stepIdx}
              onClick={() => {
                // 允許回看：不可跳到 processing（避免狀態錯亂）
                if (s.key === "processing") return;
                if (i <= stepIdx) goto(i);
              }}
              title={s.label}
            >
              <span className="as-pay-step__idx">{i + 1}</span>
              <span className="as-pay-step__label">{s.label}</span>
            </StepPill>
          ))}
        </div>
      </div>

      {/* ===== Main grid ===== */}
      <div className="as-pay-grid">
        {/* Left */}
        <div className="as-pay-main">
          {stepKey === "settlement" && (
            <div className="as-card">
              <div className="as-cardHead">
                <div>
                  <div className="as-cardTitle">明細確認</div>
                  <div className="as-cardSubtitle">
                    請確認費用項目與金額，確認無誤後再進行付款。
                  </div>
                </div>
              </div>

              <div className="as-pay-info">
                <div className="as-pay-info__row">
                  <div className="as-pay-info__item">
                    <div className="as-pay-info__k">申請類型</div>
                    <div className="as-pay-info__v">{bill.applicant}</div>
                  </div>
                  <div className="as-pay-info__item">
                    <div className="as-pay-info__k">船名</div>
                    <div className="as-pay-info__v">{bill.vesselName}</div>
                  </div>
                  <div className="as-pay-info__item">
                    <div className="as-pay-info__k">船席</div>
                    <div className="as-pay-info__v">{bill.berth}</div>
                  </div>
                </div>

                <div className="as-pay-info__row">
                  <div className="as-pay-info__item">
                    <div className="as-pay-info__k">期間</div>
                    <div className="as-pay-info__v">
                      {bill.period.from} ～ {bill.period.to}
                    </div>
                  </div>
                  <div className="as-pay-info__item">
                    <div className="as-pay-info__k">稅率</div>
                    <div className="as-pay-info__v">
                      {Math.round(bill.taxRate * 100)}%
                    </div>
                  </div>
                  <div className="as-pay-info__item">
                    <div className="as-pay-info__k">通知 Email</div>
                    <div className="as-pay-info__v">{payerEmail}</div>
                  </div>
                </div>
              </div>

              <div className="as-tableWrap">
                <table className="as-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>項目</th>
                      <th style={{ width: 220 }}>規格</th>
                      <th style={{ width: 100 }} className="as-pay-right">
                        數量
                      </th>
                      <th style={{ width: 140 }} className="as-pay-right">
                        單價
                      </th>
                      <th style={{ width: 160 }} className="as-pay-right">
                        小計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((it, idx) => (
                      <tr key={it.id}>
                        <td>{idx + 1}</td>
                        <td className="as-pay-strong">{it.name}</td>
                        <td className="as-pay-muted">{it.spec}</td>
                        <td className="as-pay-right">{it.qty}</td>
                        <td className="as-pay-right">{money(it.unitPrice)}</td>
                        <td className="as-pay-right">
                          {money(it.qty * it.unitPrice)}
                        </td>
                      </tr>
                    ))}

                    {bill.discounts.map((d) => (
                      <tr key={`d-${d.id}`}>
                        <td />
                        <td className="as-pay-muted" colSpan={4}>
                          {d.name}
                        </td>
                        <td className="as-pay-right as-pay-neg">
                          -{money(d.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="as-pay-confirm">
                <label className="as-check">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>我已確認明細與金額皆正確</span>
                </label>

                <div className="as-pay-confirm__note">
                  <FaLock /> 請勿在不信任環境下操作付款。
                </div>
              </div>
            </div>
          )}

          {stepKey === "method" && (
            <div className="as-card">
              <div className="as-cardHead">
                <div>
                  <div className="as-cardTitle">付款方式選擇</div>
                  <div className="as-cardSubtitle">
                    選擇付款方式後，系統將建立交易並導向付款流程（此處為純 UI 假流程）。
                  </div>
                </div>
              </div>

              <div className="as-form">
                <div className="as-field">
                  <label>通知 Email</label>
                  <input
                    className="as-input"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                  <div className="as-hint">付款結果與收據通知會寄送至此信箱。</div>
                </div>

                <div className="as-pay-methods">
                  <RadioCard
                    checked={method === "card"}
                    title="信用卡 / 金融卡"
                    desc="即時授權，付款完成後立即更新狀態"
                    icon={<FaCreditCard />}
                    onClick={() => setMethod("card")}
                    right={<span className="as-badge as-badge--ok">推薦</span>}
                  />
                  <RadioCard
                    checked={method === "transfer"}
                    title="銀行轉帳"
                    desc="產生虛擬帳號，待入帳確認後更新狀態"
                    icon={<FaUniversity />}
                    onClick={() => setMethod("transfer")}
                    right={
                      <span className="as-badge as-badge--neutral">需對帳</span>
                    }
                  />
                  <RadioCard
                    checked={method === "qrcode"}
                    title="QR Code / 掃碼付款"
                    desc="出示付款碼或掃碼完成支付"
                    icon={<FaQrcode />}
                    onClick={() => setMethod("qrcode")}
                    right={
                      <span className="as-badge as-badge--neutral">便利</span>
                    }
                  />
                </div>

                <div className="as-pay-hintBox">
                  建議：後端建立交易單（含金額、幣別、訂單編號、回呼 URL），前端僅顯示狀態與導頁，
                  以避免金額在前端被竄改。
                </div>
              </div>
            </div>
          )}

          {stepKey === "processing" && (
            <div className="as-card">
              <div className="as-cardHead">
                <div>
                  <div className="as-cardTitle">付款進行中</div>
                  <div className="as-cardSubtitle">
                    系統正在建立交易並等待金流回應，請勿關閉頁面。
                  </div>
                </div>
              </div>

              <div className="as-pay-processing">
                <div className="as-pay-spinner" aria-hidden="true" />
                <div>
                  <div className="as-pay-processing__headline">正在處理付款…</div>
                  <div className="as-pay-processing__sub">
                    付款方式：
                    {method === "card"
                      ? "信用卡 / 金融卡"
                      : method === "transfer"
                      ? "銀行轉帳"
                      : "QR Code / 掃碼付款"}
                  </div>
                </div>
              </div>

              <div className="as-pay-processingTips">
                <div className="as-pay-tip">
                  <div className="as-pay-tip__k">若卡住</div>
                  <div className="as-pay-tip__v">
                    請確認網路、或返回更換付款方式重試。
                  </div>
                </div>
                <div className="as-pay-tip">
                  <div className="as-pay-tip__k">安全性</div>
                  <div className="as-pay-tip__v">
                    後端應以 Server-to-Server 驗簽與回呼校驗為準。
                  </div>
                </div>
              </div>
            </div>
          )}

          {stepKey === "result" && (
            <div className="as-card">
              <div className="as-cardHead">
                <div>
                  <div className="as-cardTitle">付款結果</div>
                  <div className="as-cardSubtitle">顯示交易結果與後續處理建議。</div>
                </div>
              </div>

              <div
                className={`as-pay-resultBanner ${
                  result?.ok ? "is-ok" : "is-bad"
                }`}
              >
                <div className="as-pay-resultBanner__icon">
                  {result?.ok ? <FaCheckCircle /> : <FaTimesCircle />}
                </div>
                <div>
                  <div className="as-pay-resultBanner__headline">
                    {result?.ok ? "付款成功" : "付款失敗"}
                  </div>
                  <div className="as-pay-resultBanner__desc">{result?.msg}</div>
                </div>
              </div>

              <div className="as-pay-resultGrid">
                <div className="as-pay-kvCard">
                  <div className="as-pay-kvCard__k">交易序號</div>
                  <div className="as-pay-kvCard__v">{result?.txn || "-"}</div>
                </div>
                <div className="as-pay-kvCard">
                  <div className="as-pay-kvCard__k">付款時間</div>
                  <div className="as-pay-kvCard__v">{result?.paidAt || "-"}</div>
                </div>
                <div className="as-pay-kvCard">
                  <div className="as-pay-kvCard__k">付款方式</div>
                  <div className="as-pay-kvCard__v">
                    {method === "card"
                      ? "信用卡 / 金融卡"
                      : method === "transfer"
                      ? "銀行轉帳"
                      : "QR Code / 掃碼付款"}
                  </div>
                </div>
                <div className="as-pay-kvCard">
                  <div className="as-pay-kvCard__k">應付金額</div>
                  <div className="as-pay-kvCard__v">
                    {bill.currency} {money(totals.grand)}
                  </div>
                </div>
              </div>

              {!result?.ok ? (
                <div className="as-pay-hintBox danger">
                  建議：1) 返回付款方式重新嘗試；2) 多次失敗改用其他方式；3) 後端記錄失敗原因與金流回傳碼以利追蹤。
                </div>
              ) : (
                <div className="as-pay-hintBox ok">
                  已完成入帳。建議後端同步：更新申請狀態、寫入交易紀錄、產生收據、發送通知信。
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right summary */}
        <div className="as-pay-side">
          <div className="as-card">
            <div className="as-cardHead">
              <div>
                <div className="as-cardTitle">金額摘要</div>
                <div className="as-cardSubtitle">本次帳單結算資訊</div>
              </div>
            </div>

            <div className="as-pay-sumRow">
              <div className="as-pay-sumRow__k">小計</div>
              <div className="as-pay-sumRow__v">
                {bill.currency} {money(totals.subTotal)}
              </div>
            </div>
            <div className="as-pay-sumRow">
              <div className="as-pay-sumRow__k">折扣</div>
              <div className="as-pay-sumRow__v as-pay-neg">
                -{bill.currency} {money(totals.discountTotal)}
              </div>
            </div>
            <div className="as-pay-sumRow">
              <div className="as-pay-sumRow__k">課稅金額</div>
              <div className="as-pay-sumRow__v">
                {bill.currency} {money(totals.taxable)}
              </div>
            </div>
            <div className="as-pay-sumRow">
              <div className="as-pay-sumRow__k">稅額</div>
              <div className="as-pay-sumRow__v">
                {bill.currency} {money(totals.tax)}
              </div>
            </div>

            <div className="as-pay-sumDivider" />

            <div className="as-pay-grand">
              <div className="as-pay-grand__k">應付總額</div>
              <div className="as-pay-grand__v">
                {bill.currency} {money(totals.grand)}
              </div>
            </div>

            <div className="as-pay-sideMeta">
              <div className="as-pay-sideMeta__line">
                <span className="as-pay-sideMeta__k">目前步驟</span>
                <span className="as-pay-sideMeta__v">{STEPS[stepIdx].label}</span>
              </div>
              <div className="as-pay-sideMeta__line">
                <span className="as-pay-sideMeta__k">付款方式</span>
                <span className="as-pay-sideMeta__v">
                  {method === "card"
                    ? "信用卡"
                    : method === "transfer"
                    ? "轉帳"
                    : "掃碼"}
                </span>
              </div>
            </div>

            <div className="as-pay-actions">
              <button
                type="button"
                className="as-btn ghost"
                onClick={prev}
                disabled={!canGoPrev}
                title={!canGoPrev ? "此步驟不可返回" : "返回上一步"}
              >
                <FaChevronLeft /> 上一步
              </button>

              {stepKey === "result" && result?.ok === false ? (
                <button
                  type="button"
                  className="as-btn primary"
                  onClick={() => {
                    setProcessingState("idle");
                    setResult(null);
                    setStepIdx(1);
                  }}
                >
                  <FaRedo /> 重新付款
                </button>
              ) : (
                <button
                  type="button"
                  className="as-btn primary"
                  onClick={next}
                  disabled={!canGoNext}
                  title={
                    stepKey === "settlement" && !confirmed
                      ? "請先勾選明細確認"
                      : ""
                  }
                >
                  {stepKey === "result" ? (
                    <>
                      <FaCheckCircle /> 完成
                    </>
                  ) : stepKey === "method" ? (
                    <>
                      <FaChevronRight /> 前往付款
                    </>
                  ) : (
                    <>
                      <FaChevronRight /> 下一步
                    </>
                  )}
                </button>
              )}
            </div>

            {stepKey === "settlement" && !confirmed && (
              <div className="as-hint" style={{ marginTop: 10 }}>
                請先勾選「我已確認明細與金額皆正確」才能進入下一步。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
