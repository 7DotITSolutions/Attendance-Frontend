// =============================================================
// FILE: src/pages/admin/Batches.jsx
// PURPOSE: Admin batch management. Lists all batches with
//          student count, timing, coach assigned. Create batch
//          modal with TimeInput for start/end time.
//          Edit, archive and delete from the list.
// =============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import TimeInput from "../../components/ui/TimeInput";
import "./Batches.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_SHORT = { monday:"Mon", tuesday:"Tue", wednesday:"Wed", thursday:"Thu", friday:"Fri", saturday:"Sat", sunday:"Sun" };

const Batches = () => {
  const navigate = useNavigate();
  const [batches, setBatches]   = useState([]);
  const [coaches, setCoaches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [selDays, setSelDays]   = useState([]);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm();

  const load = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        axios.get(`${BASE}/admin/batch`, { headers: h() }),
        axios.get(`${BASE}/admin/coach`, { headers: h() }),
      ]);
      setBatches(bRes.data.batches || []);
      setCoaches(cRes.data.coaches || []);
    } catch { toast.error("Failed to load batches"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditBatch(null); setSelDays([]); reset(); setModal(true); };
  const openEdit   = (b) => {
    setEditBatch(b);
    setSelDays(b.weekDays || []);
    reset({ batchName: b.batchName, startTime: b.startTime, endTime: b.endTime, fee: b.fee, coachId: b.coachId?._id || "" });
    setModal(true);
  };

  const toggleDay = (d) => setSelDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = { ...data, weekDays: selDays, fee: Number(data.fee) || 0 };
      if (editBatch) {
        await axios.put(`${BASE}/admin/batch/${editBatch._id}`, payload, { headers: h() });
        toast.success("Batch updated");
      } else {
        await axios.post(`${BASE}/admin/batch/create`, payload, { headers: h() });
        toast.success("Batch created");
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save batch");
    } finally { setSaving(false); }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm("Delete this batch? This cannot be undone.")) return;
    try {
      await axios.delete(`${BASE}/admin/batch/${id}`, { headers: h() });
      toast.success("Batch deleted");
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Cannot delete"); }
  };

  if (loading) return <Spinner full />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">{batches.length} total batches</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Batch</button>
      </div>

      <div className="batches-grid">
        {batches.map((b) => (
          <div key={b._id} className="batch-card">
            <div className="batch-card-header">
              <div>
                <h3 className="batch-name">{b.batchName}</h3>
                <p className="batch-timing">⏰ {b.timing || "Timing not set"}</p>
              </div>
              <Badge status={b.status} />
            </div>

            <div className="batch-days">
              {DAYS.map((d) => (
                <span key={d} className={`day-pill ${(b.weekDays || []).includes(d) ? "active" : ""}`}>
                  {DAY_SHORT[d]}
                </span>
              ))}
            </div>

            <div className="batch-meta">
              <div className="batch-meta-item">
                <span className="batch-meta-label">Coach</span>
                <span className="batch-meta-val">{b.coachName || "Unassigned"}</span>
              </div>
              <div className="batch-meta-item">
                <span className="batch-meta-label">Students</span>
                <span className="batch-meta-val">{b.studentCount || 0}</span>
              </div>
              <div className="batch-meta-item">
                <span className="batch-meta-label">Monthly Fee</span>
                <span className="batch-meta-val">₹{(b.fee || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="batch-actions">
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/batches/${b._id}`)}>View</button>
              <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteBatch(b._id)}>Delete</button>
            </div>
          </div>
        ))}
        {!batches.length && (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-icon">📚</div>
            <div className="empty-text">No batches yet. Create your first batch.</div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editBatch ? "Edit Batch" : "Create New Batch"} size="md"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSubmit(onSubmit)}>
            {saving ? "Saving..." : editBatch ? "Save Changes" : "Create Batch"}
          </button>
        </>}>
        <div className="form-group">
          <label className="form-label">Batch name <span className="req">*</span></label>
          <input className={`form-input ${errors.batchName ? "error" : ""}`} placeholder="e.g. Morning Batch A"
            {...register("batchName", { required: "Batch name is required" })} />
          {errors.batchName && <p className="form-error">{errors.batchName.message}</p>}
        </div>

        <div className="form-row">
          <Controller name="startTime" control={control}
            render={({ field }) => <TimeInput label="Start time" value={field.value} onChange={field.onChange} />} />
          <Controller name="endTime" control={control}
            render={({ field }) => <TimeInput label="End time" value={field.value} onChange={field.onChange} />} />
        </div>

        <div className="form-group">
          <label className="form-label">Monthly fee (₹)</label>
          <input type="number" className="form-input" placeholder="1000" {...register("fee")} />
        </div>

        <div className="form-group">
          <label className="form-label">Week days</label>
          <div className="day-selector">
            {DAYS.map((d) => (
              <button key={d} type="button"
                className={`day-btn ${selDays.includes(d) ? "selected" : ""}`}
                onClick={() => toggleDay(d)}>
                {DAY_SHORT[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Assign coach</label>
          <select className="form-select" {...register("coachId")}>
            <option value="">No coach assigned</option>
            {coaches.filter((c) => c.status === "active").map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Batches;