// =============================================================
// FILE: src/pages/admin/Coaches.jsx
// PURPOSE: Admin coach management. List all coaches with their
//          batch count and status. Create new coach with email
//          and password (credentials emailed to coach).
//          Toggle active/inactive status. Delete coach.
// =============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import "./Coaches.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const Coaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    try {
      const res = await axios.get(`${BASE}/admin/coach`, { headers: h() });
      setCoaches(res.data.coaches || []);
    } catch { toast.error("Failed to load coaches"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createCoach = async (data) => {
    setSaving(true);
    try {
      await axios.post(`${BASE}/admin/coach/create`, data, { headers: h() });
      toast.success("Coach created! Credentials sent to their email.");
      setModal(false);
      reset();
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create coach"); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (coach) => {
    const newStatus = coach.status === "active" ? "inactive" : "active";
    if (!window.confirm(`${newStatus === "inactive" ? "Deactivate" : "Activate"} ${coach.name}?`)) return;
    try {
      await axios.put(`${BASE}/admin/coach/${coach._id}/status`, { status: newStatus }, { headers: h() });
      toast.success(`Coach ${newStatus}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const deleteCoach = async (id, name) => {
    if (!window.confirm(`Delete coach ${name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${BASE}/admin/coach/${id}`, { headers: h() });
      toast.success("Coach deleted");
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Cannot delete"); }
  };

  if (loading) return <Spinner full />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Coaches</h1>
          <p className="page-subtitle">{coaches.length} total coaches</p>
        </div>
        <button className="btn btn-primary" onClick={() => { reset(); setModal(true); }}>+ Add Coach</button>
      </div>

      <div className="coaches-grid">
        {coaches.map((c) => (
          <div key={c._id} className="coach-card">
            <div className="coach-card-top">
              <div className="coach-avatar">{c.name[0].toUpperCase()}</div>
              <div className="coach-info">
                <h3 className="coach-name">{c.name}</h3>
                <p className="coach-email">{c.email}</p>
                <p className="coach-phone">{c.phone}</p>
              </div>
              <Badge status={c.status} />
            </div>

            <div className="coach-stats">
              <div className="coach-stat">
                <span className="coach-stat-val">{c.batchCount || 0}</span>
                <span className="coach-stat-label">Batches</span>
              </div>
              <div className="coach-stat">
                <span className={`coach-verified ${c.isEmailVerified ? "yes" : "no"}`}>
                  {c.isEmailVerified ? "✓ Verified" : "⚠ Not verified"}
                </span>
                <span className="coach-stat-label">Email</span>
              </div>
            </div>

            {c.assignedBatches?.length > 0 && (
              <div className="coach-batches">
                {c.assignedBatches.map((b) => (
                  <span key={b._id} className="coach-batch-tag">{b.batchName}</span>
                ))}
              </div>
            )}

            <div className="coach-actions">
              <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(c)}>
                {c.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteCoach(c._id, c.name)}>Delete</button>
            </div>
          </div>
        ))}
        {!coaches.length && (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-icon">👨‍🏫</div>
            <div className="empty-text">No coaches yet. Add your first coach.</div>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); reset(); }} title="Add New Coach" size="md"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setModal(false); reset(); }}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSubmit(createCoach)}>
            {saving ? "Creating..." : "Create Coach"}
          </button>
        </>}>
        <div className="form-group">
          <label className="form-label">Full name <span className="req">*</span></label>
          <input className={`form-input ${errors.name ? "error" : ""}`} placeholder="Coach full name"
            {...register("name", { required: "Name is required" })} />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Email <span className="req">*</span></label>
          <input type="email" className={`form-input ${errors.email ? "error" : ""}`} placeholder="coach@email.com"
            {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Phone <span className="req">*</span></label>
          <input className={`form-input ${errors.phone ? "error" : ""}`} placeholder="10-digit number"
            {...register("phone", { required: "Phone is required" })} />
          {errors.phone && <p className="form-error">{errors.phone.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Password <span className="req">*</span></label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input type={showPass ? "text" : "password"} style={{ paddingRight: "2.75rem" }}
              className={`form-input ${errors.password ? "error" : ""}`} placeholder="Min 8 characters"
              {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min 8 characters" } })} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position: "absolute", right: "0.65rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password.message}</p>}
          <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.3rem" }}>
            This password will be emailed to the coach. They can change it after first login.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Coaches;