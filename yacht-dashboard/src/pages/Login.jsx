import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  // 交通部航港局 MTNet 會員申請表 PDF 頁面
  const mtNetApplyUrl = "https://web02.mtnet.gov.tw/";
  const bgUrl = `${import.meta.env.BASE_URL}images/bg2.png`; // 來自 public 資料夾

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      Swal.fire("請輸入帳號與密碼", "", "warning");
      return;
    }

    Swal.fire({
      title: "登入成功",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      navigate("/");
    });
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
          style={{
            color: "#0599BB",
            fontWeight: 600,
            letterSpacing: "1px",
          }}
        >
          遊艇碼頭平台 - 登入
        </h4>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              帳號
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              密碼
            </label>
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
            <label htmlFor="remember" className="form-check-label">
              記住我
            </label>
          </div>

          <button
            type="submit"
            className="btn w-100"
            style={{
              background: "#0599BB",
              color: "#fff",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            登入
          </button>

          <div className="d-flex justify-content-between mt-3">
            <a href="#" style={{ color: "#0599BB", fontSize: "0.9rem" }}>
              忘記密碼？
            </a>
            <a href="#" style={{ color: "#0599BB", fontSize: "0.9rem" }}>
              註冊帳號
            </a>
          </div>
        </form>

        {/* 🚢 入港申請按鈕區塊 */}
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
