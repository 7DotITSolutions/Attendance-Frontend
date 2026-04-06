// =============================================================
// FILE: src/components/layouts/Navbar.jsx
// PURPOSE: Top navigation bar inside the authenticated layout.
//          Shows current page title, role badge, user name
//          and avatar. Title auto-detected from route path.
// =============================================================

import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const PAGE_TITLES = {
  "/admin-dashboard":  "Dashboard",
  "/admin/batches":    "Batches",
  "/admin/coaches":    "Coaches",
  "/admin/students":   "Students",
  "/admin/attendance": "Attendance",
  "/admin/fees":       "Fees",
  "/admin/reports":    "Reports",
  "/coach-dashboard":  "Coach Dashboard",
  "/coach/attendance": "Mark Attendance",
  "/coach/fees":       "Collect Fees",
};

const Navbar = ({ onToggleSidebar }) => {
  const { user, previewUrl } = useAuth();
  const { pathname } = useLocation();

  const title = Object.entries(PAGE_TITLES).find(
    ([key]) => pathname === key || pathname.startsWith(key + "/")
  )?.[1] || "Attendance Pro";

  const roleLabel =
    user?.role === "admin+coach" ? "Owner & Coach" :
    user?.role === "admin"       ? "Owner" : "Coach";

  return (
    <nav className="navbar">
      <button className="navbar-hamburger" onClick={onToggleSidebar}>&#9776;</button>
      <h1 className="navbar-title">{title}</h1>
      <div className="navbar-right">
        <span className="navbar-role">{roleLabel}</span>
        <span className="navbar-name">{user?.name}</span>
        {previewUrl ? (
          <img src={previewUrl} alt="avatar" className="navbar-avatar-img" />
        ) : (
          <div className="navbar-avatar">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;