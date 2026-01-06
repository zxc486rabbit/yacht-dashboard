import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import EyeIcon from '../../components/EyeIcon';
import "./AccountSettings.css";
import {
  getUserProfile,
  updateUserProfile,
  changePassword
} from '../../services/userApi';

const AccountSettings = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergencyName: '',
    emergencyPhone: ''
  });

  // const [loading, setLoading] = useState(true); // Removed: unused
  const [success, setSuccess] = useState('');

  /* ===== 密碼 ===== */
  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  // const [showConfirmPwd, setShowConfirmPwd] = useState(false); // Removed: unused

  useEffect(() => {
    getUserProfile().then(data => {
      setForm(data);
      // setLoading(false); // Removed: loading state no longer used
    });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    await updateUserProfile(form);
    setSuccess('會員資料已更新');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handlePwdSave = async e => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdError('請完整填寫所有欄位');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('新密碼與確認密碼不一致');
      return;
    }
    if (pwdForm.oldPassword === pwdForm.newPassword) {
      setPwdError('新密碼不可與舊密碼相同');
      return;
    }

    await changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    });

    setPwdSuccess('密碼已更新');
    setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="account-settings-container">
      <h2 className="page-title">會員資料編輯</h2>

      {/* 快速入口 */}
      <div className="quick-links">
        <div className="quick-link-card" onClick={() => navigate('/account/yachts')}>
          <div className="quick-link-title">我的遊艇</div>
          <div className="quick-link-desc">管理遊艇與停泊</div>
        </div>

        <div className="quick-link-card" onClick={() => navigate('/account/payments')}>
          <div className="quick-link-title">支付方式</div>
          <div className="quick-link-desc">信用卡與銀行帳戶</div>
        </div>

        <div className="quick-link-card" onClick={() => navigate('/account/billing')}>
          <div className="quick-link-title">收費紀錄</div>
          <div className="quick-link-desc">帳單與付款查詢</div>
        </div>
      </div>

      {success && <div className="success-message">{success}</div>}

      {/* 基本資料 */}
      <div className="section-block">
        <h3 className="section-title">基本資訊</h3>
        <div className="form-row">
          <div className="form-group">
            <label><span className="required">*</span>姓名</label>
            <input name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" value={form.email} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* 密碼 */}
      <div className="section-block">
        <h3 className="section-title">變更密碼</h3>
        {pwdSuccess && <div className="success-message">{pwdSuccess}</div>}
        {pwdError && <div className="error-message">{pwdError}</div>}

        <form onSubmit={handlePwdSave}>
          <div className="form-row password-vertical">
            <div className="form-group">
              <label>舊密碼</label>
              <div className="password-input-wrapper">
                <input type={showOldPwd ? 'text' : 'password'}
                  value={pwdForm.oldPassword}
                  onChange={e => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                />
                <span className="eye-icon" onClick={() => setShowOldPwd(!showOldPwd)}>
                  <EyeIcon open={showOldPwd} />
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>新密碼</label>
              <div className="password-input-wrapper">
                <input type={showNewPwd ? 'text' : 'password'}
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                />
                <span className="eye-icon" onClick={() => setShowNewPwd(!showNewPwd)}>
                  <EyeIcon open={showNewPwd} />
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>確認新密碼</label>
              <div className="password-input-wrapper">
                <input type={showConfirmPwd ? 'text' : 'password'}
                  value={pwdForm.confirmPassword}
                  onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                />
                <span className="eye-icon" onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                  <EyeIcon open={showConfirmPwd} />
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions form-actions-inline">
            <button className="submit-btn" type="submit">更新密碼</button>
            <button className="submit-btn" type="button" onClick={handleSave}>儲存變更</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;
