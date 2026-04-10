// // =============================================================
// // FILE: src/App.jsx
// // PURPOSE: Root router. All routes defined here with correct
// //          guards. Public routes skip layout. Authenticated
// //          routes wrap content in sidebar + navbar layout.
// //          Add new routes here as the app grows.
// // =============================================================

// import { Routes, Route, Navigate } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";
// import Sidebar from "./components/layouts/Sidebar";
// import Navbar  from "./components/layouts/Navbar";
// import {
//   AdminRoute, CoachRoute, PublicRoute,
// } from "./components/layouts/ProtectedRoute";

// // ── Common pages ──────────────────────────────────────────
// import LoginPage            from "./pages/common/LoginPage";
// import RegisterPage         from "./pages/common/RegisterPage";
// import OtpVerificationPage  from "./pages/common/OtpVerificationPage";
// import VerifyCoachEmailPage from "./pages/common/VerifyCoachEmailPage";
// import ForgotPassword       from "./pages/common/ForgotPassword";

// // ── Admin pages ───────────────────────────────────────────
// import AdminDashboard from "./pages/admin/Dashboard";
// import Batches        from "./pages/admin/Batches";
// import BatchDetail    from "./pages/admin/BatchDetail";
// import Coaches        from "./pages/admin/Coaches";
// import Students       from "./pages/admin/Students";
// import StudentDetail  from "./pages/admin/StudentDetail";
// import Attendance     from "./pages/admin/Attendance";
// import Fees           from "./pages/admin/Fees";
// import Reports        from "./pages/admin/Reports";

// // ── Coach pages ───────────────────────────────────────────
// import CoachDashboard  from "./pages/coach/CoachDashboard";
// import BatchStudents   from "./pages/coach/BatchStudents";
// import MarkAttendance  from "./pages/coach/MarkAttendance";
// import CoachFees       from "./pages/coach/CoachFees";

// // ── Authenticated layout ──────────────────────────────────
// const AppLayout = ({ children }) => (
//   <div className="app-layout">
//     <div className="app-sidebar">
//       <Sidebar />
//     </div>
//     <div className="app-main">
//       <div className="app-navbar">
//         <Navbar />
//       </div>
//       <div className="app-content">
//         {children}
//       </div>
//     </div>
//   </div>
// );

// export default function App() {
//   return (
//     <Routes>
//       {/* ── Public ────────────────────────────────────── */}
//       <Route path="/auth"               element={<PublicRoute><LoginPage /></PublicRoute>} />
//       <Route path="/register"           element={<PublicRoute><RegisterPage /></PublicRoute>} />
//       <Route path="/verify-otp"         element={<OtpVerificationPage />} />
//       <Route path="/verify-coach-email" element={<VerifyCoachEmailPage />} />
//       <Route path="/forgot-password"    element={<ForgotPassword />} />

//       {/* ── Admin ─────────────────────────────────────── */}
//       <Route path="/admin-dashboard" element={
//         <AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>
//       } />
//       <Route path="/admin/batches" element={
//         <AdminRoute><AppLayout><Batches /></AppLayout></AdminRoute>
//       } />
//       <Route path="/admin/batches/:id" element={
//         <AdminRoute><AppLayout><BatchDetail /></AppLayout></AdminRoute>
//       } />
//       <Route path="/admin/coaches" element={
//         <AdminRoute><AppLayout><Coaches /></AppLayout></AdminRoute>
//       } />
//       <Route path="/admin/students" element={
//         <AdminRoute><AppLayout><Students /></AppLayout></AdminRoute>
//       } />
//       <Route path="/admin/students/:id" element={
//         <AdminRoute><AppLayout><StudentDetail /></AppLayout></AdminRoute>
//       } />
//       <Route path="/admin/attendance" element={
//         <AdminRoute><AppLayout><Attendance /></AppLayout></AdminRoute>
//       } />
//       <Route path="/admin/fees" element={
//         <AdminRoute><AppLayout><Fees /></AppLayout></AdminRoute>
//       } />
//       <Route path="/admin/reports" element={
//         <AdminRoute><AppLayout><Reports /></AppLayout></AdminRoute>
//       } />

//       {/* ── Coach ─────────────────────────────────────── */}
//       <Route path="/coach-dashboard" element={
//         <CoachRoute><AppLayout><CoachDashboard /></AppLayout></CoachRoute>
//       } />
//       <Route path="/coach/batch/:batchId" element={
//         <CoachRoute><AppLayout><BatchStudents /></AppLayout></CoachRoute>
//       } />
//       <Route path="/coach/attendance" element={
//         <CoachRoute><AppLayout><MarkAttendance /></AppLayout></CoachRoute>
//       } />
//       <Route path="/coach/fees" element={
//         <CoachRoute><AppLayout><CoachFees /></AppLayout></CoachRoute>
//       } />

