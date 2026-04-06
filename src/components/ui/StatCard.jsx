// =============================================================
// FILE: src/components/ui/StatCard.jsx
// PURPOSE: KPI card used on all dashboards. Shows icon, label,
//          value and optional subtitle. Color variants:
//          primary, success, warning, danger, info.
// =============================================================

const StatCard = ({ label, value, icon, subtitle, color = "primary" }) => {
  const colors = {
    primary: { bg: "#ede9fe", text: "#5b21b6" },
    success: { bg: "#d1fae5", text: "#065f46" },
    warning: { bg: "#fef3c7", text: "#92400e" },
    danger:  { bg: "#fee2e2", text: "#991b1b" },
    info:    { bg: "#dbeafe", text: "#1e40af" },
  };
  const c = colors[color] || colors.primary;

  return (
    <div className="stat-card">
      <div className="stat-card-body">
        <div className="stat-card-left">
          <p className="stat-card-label">{label}</p>
          <p className="stat-card-value">{value ?? "—"}</p>
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
        </div>
        {icon && (
          <div className="stat-card-icon" style={{ background: c.bg, color: c.text }}>
            <span>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;