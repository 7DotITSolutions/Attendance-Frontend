// =============================================================
// FILE: src/pages/common/RegisterPage.jsx
// PURPOSE: Mirrors the React Native RegisterScreen exactly —
//          indigo primary, card with shadow, role dropdown with
//          tooltip, password strength bar, eye toggles.
// =============================================================

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { HiOutlineOfficeBuilding, HiOutlineAcademicCap } from "react-icons/hi";
import "./RegisterPage.css";

const ROLES = [
  {
    value: "admin",
    label: "Owner",
    sub: "Manage coaches & students",
    Icon: HiOutlineOfficeBuilding,
    info: [
      "Create and manage batches",
      "Add coaches and assign them to batches",
      "Enroll and track students",
      "View attendance and fee reports",
    ],
  },
  {
    value: "admin+coach",
    label: "Owner + Coach",
    sub: "Admin rights + teach batches yourself",
    Icon: HiOutlineAcademicCap,
    info: [
      "Everything included in Owner role",
      "Get assigned to & teach batches directly",
      "Track your own student attendance",
      "Mark progress and add session notes",
    ],
  },
];


const RegisterPage = () => {
  const navigate = useNavigate();
  const { adminRegister, isAuthenticated, user } = useAuth();

  const [loading,  setLoading]  = useState(false);
  const [role,     setRole]     = useState(null);
  const [ddOpen,   setDdOpen]   = useState(false);
  const [tipOpen,  setTipOpen]  = useState(null);
  const [showP,    setShowP]    = useState(false);
  const [showC,    setShowC]    = useState(false);
  const [roleErr,  setRoleErr]  = useState("");

  const ddRef = useRef(null);
  

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordValue = watch("password", "");

 

  useEffect(() => {
    if (isAuthenticated && user) navigate("/admin-dashboard", { replace: true });
  }, [isAuthenticated, user, navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) {
        setDdOpen(false);
        setTipOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectRole = (value) => {
    setRole(value);
    setDdOpen(false);
    setTipOpen(null);
    setRoleErr("");
  };

  const onSubmit = async (data) => {
    if (!role) { setRoleErr("Please select your role"); return; }
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

  const selectedRole = ROLES.find((r) => r.value === role);

  return (
    <div className="rp-page">
      <div className="rp-scroll">

        {/* ── Header ── */}
        <div className="rp-header">
          <img src="/logo.png" alt="Logo" className="rp-logo" />
          <h1 className="rp-title">Create account</h1>
          <p className="rp-subtitle">Set up your institution....</p>
        </div>

        {/* ── Card ── */}
        <div className="rp-card">

          {/* Full name */}
          <div className="rp-field">
            <label className="rp-label">Full name <span className="rp-req">*</span></label>
            <input
              type="text"
              placeholder="Your full name"
              className={`rp-input${errors.name ? " rp-input--error" : ""}`}
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "Min 2 characters" },
              })}
            />
            {errors.name && <p className="rp-err">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="rp-field">
            <label className="rp-label">Email address <span className="rp-req">*</span></label>
            <input
              type="email"
              placeholder="you@example.com"
              className={`rp-input${errors.email ? " rp-input--error" : ""}`}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
              })}
            />
            {errors.email && <p className="rp-err">{errors.email.message}</p>}
          </div>

          {/* ── Role dropdown ── */}
          <div className="rp-field rp-dd-wrap" ref={ddRef}>
            <label className="rp-label">Who are you? <span className="rp-req">*</span></label>

            <button
              type="button"
              className={`rp-trigger${ddOpen ? " rp-trigger--open" : ""}${roleErr ? " rp-trigger--error" : ""}`}
              onClick={() => { setDdOpen((v) => !v); setTipOpen(null); }}
            >
              <span className={selectedRole ? "rp-trigger-text" : "rp-trigger-placeholder"}>
                {selectedRole ? selectedRole.label : "Select your role"}
              </span>
              {ddOpen ? <FiChevronUp size={18} className="rp-chevron" /> : <FiChevronDown size={18} className="rp-chevron" />}
            </button>

            {roleErr && <p className="rp-err">{roleErr}</p>}

            {ddOpen && (
              <div className="rp-dd-panel">
                {ROLES.map((r, i) => {
                  const tipVisible = tipOpen === r.value;
                  const isSelected = role === r.value;
                  return (
                    <div key={r.value}>
                      {i > 0 && <div className="rp-dd-sep" />}

                      <div
                        className={`rp-option${isSelected ? " rp-option--active" : ""}`}
                        onClick={() => selectRole(r.value)}
                      >
                        <div className={`rp-opt-icon${isSelected ? " rp-opt-icon--active" : ""}`}>
                          <r.Icon size={17} color={isSelected ? "#fff" : "#9ca3af"} />
                        </div>
                        <div className="rp-opt-body">
                          <span className={`rp-opt-title${isSelected ? " rp-opt-title--active" : ""}`}>
                            {r.label}
                          </span>
                          <span className="rp-opt-sub">{r.sub}</span>
                        </div>
                        <button
                          type="button"
                          className={`rp-info-btn${tipVisible ? " rp-info-btn--active" : ""}`}
                          onClick={(e) => { e.stopPropagation(); setTipOpen(tipVisible ? null : r.value); }}
                          aria-label="More info"
                        >
                          <span className={`rp-info-i${tipVisible ? " rp-info-i--active" : ""}`}>i</span>
                        </button>
                      </div>

                      {tipVisible && (
                        <div className="rp-tooltip">
                          <p className="rp-tt-title">{r.label} includes</p>
                          {r.info.map((line, j) => (
                            <div key={j} className="rp-tt-row">
                              <div className="rp-tt-dot" />
                              <span className="rp-tt-text">{line}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Password ── */}
          <div className="rp-field">
            <label className="rp-label">Password <span className="rp-req">*</span></label>
            <div className="rp-pw-wrap">
              <input
                type={showP ? "text" : "password"}
                placeholder="Min 8 characters"
                className={`rp-input${errors.password ? " rp-input--error" : ""}`}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Minimum 8 characters" },
                })}
              />
              <button type="button" className="rp-eye" onClick={() => setShowP((v) => !v)} aria-label="Toggle password">
                {showP ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {errors.password && <p className="rp-err">{errors.password.message}</p>}
          </div>

          {/* ── Confirm password ── */}
          <div className="rp-field">
            <label className="rp-label">Confirm password <span className="rp-req">*</span></label>
            <div className="rp-pw-wrap">
              <input
                type={showC ? "text" : "password"}
                placeholder="Re-enter password"
                className={`rp-input${errors.confirm ? " rp-input--error" : ""}`}
                {...register("confirm", {
                  required: "Please confirm your password",
                  validate: (v) => v === passwordValue || "Passwords don't match",
                })}
              />
              <button type="button" className="rp-eye" onClick={() => setShowC((v) => !v)} aria-label="Toggle confirm password">
                {showC ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {errors.confirm && <p className="rp-err">{errors.confirm.message}</p>}
          </div>

          <button
            type="button"
            className="rp-submit"
            disabled={loading}
            onClick={handleSubmit(onSubmit)}
          >
            {loading ? <span className="rp-spinner" /> : "Create account"}
          </button>

        </div>

        {/* ── Sign in link ── */}
        <div className="rp-footer">
          <span className="rp-footer-text">Already have an account? </span>
          <button type="button" className="rp-signin-link" onClick={() => navigate("/auth")}>
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;