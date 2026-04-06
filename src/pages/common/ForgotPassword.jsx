// =============================================================
// FILE: src/pages/common/ForgotPassword.jsx
// PURPOSE: Two-step forgot password flow for admin.
//          Step 1: Enter email → sends OTP.
//          Step 2: Enter OTP + new password → resets password.
// =============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./LoginPage.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { sendPasswordResetOtp, resetPassword } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onStep1 = async ({ email: e }) => {
    setLoading(true);
    try {
      await sendPasswordResetOtp(e);
      setEmail(e);
      toast.success("OTP sent to your email");
      setStep(2);
      reset();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onStep2 = async ({ otp, password }) => {
    setLoading(true);
    try {
      await resetPassword(email, otp, password);
      toast.success("Password reset! Please login.");
      navigate("/auth");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">🔑</div>
          <h1 className="auth-title">{step === 1 ? "Forgot Password" : "Reset Password"}</h1>
          <p className="auth-subtitle">{step === 1 ? "Enter your email to receive an OTP" : `OTP sent to ${email}`}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit(onStep1)} noValidate>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="you@example.com"
                {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: "0.5rem" }}>
              {loading ? "Sending..." : "Send OTP →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onStep2)} noValidate>
            <div className="form-group">
              <label className="form-label">6-digit OTP</label>
              <input type="text" inputMode="numeric" maxLength={6}
                className={`form-input otp-input ${errors.otp ? "error" : ""}`}
                placeholder="000000"
                {...register("otp", { required: "OTP is required", minLength: { value: 6, message: "6 digits required" }, pattern: { value: /^[0-9]{6}$/, message: "Numbers only" } })} />
              {errors.otp && <p className="form-error">{errors.otp.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <div className="input-with-icon">
                <input type={showPass ? "text" : "password"}
                  className={`form-input ${errors.password ? "error" : ""}`}
                  placeholder="Min 8 characters"
                  {...register("password", { required: "Password is required", minLength: { value: 8, message: "Minimum 8 characters" } })} />
                <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: "0.5rem" }}>
              {loading ? "Resetting..." : "Reset password →"}
            </button>
          </form>
        )}

        <div className="auth-links" style={{ justifyContent: "center", marginTop: "1rem" }}>
          <button type="button" className="auth-link" onClick={() => navigate("/auth")}>Back to login</button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;