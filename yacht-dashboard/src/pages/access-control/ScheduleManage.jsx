import { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "sweetalert2/dist/sweetalert2.min.css";

const MySwal = withReactContent(Swal);

export default function ScheduleManage() {
  const initialData = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `排程 ${i + 1}`,
    time: `0${8 + i}:00 - 1${0 + i}:00`,
    device: `門禁設備 ${i % 3 + 1}`,
  }));

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredData = data.filter(
    (item) =>
      item.name.includes(search.trim()) || item.device.includes(search.trim())
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pageData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const deleteSchedule = (id) => {
    Swal.fire({
      title: "確定刪除此排程？",
      text: "刪除後無法復原",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
    }).then((result) => {
      if (result.isConfirmed) {
        setData((prev) => prev.filter((item) => item.id !== id));
        Swal.fire("已刪除", "", "success");
      }
    });
  };

  const openAddModal = () => {
    MySwal.fire({
      title: "新增排程",
      html: `
        <input type="text" id="name" class="swal2-input" placeholder="排程名稱" />
        <input type="text" id="time" class="swal2-input" placeholder="時段 (例如 08:00 - 12:00)" />
        <input type="text" id="device" class="swal2-input" placeholder="設備名稱" />
      `,
      showCancelButton: true,
      confirmButtonText: "新增",
      cancelButtonText: "取消",
      preConfirm: () => {
        const name = document.getElementById("name").value.trim();
        const time = document.getElementById("time").value.trim();
        const device = document.getElementById("device").value.trim();

        if (!name || !time || !device) {
          Swal.showValidationMessage("請輸入完整資料");
          return false;
        }

        return { name, time, device };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newItem = {
          id: Date.now(),
          ...result.value,
        };
        setData((prev) => [newItem, ...prev]);
        Swal.fire("新增成功", "", "success");
      }
    });
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4 text-primary">門禁排程設定</h3>

      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            placeholder="搜尋排程名稱或設備"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-control"
          />
        </div>
        <div className="col-md-2">
          <button onClick={openAddModal} className="btn btn-success w-100">
            新增排程
          </button>
        </div>
      </div>

      <table className="table table-bordered text-center shadow-sm">
        <thead className="table-info">
          <tr>
            <th>序號</th>
            <th>排程名稱</th>
            <th>時段</th>
            <th>設備</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan="5">查無資料</td>
            </tr>
          ) : (
            pageData.map((item, idx) => (
              <tr key={item.id}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{item.name}</td>
                <td>{item.time}</td>
                <td>{item.device}</td>
                <td>
                  <button
                    onClick={() => deleteSchedule(item.id)}
                    className="btn btn-sm btn-danger"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="d-flex justify-content-center">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一頁
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li
                key={i}
                className={`page-item ${page === i + 1 ? "active" : ""}`}
              >
                <button className="page-link" onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${
                page === totalPages || totalPages === 0 ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                下一頁
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}