// =============================================================
// FILE: src/pages/admin/Attendance.jsx
// PURPOSE: Mark daily attendance for a batch. Shows each student
//          as a card with their name and TWO CIRCLE BUTTONS:
//          green circle = Present, red circle = Absent.
//          Leave option appears on long-press / tap "L" button.
//          Bulk "All Present" button at top. Save all at once.
//          Mobile-first: big tap targets, thumb-friendly layout.
// =============================================================

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Spinner from "../../components/ui/Spinner";
import "./Attendance.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const [batches,   setBatches]  = useState([]);
  const [students,  setStudents] = useState([]);
  const [records,   setRecords]  = useState({}); // { studentId: "present"|"absent"|"leave" }
  const [remarks,   setRemarks]  = useState({}); // { studentId: string }
  const [batchId,   setBatchId]  = useState(searchParams.get("batchId") || "");
  const [date,      setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [loading,   setLoading]  = useState(false);
  const [saving,    setSaving]   = useState(false);
  const [existingFetched, setExistingFetched] = useState(false);

  // Load batches
  useEffect(() => {
    axios.get(`${BASE}/admin/batch`, { headers: h() })
      .then((r) => setBatches(r.data.batches || []))
      .catch(() => toast.error("Failed to load batches"));
  }, []);

  // Load students + existing records when batch or date changes
  useEffect(() => {
    if (!batchId) { setStudents([]); return; }
    setLoading(true);
    setExistingFetched(false);
    Promise.all([
      axios.get(`${BASE}/admin/batch/${batchId}`, { headers: h() }),
      axios.get(`${BASE}/admin/attendance/batch/${batchId}?date=${date}`, { headers: h() }),
    ]).then(([bRes, aRes]) => {
      const studs = bRes.data.students || [];
      setStudents(studs);
      // Pre-fill existing records
      const existingRecords = {};
      const existingRemarks = {};
      (aRes.data.records || []).forEach((r) => {
        if (r.marked) {
          existingRecords[r.studentId] = r.status;
          existingRemarks[r.studentId] = r.remark || "";
        }
      });
      // Default unrecorded to null
      studs.forEach((s) => {
        if (!existingRecords[s._id]) existingRecords[s._id] = null;
        if (!existingRemarks[s._id]) existingRemarks[s._id] = "";
      });
      setRecords(existingRecords);
      setRemarks(existingRemarks);
      setExistingFetched(true);
    }).catch(() => toast.error("Failed to load students"))
    .finally(() => setLoading(false));
  }, [batchId, date]);

  const setStatus = (studentId, status) => {
    setRecords((p) => ({ ...p, [studentId]: p[studentId] === status ? null : status }));
  };

  const markAll = (status) => {
    const all = {};
    students.forEach((s) => { all[s._id] = status; });
    setRecords(all);
  };

  const totalMarked   = Object.values(records).filter(Boolean).length;
  const totalPresent  = Object.values(records).filter((v) => v === "present").length;
  const totalAbsent   = Object.values(records).filter((v) => v === "absent").length;
  const totalLeave    = Object.values(records).filter((v) => v === "leave").length;

  const save = async () => {
    const toSave = students
      .filter((s) => records[s._id])
      .map((s) => ({ studentId: s._id, status: records[s._id], remark: remarks[s._id] || "" }));

    if (!toSave.length) {
      toast.warning("Mark at least one student before saving");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${BASE}/admin/attendance/mark`, { batchId, date, records: toSave }, { headers: h() });
      toast.success(`Attendance saved for ${toSave.length} students`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally { setSaving(false); }
  };

  const selectedBatch = batches.find((b) => b._id === batchId);

  return (
    <div className="attendance-page">
      {/* Controls */}
      <div className="att-controls">
        <div className="att-controls-row">
          <select className="form-select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">Select batch</option>
            {batches.filter((b) => b.status === "active").map((b) => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ width: "auto" }} />
        </div>
        {selectedBatch && (
          <p className="att-batch-info">
            {selectedBatch.timing || ""} · {selectedBatch.coachName || "No coach"}
          </p>
        )}
      </div>

      {!batchId ? (
        <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">Select a batch to mark attendance</div></div>
      ) : loading ? (
        <Spinner full />
      ) : students.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🎓</div><div className="empty-text">No students in this batch</div></div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="att-summary">
            <div className="att-summary-item present">
              <span className="att-summary-count">{totalPresent}</span>
              <span className="att-summary-label">Present</span>
            </div>
            <div className="att-summary-item absent">
              <span className="att-summary-count">{totalAbsent}</span>
              <span className="att-summary-label">Absent</span>
            </div>
            <div className="att-summary-item leave">
              <span className="att-summary-count">{totalLeave}</span>
              <span className="att-summary-label">Leave</span>
            </div>
            <div className="att-summary-item total">
              <span className="att-summary-count">{totalMarked}/{students.length}</span>
              <span className="att-summary-label">Marked</span>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="att-bulk-row">
            <button className="btn att-bulk-btn present-btn" onClick={() => markAll("present")}>
              ✓ All Present
            </button>
            <button className="btn att-bulk-btn absent-btn" onClick={() => markAll("absent")}>
              ✗ All Absent
            </button>
            <button className="btn att-bulk-btn reset-btn" onClick={() => markAll(null)}>
              ↺ Reset
            </button>
          </div>

          {/* Student list — THE MAIN UI */}
          <div className="att-student-list">
            {students.map((s, idx) => {
              const status = records[s._id];
              return (
                <div key={s._id} className={`att-student-card ${status || ""}`}>
                  {/* Serial number + name */}
                  <div className="att-student-info">
                    <span className="att-serial">{idx + 1}</span>
                    <div>
                      <div className="att-student-name">{s.name}</div>
                      <div className="att-student-sub">{s.fatherName && `S/o ${s.fatherName}`}</div>
                    </div>
                  </div>

                  {/* Two circle buttons — Present and Absent */}
                  <div className="att-circles">
                    {/* Present circle */}
                    <button
                      className={`att-circle present-circle ${status === "present" ? "selected" : ""}`}
                      onClick={() => setStatus(s._id, "present")}
                      title="Present"
                      aria-label="Mark Present"
                    >
                      P
                    </button>

                    {/* Absent circle */}
                    <button
                      className={`att-circle absent-circle ${status === "absent" ? "selected" : ""}`}
                      onClick={() => setStatus(s._id, "absent")}
                      title="Absent"
                      aria-label="Mark Absent"
                    >
                      A
                    </button>

                    {/* Leave — smaller, tertiary */}
                    <button
                      className={`att-circle leave-circle ${status === "leave" ? "selected" : ""}`}
                      onClick={() => setStatus(s._id, "leave")}
                      title="Leave"
                      aria-label="Mark Leave"
                    >
                      L
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save button — sticky at bottom on mobile */}
          <div className="att-save-bar">
            <div className="att-save-info">
              {totalMarked} of {students.length} marked
            </div>
            <button className="btn btn-primary btn-lg att-save-btn" onClick={save} disabled={saving}>
              {saving ? "Saving..." : `Save Attendance (${totalMarked})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;