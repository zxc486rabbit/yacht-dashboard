import { useEffect, useState } from "react";

const mockData = [
  {
    id: 1,
    name: "A01 船席",
    status: "使用中",
    power: 220,
  },
  {
    id: 2,
    name: "A02 船席",
    status: "空閒",
    power: 0,
  },
  {
    id: 3,
    name: "A03 船席",
    status: "維護中",
    power: 0,
  },
];

export default function Test() {
  const [list, setList] = useState([]);

  useEffect(() => {
    //  純前端假資料
    setList(mockData);
  }, []);

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