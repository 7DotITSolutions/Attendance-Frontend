// =============================================================
// FILE: src/pages/common/RegisterPage.jsx
// PURPOSE: Admin self-registration. Role picker lets user
//          choose Owner or Owner+Coach. Sends OTP to email
//          then redirects to OTP verification page.
// =============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./LoginPage.css";

const ROLES = [
  { value: "admin",       label: "Owner",         icon: "🏢", desc: "Manage coaches, batches & students" },
  { value: "admin+coach", label: "Owner & Coach",  icon: "🏆", desc: "Owner features + coach batches yourself" },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { adminRegister, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("admin");
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated && user) navigate("/admin-dashboard", { replace: true });
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await adminRegister({ ...data, role });
      if (result.success) {
        toast.success("OTP sent to your email!");
        navigate("/verify-otp", { state: { type: "admin" } });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-brand">
          <div className="auth-logo">📋</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Set up your institution account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <span className="auth-section-label">I am a</span>
          <div className="role-grid">
            {ROLES.map((r) => (
              <div key={r.value} className={`role-option ${role === r.value ? "selected" : ""}`}
                onClick={() => setRole(r.value)}>
                {/* <span className="role-option-icon">{r.icon}</span> */}
                <span className="role-option-label">{r.label}</span>
                {/* <span className="role-option-desc">{r.desc}</span> */}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Full name <span className="req">*</span></label>
            <input type="text" className={`form-input ${errors.name ? "error" : ""}`}
              placeholder="Your full name"
              {...register("name", { required: "Name is required", minLength: { value: 2, message: "Min 2 characters" } })} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email address <span className="req">*</span></label>
            <input type="email" className={`form-input ${errors.email ? "error" : ""}`}
              placeholder="you@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
              })} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password <span className="req">*</span></label>
            <div className="input-with-icon">
              <input type={showPass ? "text" : "password"}
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="Min 8 characters"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Minimum 8 characters" }
                })} />
              <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: "0.5rem" }}>
            {loading ? "Creating account..." : "Register & verify email →"}
          </button>

          <div className="auth-links" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <button type="button" className="auth-link" onClick={() => navigate("/auth")}>
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;