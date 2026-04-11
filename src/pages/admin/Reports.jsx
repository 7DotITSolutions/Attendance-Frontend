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

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const currentMonth = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;

const Reports = () => {
  const [tab, setTab] = useState("attendance");
  const [batches, setBatches] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [month, setMonth] = useState(currentMonth);

  const [remindingId, setRemindingId] = useState(null);
  const [remindingAll, setRemindingAll] = useState(false);

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

  const remindStudent = async (studentId, name) => {
    if (!window.confirm(`Send reminder to ${name}?`)) return;

    setRemindingId(studentId);
    try {
      await axios.post(
        `${BASE}/whatsapp/fee-reminder-single`,
        { studentId, month },
        { headers: h() }
      );
      toast.success(`Reminder sent to ${name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const remindAll = async () => {
    if (!window.confirm(`Send reminder to all defaulters for ${month}?`)) return;

    setRemindingAll(true);
    try {
      const res = await axios.post(
        `${BASE}/whatsapp/fee-reminder`,
        { batchId, month },
        { headers: h() }
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminders");
    } finally {
      setRemindingAll(false);
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

      <div className="report-tabs">
        {[["attendance","📋 Attendance"],["fees","💰 Fee Collection"],["defaulters","⚠ Defaulters"]].map(([key, label]) => (
          <button key={key} className={`report-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

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

        <select className="form-select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.batchName}
            </option>
          ))}
        </select>
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
                      <td>{r.present ?? 0}</td>
                      <td>{r.absent ?? 0}</td>
                      <td>{r.leave ?? 0}</td>
                      <td>{r.total ?? 0}</td>
                      <td>{r.percentage ?? 0}%</td>
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
                      <td>{r.batchName}</td>
                      <td>{r.students ?? 0}</td>
                      <td>₹{(r.collected ?? 0).toLocaleString("en-IN")}</td>
                      <td>₹{(r.outstanding ?? 0).toLocaleString("en-IN")}</td>
                      <td>{r.paid ?? 0}</td>
                      <td>{r.partial ?? 0}</td>
                      <td>{r.pending ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Defaulters */}
            {tab === "defaulters" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <h3>Defaulters List</h3>
                  <button
                    className="btn btn-wa"
                    onClick={remindAll}
                    disabled={remindingAll || !data.length}
                  >
                    {remindingAll ? "Sending..." : ` Remind All (${data.length})`}
                  </button>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th><th>Father</th><th>Phone</th><th>Batch</th>
                      <th>Due</th><th>Paid</th><th>Balance</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.studentId}>
                        <td>{r.name}</td>
                        <td>{r.fatherName}</td>
                        <td>{r.phone}</td>
                        <td>{r.batchName}</td>
                        <td>₹{(r.monthlyFee ?? 0).toLocaleString("en-IN")}</td>
                        <td>₹{(r.paidAmount ?? 0).toLocaleString("en-IN")}</td>
                        <td>₹{(r.outstanding ?? 0).toLocaleString("en-IN")}</td>
                        <td>
                          <button
                            className="btn btn-wa btn-sm"
                            onClick={() => remindStudent(r.studentId, r.name)}
                            disabled={remindingId === r.studentId || !r.phone}
                          >
                            {remindingId === r.studentId ? "Sending..." : "📱 Remind"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;