// =============================================================
// FILE: src/pages/admin/StudentDetail.jsx
// PURPOSE: Full student profile. Shows personal info, attendance
//          calendar with monthly summary and attendance chart,
//          complete fee history with status badges.
// =============================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import AttendanceChart from "../../components/charts/AttendanceChart";
import "./StudentDetail.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendance");
  const [selMonth, setSelMonth] = useState(() => {
    const d = new Date();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${BASE}/admin/student/${id}`, { headers: h() });
        setStudent(res.data.student);
      } catch { toast.error("Student not found"); navigate("/admin/students"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <Spinner full />;
  if (!student) return null;

  // Filter attendance for selected month
  const [monthName, year] = selMonth.split(" ");
  const monthIndex = MONTHS.indexOf(monthName);
  const monthAttendance = student.attendance?.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === monthIndex && d.getFullYear() === parseInt(year);
  }) || [];

  const present = monthAttendance.filter((a) => a.status === "present").length;
  const absent  = monthAttendance.filter((a) => a.status === "absent").length;
  const leave   = monthAttendance.filter((a) => a.status === "leave").length;

  // Fee history sorted newest first
  const feeHistory = [...(student.fee || [])].reverse();

  const statusColor = { present: "#059669", absent: "#dc2626", leave: "#2563eb" };
  const statusBg    = { present: "#d1fae5", absent: "#fee2e2", leave: "#dbeafe" };

  return (
    <div>
      {/* Back + header */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: "0.5rem" }}>← Back</button>
          <h1 className="page-title">{student.name}</h1>
          <p className="page-subtitle">{student.batchName} · {student.phone}</p>
        </div>
        <Badge status={student.status} />
      </div>

      {/* Profile info */}
      <div className="sd-info-grid">
        <div className="card"><div className="card-body">
          <p className="sd-label">Father</p><p className="sd-val">{student.fatherName}</p>
        </div></div>
        <div className="card"><div className="card-body">
          <p className="sd-label">Mother</p><p className="sd-val">{student.motherName || "—"}</p>
        </div></div>
        <div className="card"><div className="card-body">
          <p className="sd-label">School</p><p className="sd-val">{student.schoolName || "—"}</p>
        </div></div>
        <div className="card"><div className="card-body">
          <p className="sd-label">Monthly Fee</p>
          <p className="sd-val">₹{(student.monthlyFee || 0).toLocaleString("en-IN")}</p>
        </div></div>
        <div className="card"><div className="card-body">
          <p className="sd-label">Advance Balance</p>
          <p className="sd-val" style={{ color: student.advanceBalance > 0 ? "var(--success)" : "inherit" }}>
            ₹{(student.advanceBalance || 0).toLocaleString("en-IN")}
          </p>
        </div></div>
        <div className="card"><div className="card-body">
          <p className="sd-label">Enrolled</p>
          <p className="sd-val">{new Date(student.enrollDate).toLocaleDateString("en-IN")}</p>
        </div></div>
      </div>

      {/* Tabs */}
      <div className="sd-tabs">
        <button className={`sd-tab ${activeTab === "attendance" ? "active" : ""}`} onClick={() => setActiveTab("attendance")}>
          📋 Attendance
        </button>
        <button className={`sd-tab ${activeTab === "fees" ? "active" : ""}`} onClick={() => setActiveTab("fees")}>
          💰 Fees
        </button>
      </div>

      {/* Attendance tab */}
      {activeTab === "attendance" && (
        <div>
          <div className="sd-month-row">
            <select className="form-select" style={{ width: "auto" }} value={selMonth}
              onChange={(e) => setSelMonth(e.target.value)}>
              {MONTHS.map((m) => {
                const yr = new Date().getFullYear();
                return [yr, yr-1].map((y) => (
                  <option key={`${m} ${y}`} value={`${m} ${y}`}>{m} {y}</option>
                ));
              })}
            </select>
          </div>

          <div className="sd-attendance-layout">
            <AttendanceChart present={present} absent={absent} leave={leave} title={`${selMonth}`} />

            <div className="sd-attendance-list">
              {monthAttendance.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">No records for {selMonth}</div></div>
              ) : (
                monthAttendance.sort((a, b) => new Date(b.date) - new Date(a.date)).map((a) => (
                  <div key={a._id} className="sd-att-row">
                    <div className="sd-att-date">
                      {new Date(a.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "short" })}
                    </div>
                    <span className="sd-att-badge" style={{ background: statusBg[a.status], color: statusColor[a.status] }}>
                      {a.status}
                    </span>
                    {a.remark && <span className="sd-att-remark">{a.remark}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fee tab */}
      {activeTab === "fees" && (
        <div className="sd-fee-list">
          {feeHistory.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-text">No fee records yet</div></div>
          ) : feeHistory.map((f) => (
            <div key={f._id} className="sd-fee-card">
              <div className="sd-fee-top">
                <div>
                  <h4 className="sd-fee-month">{f.month}</h4>
                  {f.receiptNo && <p className="sd-fee-receipt">🧾 {f.receiptNo}</p>}
                </div>
                <Badge status={f.status} />
              </div>
              <div className="sd-fee-amounts">
                <div><span className="sd-fee-label">Due</span><span className="sd-fee-val">₹{(f.monthlyFee || 0).toLocaleString("en-IN")}</span></div>
                <div><span className="sd-fee-label">Paid</span><span className="sd-fee-val" style={{ color: "var(--success)" }}>₹{(f.paidAmount || 0).toLocaleString("en-IN")}</span></div>
                <div><span className="sd-fee-label">Balance</span><span className="sd-fee-val" style={{ color: "var(--danger)" }}>₹{Math.max(0, (f.monthlyFee || 0) - (f.paidAmount || 0)).toLocaleString("en-IN")}</span></div>
                {f.paymentMethod && <div><span className="sd-fee-label">Method</span><span className="sd-fee-val">{f.paymentMethod}</span></div>}
              </div>
              {f.remarks && <p className="sd-fee-remark">Note: {f.remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDetail;