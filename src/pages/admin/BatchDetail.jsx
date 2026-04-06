// =============================================================
// FILE: src/pages/admin/BatchDetail.jsx
// PURPOSE: Single batch detail page. Shows batch info, enrolled
//          students list, quick actions to go to attendance/fees
//          for this batch. Enroll new student modal.
// =============================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import "./BatchDetail.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch]       = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    try {
      const res = await axios.get(`${BASE}/admin/batch/${id}`, { headers: h() });
      setBatch(res.data.batch);
      setStudents(res.data.students || []);
    } catch { toast.error("Failed to load batch"); navigate("/admin/batches"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const enroll = async (data) => {
    setSaving(true);
    try {
      await axios.post(`${BASE}/admin/student/create`, { ...data, batchId: id }, { headers: h() });
      toast.success("Student enrolled!");
      setModal(false);
      reset();
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Enrollment failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner full />;
  if (!batch)  return null;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/admin/batches")} style={{ marginBottom: "0.5rem" }}>
            ← Back
          </button>
          <h1 className="page-title">{batch.batchName}</h1>
          <p className="page-subtitle">{batch.timing || "Timing not set"} · {batch.coachName || "No coach"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-outline" onClick={() => navigate(`/admin/attendance?batchId=${id}`)}>📋 Attendance</button>
          <button className="btn btn-outline" onClick={() => navigate(`/admin/fees?batchId=${id}`)}>💰 Fees</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Enroll Student</button>
        </div>
      </div>

      {/* Batch info */}
      <div className="bd-info-grid">
        <div className="card"><div className="card-body bd-info-item"><span className="bd-info-label">Fee</span><span className="bd-info-val">₹{(batch.fee || 0).toLocaleString("en-IN")}/month</span></div></div>
        <div className="card"><div className="card-body bd-info-item"><span className="bd-info-label">Students</span><span className="bd-info-val">{students.length} enrolled</span></div></div>
        <div className="card"><div className="card-body bd-info-item"><span className="bd-info-label">Status</span><Badge status={batch.status} /></div></div>
        <div className="card"><div className="card-body bd-info-item"><span className="bd-info-label">Days</span><span className="bd-info-val bd-days">{(batch.weekDays || []).map((d) => d.slice(0,3)).join(", ") || "Not set"}</span></div></div>
      </div>

      {/* Students table */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <h3 className="card-title">Enrolled Students</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Enroll</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Father</th><th>Phone</th><th>Fee/Month</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td style={{ fontSize: "0.82rem" }}>{s.fatherName}</td>
                  <td style={{ fontSize: "0.82rem" }}>{s.phone}</td>
                  <td>₹{(s.monthlyFee || 0).toLocaleString("en-IN")}</td>
                  <td><Badge status={s.status} /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/students/${s._id}`)}>View →</button></td>
                </tr>
              ))}
              {!students.length && (
                <tr><td colSpan={6} className="empty-state"><div className="empty-icon">🎓</div><div className="empty-text">No students enrolled yet</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Modal */}
      <Modal open={modal} onClose={() => { setModal(false); reset(); }} title="Enroll New Student" size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setModal(false); reset(); }}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSubmit(enroll)}>
            {saving ? "Enrolling..." : "Enroll Student"}
          </button>
        </>}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Student name <span className="req">*</span></label>
            <input className={`form-input ${errors.name ? "error" : ""}`} placeholder="Full name"
              {...register("name", { required: "Required" })} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Father name <span className="req">*</span></label>
            <input className={`form-input ${errors.fatherName ? "error" : ""}`} placeholder="Father's name"
              {...register("fatherName", { required: "Required" })} />
            {errors.fatherName && <p className="form-error">{errors.fatherName.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone <span className="req">*</span></label>
            <input className={`form-input ${errors.phone ? "error" : ""}`} placeholder="10-digit number"
              {...register("phone", { required: "Required" })} />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Monthly fee (₹)</label>
            <input type="number" className="form-input" placeholder={batch.fee || 0} {...register("monthlyFee")} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">School name</label>
            <input className="form-input" placeholder="School" {...register("schoolName")} />
          </div>
          <div className="form-group">
            <label className="form-label">Date of birth</label>
            <input type="date" className="form-input" {...register("DOB")} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-textarea" placeholder="Home address" rows={2} {...register("address")} />
        </div>
      </Modal>
    </div>
  );
};

export default BatchDetail;