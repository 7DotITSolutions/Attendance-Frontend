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

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "coach") {
        navigate("/coach-dashboard", { replace: true });
      } else {
        navigate("/admin-dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async ({ email, password }) => {
    setLoading(true);

    try {
      const result = await unifiedLogin(email, password);

      if (result?.requiresEmailVerification) {
        toast.info("OTP sent to your email.");
        navigate("/verify-coach-email");
        return;
      }

      if (result?.success) {
        toast.success("Welcome back!");

        if (result.role === "coach") {
          navigate("/coach-dashboard");
        } else {
          navigate("/admin-dashboard");
        }

        return;
      }

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
          <h1 className="auth-title">Tick</h1>
          <p className="auth-subtitle">Log in to your account</p>
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

            {/* Forgot password BELOW input */}
            <div className="forgot-pass">
              <button
                type="button"
                className="auth-link"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
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
          >
            {loading ? (
              <>
                <span className="spinner" /> Signing in...
              </>
            ) : (
              "Log In →"
            )}
          </button>

          {/* Only Create Account at bottom */}
          <div className="auth-links">
            <button
              type="button"
              className="auth-link"
              onClick={() => navigate("/register")}
            >
              Still nor registered? Create an account →
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;