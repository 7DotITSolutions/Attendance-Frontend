// =============================================================
// FILE: src/components/charts/FeeChart.jsx
// PURPOSE: Donut chart showing fee collection status breakdown:
//          paid, partial, pending counts for a batch/month.
//          Props: paid, partial, pending (numbers).
// =============================================================

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./FeeChart.css";

const COLORS = ["#059669", "#d97706", "#dc2626"];

export const FeeChart = ({ paid = 0, partial = 0, pending = 0, title = "Fee Status" }) => {
  const total = paid + partial + pending;
  const data = [
    { name: "Paid", value: paid },
    { name: "Partial", value: partial },
    { name: "Pending", value: pending },
  ].filter(d => d.value > 0);

  if (total === 0) {
    return (
      <div className="chart-card">
        <p className="chart-title">{title}</p>
        <div className="fee-chart-empty">No fee data for this month</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <p className="chart-title">{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={v => [`${v} students`, ""]} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
      <div className="fee-chart-row">
        <div className="fee-chart-stat" style={{ color: "#059669" }}>
          <span className="fee-stat-val">{paid}</span>
          <span className="fee-stat-label">Paid</span>
        </div>
        <div className="fee-chart-stat" style={{ color: "#d97706" }}>
          <span className="fee-stat-val">{partial}</span>
          <span className="fee-stat-label">Partial</span>
        </div>
        <div className="fee-chart-stat" style={{ color: "#dc2626" }}>
          <span className="fee-stat-val">{pending}</span>
          <span className="fee-stat-label">Pending</span>
        </div>
      </div>
    </div>
  );
};