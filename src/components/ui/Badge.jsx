// =============================================================
// FILE: src/components/ui/Badge.jsx
// PURPOSE: Status pill badge. Auto-maps common statuses to
//          correct color variant. Pass status prop and it
//          picks the right color automatically.
//          Variants: paid, partial, pending, active, inactive,
//          present, absent, leave, suspended, left, archived.
// =============================================================

import "./Badge.css";

const Badge = ({ status, children }) => {
  const label = children || status;
  const map = {
    paid:      "badge-success",
    active:    "badge-success",
    present:   "badge-success",
    partial:   "badge-warning",
    pending:   "badge-warning",
    leave:     "badge-info",
    inactive:  "badge-gray",
    absent:    "badge-danger",
    suspended: "badge-danger",
    left:      "badge-gray",
    archived:  "badge-gray",
  };
  const cls = map[status?.toLowerCase()] || "badge-gray";
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default Badge;