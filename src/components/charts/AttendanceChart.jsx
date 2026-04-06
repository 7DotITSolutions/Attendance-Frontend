// =============================================================
// FILE: src/components/charts/AttendanceChart.jsx
// PURPOSE: Donut chart showing present / absent / leave
//          breakdown for a student or batch. Uses Recharts.
//          Props: present, absent, leave (numbers).
// =============================================================

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./AttendanceChart.css";

const COLORS = ["#059669", "#dc2626", "#2563eb"];

const AttendanceChart = ({ present = 0, absent = 0, leave = 0, title = "Attendance" }) => {
  const total = present + absent + leave;
  const data = [
    { name: "Present", value: present },
    { name: "Absent",  value: absent  },
    { name: "Leave",   value: leave   },
  ].filter((d) => d.value > 0);

  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  if (total === 0) {
    return (
      <div className="chart-card">
        <p className="chart-title">{title}</p>
        <div className="chart-empty">No attendance data yet</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <p className="chart-title">{title}</p>
      <div className="chart-center-stat">
        <span className="chart-percent">{percentage}%</span>
        <span className="chart-percent-label">attendance</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`${v} days`, ""]} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-stats-row">
        <div className="chart-stat" style={{ color: "#059669" }}>
          <span className="chart-stat-val">{present}</span>
          <span className="chart-stat-label">Present</span>
        </div>
        <div className="chart-stat" style={{ color: "#dc2626" }}>
          <span className="chart-stat-val">{absent}</span>
          <span className="chart-stat-label">Absent</span>
        </div>
        <div className="chart-stat" style={{ color: "#2563eb" }}>
          <span className="chart-stat-val">{leave}</span>
          <span className="chart-stat-label">Leave</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;