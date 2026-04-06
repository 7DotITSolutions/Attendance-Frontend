// =============================================================
// FILE: src/pages/admin/Reports.jsx
// PURPOSE: Admin reports page. Three tabs: Attendance report,
//          Fee collection report, Defaulters list.
//          Export to Excel using xlsx library.
//          Filter by batch and month. Mobile-friendly table.
// =============================================================

// =============================================================
// FILE: src/pages/admin/Reports.jsx
// =============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import Spinner from "../../components/ui/Spinner";
import "./Reports.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const currentMonth = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;

const Reports = () => {
  const [tab, setTab] = useState("attendance");
  const [batches, setBatches] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [month, setMonth] = useState(currentMonth);

  useEffect(() => {
    axios.get(`${BASE}/admin/batch`, { headers: h() })
      .then((r) => setBatches(r.data.batches || []))
      .catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      let url = "";

      if (tab === "attendance") {
        url = `${BASE}/admin/reports/attendance?month=${encodeURIComponent(month)}${batchId ? `&batchId=${batchId}` : ""}`;
        const res = await axios.get(url, { headers: h() });
        setData(res.data.report || []);
      } 
      else if (tab === "fees") {
        url = `${BASE}/admin/reports/fees?month=${encodeURIComponent(month)}${batchId ? `&batchId=${batchId}` : ""}`;
        const res = await axios.get(url, { headers: h() });
        setData(res.data.report || []);
      } 
      else {
        url = `${BASE}/admin/reports/defaulters?month=${encodeURIComponent(month)}${batchId ? `&batchId=${batchId}` : ""}`;
        const res = await axios.get(url, { headers: h() });
        setData(res.data.defaulters || []);
      }

    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab, batchId, month]);

  const exportExcel = async () => {
    try {
      const res = await axios.get(
        `${BASE}/admin/reports/export?type=${tab === "defaulters" ? "fees" : tab}&month=${encodeURIComponent(month)}${batchId ? `&batchId=${batchId}` : ""}`,
        { headers: h() }
      );

      const rows = res.data.rows || [];
      if (!rows.length) {
        toast.warning("No data to export");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, tab);
      XLSX.writeFile(wb, `${tab}-report-${month.replace(" ", "-")}.xlsx`);

      toast.success("Excel downloaded!");
    } catch {
      toast.error("Export failed");
    }
  };

  const yearOptions = [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">{month}</p>
        </div>
        <button className="btn btn-success" onClick={exportExcel}>
          ⬇ Export Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        {[["attendance","📋 Attendance"],["fees","💰 Fee Collection"],["defaulters","⚠ Defaulters"]].map(([key, label]) => (
          <button key={key} className={`report-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="report-filters">
        <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
          {yearOptions.map((y) =>
            MONTHS.map((m) => (
              <option key={`${m} ${y}`} value={`${m} ${y}`}>
                {m} {y}
              </option>
            ))
          )}
        </select>

        {true && (
          <select className="form-select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.batchName}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? <Spinner full /> : (
        <div className="card">
          <div className="table-wrap">

            {/* Attendance */}
            {tab === "attendance" && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th><th>Batch</th><th>Present</th><th>Absent</th><th>Leave</th><th>Total</th><th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.studentId}>
                      <td>
                        <strong>{r.name}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                          {r.phone}
                        </div>
                      </td>
                      <td><span className="badge badge-info">{r.batchName}</span></td>
                      <td><span className="badge badge-success">{r.present ?? 0}</span></td>
                      <td><span className="badge badge-danger">{r.absent ?? 0}</span></td>
                      <td><span className="badge badge-info">{r.leave ?? 0}</span></td>
                      <td>{r.total ?? 0}</td>
                      <td>
                        <div className="att-pct-bar">
                          <div
                            className="att-pct-fill"
                            style={{
                              width: `${r.percentage ?? 0}%`,
                              background:
                                (r.percentage ?? 0) >= 75
                                  ? "var(--success)"
                                  : (r.percentage ?? 0) >= 50
                                  ? "var(--warning)"
                                  : "var(--danger)"
                            }}
                          />
                          <span className="att-pct-text">
                            {r.percentage ?? 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Fees */}
            {tab === "fees" && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Batch</th><th>Students</th><th>Collected</th><th>Outstanding</th><th>Paid</th><th>Partial</th><th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.batchId}>
                      <td>
                        <strong>{r.batchName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                          {r.timing}
                        </div>
                      </td>
                      <td>{r.students ?? 0}</td>

                      <td style={{ color: "var(--success)", fontWeight: 700 }}>
                        ₹{(r.collected ?? 0).toLocaleString("en-IN")}
                      </td>

                      <td style={{ color: "var(--danger)", fontWeight: 700 }}>
                        ₹{(r.outstanding ?? 0).toLocaleString("en-IN")}
                      </td>

                      <td><span className="badge badge-success">{r.paid ?? 0}</span></td>
                      <td><span className="badge badge-warning">{r.partial ?? 0}</span></td>
                      <td><span className="badge badge-danger">{r.pending ?? 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Defaulters */}
            {tab === "defaulters" && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th><th>Father</th><th>Phone</th><th>Batch</th><th>Due</th><th>Paid</th><th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.studentId}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.fatherName}</td>
                      <td>{r.phone}</td>
                      <td><span className="badge badge-info">{r.batchName}</span></td>

                      <td>₹{(r.monthlyFee ?? 0).toLocaleString("en-IN")}</td>
                      <td>₹{(r.paidAmount ?? 0).toLocaleString("en-IN")}</td>
                      <td>₹{(r.outstanding ?? 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;