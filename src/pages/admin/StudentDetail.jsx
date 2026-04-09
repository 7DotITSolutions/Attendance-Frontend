// =============================================================
// FILE: src/pages/admin/StudentDetail.jsx
// PURPOSE: Full student profile with Edit Student functionality.
//          Edit modal updates: name, father, mother, phone,
//          aadhaar, school, address, DOB, monthly fee, status.
//          Both admin and coach can edit their students.
// =============================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import Badge   from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import Modal   from "../../components/ui/Modal";
import AttendanceChart from "../../components/charts/AttendanceChart";
import "./StudentDetail.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const StudentDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [student,   setStudent]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("attendance");
  const [editModal, setEditModal] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const [selMonth, setSelMonth] = useState(() => {
    const d = new Date();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // ── Load student ──────────────────────────────────────
  const load = async () => {
    try {
      const res = await axios.get(`${BASE}/admin/student/${id}`, { headers: h() });
      setStudent(res.data.student);
    } catch {
      toast.error("Student not found");
      navigate("/admin/students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // ── Open edit modal pre-filled ─────────────────────────
  const openEdit = () => {
    reset({
      name:         student.name,
      fatherName:   student.fatherName,
      motherName:   student.motherName   || "",
      phone:        student.phone,
      aadharNumber: student.aadharNumber || "",
      schoolName:   student.schoolName   || "",
      address:      student.address      || "",
      DOB:          student.DOB          || "",
      monthlyFee:   student.monthlyFee   || "",
      status:       student.status,
    });
    setEditModal(true);
  };

  // ── Save edit ─────────────────────────────────────────
  const onSave = async (data) => {
    setSaving(true);
    try {
      await axios.put(
        `${BASE}/admin/student/${id}`,
        data,
        { headers: h() }
      );
      toast.success("Student updated successfully");
      setEditModal(false);
      load(); // refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner full />;
  if (!student) return null;

  // ── Attendance filter for selected month ───────────────
  const [monthName, year] = selMonth.split(" ");
  const monthIndex        = MONTHS.indexOf(monthName);
  const monthAttendance   = (student.attendance || []).filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === monthIndex && d.getFullYear() === parseInt(year);
  });

  const present = monthAttendance.filter((a) => a.status === "present").length;
  const absent  = monthAttendance.filter((a) => a.status === "absent").length;
  const leave   = monthAttendance.filter((a) => a.status === "leave").length;

  const feeHistory = [...(student.fee || [])].reverse();

  const statusColor = { present: "#059669", absent: "#dc2626", leave: "#2563eb" };
  const statusBg    = { present: "#d1fae5", absent: "#fee2e2", leave: "#dbeafe" };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            style={{ marginBottom: "0.5rem" }}>
            ← Back
          </button>
          <h1 className="page-title">{student.name}</h1>
          <p className="page-subtitle">{student.batchName} · {student.phone}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Badge status={student.status} />
          {/* ── EDIT BUTTON ── */}
          <button className="btn btn-primary btn-sm" onClick={openEdit}>
            ✏️ Edit Student
          </button>
        </div>
      </div>

      {/* Profile info grid */}
      <div className="sd-info-grid">
        <div className="card"><div className="card-body">
          <p className="sd-label">Father</p>
          <p className="sd-val">{student.fatherName}</p>
        </div></div>

        <div className="card"><div className="card-body">
          <p className="sd-label">Mother</p>
          <p className="sd-val">{student.motherName || "—"}</p>
        </div></div>

        <div className="card"><div className="card-body">
          <p className="sd-label">Phone</p>
          <p className="sd-val">{student.phone}</p>
        </div></div>

        <div className="card"><div className="card-body">
          <p className="sd-label">Aadhaar</p>
          <p className="sd-val" style={{ fontFamily: "monospace" }}>
            {student.aadharNumber
              ? `XXXX-XXXX-${student.aadharNumber.slice(-4)}`
              : "—"}
          </p>
        </div></div>

        <div className="card"><div className="card-body">
          <p className="sd-label">School</p>
          <p className="sd-val">{student.schoolName || "—"}</p>
        </div></div>

        <div className="card"><div className="card-body">
          <p className="sd-label">Date of Birth</p>
          <p className="sd-val">
            {student.DOB
              ? new Date(student.DOB).toLocaleDateString("en-IN")
              : "—"}
          </p>
        </div></div>

        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-body">
            <p className="sd-label">Address</p>
            <p className="sd-val">{student.address || "—"}</p>
          </div>
        </div>

        <div className="card"><div className="card-body">
          <p className="sd-label">Monthly Fee</p>
          <p className="sd-val">₹{(student.monthlyFee || 0).toLocaleString("en-IN")}</p>
        </div></div>

        <div className="card"><div className="card-body">
          <p className="sd-label">Advance Balance</p>
          <p className="sd-val"
            style={{ color: student.advanceBalance > 0 ? "var(--success)" : "inherit" }}>
            ₹{(student.advanceBalance || 0).toLocaleString("en-IN")}
          </p>
        </div></div>

        <div className="card"><div className="card-body">
          <p className="sd-label">Enrolled</p>
          <p className="sd-val">
            {new Date(student.enrollDate).toLocaleDateString("en-IN")}
          </p>
        </div></div>
      </div>

      {/* Tabs */}
      <div className="sd-tabs">
        <button
          className={`sd-tab ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}>
          📋 Attendance
        </button>
        <button
          className={`sd-tab ${activeTab === "fees" ? "active" : ""}`}
          onClick={() => setActiveTab("fees")}>
          💰 Fees
        </button>
      </div>

      {/* Attendance tab */}
      {activeTab === "attendance" && (
        <div>
          <div className="sd-month-row">
            <select className="form-select" style={{ width: "auto" }}
              value={selMonth} onChange={(e) => setSelMonth(e.target.value)}>
              {MONTHS.map((m) => {
                const yr = new Date().getFullYear();
                return [yr, yr - 1].map((y) => (
                  <option key={`${m} ${y}`} value={`${m} ${y}`}>{m} {y}</option>
                ));
              })}
            </select>
          </div>

          <div className="sd-attendance-layout">
            <AttendanceChart
              present={present} absent={absent} leave={leave}
              title={selMonth} />

            <div className="sd-attendance-list">
              {monthAttendance.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-text">No records for {selMonth}</div>
                </div>
              ) : (
                [...monthAttendance]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((a) => (
                    <div key={a._id} className="sd-att-row">
                      <div className="sd-att-date">
                        {new Date(a.date).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", weekday: "short",
                        })}
                      </div>
                      <span className="sd-att-badge"
                        style={{
                          background: statusBg[a.status],
                          color:      statusColor[a.status],
                        }}>
                        {a.status}
                      </span>
                      {a.remark && (
                        <span className="sd-att-remark">{a.remark}</span>
                      )}
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
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <div className="empty-text">No fee records yet</div>
            </div>
          ) : feeHistory.map((f) => (
            <div key={f._id} className="sd-fee-card">
              <div className="sd-fee-top">
                <div>
                  <h4 className="sd-fee-month">{f.month}</h4>
                  {f.receiptNo && (
                    <p className="sd-fee-receipt">🧾 {f.receiptNo}</p>
                  )}
                </div>
                <Badge status={f.status} />
              </div>
              <div className="sd-fee-amounts">
                <div>
                  <span className="sd-fee-label">Due</span>
                  <span className="sd-fee-val">
                    ₹{(f.monthlyFee || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="sd-fee-label">Paid</span>
                  <span className="sd-fee-val" style={{ color: "var(--success)" }}>
                    ₹{(f.paidAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="sd-fee-label">Balance</span>
                  <span className="sd-fee-val" style={{ color: "var(--danger)" }}>
                    ₹{Math.max(0, (f.monthlyFee || 0) - (f.paidAmount || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
                {f.paymentMethod && (
                  <div>
                    <span className="sd-fee-label">Method</span>
                    <span className="sd-fee-val">{f.paymentMethod}</span>
                  </div>
                )}
              </div>
              {f.remarks && (
                <p className="sd-fee-remark">Note: {f.remarks}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Student Modal ──────────────────────────── */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit — ${student.name}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={saving}
              onClick={handleSubmit(onSave)}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Student name <span className="req">*</span></label>
            <input className={`form-input ${errors.name ? "error" : ""}`}
              {...register("name", { required: "Required" })} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Father name <span className="req">*</span></label>
            <input className={`form-input ${errors.fatherName ? "error" : ""}`}
              {...register("fatherName", { required: "Required" })} />
            {errors.fatherName && <p className="form-error">{errors.fatherName.message}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mother name</label>
            <input className="form-input" {...register("motherName")} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span className="req">*</span></label>
            <input className={`form-input ${errors.phone ? "error" : ""}`}
              {...register("phone", { required: "Required" })} />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Aadhaar number</label>
            <input
              className={`form-input ${errors.aadharNumber ? "error" : ""}`}
              placeholder="12-digit Aadhaar"
              maxLength={12}
              inputMode="numeric"
              {...register("aadharNumber", {
                pattern: {
                  value:   /^\d{12}$/,
                  message: "Must be exactly 12 digits",
                },
              })}
            />
            {errors.aadharNumber && (
              <p className="form-error">{errors.aadharNumber.message}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Date of birth</label>
            <input type="date" className="form-input" {...register("DOB")} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">School name</label>
            <input className="form-input" {...register("schoolName")} />
          </div>
          <div className="form-group">
            <label className="form-label">Monthly fee (₹)</label>
            <input type="number" className="form-input" {...register("monthlyFee")} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="left">Left</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-textarea" rows={2} {...register("address")} />
        </div>
      </Modal>
    </div>
  );
};

export default StudentDetail;