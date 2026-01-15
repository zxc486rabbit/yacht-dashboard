import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  // 這頁目前不串 API，所以先用 state 收集表單輸入，之後要換成真的登入流程也方便
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  // navigate：登入成功後導頁用
  // location：用來拿「原本要去的頁」，避免登入後永遠只回首頁
  const navigate = useNavigate();
  const location = useLocation();

  // 從 AuthContext 拿到 login 方法，讓登入狀態能全站共用（Sidebar / RequireAuth 都會吃到）
  const { login } = useAuth();

  // 如果使用者是被 RequireAuth 擋下來才來登入，state 會帶 from
  // 沒帶的話就回到預設的 dashboard
  const from = location.state?.from || "/dashboard";

  // 交通部航港局網站（先放外連入口）
  const mtNetApplyUrl = "https://yberth.motcmpb.gov.tw/YberthM2/Portal";

  // Vite 的 public 靜態檔是「直接從根路徑取」，不要再寫 /public
  // import.meta.env.BASE_URL 會跟你的 base（例如 github pages）一起變動
  const bgUrl = `${import.meta.env.BASE_URL}images/bg2.png`;

  const handleLogin = async (e) => {
    e.preventDefault();

    // 先做基本防呆，避免空值送出
    if (!username.trim() || !password.trim()) {
      Swal.fire("請輸入帳號與密碼", "", "warning");
      return;
    }

    // 目前只是做畫面呈現，所以先建立一份「假的登入者資料」
    // 之後串 API 的時候，這段會改成：呼叫登入 API → 拿 token / userInfo
    const mockUser = {
      id: "U0001",
      name: username.trim(),  // 先把帳號當作顯示名稱
      role: "管理者",         // 先固定給一個角色，讓 sidebar 有東西可展示
      avatar: null,           // 之後要接照片 url 再用
      remember,
      loginAt: new Date().toISOString(),
    };

    // 寫入全站登入狀態（Context + localStorage）
    login(mockUser);

    // 做一個短暫的回饋，讓使用者知道「登入成功」而不是直接跳頁
    await Swal.fire({
      title: "登入成功",
      text: `歡迎回來，${mockUser.name}`,
      icon: "success",
      timer: 1200,
      showConfirmButton: false,
    });

    // 回到原本想去的頁（或 dashboard）
    // replace: true 是避免登入頁留在瀏覽器上一頁紀錄中
    navigate(from, { replace: true });
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        height: "100vh",
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="card shadow p-4"
        style={{
          maxWidth: "400px",
          width: "100%",
          border: "none",
          borderRadius: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <h4
          className="text-center mb-4"
          style={{ color: "#0599BB", fontWeight: 600, letterSpacing: "1px" }}
        >
          遊艇碼頭平台 - 登入
        </h4>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">帳號</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">密碼</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember" className="form-check-label">記住我</label>
          </div>

          <button
            type="submit"
            className="btn w-100"
            style={{ background: "#0599BB", color: "#fff", fontWeight: "bold", letterSpacing: "1px" }}
          >
            登入
          </button>

          <div className="d-flex justify-content-between mt-3">
            {/* 先留著做 UI，之後若要做功能再補路由或 modal */}
            <a href="#" style={{ color: "#0599BB", fontSize: "0.9rem" }}>忘記密碼？</a>
            <a href="#" style={{ color: "#0599BB", fontSize: "0.9rem" }}>註冊帳號</a>
          </div>
        </form>

        <div className="text-center mt-4">
          <a
            href={mtNetApplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              fontWeight: "600",
              fontSize: "0.95rem",
              color: "#fff",
              background: "linear-gradient(90deg, #FF9800, #FFB74D)",
              borderRadius: "8px",
              textDecoration: "none",
              boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
              transition: "transform 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
          >
            入港申請（前往航港局）
          </a>
        </div>
      </div>
    </div>
  );
}
