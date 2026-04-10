// =============================================================
// FILE: src/pages/admin/Dashboard.jsx
// PURPOSE: Admin home page. Shows KPI stat cards, today's
//          attendance overview, monthly fee summary chart,
//          batch list with student counts, and recent activity.
// =============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import StatCard from "../../components/ui/StatCard";
import { FeeChart } from "../../components/charts/FeeChart";
import { MonthlyBar } from "../../components/charts/MonthlyBar";
import Spinner from "../../components/ui/Spinner";
import "./Dashboard.css";

const BASE = import.meta.env.VITE_BASE_URL;
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const Dashboard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toLocaleString("en-IN", { month: "long" }) + " " + new Date().getFullYear();

  useEffect(() => {
    const load = async () => {
      try {
        const [batchRes, studentRes, coachRes, feeRes] = await Promise.all([
          axios.get(`${BASE}/admin/batch`, { headers: headers() }),
          axios.get(`${BASE}/admin/student?status=active`, { headers: headers() }),
          axios.get(`${BASE}/admin/coach`, { headers: headers() }),
          axios.get(`${BASE}/admin/fees/summary?month=${encodeURIComponent(currentMonth)}`, { headers: headers() }),
        ]);
        setData({
          batches:  batchRes.data.batches  || [],
          students: studentRes.data.students || [],
          coaches:  coachRes.data.coaches   || [],
          fee:      feeRes.data.summary     || {},
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner full />;

  const { batches, students, coaches, fee } = data;
  const activeBatches = batches.filter((b) => b.status === "active");

  return (
    <div className="dashboard">
      {/* KPI cards */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Active Students" value={students.length}    />
        <StatCard label="Active Batches"  value={activeBatches.length}  />
        <StatCard label="Coaches"         value={coaches.length}     />
        <StatCard 
  label={`Fee Collected (${currentMonth})`}
  value={`₹${(fee.totalCollected || 0).toLocaleString("en-IN")}`}
/>
      </div>

      {/* Charts row */}
      <div className="dashboard-charts">
        <FeeChart
          paid={fee.paid || 0}
          partial={fee.partial || 0}
          pending={fee.pending || 0}
          title={`Fee Status — ${currentMonth}`}
        />
        <div className="card" style={{ padding: "1.25rem" }}>
          <p className="card-title" style={{ marginBottom: "0.75rem" }}>Outstanding</p>
          <div className="dash-outstanding">
            <div className="dash-amount">₹{(fee.outstanding || 0).toLocaleString("en-IN")}</div>
            <p className="dash-amount-label">pending collection</p>
          </div>
          <div className="dash-fee-row">
            <div><span className="dash-fee-label">Total Due</span><span className="dash-fee-val">₹{(fee.totalDue || 0).toLocaleString("en-IN")}</span></div>
            <div><span className="dash-fee-label">Collected</span><span className="dash-fee-val" style={{ color: "var(--success)" }}>₹{(fee.totalCollected || 0).toLocaleString("en-IN")}</span></div>
          </div>
        </div>
      </div>

      {/* Batch cards */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <h3 className="card-title">All Batches</h3>
          <span className="badge badge-primary">{activeBatches.length} active</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Timing</th>
                  <th>Coach</th>
                  <th>Students</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td><strong>{b.batchName}</strong></td>
                    <td style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>{b.timing || "Not set"}</td>
                    <td style={{ fontSize: "0.82rem" }}>{b.coachName || <span style={{ color: "var(--gray-400)" }}>Unassigned</span>}</td>
                    <td><span className="badge badge-info">{b.studentCount || 0}</span></td>
                    <td><span className={`badge badge-${b.status === "active" ? "success" : "gray"}`}>{b.status}</span></td>
                  </tr>
                ))}
                {!batches.length && (
                  <tr><td colSpan={5} className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">No batches yet</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;