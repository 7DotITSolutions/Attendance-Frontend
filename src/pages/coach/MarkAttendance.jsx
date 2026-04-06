// =============================================================
// FILE: src/pages/coach/MarkAttendance.jsx
// PURPOSE: Coach marks attendance for their assigned batches.
//          P / A / L circle buttons, bulk mark, sticky save.
// FIX: Now fetches batch list from /coach/dashboard (correct
//      scope) and students from /coach/attendance/batch/:id
//      instead of /admin/batch/:id which doesn't scope by coach.
// =============================================================

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Spinner from "../../components/ui/Spinner";

// Reuse the same attendance CSS from admin page
import "../admin/Attendance.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const MarkAttendance = () => {
  const [searchParams] = useSearchParams();

  const [myBatches, setMyBatches] = useState([]);
  const [students,  setStudents]  = useState([]);
  const [records,   setRecords]   = useState({}); // { studentId: "present"|"absent"|"leave"|null }
  const [batchId,   setBatchId]   = useState(searchParams.get("batchId") || "");
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  // ── Load coach's batches from dashboard endpoint ──────────
  useEffect(() => {
    axios
      .get(`${BASE}/coach/dashboard`, { headers: h() })
      .then((r) => {
        const batches = (r.data.batchStats || []).map((b) => ({
          _id:       b.batchId,
          batchName: b.batchName,
          timing:    b.timing,
        }));
        setMyBatches(batches);
      })
      .catch(() => toast.error("Failed to load your batches"));
  }, []);

  // ── Load students + existing records for selected batch+date
  useEffect(() => {
    if (!batchId) {
      setStudents([]);
      setRecords({});
      return;
    }

    setLoading(true);

    // Use coach-scoped attendance endpoint
    axios
      .get(`${BASE}/coach/attendance/batch/${batchId}?date=${date}`, { headers: h() })
      .then((r) => {
        const recs = r.data.records || [];
        setStudents(recs);

        // Pre-fill already-marked records
        const init = {};
        recs.forEach((s) => {
          init[s.studentId] = s.marked ? s.status : null;
        });
        setRecords(init);
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [batchId, date]);

  // ── Helpers ───────────────────────────────────────────────
  const setStatus = (id, st) =>
    setRecords((prev) => ({ ...prev, [id]: prev[id] === st ? null : st }));

  const markAll = (st) => {
    const all = {};
    students.forEach((s) => { all[s.studentId] = st; });
    setRecords(all);
  };

  // ── Counts ────────────────────────────────────────────────
  const totalPresent = Object.values(records).filter((v) => v === "present").length;
  const totalAbsent  = Object.values(records).filter((v) => v === "absent").length;
  const totalLeave   = Object.values(records).filter((v) => v === "leave").length;
  const totalMarked  = Object.values(records).filter(Boolean).length;

  // ── Save ──────────────────────────────────────────────────
  const save = async () => {
    const toSave = students
      .filter((s) => records[s.studentId])
      .map((s) => ({
        studentId: s.studentId,
        status:    records[s.studentId],
        remark:    "",
      }));

    if (!toSave.length) {
      toast.warning("Mark at least one student before saving");
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${BASE}/coach/attendance/mark`,
        { batchId, date, records: toSave },
        { headers: h() }
      );
      toast.success(`Attendance saved for ${toSave.length} students`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-page">
      {/* Controls */}
      <div className="att-controls">
        <div className="att-controls-row">
          <select
            className="form-select"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
          >
            <option value="">Select your batch</option>
            {myBatches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.batchName} {b.timing ? `— ${b.timing}` : ""}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "auto" }}
          />
        </div>
      </div>

      {/* States */}
      {!batchId ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">Select a batch to mark attendance</div>
        </div>
      ) : loading ? (
        <Spinner full />
      ) : students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <div className="empty-text">No students in this batch</div>
        </div>
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
            <button
              className="btn att-bulk-btn present-btn"
              onClick={() => markAll("present")}
            >
              ✓ All Present
            </button>
            <button
              className="btn att-bulk-btn absent-btn"
              onClick={() => markAll("absent")}
            >
              ✗ All Absent
            </button>
            <button
              className="btn att-bulk-btn reset-btn"
              onClick={() => markAll(null)}
            >
              ↺ Reset
            </button>
          </div>

          {/* Student list — P / A / L circles */}
          <div className="att-student-list">
            {students.map((s, idx) => {
              const status = records[s.studentId];
              return (
                <div
                  key={s.studentId}
                  className={`att-student-card ${status || ""}`}
                >
                  {/* Name + serial */}
                  <div className="att-student-info">
                    <span className="att-serial">{idx + 1}</span>
                    <div>
                      <div className="att-student-name">{s.name}</div>
                      {s.fatherName && (
                        <div className="att-student-sub">S/o {s.fatherName}</div>
                      )}
                    </div>
                  </div>

                  {/* Circle buttons */}
                  <div className="att-circles">
                    <button
                      className={`att-circle present-circle ${status === "present" ? "selected" : ""}`}
                      onClick={() => setStatus(s.studentId, "present")}
                      aria-label="Mark Present"
                    >
                      P
                    </button>
                    <button
                      className={`att-circle absent-circle ${status === "absent" ? "selected" : ""}`}
                      onClick={() => setStatus(s.studentId, "absent")}
                      aria-label="Mark Absent"
                    >
                      A
                    </button>
                    <button
                      className={`att-circle leave-circle ${status === "leave" ? "selected" : ""}`}
                      onClick={() => setStatus(s.studentId, "leave")}
                      aria-label="Mark Leave"
                    >
                      L
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky save bar */}
          <div className="att-save-bar">
            <div className="att-save-info">
              {totalMarked} of {students.length} marked
            </div>
            <button
              className="btn btn-primary btn-lg att-save-btn"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : `Save Attendance (${totalMarked})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MarkAttendance;