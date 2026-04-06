// =============================================================
// FILE: src/pages/admin/Students.jsx
// PURPOSE: All students across all batches. Search by name,
//          filter by batch and status. Click row to view detail.
//          Mobile-friendly card layout on small screens.
// =============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import "./Students.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (search)      params.append("search", search);
      if (batchFilter) params.append("batchId", batchFilter);
      if (statusFilter) params.append("status", statusFilter);
      const [sRes, bRes] = await Promise.all([
        axios.get(`${BASE}/admin/student?${params}`, { headers: h() }),
        axios.get(`${BASE}/admin/batch`, { headers: h() }),
      ]);
      setStudents(sRes.data.students || []);
      setBatches(bRes.data.batches   || []);
    } catch { toast.error("Failed to load students"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, batchFilter, statusFilter]);

  if (loading) return <Spinner full />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} students found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="students-filters">
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="form-input search-input" placeholder="Search name, phone..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: "auto" }} value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="">All Batches</option>
          {batches.map((b) => <option key={b._id} value={b._id}>{b.batchName}</option>)}
        </select>
        <select className="form-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="left">Left</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="card students-table-wrap">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Student</th><th>Father</th><th>Phone</th><th>Batch</th><th>Fee/Month</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/admin/students/${s._id}`)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <div className="avatar">{s.name[0].toUpperCase()}</div>
                      <strong>{s.name}</strong>
                    </div>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{s.fatherName}</td>
                  <td style={{ fontSize: "0.85rem" }}>{s.phone}</td>
                  <td><span className="badge badge-info">{s.batchName}</span></td>
                  <td>₹{(s.monthlyFee || 0).toLocaleString("en-IN")}</td>
                  <td><Badge status={s.status} /></td>
                  <td><span style={{ color: "var(--primary)", fontSize: "0.82rem" }}>View →</span></td>
                </tr>
              ))}
              {!students.length && (
                <tr><td colSpan={7} className="empty-state">
                  <div className="empty-icon">🎓</div>
                  <div className="empty-text">No students found</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="students-mobile-list">
        {students.map((s) => (
          <div key={s._id} className="student-mobile-card" onClick={() => navigate(`/admin/students/${s._id}`)}>
            <div className="student-mobile-left">
              <div className="avatar">{s.name[0].toUpperCase()}</div>
              <div>
                <div className="student-mobile-name">{s.name}</div>
                <div className="student-mobile-sub">{s.fatherName} · {s.phone}</div>
                <div className="student-mobile-sub">{s.batchName}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
              <Badge status={s.status} />
              <span style={{ fontSize: "0.78rem", color: "var(--gray-500)" }}>₹{(s.monthlyFee || 0).toLocaleString("en-IN")}/mo</span>
            </div>
          </div>
        ))}
        {!students.length && (
          <div className="empty-state"><div className="empty-icon">🎓</div><div className="empty-text">No students found</div></div>
        )}
      </div>
    </div>
  );
};

export default Students;