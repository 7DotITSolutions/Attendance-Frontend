// =============================================================
// FILE: src/pages/common/VerifyCoachEmailPage.jsx
// PURPOSE: Coach first-login email OTP verification.
//          Shown only once — after this coach logs in directly
//          with email and password forever.
// =============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./LoginPage.css";

const VerifyCoachEmailPage = () => {
  const navigate = useNavigate();
  const { verifyCoachFirstLogin, coachPendingEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ otp }) => {
    setLoading(true);
    try {
      const result = await verifyCoachFirstLogin(otp);
      if (result.success) {
        toast.success("Email verified! Welcome to your dashboard.");
        navigate("/coach-dashboard");
      }
    } catch (err) {
      toast.error(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">✅</div>
          <h1 className="auth-title">Verify Email</h1>
          <p className="auth-subtitle">One-time verification for your coach account</p>
        </div>

        <div className="auth-info-box">
          OTP sent to: <span className="auth-info-email">{coachPendingEmail || "your email"}</span>
          <br />After this, you can log in directly with email and password.
        </div>

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
            {loading ? "Verifying..." : "Verify & go to dashboard →"}
          </button>

          <div className="auth-links" style={{ justifyContent: "center" }}>
            <button type="button" className="auth-link" onClick={() => navigate("/auth")}>Back to login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyCoachEmailPage;