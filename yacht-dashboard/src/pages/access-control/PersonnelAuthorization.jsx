import { useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function PersonnelAuthorization() {
  const initialData = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    name: `人員 ${i + 1}`,
    cardId: `CARD-${1000 + i}`,
    role: i % 2 === 0 ? "一般員工" : "管理員",
    status: i % 3 === 0 ? "停用" : "啟用",
  }));

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredData = data.filter(
    (item) =>
      item.name.includes(search.trim()) ||
      item.cardId.includes(search.trim()) ||
      item.role.includes(search.trim())
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pageData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const toggleStatus = (id) => {
    const person = data.find((x) => x.id === id);
    Swal.fire({
      title: `切換 ${person.name} 狀態`,
      text: `目前狀態: ${person.status}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "切換",
      cancelButtonText: "取消",
    }).then((result) => {
      if (result.isConfirmed) {
        setData((prev) =>
          prev.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: x.status === "啟用" ? "停用" : "啟用",
                }
              : x
          )
        );
        Swal.fire("狀態已更新", "", "success");
      }
    });
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4 text-primary">人員授權管理</h3>

      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            placeholder="搜尋人員、卡號或角色"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-control"
          />
        </div>
      </div>

      <table className="table table-bordered text-center shadow-sm">
        <thead className="table-info">
          <tr>
            <th>序號</th>
            <th>人員姓名</th>
            <th>卡號</th>
            <th>角色</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan="6">查無資料</td>
            </tr>
          ) : (
            pageData.map((item, idx) => (
              <tr key={item.id}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{item.name}</td>
                <td>{item.cardId}</td>
                <td>{item.role}</td>
                <td>
                  {item.status === "啟用" ? (
                    <span className="badge bg-success">
                      <i className="fas fa-check-circle me-1"></i> 啟用
                    </span>
                  ) : (
                    <span className="badge bg-secondary">
                      <i className="fas fa-ban me-1"></i> 停用
                    </span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className="btn btn-sm btn-primary"
                  >
                    切換狀態
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