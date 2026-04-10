// =============================================================
// FILE: src/components/layouts/Sidebar.jsx
// PURPOSE: Left sidebar nav. Receives onClose prop from App.jsx
//          so tapping a nav link on mobile closes the sidebar.
//          WhatsApp reminder button included for all roles.
// =============================================================

import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const SVG = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ADMIN_NAV = [
  { to: "/admin-dashboard",  label: "Dashboard",  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/admin/batches",    label: "Batches",    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { to: "/admin/coaches",    label: "Coaches",    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "/admin/students",   label: "Students",   icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { to: "/admin/attendance", label: "Attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { to: "/admin/fees",       label: "Fees",       icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { to: "/admin/reports",    label: "Reports",    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

const COACH_NAV = [
  { to: "/coach-dashboard",  label: "Dashboard",  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/coach/attendance", label: "Attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { to: "/coach/fees",       label: "Fees",       icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const NavItem = ({ to, label, icon, onClick }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`}
    onClick={onClick}
  >
    <SVG d={icon} />
    <span>{label}</span>
  </NavLink>
);

// ── WhatsApp Reminder Modal ───────────────────────────────
const WAModal = ({ onClose }) => {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    axios.get(`${BASE}/whatsapp/batches`, { headers: h() })
      .then((r) => setBatches(r.data.batches || []))
      .catch(() => toast.error("Failed to load batches"));
  }, []);

  const send = async () => {
    if (!batchId) { toast.warning("Select a batch first"); return; }
    setSending(true);
    try {
      const res = await axios.post(
        `${BASE}/whatsapp/fee-reminder`,
        { batchId },
        { headers: h() }
      );
      toast.success(res.data.message);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send");
    } finally { setSending(false); }
  };

  return (
    <div className="wa-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wa-modal">
        <div className="wa-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📱</span>
            <h3 className="wa-modal-title">Fee Reminder</h3>
          </div>
          <button className="wa-close" onClick={onClose}>✕</button>
        </div>
        <div className="wa-modal-body">
          <p className="wa-desc">Sends each parent a WhatsApp with last month's attendance + this month's fee.</p>
          <div className="form-group" style={{ marginTop: "0.875rem" }}>
            <label className="form-label">Select batch</label>
            <select className="form-select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              <option value="">Choose batch...</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.batchName}{b.timing ? ` — ${b.timing}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="wa-note">
            💡 Students without a phone number are skipped. In dev mode, messages are logged to console only.
          </div>
        </div>
        <div className="wa-modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn wa-send-btn" onClick={send} disabled={sending || !batchId}>
            {sending ? "Sending..." : "📱 Send Reminders"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Sidebar ──────────────────────────────────────────
const Sidebar = ({ onClose }) => {
  const { user, isAdmin, isCoach, isAdminAndCoach, logout } = useAuth();
  const [waOpen, setWaOpen] = useState(false);

  const handleNav = () => {
    onClose?.();
  };

  return (
    <>
      <div className="sidebar">
        <div className="sb-brand">
          <div className="sb-brand-icon">📋</div>
          <div>
            <div className="sb-brand-name">AttendancePro</div>
            <div className="sb-brand-sub">Management System</div>
          </div>
        </div>

        <div className="sb-scroll">
          {/* Admin nav */}
          {(isAdmin || isAdminAndCoach) && (
            <div className="sb-section">
              <p className="sb-section-label">
                {isAdminAndCoach ? "Owner + Coach" : "Admin"}
              </p>
              {ADMIN_NAV.map((n) => (
                <NavItem key={n.to} {...n} onClick={handleNav} />
              ))}
            </div>
          )}

          {/* Coach-only nav */}
          {isCoach && !isAdminAndCoach && !isAdmin && (
            <div className="sb-section">
              <p className="sb-section-label">Coach</p>
              {COACH_NAV.map((n) => (
                <NavItem key={n.to} {...n} onClick={handleNav} />
              ))}
            </div>
          )}

          {/* WhatsApp reminder */}
          <div className="sb-section">
            <div className="sb-divider" />
            <button className="sb-wa-btn" onClick={() => { setWaOpen(true); handleNav(); }}>
              <span>📱</span>
              <span>Fee Reminder</span>
              <span className="sb-wa-badge">WA</span>
            </button>
          </div>
        </div>

        {/* Bottom user + logout */}
        <div className="sb-bottom">
          <div className="sb-user">
            <div className="sb-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
            <div className="sb-user-info">
              <div className="sb-user-name">{user?.name}</div>
              <div className="sb-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="sb-logout" onClick={logout}>
            <SVG d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={16} />
            <span className="sb-logout-label">Logout</span>
          </button>
        </div>
      </div>

      {waOpen && <WAModal onClose={() => setWaOpen(false)} />}
    </>
  );
};

export default Sidebar;