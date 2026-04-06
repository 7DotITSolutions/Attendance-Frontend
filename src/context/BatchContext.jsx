// =============================================================
// FILE: src/context/BatchContext.jsx
// PURPOSE: Global batch state for admin. Fetches and caches
//          all batches for the logged-in admin. Used by pages
//          that need batch list without re-fetching (dropdowns,
//          filters). Provides refetch() to force reload.
// =============================================================

import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const BatchContext = createContext();
export const useBatch = () => useContext(BatchContext);

const BASE = import.meta.env.VITE_BASE_URL;

export const BatchProvider = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [batches, setBatches]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);

  const fetchBatches = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/admin/batch`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(res.data.batches || []);
      setFetched(true);
    } catch (err) {
      console.error("BatchContext fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin && !fetched) {
      fetchBatches();
    }
    if (!isAuthenticated) {
      setBatches([]);
      setFetched(false);
    }
  }, [isAuthenticated, isAdmin]);

  const activeBatches = batches.filter((b) => b.status === "active");

  return (
    <BatchContext.Provider value={{
      batches,
      activeBatches,
      loading,
      refetch: fetchBatches,
    }}>
      {children}
    </BatchContext.Provider>
  );
};