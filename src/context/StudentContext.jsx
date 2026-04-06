// =============================================================
// FILE: src/context/StudentContext.jsx
// PURPOSE: Lightweight student context. Provides a shared
//          fetch helper so multiple pages can load students
//          for a given batch without prop drilling.
//          Each page manages its own local state; this context
//          provides the axios helper and common filters.
// =============================================================

import { createContext, useContext } from "react";
import axios from "axios";

const StudentContext = createContext();
export const useStudent = () => useContext(StudentContext);

const BASE = import.meta.env.VITE_BASE_URL;
const h = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export const StudentProvider = ({ children }) => {

  // Fetch students for a batch (used by multiple pages)
  const fetchStudents = async (batchId, status = "active") => {
    try {
      const params = new URLSearchParams();
      if (batchId) params.append("batchId", batchId);
      if (status)  params.append("status",  status);
      const res = await axios.get(`${BASE}/admin/student?${params}`, { headers: h() });
      return res.data.students || [];
    } catch (err) {
      console.error("StudentContext fetchStudents error:", err.message);
      return [];
    }
  };

  // Fetch single student by ID
  const fetchStudent = async (studentId) => {
    try {
      const res = await axios.get(`${BASE}/admin/student/${studentId}`, { headers: h() });
      return res.data.student || null;
    } catch (err) {
      console.error("StudentContext fetchStudent error:", err.message);
      return null;
    }
  };

  return (
    <StudentContext.Provider value={{ fetchStudents, fetchStudent }}>
      {children}
    </StudentContext.Provider>
  );
};