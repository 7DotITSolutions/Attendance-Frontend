// =============================================================
// FILE: src/pages/admin/Batches.jsx
// PURPOSE: Admin batch management.
// CHANGE: Added "Enroll" button directly on each batch card.
//         Opens an enroll modal without needing to go to BatchDetail.
//         View, Edit, Enroll, Delete all available from the list.
// =============================================================

import { useState, useEffect } from "react";
import { useNavigate }  from "react-router-dom";
import axios  from "axios";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Modal     from "../../components/ui/Modal";
import Badge     from "../../components/ui/Badge";
import Spinner   from "../../components/ui/Spinner";
import TimeInput from "../../components/ui/TimeInput";
import "./Batches.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const DAYS  = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const SHORT = { monday:"Mon", tuesday:"Tue", wednesday:"Wed", thursday:"Thu", friday:"Fri", saturday:"Sat", sunday:"Sun" };

const Batches = () => {
  const navigate = useNavigate();

  const [batches,     setBatches]     = useState([]);
  const [coaches,     setCoaches]     = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Batch create/edit modal
  const [batchModal,  setBatchModal]  = useState(false);
  const [editBatch,   setEditBatch]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [selDays,     setSelDays]     = useState([]);
  const [startTime,   setStartTime]   = useState("");
  const [endTime,     setEndTime]     = useState("");

  // Enroll modal
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollBatch, setEnrollBatch] = useState(null);
  const [enrollSaving,setEnrollSaving]= useState(false);

  const batchForm  = useForm();
  const enrollForm = useForm();

  const load = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        axios.get(`${BASE}/admin/batch`, { headers: h() }),
        axios.get(`${BASE}/admin/coach`,  { headers: h() }),
      ]);
      setBatches(bRes.data.batches || []);
      setCoaches(cRes.data.coaches || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Batch modal ───────────────────────────────────────
  const openCreate = () => {
    setEditBatch(null);
    setSelDays([]);
    setStartTime("");
    setEndTime("");
    batchForm.reset({ batchName: "", fee: "", coachId: "" });
    setBatchModal(true);
  };

  const openEdit = (b) => {
    setEditBatch(b);
    setSelDays(b.weekDays || []);
    setStartTime(b.startTime || "");
    setEndTime(b.endTime   || "");
    batchForm.reset({
      batchName: b.batchName,
      fee:       b.fee       || "",
      coachId:   b.coachId?._id || b.coachId || "",
    });
    setBatchModal(true);
  };

  const toggleDay = (d) =>
    setSelDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);

  const saveBatch = async (data) => {
    setSaving(true);
    try {
      const payload = {
        batchName: data.batchName,
        fee:       Number(data.fee) || 0,
        coachId:   data.coachId || null,
        weekDays:  selDays,
        startTime,
        endTime,
      };
      if (editBatch) {
        await axios.put(`${BASE}/admin/batch/${editBatch._id}`, payload, { headers: h() });
        toast.success("Batch updated");
      } else {
        await axios.post(`${BASE}/admin/batch/create`, payload, { headers: h() });
        toast.success("Batch created");
      }
      setBatchModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save batch");
    } finally { setSaving(false); }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm("Delete this batch? Students must be removed first.")) return;
    try {
      await axios.delete(`${BASE}/admin/batch/${id}`, { headers: h() });
      toast.success("Batch deleted");
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Cannot delete"); }
  };

  // ── Enroll modal ──────────────────────────────────────
  const openEnroll = (batch) => {
    setEnrollBatch(batch);
    enrollForm.reset({
      name: "", fatherName: "", phone: "", aadharNumber: "",
      motherName: "", schoolName: "", address: "", DOB: "", monthlyFee: "",
    });
    setEnrollModal(true);
  };

  const enrollStudent = async (data) => {
    setEnrollSaving(true);
    try {
      const finalData = {
  ...data,
  monthlyFee: data.monthlyFee
    ? Number(data.monthlyFee)
    : enrollBatch.fee,
};

const res = await axios.post(
  `${BASE}/admin/student/create`,
  { ...finalData, batchId: enrollBatch._id },
  { headers: h() }
);
      toast.success("Student enrolled successfully!");
      if (res.data.info) toast.info(res.data.info, { autoClose: 5000 });
      setEnrollModal(false);
      load(); // refresh to update student count
    } catch (err) {
      toast.error(err.response?.data?.message || "Enrollment failed");
    } finally { setEnrollSaving(false); }
  };

  if (loading) return <Spinner full />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">{batches.length} total</p>
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
                <span key={d}
                  className={`day-pill ${(b.weekDays || []).includes(d) ? "active" : ""}`}>
                  {SHORT[d]}
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
                <span className="batch-meta-label">Fee/Month</span>
                <span className="batch-meta-val">
                  ₹{(b.fee || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* ── Four action buttons ── */}
            <div className="batch-actions">
              <button className="btn btn-outline btn-sm"
                onClick={() => navigate(`/admin/batches/${b._id}`)}>
                View
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}>
                Edit
              </button>
              {/* NEW: Enroll button */}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => openEnroll(b)}
                disabled={b.status !== "active"}
                title={b.status !== "active" ? "Batch is not active" : "Enroll a student"}
              >
                + Enroll
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteBatch(b._id)}>
                Delete
              </button>
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

      {/* ── Create / Edit Batch Modal ──────────────────── */}
      <Modal
        open={batchModal}
        onClose={() => setBatchModal(false)}
        title={editBatch ? "Edit Batch" : "Create New Batch"}
        size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setBatchModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={saving}
              onClick={batchForm.handleSubmit(saveBatch)}>
              {saving ? "Saving..." : editBatch ? "Save Changes" : "Create Batch"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Batch name <span className="req">*</span></label>
          <input
            className={`form-input ${batchForm.formState.errors.batchName ? "error" : ""}`}
            placeholder="e.g. Morning Batch A"
            {...batchForm.register("batchName", { required: "Batch name is required" })}
          />
          {batchForm.formState.errors.batchName && (
            <p className="form-error">{batchForm.formState.errors.batchName.message}</p>
          )}
        </div>

        <div className="form-row" style={{ marginBottom: "1rem" }}>
          <TimeInput label="Start time" value={startTime} onChange={setStartTime} />
          <TimeInput label="End time"   value={endTime}   onChange={setEndTime} />
        </div>

        <div className="form-group">
          <label className="form-label">Monthly fee (₹)</label>
          <input type="number" className="form-input" placeholder="1000"
            {...batchForm.register("fee")} />
        </div>

        <div className="form-group">
          <label className="form-label">Week days</label>
          <div className="day-selector">
            {DAYS.map((d) => (
              <button key={d} type="button"
                className={`day-btn ${selDays.includes(d) ? "selected" : ""}`}
                onClick={() => toggleDay(d)}>
                {SHORT[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Assign coach</label>
          <select className="form-select" {...batchForm.register("coachId")}>
            <option value="">No coach assigned</option>
            {coaches.filter((c) => c.status === "active").map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* ── Enroll Student Modal ───────────────────────── */}
      <Modal
        open={enrollModal}
        onClose={() => setEnrollModal(false)}
        title={`Enroll Student — ${enrollBatch?.batchName}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEnrollModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={enrollSaving}
              onClick={enrollForm.handleSubmit(enrollStudent)}>
              {enrollSaving ? "Enrolling..." : "Enroll Student"}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Student name <span className="req">*</span></label>
            <input
              className={`form-input ${enrollForm.formState.errors.name ? "error" : ""}`}
              placeholder="Full name"
              {...enrollForm.register("name", { required: "Required" })}
            />
            {enrollForm.formState.errors.name && (
              <p className="form-error">{enrollForm.formState.errors.name.message}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Father name <span className="req">*</span></label>
            <input
              className={`form-input ${enrollForm.formState.errors.fatherName ? "error" : ""}`}
              placeholder="Father's name"
              {...enrollForm.register("fatherName", { required: "Required" })}
            />
            {enrollForm.formState.errors.fatherName && (
              <p className="form-error">{enrollForm.formState.errors.fatherName.message}</p>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone <span className="req">*</span></label>
            <input
              className={`form-input ${enrollForm.formState.errors.phone ? "error" : ""}`}
              placeholder="10-digit number"
              {...enrollForm.register("phone", { required: "Required" })}
            />
            {enrollForm.formState.errors.phone && (
              <p className="form-error">{enrollForm.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">
              Aadhaar number <span className="req">*</span>
            </label>
            <input
              className={`form-input ${enrollForm.formState.errors.aadharNumber ? "error" : ""}`}
              placeholder="12-digit Aadhaar"
              maxLength={12}
              inputMode="numeric"
              {...enrollForm.register("aadharNumber", {
                required: "Aadhaar is required",
                pattern: { value: /^\d{12}$/, message: "Must be 12 digits" },
              })}
            />
            {enrollForm.formState.errors.aadharNumber && (
              <p className="form-error">{enrollForm.formState.errors.aadharNumber.message}</p>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monthly fee (₹)</label>
            <input type="number" className="form-input"
              placeholder={`Default: ₹${enrollBatch?.fee}`}
              {...enrollForm.register("monthlyFee")} />
          </div>
          <div className="form-group">
            <label className="form-label">Date of birth</label>
            <input type="date" className="form-input"
              {...enrollForm.register("DOB")} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mother name</label>
            <input className="form-input" placeholder="Optional"
              {...enrollForm.register("motherName")} />
          </div>
          <div className="form-group">
            <label className="form-label">School name</label>
            <input className="form-input" placeholder="Optional"
              {...enrollForm.register("schoolName")} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-textarea" rows={2} placeholder="Optional"
            {...enrollForm.register("address")} />
        </div>
      </Modal>
    </div>
  );
};

export default Batches;