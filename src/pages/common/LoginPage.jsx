// =============================================================
// FILE: src/pages/common/LoginPage.jsx
// =============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { unifiedLogin, isAuthenticated, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // 🔥 Keep this for auto redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "coach") {
        navigate("/coach-dashboard", { replace: true });
      } else {
        navigate("/admin-dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // 🔥 FIXED LOGIN HANDLER
  const onSubmit = async ({ email, password }) => {
    setLoading(true);

    try {
      const result = await unifiedLogin(email, password);

      // Coach first login → OTP flow
      if (result?.requiresEmailVerification) {
        toast.info("OTP sent to your email.");
        navigate("/verify-coach-email");
        return;
      }

      // Normal login success
      if (result?.success) {
        toast.success("Welcome back!");

        // 🔥 IMMEDIATE REDIRECT (fixes infinite loading issue)
        if (result.role === "coach") {
          navigate("/coach-dashboard");
        } else {
          navigate("/admin-dashboard");
        }

        return;
      }

      // Fallback safety
      throw new Error("Login failed");

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      toast.error(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">📋</div>
          <h1 className="auth-title">AttendancePro</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className={`form-input ${errors.email ? "error" : ""}`}
              placeholder="you@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email",
                },
              })}
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>

            <div className="input-with-icon">
              <input
                type={showPass ? "text" : "password"}
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="Your password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Minimum 8 characters",
                  },
                })}
              />

              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? (
              <>
                <span
                  className="spinner"
                  style={{ width: 16, height: 16, borderWidth: 2 }}
                />
                {" "}Signing in...
              </>
            ) : (
              "Sign in →"
            )}
          </button>

          {/* Links */}
          <div className="auth-links">
            <button
              type="button"
              className="auth-link"
              onClick={() => navigate("/register")}
            >
              Create admin account
            </button>

            <button
              type="button"
              className="auth-link"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;