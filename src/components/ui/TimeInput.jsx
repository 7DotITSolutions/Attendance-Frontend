// =============================================================
// FILE: src/components/ui/TimeInput.jsx
// PURPOSE: Batch timing input. Admin types hour (1–12 free
//          text), selects minute from :00 :15 :30 :45 dropdown,
//          then selects AM or PM. Outputs a plain string like
//          "9:00 AM". Works with react-hook-form via
//          value + onChange props. Used in batch create/edit.
// =============================================================

import { useState, useEffect } from "react";
import "./TimeInput.css";

const MINUTES = ["00", "15", "30", "45"];

const parseTime = (str) => {
  if (!str) return { hour: "", minute: "00", period: "AM" };
  const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hour: "", minute: "00", period: "AM" };
  return { hour: m[1], minute: m[2], period: m[3].toUpperCase() };
};

const TimeInput = ({
  label,
  value = "",
  onChange,
  error,
  required = false,
  disabled = false,
}) => {
  const parsed = parseTime(value);
  const [hour,   setHour]   = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);
  const [focused, setFocused] = useState(false);

  // Sync if parent resets value
  useEffect(() => {
    const p = parseTime(value);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const emit = (h, m, p) => {
    if (!h) return onChange?.("");
    const n = parseInt(h, 10);
    if (isNaN(n) || n < 1 || n > 12) return;
    onChange?.(`${n}:${m} ${p}`);
  };

  const handleHour = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    setHour(v);
    emit(v, minute, period);
  };

  const handleHourBlur = () => {
    const n = parseInt(hour, 10);
    if (isNaN(n) || n < 1) { setHour("1");  emit("1",  minute, period); }
    else if (n > 12)        { setHour("12"); emit("12", minute, period); }
    setFocused(false);
  };

  return (
    <div className="time-input-wrap">
      {label && (
        <label className="time-input-label">
          {label}
          {required && <span className="time-input-req"> *</span>}
        </label>
      )}

      <div
        className={[
          "time-input-row",
          focused  ? "focused"   : "",
          error    ? "has-error" : "",
          disabled ? "disabled"  : "",
        ].filter(Boolean).join(" ")}
      >
        {/* Hour — free text 1–12 */}
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="9"
          value={hour}
          disabled={disabled}
          className="time-input-hour"
          onChange={handleHour}
          onFocus={() => setFocused(true)}
          onBlur={handleHourBlur}
          aria-label={`${label || "Time"} hour`}
        />

        <span className="time-input-colon">:</span>

        {/* Minute dropdown */}
        <select
          value={minute}
          disabled={disabled}
          className="time-input-minute"
          onChange={(e) => { setMinute(e.target.value); emit(hour, e.target.value, period); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={`${label || "Time"} minute`}
        >
          {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* AM / PM */}
        <select
          value={period}
          disabled={disabled}
          className="time-input-period"
          onChange={(e) => { setPeriod(e.target.value); emit(hour, minute, e.target.value); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="AM or PM"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      {error && <p className="time-input-error">{error}</p>}
    </div>
  );
};

export default TimeInput;