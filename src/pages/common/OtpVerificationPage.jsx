// =============================================================
// FILE: src/pages/common/OtpVerificationPage.jsx
// PURPOSE: Admin email OTP verification after registration.
//          type="admin" from route state determines which
//          verify function to call.
// =============================================================

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./LoginPage.css";

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { verifyAdminEmail, pendingEmail, pendingName } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ otp }) => {
    setLoading(true);
    try {
      const result = await verifyAdminEmail(otp);
      if (result.success) {
        toast.success("Email verified! Welcome.");
        navigate("/admin-dashboard");
      }
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">📧</div>
          <h1 className="auth-title">Verify Email</h1>
          <p className="auth-subtitle">Enter the 6-digit OTP sent to your email</p>
        </div>

        {pendingEmail && (
          <div className="auth-info-box">
            OTP sent to: <span className="auth-info-email">{pendingEmail}</span>
            {pendingName && <><br />Completing registration for: <strong>{pendingName}</strong></>}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label">6-digit OTP</label>
            <input type="text" inputMode="numeric" maxLength={6}
              className={`form-input otp-input ${errors.otp ? "error" : ""}`}
              placeholder="000000"
              {...register("otp", {
                required: "OTP is required",
                minLength: { value: 6, message: "Must be 6 digits" },
                maxLength: { value: 6, message: "Must be 6 digits" },
                pattern: { value: /^[0-9]{6}$/, message: "Numbers only" }
              })} />
            {errors.otp && <p className="form-error">{errors.otp.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: "0.5rem" }}>
            {loading ? "Verifying..." : "Verify & continue →"}
          </button>

          <div className="auth-links" style={{ justifyContent: "center" }}>
            <button type="button" className="auth-link" onClick={() => navigate("/auth")}>Back to login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpVerificationPage;