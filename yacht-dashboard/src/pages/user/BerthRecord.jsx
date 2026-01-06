import { useEffect, useState } from "react";
import "./MyYachts.css";

// 可重用欄位元件
const FormRow = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  required = false,
  error,
}) => {
  return (
    <div className="form-row">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
};

const BerthRecord = () => {
  const [berthData, setBerthData] = useState({
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
    other: {
      draft: "",
      crewHealthIssueCount: "",
    },
    visa: {
      onboardTaiwan: "",
      onboardForeign: "",
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});

  const visaTotal =
    Number(berthData.visa.onboardTaiwan || 0) +
    Number(berthData.visa.onboardForeign || 0);

  const handleChange = (section, field, value) => {
    setBerthData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    validateField(section, field, value);
  };

  const validateField = (section, field, value) => {
    let msg = "";

    if (["portCode"].includes(field)) {
      if (!value) msg = "必填";
    }

    if (["draft", "crewHealthIssueCount", "onboardTaiwan", "onboardForeign"].includes(field)) {
      if (value && isNaN(Number(value))) msg = "必須為數字";
    }

    if (["arrivalDate", "departureDate"].includes(field)) {
      if (value && isNaN(Date.parse(value))) msg = "日期格式錯誤";
    }

    setErrors((prev) => ({
      ...prev,
      [section + "_" + field]: msg,
    }));

    return msg === "";
  };

  const validateAll = () => {
    let valid = true;
    Object.entries(berthData).forEach(([section, fields]) => {
      Object.entries(fields).forEach(([field, value]) => {
        const fieldValid = validateField(section, field, value);
        if (!fieldValid) valid = false;
      });
    });
    return valid;
  };

  const handleSave = () => {
    if (!validateAll()) {
      alert("請先修正錯誤欄位");
      return;
    }
    setEditMode(false);
  };

  useEffect(() => {
    // TODO: API GET
  }, []);

  return (
    <div className="yacht-page">
      <div className="actions">
        {editMode ? (
          <>
            <button className="btn btn-save" onClick={handleSave}>
              儲存
            </button>
            <button className="btn btn-cancel" onClick={() => setEditMode(false)}>
              取消
            </button>
          </>
        ) : (
          <button className="btn btn-edit" onClick={() => setEditMode(true)}>
            編輯
          </button>
        )}
      </div>

      {/* 進港資訊 */}
      <section className="yacht-section">
        <h2>預定進港日期、航線、港口</h2>
        <div className="grid-2">
          <div>
            <FormRow
              label="預定進港日期"
              type="date"
              value={berthData.schedule.arrivalDate}
              onChange={(v) => handleChange("schedule", "arrivalDate", v)}
              disabled={!editMode}
              error={errors.schedule_arrivalDate}
            />
            <FormRow
              label="預定離臺日期"
              type="date"
              value={berthData.schedule.departureDate}
              onChange={(v) => handleChange("schedule", "departureDate", v)}
              disabled={!editMode}
              error={errors.schedule_departureDate}
            />
            <FormRow
              label="進港目的"
              value={berthData.schedule.purpose}
              onChange={(v) => handleChange("schedule", "purpose", v)}
              disabled={!editMode}
            />
            <FormRow
              label="前一港代碼"
              value={berthData.schedule.previousPortCode}
              onChange={(v) => handleChange("schedule", "previousPortCode", v)}
              disabled={!editMode}
            />
            <FormRow
              label="進出港口"
              value={berthData.schedule.portCode}
              onChange={(v) => handleChange("schedule", "portCode", v)}
              disabled={!editMode}
              required
              error={errors.schedule_portCode}
            />
          </div>
          <div>
            <FormRow
              label="預定進港時間 (HHMM)"
              value={berthData.schedule.arrivalTime}
              onChange={(v) => handleChange("schedule", "arrivalTime", v)}
              disabled={!editMode}
            />
            <FormRow
              label="次一港代碼"
              value={berthData.schedule.nextPortCode}
              onChange={(v) => handleChange("schedule", "nextPortCode", v)}
              disabled={!editMode}
            />
            <FormRow
              label="靠泊馬頭"
              value={berthData.schedule.berth}
              onChange={(v) => handleChange("schedule", "berth", v)}
              disabled={!editMode}
            />
          </div>
        </div>
      </section>

      {/* 其他 */}
      <section className="yacht-section">
        <h2>其他</h2>
        <div className="grid-2">
          <FormRow
            label="吃水 (公尺)"
            value={berthData.other.draft}
            onChange={(v) => handleChange("other", "draft", v)}
            disabled={!editMode}
            error={errors.other_draft}
          />
          <FormRow
            label="船員健康異常人數"
            value={berthData.other.crewHealthIssueCount}
            onChange={(v) => handleChange("other", "crewHealthIssueCount", v)}
            disabled={!editMode}
            error={errors.other_crewHealthIssueCount}
          />
        </div>
      </section>

      {/* 簽證人數 */}
      <section className="yacht-section">
        <h2>簽證人數</h2>
        <div className="grid-3">
          <FormRow
            label="在船人數 (台灣)"
            value={berthData.visa.onboardTaiwan}
            onChange={(v) => handleChange("visa", "onboardTaiwan", v)}
            disabled={!editMode}
            error={errors.visa_onboardTaiwan}
          />
          <FormRow
            label="在船人數 (外國)"
            value={berthData.visa.onboardForeign}
            onChange={(v) => handleChange("visa", "onboardForeign", v)}
            disabled={!editMode}
            error={errors.visa_onboardForeign}
          />
          <FormRow label="合計" value={visaTotal} disabled />
        </div>
      </section>
    </div>
  );
};

export default BerthRecord;
