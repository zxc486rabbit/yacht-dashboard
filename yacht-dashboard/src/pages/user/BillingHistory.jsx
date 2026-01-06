import React, { useEffect, useState } from 'react';
// import { getUserBillingRecords } from '../../services/userApi';
import './BillingHistory.css';

const BillingHistory = () => {
  const [bills, setBills] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    // Mock data - 實際應從 API 取得
    const mockData = [
      {
        id: 1,
        billNumber: 'BILL-2026-001',
        paymentDate: '2026-01-05',
        totalAmount: 15000,
        paidAmount: 15000,
        unpaidAmount: 0,
        status: '已繳',
        items: [
          { name: '水費', amount: 5000 },
          { name: '電費', amount: 10000 },
        ]
      },
      {
        id: 2,
        billNumber: 'BILL-2025-012',
        paymentDate: '2025-12-28',
        totalAmount: 20000,
        paidAmount: 10000,
        unpaidAmount: 10000,
        status: '部分已繳',
        items: [
          { name: '水費', amount: 6000 },
          { name: '電費', amount: 14000 },
        ]
      },
      {
        id: 3,
        billNumber: 'BILL-2025-011',
        paymentDate: '2025-12-15',
        totalAmount: 12000,
        paidAmount: 0,
        unpaidAmount: 12000,
        status: '未繳',
        items: [
          { name: '水費', amount: 4000 },
          { name: '電費', amount: 8000 },
        ]
      },
    ];
    setBills(mockData);
    // getUserBillingRecords().then(setBills);
  }, []);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="account-settings-container">
      <h2 className="page-title">繳費紀錄</h2>

      {bills.length === 0 ? (
        <p className="no-data">目前沒有繳費紀錄</p>
      ) : (
        <div className="table-wrapper">
          <table className="billing-table">
            <thead>
              <tr>
                <th style={{width: '150px'}}>帳單</th>
                <th style={{width: '120px'}}>繳費日期</th>
                <th style={{width: '100px'}}>繳費</th>
                <th style={{width: '100px'}}>已繳</th>
                <th style={{width: '100px'}}>未繳</th>
                <th style={{width: '100px'}}>狀態</th>
                <th style={{width: '80px'}}>項目</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <React.Fragment key={bill.id}>
                  <tr>
                    <td>{bill.billNumber}</td>
                    <td>{bill.paymentDate}</td>
                    <td>NT$ {bill.totalAmount.toLocaleString()}</td>
                    <td>NT$ {bill.paidAmount.toLocaleString()}</td>
                    <td>NT$ {bill.unpaidAmount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${bill.status === '已繳' ? 'paid' : bill.status === '未繳' ? 'unpaid' : 'partial'}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="toggle-btn"
                        onClick={() => toggleRow(bill.id)}
                      >
                        {expandedRow === bill.id ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === bill.id && (
                    <tr className="expanded-row">
                      <td colSpan="7">
                        <div className="item-details">
                          <h4>費用明細</h4>
                          <table className="detail-table">
                            <thead>
                              <tr>
                                <th>費用項目</th>
                                <th>金額</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bill.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.name}</td>
                                  <td>NT$ {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BillingHistory;
