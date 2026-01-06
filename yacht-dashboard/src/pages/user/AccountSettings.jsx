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
    idNumber: '',
    account: 'user123456',
    email: '',
    phone: '',
    address: '',
    emergencyName: '',
    emergencyPhone: ''
  });

  const [avatarUrl, setAvatarUrl] = useState('');

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
  const [showPwdModal, setShowPwdModal] = useState(false);
  // const [showConfirmPwd, setShowConfirmPwd] = useState(false); // Removed: unused

  useEffect(() => {
    // 從 localStorage 讀取資料
    const savedData = localStorage.getItem('userProfile');
    const savedAvatar = localStorage.getItem('userAvatar');
    
    if (savedData) {
      setForm(JSON.parse(savedData));
    } else {
      getUserProfile().then(data => {
        setForm(data);
        // setLoading(false); // Removed: loading state no longer used
      });
    }
    
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    // 保存到 localStorage
    localStorage.setItem('userProfile', JSON.stringify(form));
    if (avatarUrl) {
      localStorage.setItem('userAvatar', avatarUrl);
    }
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
        {/* 大頭貼獨立一行 */}
        <div className="form-row">
          <div className="form-group" style={{alignItems: 'flex-start', width: '100%'}}>
            <div 
              style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => document.getElementById('avatar-upload').click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#aaa' }}>點擊上傳</span>
              )}
            </div>
            <input 
              id="avatar-upload"
              type="file" 
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setAvatarUrl(reader.result);
                  };
                  reader.readAsDataURL(file);
                } else {
                  setAvatarUrl('');
                }
              }}
            />
          </div>
        </div>
        {/* 姓名與身分證並排 */}
        <div className="form-row">
          <div className="form-group name-field">
            <label><span className="required">*</span>姓名</label>
            <input name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group id-field">
            <label><span className="required">*</span>身分證/護照</label>
            <input name="idNumber" value={form.idNumber} onChange={handleChange} />
          </div>
        </div>
        {/* 會員帳號與 Email */}
        <div className="form-row">
          <div className="form-group">
            <label>會員帳號</label>
            <input name="account" value={form.account} disabled />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" value={form.email} onChange={handleChange} />
          </div>
        </div>
        {/* 手機與地址 */}
        <div className="form-row">
          <div className="form-group">
            <label>手機</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>地址</label>
            <input name="address" value={form.address} onChange={handleChange} />
          </div>
        </div>
        {/* 緊急聯絡人 */}
        <div className="form-row">
          <div className="form-group">
            <label>緊急聯絡人</label>
            <input name="emergencyName" value={form.emergencyName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>緊急聯絡人電話</label>
            <input name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* 密碼 */}
      <div className="section-block">
        <h3 className="section-title">變更密碼</h3>
        <button className="submit-btn" type="button" onClick={() => setShowPwdModal(true)} style={{marginBottom: '20px'}}>更新密碼</button>
      </div>

      <div className="form-actions">
        <button className="submit-btn" onClick={handleSave}>儲存變更</button>
      </div>

      {/* 密碼彈窗 */}
      {showPwdModal && (
        <div className="modal-overlay" onClick={() => setShowPwdModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>變更密碼</h3>
            {pwdSuccess && <div className="success-message">{pwdSuccess}</div>}
            {pwdError && <div className="error-message">{pwdError}</div>}
            <form onSubmit={handlePwdSave}>
              <div className="form-group" style={{marginBottom: '16px'}}>
                <label>舊密碼</label>
                <div className="password-input-wrapper" style={{maxWidth: '100%'}}>
                  <input type={showOldPwd ? 'text' : 'password'}
                    value={pwdForm.oldPassword}
                    onChange={e => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                  />
                  <span className="eye-icon" onClick={() => setShowOldPwd(!showOldPwd)}>
                    <EyeIcon open={showOldPwd} />
                  </span>
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '16px'}}>
                <label>新密碼</label>
                <div className="password-input-wrapper" style={{maxWidth: '100%'}}>
                  <input type={showNewPwd ? 'text' : 'password'}
                    value={pwdForm.newPassword}
                    onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  />
                  <span className="eye-icon" onClick={() => setShowNewPwd(!showNewPwd)}>
                    <EyeIcon open={showNewPwd} />
                  </span>
                </div>
              </div>

              <div className="form-group" style={{marginBottom: '24px'}}>
                <label>確認新密碼</label>
                <div className="password-input-wrapper" style={{maxWidth: '100%'}}>
                  <input type={showConfirmPwd ? 'text' : 'password'}
                    value={pwdForm.confirmPassword}
                    onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  />
                  <span className="eye-icon" onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                    <EyeIcon open={showConfirmPwd} />
                  </span>
                </div>
              </div>

              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button className="submit-btn" type="button" onClick={() => setShowPwdModal(false)} style={{background: '#6c757d'}}>取消</button>
                <button className="submit-btn" type="submit">確認</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
