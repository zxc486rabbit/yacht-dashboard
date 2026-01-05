// mock 會員資料 API
let userProfile = {
  name: '預設會員',
  email: 'user@email.com',
  phone: '0912345678',
};

export async function getUserProfile() {
  // 模擬 API 請求
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...userProfile }), 300);
  });
}


export async function updateUserProfile({ name, email, phone }) {
  // 模擬 API 請求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!name || !email || !phone) {
        reject(new Error('所有欄位皆為必填'));
      } else {
        userProfile = { name, email, phone };
        resolve({ success: true });
      }
    }, 500);
  });
}

// mock 密碼修改
export async function changePassword({ oldPassword, newPassword }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!oldPassword || !newPassword) {
        reject(new Error('請輸入完整欄位'));
      } else if (oldPassword !== '123456') {
        reject(new Error('舊密碼錯誤（測試用：123456）'));
      } else {
        resolve({ success: true });
      }
    }, 600);
  });
}

// mock 遊艇列表
export async function getUserYachts() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: '海洋之星', type: '帆船', length: 32 },
        { id: 2, name: '藍天號', type: '動力艇', length: 24 },
      ]);
    }, 400);
  });
}

// mock 支付方式
export async function getUserPaymentMethods() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, type: '信用卡', last4: '1234', holder: 'ARIEL LIN' },
        { id: 2, type: '銀行帳戶', bank: '台灣銀行', account: '****5678' },
      ]);
    }, 400);
  });
}

// mock 收費紀錄
export async function getUserBillingRecords() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, date: '2025-12-01', item: '船位租賃', amount: 3200, status: '已繳清' },
        { id: 2, date: '2025-11-01', item: '電費', amount: 800, status: '已繳清' },
        { id: 3, date: '2025-10-01', item: '水費', amount: 200, status: '未繳' },
      ]);
    }, 400);
  });
}