//       {/* ── Fallback ──────────────────────────────────── */}
//       <Route path="/"  element={<Navigate to="/auth" replace />} />
//       <Route path="*"  element={<Navigate to="/auth" replace />} />
//     </Routes>
//   );
// }
// =============================================================
// FILE: src/App.jsx
// PURPOSE: Root router. AppLayout manages sidebar open/close
//          state so Navbar hamburger and Sidebar stay in sync.
// =============================================================

import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/layouts/Sidebar";
import Navbar  from "./components/layouts/Navbar";
import { AdminRoute, CoachRoute, PublicRoute } from "./components/layouts/ProtectedRoute";

// ── Common pages ──────────────────────────────────────────
import LoginPage            from "./pages/common/LoginPage";
import RegisterPage         from "./pages/common/RegisterPage";
import OtpVerificationPage  from "./pages/common/OtpVerificationPage";
import VerifyCoachEmailPage from "./pages/common/VerifyCoachEmailPage";
import ForgotPassword       from "./pages/common/ForgotPassword";

// ── Admin pages ───────────────────────────────────────────
import AdminDashboard from "./pages/admin/Dashboard";
import Batches        from "./pages/admin/Batches";
import BatchDetail    from "./pages/admin/BatchDetail";
import Coaches        from "./pages/admin/Coaches";
import Students       from "./pages/admin/Students";
import StudentDetail  from "./pages/admin/StudentDetail";
import Attendance     from "./pages/admin/Attendance";
import Fees           from "./pages/admin/Fees";
import Reports        from "./pages/admin/Reports";

// ── Coach pages ───────────────────────────────────────────
import CoachDashboard from "./pages/coach/CoachDashboard";
import BatchStudents  from "./pages/coach/BatchStudents";
import MarkAttendance from "./pages/coach/MarkAttendance";
import CoachFees      from "./pages/coach/CoachFees";

// ── App layout with sidebar state ─────────────────────────
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when screen becomes large
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const handler = (e) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="app-layout">
      <div className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="app-main">
        <div className="app-navbar">
          <Navbar
            onToggleSidebar={() => setSidebarOpen((p) => !p)}
            sidebarOpen={sidebarOpen}
          />
        </div>
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      {/* ── Public ────────────────────────────────────── */}
      <Route path="/auth"               element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"           element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-otp"         element={<OtpVerificationPage />} />
      <Route path="/verify-coach-email" element={<VerifyCoachEmailPage />} />
      <Route path="/forgot-password"    element={<ForgotPassword />} />

      {/* ── Admin ─────────────────────────────────────── */}
      <Route path="/admin-dashboard"    element={<AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>} />
      <Route path="/admin/batches"      element={<AdminRoute><AppLayout><Batches /></AppLayout></AdminRoute>} />
      <Route path="/admin/batches/:id"  element={<AdminRoute><AppLayout><BatchDetail /></AppLayout></AdminRoute>} />
      <Route path="/admin/coaches"      element={<AdminRoute><AppLayout><Coaches /></AppLayout></AdminRoute>} />
      <Route path="/admin/students"     element={<AdminRoute><AppLayout><Students /></AppLayout></AdminRoute>} />
      <Route path="/admin/students/:id" element={<AdminRoute><AppLayout><StudentDetail /></AppLayout></AdminRoute>} />
      <Route path="/admin/attendance"   element={<AdminRoute><AppLayout><Attendance /></AppLayout></AdminRoute>} />
      <Route path="/admin/fees"         element={<AdminRoute><AppLayout><Fees /></AppLayout></AdminRoute>} />
      <Route path="/admin/reports"      element={<AdminRoute><AppLayout><Reports /></AppLayout></AdminRoute>} />

      {/* ── Coach ─────────────────────────────────────── */}
      <Route path="/coach-dashboard"       element={<CoachRoute><AppLayout><CoachDashboard /></AppLayout></CoachRoute>} />
      <Route path="/coach/batch/:batchId"  element={<CoachRoute><AppLayout><BatchStudents /></AppLayout></CoachRoute>} />
      <Route path="/coach/attendance"      element={<CoachRoute><AppLayout><MarkAttendance /></AppLayout></CoachRoute>} />
      <Route path="/coach/fees"            element={<CoachRoute><AppLayout><CoachFees /></AppLayout></CoachRoute>} />

      {/* ── Fallback ──────────────────────────────────── */}
      <Route path="/"  element={<Navigate to="/auth" replace />} />
      <Route path="*"  element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}