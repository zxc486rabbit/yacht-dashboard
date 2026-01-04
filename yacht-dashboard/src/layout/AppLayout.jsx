// sidebar與主內容的排版容器
import Sidebar from "../components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="container-fluid d-flex flex-nowrap p-0" style={{ height: "100vh" }}>
      <Sidebar />
      <div className="main-content flex-grow-1 overflow-auto" style={{ minWidth: 0, height: "100vh" }}>
        {children}
      </div>
    </div>
  );
}
