import { useState } from "react";

// 基本資訊 拆出來
import AccountBasicProfile from "./AccountBasicProfile";

// 原本 tab
import MyYachts from "./MyYachts";
import BerthRecord from "./BerthRecord";
import PaymentMethods from "./PaymentMethods";
import BillingHistory from "./BillingHistory";

import "../../styles/userProfile/AccountSettings.css";

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <div className="account-settings-container">
      <h2 className="page-title">會員資料編輯</h2>

      {/* Tab 導航 */}
      <div className="tab-navigation">
        <button
          className={`tab-item ${activeTab === "basic" ? "active" : ""}`}
          onClick={() => setActiveTab("basic")}
          type="button"
        >
          基本資訊
        </button>

        <button
          className={`tab-item ${activeTab === "yachts" ? "active" : ""}`}
          onClick={() => setActiveTab("yachts")}
          type="button"
        >
          遊艇資訊
        </button>

        <button
          className={`tab-item ${activeTab === "berth-record" ? "active" : ""}`}
          onClick={() => setActiveTab("berth-record")}
          type="button"
        >
          船隻停泊紀錄
        </button>

        <button
          className={`tab-item ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
          type="button"
        >
          支付方式
        </button>

        <button
          className={`tab-item ${activeTab === "billing" ? "active" : ""}`}
          onClick={() => setActiveTab("billing")}
          type="button"
        >
          繳費紀錄
        </button>
      </div>

      {/* Tab 內容 */}
      {activeTab === "basic" && <AccountBasicProfile />}
      {activeTab === "yachts" && <MyYachts />}
      {activeTab === "berth-record" && <BerthRecord />}
      {activeTab === "payments" && <PaymentMethods />}
      {activeTab === "billing" && <BillingHistory />}
    </div>
  );
};

export default AccountSettings;
