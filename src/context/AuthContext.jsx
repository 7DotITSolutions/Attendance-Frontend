// =============================================================
// FILE: src/context/AuthContext.jsx
// PURPOSE: Global auth state for all roles.
// FIX: unifiedLogin reads data.user || data.admin || data.coach
//      so it works regardless of which key backend returns.
//      Session restored cleanly on page refresh.
//      Token expiry checked every 60s.
// =============================================================

import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const BASE = import.meta.env.VITE_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user:              null,
    loading:           true,
    otpSent:           false,
    pendingEmail:      "",
    pendingName:       "",
    coachPendingEmail: "",
  });

  const [previewUrl, setPreviewUrl] = useState("");

  // ── State updater ─────────────────────────────────────────
  const update = (obj) => setAuthState((prev) => ({ ...prev, ...obj }));

  // ── Token helpers ─────────────────────────────────────────
  const isExpired = (token) => {
    try {
      return jwtDecode(token).exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // ── Write auth to state + localStorage ───────────────────
  const setAuthData = (userData, token) => {
    if (!userData || !token) return;

    const user = {
      _id:        userData._id,
      name:       userData.name,
      email:      userData.email,
      role:       userData.role || "user",
      profile:    userData.profile    || null,
      profile_id: userData.profile_id || null,
    };

    setAuthState((prev) => ({ ...prev, user, loading: false }));
    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(user));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  // ── Clear auth completely ─────────────────────────────────
  const clearAuth = async (silent = false) => {
    const token = localStorage.getItem("token");

    if (token && !silent) {
      try {
        await axios.post(
          `${BASE}/admin/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        // Logout API failure is non-critical
      }
    }

    setAuthState({
      user:              null,
      loading:           false,
      otpSent:           false,
      pendingEmail:      "",
      pendingName:       "",
      coachPendingEmail: "",
    });
    setPreviewUrl("");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  };

  // ── Generic authenticated API call ────────────────────────
  const api = async (endpoint, data, method = "post") => {
    try {
      const res = await axios[method](
        `${BASE}${endpoint}`,
        data,
        { headers: { "Content-Type": "application/json" } }
      );
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) {
        await clearAuth(true);
        window.location.href = "/auth";
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    }
  };

  // ── Restore session on app load ───────────────────────────
  useEffect(() => {
    const restoreSession = () => {
      try {
        const token   = localStorage.getItem("token");
        const rawUser = localStorage.getItem("user");

        if (token && rawUser) {
          if (isExpired(token)) {
            // Token expired — clear silently
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            update({ loading: false });
          } else {
            // Valid token — restore session
            const userData = JSON.parse(rawUser);
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            update({ user: userData, loading: false });
          }
        } else {
          update({ loading: false });
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        update({ loading: false });
      }
    };

    restoreSession();
  }, []);

  // ── Token expiry polling (every 60 seconds) ───────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token && isExpired(token)) {
        clearAuth(true).then(() => {
          window.location.href = "/auth";
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Axios 401 interceptor ─────────────────────────────────
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await clearAuth(true);
          window.location.href = "/auth";
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  // ── Admin profile image fetch on load ────────────────────
  useEffect(() => {
    const token   = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (!token || !rawUser) return;

    const user = JSON.parse(rawUser);
    if (user.role === "admin" || user.role === "admin+coach") {
      axios
        .get(`${BASE}/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data?.admin?.profile) {
            setPreviewUrl(res.data.admin.profile);
          }
        })
        .catch(() => {});
    }
  }, []);

  // ────────────────────────────────────────────────────────────
  // AUTH METHODS
  // ────────────────────────────────────────────────────────────

  /**
   * Universal login for admin, admin+coach, and coach.
   *
   * Backend response shapes:
   *   Admin:   { success, token, user: {...}, admin: {...} }
   *   Coach first login: { success, requiresEmailVerification, email }
   *   Coach:   { success, token, user: {...}, coach: {...} }
   *
   * We always read data.user first (generic), then fall back to
   * data.admin / data.coach for backward compatibility.
   */
  const unifiedLogin = async (email, password) => {
    const data = await api("/auth/login", { email, password });

    if (data.requiresEmailVerification) {
      // Coach first login — store email for OTP page
      update({ coachPendingEmail: email });
      return data;
    }

    if (data.success) {
      // Pick user object — try generic key first, then role-specific
      const userData =
        data.user   ||
        data.admin  ||
        data.adminCoach ||
        data.coach;

      if (!userData) {
        throw new Error("Login response missing user data. Please contact support.");
      }

      setAuthData(userData, data.token);
    }

    return data;
  };

  /**
   * Coach first-login OTP verification.
   * After this succeeds, coach can login with email+password forever.
   */
  const verifyCoachFirstLogin = async (otp) => {
    const data = await api("/auth/verify-coach-email", {
      email: authState.coachPendingEmail,
      otp,
    });

    if (data.success) {
      const userData = data.user || data.coach;
      setAuthData(userData, data.token);
      update({ coachPendingEmail: "" });
    }

    return data;
  };

  /** Admin self-registration — sends OTP to email */
  const adminRegister = async (userData) => {
    const data = await api("/admin/register", userData);
    if (data.success) {
      update({
        otpSent:      true,
        pendingEmail: userData.email,
        pendingName:  userData.name,
      });
    }
    return data;
  };

  /** Admin email OTP verify after registration */
  const verifyAdminEmail = async (otp) => {
    const data = await api("/admin/verify-email", {
      email: authState.pendingEmail,
      otp,
    });

    if (data.success) {
      const userData = data.user || data.admin;
      setAuthData(userData, data.token);
      update({ otpSent: false, pendingEmail: "", pendingName: "" });
    }

    return data;
  };

  /** Send password reset OTP */
  const sendPasswordResetOtp = (email) =>
    api("/admin/otp-send-password", { email });

  /** Reset password with OTP */
  const resetPassword = (email, otp, password) =>
    api("/admin/password-reset", { email, otp, password });

  /** Logout with confirmation */
  const logout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await clearAuth(false);
      window.location.href = "/auth";
    }
  };

  // ── Derived role flags ────────────────────────────────────
  const role = authState.user?.role;

  const value = {
    // State
    ...authState,

    // Derived flags
    isAuthenticated: !!authState.user,
    isAdmin:         role === "admin" || role === "admin+coach",
    isCoach:         role === "coach" || role === "admin+coach",
    isAdminAndCoach: role === "admin+coach",

    // Methods
    unifiedLogin,
    verifyCoachFirstLogin,
    adminRegister,
    verifyAdminEmail,
    sendPasswordResetOtp,
    resetPassword,
    logout,

    // Profile image
    previewUrl,
    setPreviewUrl,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};