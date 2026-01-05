
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
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // 密碼修改
  const [showPwdEdit, setShowPwdEdit] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  // 密碼顯示/隱藏
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
      .then(([profile, yachts, payments, bills]) => {
        setForm((f) => ({ ...f, ...profile }));
        setYachts(yachts);
        setPayments(payments);
        setBills(bills);
        setLoading(false);
      })
      .catch(() => {
        setError('載入會員資料失敗');
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setEditMode(true);
    setError('');
    setSuccess('');
  };
  const handleCancel = () => {
    setEditMode(false);
    setError('');
    setSuccess('');
    getUserProfile().then((data) => setForm((f) => ({ ...f, ...data })));
  };

  // 密碼修改
  const handlePwdChange = (e) => {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });
  };
  const handlePwdEdit = () => {
    setShowPwdEdit(true);
    setPwdError('');
    setPwdSuccess('');
    setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };
  const handlePwdCancel = () => {
    setShowPwdEdit(false);
    setPwdError('');
    setPwdSuccess('');
    setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
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
      setShowPwdEdit(false);
    } catch (err) {
      setPwdError(err.message || '密碼更新失敗');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.email || !form.phone) {
      setError('所有欄位皆為必填');
      return;
    }
    setLoading(true);
    try {
      await updateUserProfile({ name: form.name, email: form.email, phone: form.phone });
      setEditMode(false);
      setSuccess('資料已更新');
    } catch (err) {
      setError(err.message || '更新失敗');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="account-settings-container">
      <h2>個人帳戶設定</h2>
      {loading && <div style={{ color: '#888' }}>載入中...</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
      {!editMode ? (
        <>
          <div className="form-group">
            <label>會員姓名</label>
            <input name="name" value={form.name} readOnly disabled />
          </div>
          <div className="form-group">
            <label>信箱</label>
            <input name="email" value={form.email} readOnly disabled />
          </div>
          <div className="form-group">
            <label>手機</label>
            <input name="phone" value={form.phone} readOnly disabled />
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleEdit} disabled={loading}>編輯</button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label>會員姓名</label>
            <input name="name" value={form.name} onChange={handleChange} disabled={loading} />
          </div>
          <div className="form-group">
            <label>信箱</label>
            <input name="email" value={form.email} onChange={handleChange} disabled={loading} />
          </div>
          <div className="form-group">
            <label>手機</label>
            <input name="phone" value={form.phone} onChange={handleChange} disabled={loading} />
          </div>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
          <div className="form-actions">
            <button type="submit" disabled={loading}>確認編輯</button>
            <button type="button" onClick={handleCancel} disabled={loading}>取消</button>
          </div>
        </form>
      )}
      <div style={{ margin: '18px 0 0 0' }}>
        <h4>帳戶密碼</h4>
        {pwdSuccess && <div style={{ color: 'green', marginBottom: 8 }}>{pwdSuccess}</div>}
        {showPwdEdit ? (
          <form onSubmit={handlePwdSave} style={{ marginBottom: 12 }}>
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <label style={{ marginBottom: 0 }}>舊密碼</label>
                <span
                  style={{ cursor: 'pointer', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setShowOldPwd((v) => !v)}
                  tabIndex={0}
                  aria-label={showOldPwd ? '隱藏密碼' : '顯示密碼'}
                >
                  <EyeIcon open={showOldPwd} />
                </span>
              </div>
              <input
                type={showOldPwd ? 'text' : 'password'}
                name="oldPassword"
                value={pwdForm.oldPassword}
                onChange={handlePwdChange}
                disabled={pwdLoading}
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <label style={{ marginBottom: 0 }}>新密碼</label>
                <span
                  style={{ cursor: 'pointer', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setShowNewPwd((v) => !v)}
                  tabIndex={0}
                  aria-label={showNewPwd ? '隱藏密碼' : '顯示密碼'}
                >
                  <EyeIcon open={showNewPwd} />
                </span>
              </div>
              <input
                type={showNewPwd ? 'text' : 'password'}
                name="newPassword"
                value={pwdForm.newPassword}
                onChange={handlePwdChange}
                disabled={pwdLoading}
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <label style={{ marginBottom: 0 }}>確認新密碼</label>
                <span
                  style={{ cursor: 'pointer', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setShowConfirmPwd((v) => !v)}
                  tabIndex={0}
                  aria-label={showConfirmPwd ? '隱藏密碼' : '顯示密碼'}
                >
                  <EyeIcon open={showConfirmPwd} />
                </span>
              </div>
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                name="confirmPassword"
                value={pwdForm.confirmPassword}
                onChange={handlePwdChange}
                disabled={pwdLoading}
              />
            </div>
            {pwdError && <div style={{ color: 'red', marginBottom: 8 }}>{pwdError}</div>}
            <div className="form-actions">
              <button type="submit" disabled={pwdLoading}>儲存密碼</button>
              <button type="button" onClick={handlePwdCancel} disabled={pwdLoading}>取消</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={handlePwdEdit} disabled={pwdLoading}>修改密碼</button>
        )}
      </div>
      <hr />
      <div className="account-section">
        <h3>我的遊艇</h3>
        {yachts.length === 0 ? <p>無遊艇資料</p> : (
          <ul>
            {yachts.map(y => (
              <li key={y.id}>{y.name}（{y.type}，{y.length}呎）</li>
            ))}
          </ul>
        )}
      </div>
      <div className="account-section">
        <h3>支付方式</h3>
        {payments.length === 0 ? <p>無支付方式</p> : (
          <ul>
            {payments.map(p => (
              <li key={p.id}>
                {p.type === '信用卡' ? `信用卡（****${p.last4}，${p.holder}）` : `銀行帳戶（${p.bank}，${p.account}）`}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="account-section">
        <h3>收費紀錄查詢</h3>
        {bills.length === 0 ? <p>無收費紀錄</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f4f8' }}>
                <th style={{ padding: 4, border: '1px solid #ddd' }}>日期</th>
                <th style={{ padding: 4, border: '1px solid #ddd' }}>項目</th>
                <th style={{ padding: 4, border: '1px solid #ddd' }}>金額</th>
                <th style={{ padding: 4, border: '1px solid #ddd' }}>狀態</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.id}>
                  <td style={{ padding: 4, border: '1px solid #ddd' }}>{b.date}</td>
                  <td style={{ padding: 4, border: '1px solid #ddd' }}>{b.item}</td>
                  <td style={{ padding: 4, border: '1px solid #ddd' }}>{b.amount}</td>
                  <td style={{ padding: 4, border: '1px solid #ddd' }}>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
