
import React, { useState, useEffect } from 'react';
import EyeIcon from '../../components/EyeIcon';
import './AccountSettings.css';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserYachts,
  getUserPaymentMethods,
  getUserBillingRecords
} from '../../services/userApi';


const AccountSettings = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergencyName: '',
    emergencyPhone: ''
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  
  // 密碼修改
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  
  // 會員資料
  const [yachts, setYachts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUserProfile(),
      getUserYachts(),
      getUserPaymentMethods(),
      getUserBillingRecords()
    ])
      .then(([profile, yachtsData, paymentsData, billsData]) => {
        setForm((f) => ({ ...f, ...profile }));
        setYachts(yachtsData);
        setPayments(paymentsData);
        setBills(billsData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSuccess('');
    setLoading(true);
    try {
      await updateUserProfile(form);
      setSuccess('會員資料已更新');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 密碼修改
  const handlePwdChange = (e) => {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });
  };
  const handlePwdSave = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    
    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdError('所有欄位皆為必填');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('新密碼與確認密碼不一致');
      return;
    }
    
    setPwdLoading(true);
    try {
      await changePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      setPwdSuccess('密碼已更新');
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdSuccess(''), 3000);
    } catch (err) {
      setPwdError(err.message || '密碼更新失敗');
    } finally {
      setPwdLoading(false);
    }
  };


  return (
    <div className="account-settings-container">
      <h2 className="page-title">會員資料編輯</h2>
      
      {success && (
        <div className="success-banner">
          {success}
        </div>
      )}

      <div className="section-block">
        <h3 className="section-title">基本資訊</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>
              <span className="required">*</span> 會員姓名
            </label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>
              <span className="required">*</span> 聯絡Email
            </label>
            <input 
              name="email" 
              type="email"
              value={form.email} 
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <span className="required">*</span> 聯絡電話
            </label>
            <input 
              name="phone" 
              value={form.phone} 
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>聯絡地址</label>
            <input 
              name="address" 
              value={form.address} 
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="section-block">
        <h3 className="section-title">緊急聯絡人</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>緊急聯絡人姓名</label>
            <input 
              name="emergencyName" 
              value={form.emergencyName} 
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>緊急聯絡人電話</label>
            <input 
              name="emergencyPhone" 
              value={form.emergencyPhone} 
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="section-block">
        <h3 className="section-title">變更密碼</h3>
        {pwdSuccess && <div className="success-message">{pwdSuccess}</div>}
        {pwdError && <div className="error-message">{pwdError}</div>}
        
        <form onSubmit={handlePwdSave}>
          <div className="form-row">
            <div className="form-group">
              <label>舊密碼</label>
              <div className="password-input-wrapper">
                <input 
                  type={showOldPwd ? 'text' : 'password'}
                  name="oldPassword" 
                  value={pwdForm.oldPassword} 
                  onChange={handlePwdChange}
                  disabled={pwdLoading}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowOldPwd((v) => !v)}
                  tabIndex={0}
                  aria-label={showOldPwd ? '隱藏密碼' : '顯示密碼'}
                >
                  <EyeIcon open={showOldPwd} />
                </span>
              </div>
            </div>
            
            <div className="form-group">
              <label>新密碼</label>
              <div className="password-input-wrapper">
                <input 
                  type={showNewPwd ? 'text' : 'password'}
                  name="newPassword" 
                  value={pwdForm.newPassword} 
                  onChange={handlePwdChange}
                  disabled={pwdLoading}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowNewPwd((v) => !v)}
                  tabIndex={0}
                  aria-label={showNewPwd ? '隱藏密碼' : '顯示密碼'}
                >
                  <EyeIcon open={showNewPwd} />
                </span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>確認新密碼</label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPwd ? 'text' : 'password'}
                  name="confirmPassword" 
                  value={pwdForm.confirmPassword} 
                  onChange={handlePwdChange}
                  disabled={pwdLoading}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowConfirmPwd((v) => !v)}
                  tabIndex={0}
                  aria-label={showConfirmPwd ? '隱藏密碼' : '顯示密碼'}
                >
                  <EyeIcon open={showConfirmPwd} />
                </span>
              </div>
            </div>
            <div className="form-group"></div>
          </div>

          <div className="password-actions">
            <button type="submit" className="submit-btn" disabled={pwdLoading}>
              變更密碼
            </button>
          </div>
        </form>
      </div>
      
      <div className="section-block">
        <h3 className="section-title">我的遊艇</h3>
        {yachts.length === 0 ? (
          <p className="no-data">無遊艇資料</p>
        ) : (
          <ul className="yacht-list">
            {yachts.map(y => (
              <li key={y.id}>{y.name}（{y.type}，{y.length}呎）</li>
            ))}
          </ul>
        )}
      </div>

      <div className="section-block">
        <h3 className="section-title">支付方式</h3>
        {payments.length === 0 ? (
          <p className="no-data">無支付方式</p>
        ) : (
          <ul className="payment-list">
            {payments.map(p => (
              <li key={p.id}>
                {p.type === '信用卡' ? `信用卡（****${p.last4}，${p.holder}）` : `銀行帳戶（${p.bank}，${p.account}）`}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="section-block">
        <h3 className="section-title">收費紀錄查詢</h3>
        {bills.length === 0 ? (
          <p className="no-data">無收費紀錄</p>
        ) : (
          <div className="table-wrapper">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>項目</th>
                  <th>金額</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b.id}>
                    <td>{b.date}</td>
                    <td>{b.item}</td>
                    <td>{b.amount}</td>
                    <td>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="submit-btn" onClick={handleSave} disabled={loading}>
          確認編輯
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
