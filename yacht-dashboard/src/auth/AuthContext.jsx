// 全站共用的登入狀態盒子
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// 這個 Context 用來放「目前登入者」與登入/登出方法
// 好處是任何元件都能直接取用，不用一層層 props 傳下去
const AuthContext = createContext(null);

// localStorage 的 key 統一集中管理，之後要改名稱也不會漏改
const LS_KEY = "hk_auth_user";

export function AuthProvider({ children }) {
  // user = null 表示未登入；有值表示已登入
  const [user, setUser] = useState(null);

  // App 第一次載入時，把上次存的登入者資訊撈回來
  // 目前只是做展示用，所以直接存整包 user；以後串後端通常會改存 token
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    try {
      setUser(JSON.parse(raw));
    } catch (err) {
      // 如果 localStorage 被改壞或格式不對，就直接清掉避免卡死
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  // 登入：更新 state + 存到 localStorage，讓重整後仍保持登入感
  const login = (payloadUser) => {
    setUser(payloadUser);
    localStorage.setItem(LS_KEY, JSON.stringify(payloadUser));
  };

  // 登出：清空 state + 清 localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_KEY);
  };

  // useMemo 是為了避免每次 render 都產生新的物件，減少不必要的重渲染
  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 提供一個 hook 給外面用，方便取用 AuthContext 並且強制要求必須包在 <AuthProvider> 裡，避免開發時默默拿到 null
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("我要拿登入狀態");
  return ctx;
}
