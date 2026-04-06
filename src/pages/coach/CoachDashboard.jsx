// =============================================================
// FILE: src/pages/coach/CoachDashboard.jsx
// PURPOSE: Coach home page. Shows assigned batches as cards with
//          today's attendance status (marked or not), student
//          count, and this month's fee summary per batch.
//          Quick links to mark attendance and collect fees.
// =============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import "./CoachDashboard.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE}/coach/dashboard`, { headers: h() })
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner full />;
  if (!data)   return null;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="coach-dashboard">
      {/* Welcome */}
      <div className="coach-welcome">
        <div>
          <h2 className="coach-welcome-name">Hi, {data.coach?.name} 👋</h2>
          <p className="coach-welcome-date">{today}</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="My Batches"   value={data.totalBatches}   icon="📚" color="primary" />
        <StatCard label="My Students"  value={data.totalStudents}  icon="🎓" color="info" />
        <StatCard label="Today's Date" value={new Date().getDate()} icon="📅" color="success"
          subtitle={new Date().toLocaleString("en-IN", { month: "long" })} />
      </div>

      {/* Batch cards */}
      <h3 className="coach-section-title">My Batches</h3>
      <div className="coach-batch-grid">
        {(data.batchStats || []).map((b) => {
          const attendanceDone = b.attendanceMarkedToday === b.totalStudents && b.totalStudents > 0;
          const attendancePct  = b.totalStudents > 0
            ? Math.round((b.attendanceMarkedToday / b.totalStudents) * 100) : 0;

          return (
            <div key={b.batchId} className="coach-batch-card">
              <div className="coach-batch-header">
                <div>
                  <h4 className="coach-batch-name">{b.batchName}</h4>
                  <p className="coach-batch-timing">⏰ {b.timing || "Timing not set"}</p>
                </div>
                <span className={`att-status-pill ${attendanceDone ? "done" : "pending"}`}>
                  {attendanceDone ? "✓ Marked" : "⏳ Pending"}
                </span>
              </div>

              {/* Attendance progress */}
              <div className="coach-att-progress">
                <div className="coach-att-progress-bar">
                  <div className="coach-att-progress-fill" style={{ width: `${attendancePct}%` }} />
                </div>
                <span className="coach-att-progress-text">{b.attendanceMarkedToday}/{b.totalStudents} marked today</span>
              </div>

              {/* Fee summary */}
              <div className="coach-fee-row">
                <div className="coach-fee-item paid"><span className="coach-fee-val">{b.feePaid}</span><span className="coach-fee-label">Paid</span></div>
                <div className="coach-fee-item pending"><span className="coach-fee-val">{b.feePending}</span><span className="coach-fee-label">Pending</span></div>
                <div className="coach-fee-item"><span className="coach-fee-val">{b.totalStudents}</span><span className="coach-fee-label">Total</span></div>
              </div>

              {/* Actions */}
              <div className="coach-batch-actions">
                <button className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/coach/attendance?batchId=${b.batchId}`)}>
                  📋 Mark Attendance
                </button>
                <button className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/coach/fees?batchId=${b.batchId}`)}>
                  💰 Collect Fees
                </button>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/coach/batch/${b.batchId}`)}>
                  👥 Students
                </button>
              </div>
            </div>
          );
        })}
        {!data.batchStats?.length && (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-icon">📚</div>
            <div className="empty-text">No batches assigned yet. Contact your admin.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;