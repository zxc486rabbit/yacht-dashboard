import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://api-domain.com/api";

export default function BerthList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(${API_BASE}/BerthApi/GetBerths);
        setList(res.data); // ← 關鍵只改這一行來源
      } catch (err) {
        console.error("取得船席失敗", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>載入中...</div>;

  return (
    <div>
      <h2>船席清單</h2>
      <table className="table">
        <thead>
          <tr>
            <th>編號</th>
            <th>名稱</th>
            <th>狀態</th>
            <th>電力</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.status}</td>
              <td>{item.power} V</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}