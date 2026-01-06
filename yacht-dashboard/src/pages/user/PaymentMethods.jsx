import React, { useEffect, useState } from 'react';
import { getUserPaymentMethods } from '../../services/userApi';

const PaymentMethods = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    getUserPaymentMethods().then(setPayments);
  }, []);

  return (
    <div className="account-settings-container">
      <h2 className="page-title">支付方式</h2>

      {payments.length === 0 ? (
        <p className="no-data">尚未設定支付方式</p>
      ) : (
        <ul className="payment-list">
          {payments.map(p => (
            <li key={p.id}>
              {p.type === '信用卡'
                ? `信用卡（****${p.last4}，${p.holder}）`
                : `銀行帳戶（${p.bank}，${p.account}）`
              }
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PaymentMethods;
