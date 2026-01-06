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
  // validate, // 移除未使用的 prop
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

const MyYachts = () => {
  const [yachtData, setYachtData] = useState({
    summary: {
      businessNo: "",
      vesselNo: "",
      vesselNameZh: "",
      nationality: "",
      vesselType: "",
      grossTonnage: "",
      operatorName: "",
      userAccountRef: "",
      passportNo: "",
    },
    detail: {
      arrivalNoticeNo: "",
      radioCallSign: "",
      vesselNameEn: "",
      portOfRegistry: "",
      loa: "",
      beam: "",
      depth: "",
      buildDate: "",
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (section, field, value) => {
    setYachtData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // 實時驗證
    validateField(section, field, value);
  };

  const validateField = (section, field, value) => {
    let msg = "";

    // 必填
    if (
      [
        "vesselNameZh",
        "nationality",
        "vesselType",
        "operatorName",
      ].includes(field)
    ) {
      if (!value) msg = "必填";
    }

    // 數字
    if (["grossTonnage", "loa", "beam", "depth"].includes(field)) {
      if (value && isNaN(Number(value))) msg = "必須為數字";
    }

    // 日期
    if (["buildDate"].includes(field)) {
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
    Object.entries(yachtData).forEach(([section, fields]) => {
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
    // TODO: API PUT 保存資料
    setEditMode(false);
  };

  useEffect(() => {
    // TODO: API GET
    // setYachtData(apiResponse);
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

      {/* 船舶摘要資訊 */}
      <section className="yacht-section">
        <h2>船舶摘要資訊</h2>
        <div className="grid-2">
          <div>
            <FormRow
              label="業務編號"
              value={yachtData.summary.businessNo}
              disabled
            />
            <FormRow
              label="船舶號數"
              value={yachtData.summary.vesselNo}
              disabled
            />
            <FormRow
              label="中文船名"
              value={yachtData.summary.vesselNameZh}
              onChange={(v) => handleChange("summary", "vesselNameZh", v)}
              disabled={!editMode}
              required
              error={errors.summary_vesselNameZh}
            />
            <FormRow
              label="國籍"
              value={yachtData.summary.nationality}
              onChange={(v) => handleChange("summary", "nationality", v)}
              disabled={!editMode}
              required
              error={errors.summary_nationality}
            />
            <FormRow
              label="船舶種類"
              value={yachtData.summary.vesselType}
              onChange={(v) => handleChange("summary", "vesselType", v)}
              disabled={!editMode}
              required
              error={errors.summary_vesselType}
            />
            <FormRow
              label="總噸位"
              value={yachtData.summary.grossTonnage}
              onChange={(v) => handleChange("summary", "grossTonnage", v)}
              disabled={!editMode}
              error={errors.summary_grossTonnage}
            />
            <FormRow
              label="駕駛人 / 所有人 / 代理人"
              value={yachtData.summary.operatorName}
              onChange={(v) => handleChange("summary", "operatorName", v)}
              disabled={!editMode}
              required
              error={errors.summary_operatorName}
            />
            <FormRow
              label="使用者帳號 / 公司流水號"
              value={yachtData.summary.userAccountRef}
              onChange={(v) => handleChange("summary", "userAccountRef", v)}
              disabled={!editMode}
            />
            <FormRow
              label="駕駛人護照號碼"
              value={yachtData.summary.passportNo}
              onChange={(v) => handleChange("summary", "passportNo", v)}
              disabled={!editMode}
            />
          </div>

          <div>
            <FormRow
              label="入境通報單"
              value={yachtData.detail.arrivalNoticeNo}
              disabled
            />
            <FormRow
              label="電臺呼號"
              value={yachtData.detail.radioCallSign}
              onChange={(v) => handleChange("detail", "radioCallSign", v)}
              disabled={!editMode}
            />
            <FormRow
              label="英文船名"
              value={yachtData.detail.vesselNameEn}
              onChange={(v) => handleChange("detail", "vesselNameEn", v)}
              disabled={!editMode}
            />
            <FormRow
              label="船籍港"
              value={yachtData.detail.portOfRegistry}
              onChange={(v) => handleChange("detail", "portOfRegistry", v)}
              disabled={!editMode}
            />
            <FormRow
              label="總長 (公尺)"
              value={yachtData.detail.loa}
              onChange={(v) => handleChange("detail", "loa", v)}
              disabled={!editMode}
              error={errors.detail_loa}
            />
            <FormRow
              label="船寬 (公尺)"
              value={yachtData.detail.beam}
              onChange={(v) => handleChange("detail", "beam", v)}
              disabled={!editMode}
              error={errors.detail_beam}
            />
            <FormRow
              label="船深 (公尺)"
              value={yachtData.detail.depth}
              onChange={(v) => handleChange("detail", "depth", v)}
              disabled={!editMode}
              error={errors.detail_depth}
            />
            <FormRow
              label="建造日期"
              type="date"
              value={yachtData.detail.buildDate}
              onChange={(v) => handleChange("detail", "buildDate", v)}
              disabled={!editMode}
              error={errors.detail_buildDate}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyYachts;
