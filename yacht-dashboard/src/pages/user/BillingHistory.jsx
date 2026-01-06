import React, { useEffect, useState } from 'react';
import { getUserBillingRecords } from '../../services/userApi';

const BillingHistory = () => {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    getUserBillingRecords().then(setBills);
  }, []);

  return (
    <div className="account-settings-container">
      <h2 className="page-title">收費紀錄</h2>

      {bills.length === 0 ? (
        <p className="no-data">目前沒有收費紀錄</p>
      ) : (
        <div className="table-wrapper">
          <table className="billing-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>項目</th>
                <th>金額</th>
                <th>付款狀態</th>
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
  );
};

export default BillingHistory;
